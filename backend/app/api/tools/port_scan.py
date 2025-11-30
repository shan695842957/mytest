"""
端口扫描工具
"""

from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.deps import get_current_user, get_locale, get_request_id
from app.schemas.response import ApiResponse, success_response
from app.models.user import User, UserRole
from app.core.permissions import check_role_permission
from app.i18n import t

router = APIRouter()


# ============================================================================
# Schema 定义
# ============================================================================

class PortScanRequest(BaseModel):
    """端口扫描请求"""
    port: int = Field(..., ge=1, le=65535, description="要扫描的端口号")


class ProcessInfo(BaseModel):
    """进程信息"""
    pid: int = Field(..., description="进程ID")
    name: str = Field(..., description="进程名称")
    user: Optional[str] = Field(None, description="运行用户")
    cmdline: Optional[str] = Field(None, description="命令行")


class PortInfo(BaseModel):
    """端口信息"""
    port: int = Field(..., description="端口号")
    host: str = Field(..., description="主机地址")
    is_occupied: bool = Field(..., description="是否被占用")
    process: Optional[ProcessInfo] = Field(None, description="占用该端口的进程")
    protocol: str = Field(..., description="协议类型（TCP/UDP）")


# ============================================================================
# API 路由
# ============================================================================

@router.post(
    "/port/scan",
    response_model=ApiResponse[PortInfo],
    summary="端口扫描",
    description="检查指定端口是否被占用，并列出占用进程信息"
)
async def scan_port(
    request: PortScanRequest,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[PortInfo]:
    """
    端口扫描工具
    
    参数：
    - port: 端口号（1-65535）
    
    权限：仅开发者和运维者可访问
    
    返回：端口占用情况和进程信息（仅扫描本地端口）
    """
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("tools.error.permission_denied", locale)
    )
    
    try:
        import psutil
        
        # 检查端口是否被占用（固定为本地）
        is_occupied = False
        process_info = None
        protocol = "TCP"
        host = "127.0.0.1"  # 固定为本地
        
        # 遍历所有网络连接，查找目标端口
        for conn in psutil.net_connections(kind='inet'):
            if conn.laddr.port == request.port:
                is_occupied = True
                protocol = conn.type.name  # SOCK_STREAM=TCP, SOCK_DGRAM=UDP
                
                # 获取进程信息
                if conn.pid:
                    try:
                        proc = psutil.Process(conn.pid)
                        process_info = ProcessInfo(
                            pid=conn.pid,
                            name=proc.name(),
                            user=proc.username(),
                            cmdline=' '.join(proc.cmdline())
                        )
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        process_info = ProcessInfo(
                            pid=conn.pid,
                            name="Unknown",
                            user=None,
                            cmdline=None
                        )
                break
        
        port_info = PortInfo(
            port=request.port,
            host=host,
            is_occupied=is_occupied,
            process=process_info,
            protocol=protocol
        )
        
        return success_response(
            data=port_info,
            message=t("tools.success.port_scanned", locale),
            locale=locale,
            request_id=request_id
        )
    
    except Exception as e:
        # 返回标准ApiResponse格式
        return success_response(
            data=PortInfo(
                port=request.port,
                host="127.0.0.1",
                is_occupied=False,
                process=None,
                protocol="TCP"
            ),
            message=t("tools.error.port_scan_failed", locale),
            code=500,
            locale=locale,
            request_id=request_id
        )


@router.delete(
    "/port/process/{pid}",
    response_model=ApiResponse[dict],
    summary="终止进程",
    description="终止占用端口的进程（危险操作）"
)
async def kill_process(
    pid: int,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[dict]:
    """
    终止进程
    
    参数：
    - pid: 进程ID
    
    权限：仅开发者和运维者可访问
    
    警告：这是危险操作，会强制终止进程
    """
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("tools.error.permission_denied", locale)
    )
    
    try:
        import psutil
        
        # 获取进程
        proc = psutil.Process(pid)
        process_name = proc.name()
        
        # 终止进程
        proc.kill()
        proc.wait(timeout=3)
        
        return success_response(
            data={"pid": pid, "name": process_name, "killed": True},
            message=t("tools.success.process_killed", locale),
            locale=locale,
            request_id=request_id
        )
    
    except psutil.NoSuchProcess:
        # 返回标准ApiResponse格式
        return success_response(
            data={"pid": pid, "killed": False},
            message=t("tools.error.process_not_found", locale),
            code=404,
            locale=locale,
            request_id=request_id
        )
    except psutil.AccessDenied:
        # 返回标准ApiResponse格式
        return success_response(
            data={"pid": pid, "killed": False},
            message=t("tools.error.permission_denied", locale),
            code=403,
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        # 返回标准ApiResponse格式
        return success_response(
            data={"pid": pid, "killed": False},
            message=t("tools.error.kill_failed", locale),
            code=500,
            locale=locale,
            request_id=request_id
        )

