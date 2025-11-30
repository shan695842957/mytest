"""
Traceroute 路由追踪工具
"""

from typing import Optional, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, validator
import subprocess
import re
import platform
from datetime import datetime

from app.api.deps import get_current_user, get_locale, get_request_id
from app.schemas.response import ApiResponse, success_response
from app.models.user import User, UserRole
from app.core.permissions import check_role_permission
from app.i18n import t

router = APIRouter()


# ============================================================================
# Schema 定义
# ============================================================================

class TracerouteHop(BaseModel):
    """路由跳点"""
    hop_number: int = Field(..., description="跳数")
    ip: Optional[str] = Field(None, description="IP地址")
    hostname: Optional[str] = Field(None, description="主机名")
    rtt1: Optional[float] = Field(None, description="第1次往返时间（ms）")
    rtt2: Optional[float] = Field(None, description="第2次往返时间（ms）")
    rtt3: Optional[float] = Field(None, description="第3次往返时间（ms）")
    timeout: bool = Field(default=False, description="是否超时")


class TracerouteRequest(BaseModel):
    """Traceroute请求"""
    target: str = Field(..., min_length=1, max_length=255, description="目标IP或域名")
    max_hops: int = Field(default=30, ge=1, le=64, description="最大跳数")
    timeout: int = Field(default=5, ge=1, le=30, description="超时时间（秒）")
    
    @validator('target')
    def validate_target(cls, v):
        """验证目标地址格式"""
        v = v.strip()
        if not v:
            raise ValueError("Target cannot be empty")
        # 防止命令注入
        if any(char in v for char in [';', '&', '|', '`', '$', '(', ')', '<', '>']):
            raise ValueError("Invalid characters in target")
        return v


class TracerouteResult(BaseModel):
    """Traceroute结果"""
    target: str = Field(..., description="目标地址")
    success: bool = Field(..., description="是否成功")
    hops: List[TracerouteHop] = Field(..., description="路由跳点列表")
    output: str = Field(..., description="完整输出")
    executed_at: datetime = Field(..., description="执行时间")
    total_hops: int = Field(..., description="总跳数")


# ============================================================================
# API 路由
# ============================================================================

@router.post(
    "/traceroute",
    response_model=ApiResponse[TracerouteResult],
    summary="路由追踪",
    description="追踪到目标主机的网络路径，显示每一跳的路由信息"
)
async def traceroute_test(
    request: TracerouteRequest,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[TracerouteResult]:
    """
    Traceroute路由追踪
    
    参数：
    - target: 目标IP或域名
    - max_hops: 最大跳数（默认30）
    - timeout: 超时时间（默认5秒）
    
    权限：仅开发者和运维者可访问
    
    返回：每一跳的路由信息
    """
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("tools.error.permission_denied", locale)
    )
    
    try:
        system = platform.system().lower()
        
        # 检查traceroute命令是否存在
        if system == 'windows':
            # Windows: tracert -h max_hops target
            cmd = ['tracert', '-h', str(request.max_hops), '-w', str(request.timeout * 1000)]
        else:
            # Linux/Mac: 尝试多种traceroute命令
            traceroute_cmd = None
            for cmd_name in ['traceroute', 'tracepath', '/usr/sbin/traceroute', '/usr/bin/traceroute']:
                try:
                    # 检查命令是否存在
                    check_result = subprocess.run(
                        ['which', cmd_name],
                        capture_output=True,
                        timeout=1
                    )
                    if check_result.returncode == 0:
                        traceroute_cmd = cmd_name
                        break
                except:
                    continue
            
            if not traceroute_cmd:
                # 返回标准ApiResponse格式
                return success_response(
                    data=TracerouteResult(
                        target=request.target,
                        success=False,
                        hops=[],
                        output="",
                        executed_at=datetime.now(),
                        total_hops=0
                    ),
                    message=t("tools.error.traceroute_not_installed", locale),
                    code=503,
                    locale=locale,
                    request_id=request_id
                )
            
            cmd = [traceroute_cmd, '-m', str(request.max_hops), '-w', str(request.timeout)]
        
        cmd.append(request.target)
        
        # 执行traceroute命令
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=request.timeout * request.max_hops + 30
        )
        
        output = result.stdout + result.stderr
        success = result.returncode == 0
        
        # 解析跳点信息
        hops = _parse_traceroute_output(output, system)
        
        traceroute_result = TracerouteResult(
            target=request.target,
            success=success,
            hops=hops,
            output=output,
            executed_at=datetime.now(),
            total_hops=len(hops)
        )
        
        return success_response(
            data=traceroute_result,
            message=t("tools.success.traceroute_completed", locale),
            locale=locale,
            request_id=request_id
        )
    
    except subprocess.TimeoutExpired:
        return success_response(
            data=TracerouteResult(
                target=request.target,
                success=False,
                hops=[],
                output="",
                executed_at=datetime.now(),
                total_hops=0
            ),
            message=t("tools.error.traceroute_timeout", locale),
            locale=locale,
            request_id=request_id
        )
    except FileNotFoundError:
        # 命令不存在时返回标准格式
        return success_response(
            data=TracerouteResult(
                target=request.target,
                success=False,
                hops=[],
                output="",
                executed_at=datetime.now(),
                total_hops=0
            ),
            message=t("tools.error.traceroute_not_installed", locale),
            code=503,
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        # 其他错误也返回标准格式
        return success_response(
            data=TracerouteResult(
                target=request.target,
                success=False,
                hops=[],
                output=str(e),
                executed_at=datetime.now(),
                total_hops=0
            ),
            message=t("tools.error.traceroute_failed", locale),
            code=500,
            locale=locale,
            request_id=request_id
        )


# ============================================================================
# 辅助函数
# ============================================================================

def _parse_traceroute_output(output: str, system: str) -> List[TracerouteHop]:
    """
    解析traceroute输出
    
    Args:
        output: traceroute命令输出
        system: 操作系统类型
    
    Returns:
        路由跳点列表
    """
    hops = []
    
    try:
        for line in output.split('\n'):
            if system == 'windows':
                # Windows格式：1  <1 ms  <1 ms  <1 ms  192.168.1.1
                match = re.search(r'^\s*(\d+)\s+(?:(<?\d+)\s*ms|[*])\s+(?:(<?\d+)\s*ms|[*])\s+(?:(<?\d+)\s*ms|[*])\s+([\d.]+|[\w.-]+)', line)
                if match:
                    hop_num = int(match.group(1))
                    rtt1 = float(match.group(2).replace('<', '')) if match.group(2) else None
                    rtt2 = float(match.group(3).replace('<', '')) if match.group(3) else None
                    rtt3 = float(match.group(4).replace('<', '')) if match.group(4) else None
                    host = match.group(5)
                    
                    hops.append(TracerouteHop(
                        hop_number=hop_num,
                        ip=host if re.match(r'\d+\.\d+\.\d+\.\d+', host) else None,
                        hostname=host if not re.match(r'\d+\.\d+\.\d+\.\d+', host) else None,
                        rtt1=rtt1,
                        rtt2=rtt2,
                        rtt3=rtt3,
                        timeout=False
                    ))
            else:
                # Linux格式：1  192.168.1.1 (192.168.1.1)  0.123 ms  0.456 ms  0.789 ms
                match = re.search(r'^\s*(\d+)\s+(?:([\w.-]+)\s+)?\(?(\d+\.\d+\.\d+\.\d+)\)?\s+([\d.]+|[*])\s*ms\s+([\d.]+|[*])\s*ms\s+([\d.]+|[*])\s*ms', line)
                if match:
                    hop_num = int(match.group(1))
                    hostname = match.group(2) if match.group(2) else None
                    ip = match.group(3)
                    rtt1 = float(match.group(4)) if match.group(4) != '*' else None
                    rtt2 = float(match.group(5)) if match.group(5) != '*' else None
                    rtt3 = float(match.group(6)) if match.group(6) != '*' else None
                    
                    hops.append(TracerouteHop(
                        hop_number=hop_num,
                        ip=ip,
                        hostname=hostname,
                        rtt1=rtt1,
                        rtt2=rtt2,
                        rtt3=rtt3,
                        timeout=rtt1 is None
                    ))
    
    except Exception:
        pass
    
    return hops

