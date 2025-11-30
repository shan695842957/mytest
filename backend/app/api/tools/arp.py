"""
ARP 表查看工具
"""

from typing import Optional, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
import subprocess
import re
import platform

from app.api.deps import get_current_user, get_locale, get_request_id
from app.schemas.response import ApiResponse, success_response
from app.models.user import User, UserRole
from app.core.permissions import check_role_permission
from app.i18n import t

router = APIRouter()


# ============================================================================
# Schema 定义
# ============================================================================

class ARPEntry(BaseModel):
    """ARP表项"""
    ip: str = Field(..., description="IP地址")
    mac: str = Field(..., description="MAC地址")
    interface: Optional[str] = Field(None, description="网卡接口")
    type: Optional[str] = Field(None, description="类型（动态/静态）")


# ============================================================================
# API 路由
# ============================================================================

@router.get(
    "/arp",
    response_model=ApiResponse[List[ARPEntry]],
    summary="查看ARP表",
    description="获取系统ARP表，显示IP-MAC映射关系"
)
async def get_arp_table(
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[ARPEntry]]:
    """
    查看ARP表
    
    权限：仅开发者和运维者可访问
    
    返回：ARP表项列表（IP-MAC映射）
    """
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("tools.error.permission_denied", locale)
    )
    
    try:
        system = platform.system().lower()
        
        if system == 'windows':
            result = subprocess.run(['arp', '-a'], capture_output=True, text=True, timeout=10)
        else:
            result = subprocess.run(['arp', '-n'], capture_output=True, text=True, timeout=10)
        
        if result.returncode != 0:
            raise Exception("ARP command failed")
        
        # 解析ARP表
        arp_entries = _parse_arp_table(result.stdout, system)
        
        return success_response(
            data=arp_entries,
            message=t("tools.success.arp_retrieved", locale),
            locale=locale,
            request_id=request_id
        )
    
    except Exception as e:
        # 返回标准ApiResponse格式
        return success_response(
            data=[],
            message=t("tools.error.arp_failed", locale),
            code=500,
            locale=locale,
            request_id=request_id
        )


# ============================================================================
# 辅助函数
# ============================================================================

def _parse_arp_table(output: str, system: str) -> List[ARPEntry]:
    """
    解析ARP表输出
    
    Args:
        output: arp命令输出
        system: 操作系统类型
    
    Returns:
        ARP表项列表
    """
    entries = []
    
    try:
        if system == 'windows':
            # Windows格式：
            # Internet Address      Physical Address      Type
            # 192.168.1.1          00-11-22-33-44-55     dynamic
            for line in output.split('\n'):
                match = re.search(r'(\d+\.\d+\.\d+\.\d+)\s+([\da-fA-F-:]+)\s+(\w+)', line)
                if match:
                    entries.append(ARPEntry(
                        ip=match.group(1),
                        mac=match.group(2).replace('-', ':'),
                        interface=None,
                        type=match.group(3)
                    ))
        else:
            # Linux格式（支持中英文输出）
            # 英文：Address      HWtype  HWaddress           Flags Mask  Iface
            # 中文：地址         类型    硬件地址            标志  Mask    接口
            # 数据：192.168.1.1  ether   00:11:22:33:44:55   C           eth0
            for line in output.split('\n'):
                # 匹配IP地址开头的行（更宽松的匹配）
                # 格式：IP地址 任意空白 类型 任意空白 MAC地址 任意空白 标志 任意空白 接口
                match = re.search(
                    r'(\d+\.\d+\.\d+\.\d+)\s+\S+\s+([\da-fA-F:]+)\s+\S+\s+\S*\s+(\S+)',
                    line
                )
                if match:
                    mac = match.group(2)
                    # 过滤掉无效的MAC地址（如 "(incomplete)"）
                    if ':' in mac and len(mac) >= 17:
                        entries.append(ARPEntry(
                            ip=match.group(1),
                            mac=mac,
                            interface=match.group(3) if match.group(3) else None,
                            type=None
                        ))
    
    except Exception:
        pass
    
    return entries

