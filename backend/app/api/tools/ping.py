"""
Ping 网络测试工具
"""

from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, validator
import subprocess
import re
import platform
from datetime import datetime

from app.api.deps import get_current_user, get_locale, get_request_id
from app.schemas.response import ApiResponse, success_response
from app.models.user import User
from app.i18n import t

router = APIRouter()


# ============================================================================
# Schema 定义
# ============================================================================

class PingRequest(BaseModel):
    """Ping请求"""
    target: str = Field(..., min_length=1, max_length=255, description="目标IP或域名")
    count: int = Field(default=4, ge=1, le=100, description="Ping次数（1-100）")
    timeout: int = Field(default=5, ge=1, le=30, description="超时时间（秒）")
    interface: Optional[str] = Field(None, max_length=50, description="指定网卡（可选）")
    
    @validator('target')
    def validate_target(cls, v):
        """验证目标地址格式"""
        v = v.strip()
        if not v:
            raise ValueError("Target cannot be empty")
        # 简单验证：不允许特殊字符，防止命令注入
        if any(char in v for char in [';', '&', '|', '`', '$', '(', ')', '<', '>']):
            raise ValueError("Invalid characters in target")
        return v


class PingStatistics(BaseModel):
    """Ping统计信息"""
    packets_sent: int = Field(..., description="发送数据包数")
    packets_received: int = Field(..., description="接收数据包数")
    packets_lost: int = Field(..., description="丢失数据包数")
    loss_rate: float = Field(..., description="丢包率（%）")
    min_time: Optional[float] = Field(None, description="最小延迟（ms）")
    max_time: Optional[float] = Field(None, description="最大延迟（ms）")
    avg_time: Optional[float] = Field(None, description="平均延迟（ms）")


class PingResult(BaseModel):
    """Ping结果"""
    target: str = Field(..., description="目标地址")
    success: bool = Field(..., description="是否成功")
    output: str = Field(..., description="完整输出")
    statistics: Optional[PingStatistics] = Field(None, description="统计信息")
    error_message: Optional[str] = Field(None, description="错误信息")
    executed_at: datetime = Field(..., description="执行时间")
    interface_used: Optional[str] = Field(None, description="使用的网卡")


# ============================================================================
# API 路由
# ============================================================================

@router.post(
    "/ping",
    response_model=ApiResponse[PingResult],
    summary="Ping测试",
    description="测试到目标主机的网络连通性，支持IP地址和域名，可选指定网卡"
)
async def ping_test(
    request: PingRequest,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[PingResult]:
    """
    Ping测试工具
    
    参数：
    - target: 目标IP或域名
    - count: Ping次数（默认4次）
    - timeout: 超时时间（默认5秒）
    - interface: 指定网卡（可选）
    
    权限：所有角色可访问
    
    返回：Ping结果和统计信息
    """
    try:
        # 构建ping命令
        system = platform.system().lower()
        
        if system == 'windows':
            # Windows: ping -n count -w timeout target
            cmd = ['ping', '-n', str(request.count), '-w', str(request.timeout * 1000)]
            if request.interface:
                cmd.extend(['-S', request.interface])
        else:
            # Linux/Mac: ping -c count -W timeout target
            cmd = ['ping', '-c', str(request.count), '-W', str(request.timeout)]
            if request.interface:
                cmd.extend(['-I', request.interface])
        
        cmd.append(request.target)
        
        # 执行ping命令
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=request.timeout * request.count + 10  # 总超时时间
        )
        
        output = result.stdout + result.stderr
        success = result.returncode == 0
        
        # 解析统计信息
        statistics = None
        if success and output:
            statistics = _parse_ping_statistics(output, system)
        
        # 构建结果
        ping_result = PingResult(
            target=request.target,
            success=success,
            output=output,
            statistics=statistics,
            error_message=None if success else t("tools.error.ping_failed", locale),
            executed_at=datetime.now(),
            interface_used=request.interface
        )
        
        return success_response(
            data=ping_result,
            message=t("tools.success.ping_completed", locale),
            locale=locale,
            request_id=request_id
        )
    
    except subprocess.TimeoutExpired:
        return success_response(
            data=PingResult(
                target=request.target,
                success=False,
                output="",
                statistics=None,
                error_message=t("tools.error.ping_timeout", locale),
                executed_at=datetime.now(),
                interface_used=request.interface
            ),
            message=t("tools.error.ping_timeout", locale),
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        # 返回标准ApiResponse格式
        return success_response(
            data=PingResult(
                target=request.target,
                success=False,
                output=str(e),
                statistics=None,
                error_message=t("tools.error.ping_execution_failed", locale),
                executed_at=datetime.now(),
                interface_used=request.interface
            ),
            message=t("tools.error.ping_execution_failed", locale),
            code=500,
            locale=locale,
            request_id=request_id
        )


# ============================================================================
# 辅助函数
# ============================================================================

def _parse_ping_statistics(output: str, system: str) -> Optional[PingStatistics]:
    """
    解析Ping统计信息
    
    Args:
        output: Ping命令输出
        system: 操作系统类型（windows/linux/darwin）
    
    Returns:
        统计信息或None
    """
    try:
        if system == 'windows':
            # Windows格式：
            # 数据包: 已发送 = 4，已接收 = 4，丢失 = 0 (0% 丢失)
            # 最短 = 1ms，最长 = 2ms，平均 = 1ms
            packets_match = re.search(r'已发送\s*=\s*(\d+).*已接收\s*=\s*(\d+).*丢失\s*=\s*(\d+)', output)
            time_match = re.search(r'最短\s*=\s*(\d+)ms.*最长\s*=\s*(\d+)ms.*平均\s*=\s*(\d+)ms', output)
            
            if packets_match:
                sent = int(packets_match.group(1))
                received = int(packets_match.group(2))
                lost = int(packets_match.group(3))
                loss_rate = (lost / sent * 100) if sent > 0 else 0
                
                min_time = int(time_match.group(1)) if time_match else None
                max_time = int(time_match.group(2)) if time_match else None
                avg_time = int(time_match.group(3)) if time_match else None
                
                return PingStatistics(
                    packets_sent=sent,
                    packets_received=received,
                    packets_lost=lost,
                    loss_rate=round(loss_rate, 2),
                    min_time=float(min_time) if min_time else None,
                    max_time=float(max_time) if max_time else None,
                    avg_time=float(avg_time) if avg_time else None
                )
        else:
            # Linux/Mac格式：
            # 4 packets transmitted, 4 received, 0% packet loss, time 3003ms
            # rtt min/avg/max/mdev = 0.123/0.456/0.789/0.234 ms
            packets_match = re.search(r'(\d+)\s+packets transmitted,\s*(\d+)\s+received', output)
            loss_match = re.search(r'(\d+(?:\.\d+)?)%\s+packet loss', output)
            time_match = re.search(r'rtt min/avg/max/mdev = ([\d.]+)/([\d.]+)/([\d.]+)/', output)
            
            if packets_match:
                sent = int(packets_match.group(1))
                received = int(packets_match.group(2))
                lost = sent - received
                loss_rate = float(loss_match.group(1)) if loss_match else 0
                
                min_time = float(time_match.group(1)) if time_match else None
                avg_time = float(time_match.group(2)) if time_match else None
                max_time = float(time_match.group(3)) if time_match else None
                
                return PingStatistics(
                    packets_sent=sent,
                    packets_received=received,
                    packets_lost=lost,
                    loss_rate=round(loss_rate, 2),
                    min_time=min_time,
                    max_time=max_time,
                    avg_time=avg_time
                )
        
        return None
    except Exception:
        return None

