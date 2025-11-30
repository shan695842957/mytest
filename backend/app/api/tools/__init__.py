"""
系统工具 API 模块

包含：
- Ping 测试
- 端口扫描
- ARP 表查看
- Traceroute 路由追踪
- 网络抓包 (tcpdump)
- 串口测试工具
"""

from typing import List
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.deps import get_current_user, get_locale, get_request_id
from app.schemas.response import ApiResponse, success_response
from app.models.user import User
from app.i18n import t

# 导入子路由
from app.api.tools import ping, port_scan, arp, traceroute, network_capture, serial

# 创建主路由
router = APIRouter(tags=["系统工具"])


# ============================================================================
# 网络接口查询（共享 API）
# ============================================================================

class NetworkInterface(BaseModel):
    """网络接口"""
    name: str = Field(..., description="接口名称")
    display_name: str = Field(..., description="显示名称")


@router.get(
    "/network/interfaces",
    response_model=ApiResponse[List[NetworkInterface]],
    summary="获取网络接口列表",
    description="获取系统所有可用的网络接口名称"
)
async def get_network_interfaces(
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[NetworkInterface]]:
    """
    获取网络接口列表
    
    权限：所有角色可访问
    
    返回：网卡信息列表
    """
    try:
        import psutil
        
        # 获取所有网卡
        interface_names = list(psutil.net_if_addrs().keys())
        
        # 构建网卡对象列表
        interfaces = []
        for name in interface_names:
            # 生成友好的显示名称
            if name == 'lo':
                display_name = 'lo (本地回环)'
            elif name.startswith('loopback'):
                display_name = f'{name} (回环)'
            elif name.startswith('eth'):
                display_name = f'{name} (以太网)'
            elif name.startswith('wlan'):
                display_name = f'{name} (无线网卡)'
            elif name.startswith('docker'):
                display_name = f'{name} (Docker虚拟网卡)'
            elif name.startswith('veth'):
                display_name = f'{name} (虚拟网卡)'
            else:
                display_name = name
            
            interfaces.append(NetworkInterface(
                name=name,
                display_name=display_name
            ))
        
        return success_response(
            data=interfaces,
            message=t("tools.success.interfaces_retrieved", locale),
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        # 返回标准ApiResponse格式
        return success_response(
            data=[],
            message=t("tools.error.interfaces_failed", locale),
            code=500,
            locale=locale,
            request_id=request_id
        )


# ============================================================================
# 聚合所有子路由
# ============================================================================

# 包含所有子模块的路由
router.include_router(ping.router)
router.include_router(port_scan.router)
router.include_router(arp.router)
router.include_router(traceroute.router)
router.include_router(network_capture.router)
router.include_router(serial.router, prefix="/serial")

