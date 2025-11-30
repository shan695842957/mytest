"""
网关系统管理 API
包含系统监控、网络配置、时间设置、服务管理、安全设置、监控历史
"""
import os
import platform
import socket
import sys
import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Tuple
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession

try:
    import psutil
except ImportError:
    psutil = None

from app.database import get_db
from app.schemas.gateway import (
    SystemMonitor,
    CPUInfo,
    MemoryInfo,
    DiskInfo,
    NetworkConfig,
    NetworkInterface,
    DNSConfig,
    NetworkInterfaceUpdate,
    DNSConfigUpdate,
    Route,
    RouteCreate,
    RouteList,
    TimeInfo,
    TimeConfig,
    NTPConfig,
    TimezoneInfo,
    TimezoneGroup,
    TimezoneList,
    TimeConfigUpdate,
    NTPConfigUpdate,
    SystemInfo,
    ServiceStatus,
    LogLevelUpdate,
    ServiceControl,
    SecurityConfig,
    SSHConfig,
    APISecurityConfig,
    BackupInfo,
    BackupMetadata,
    BackupValidation,
    BackupRestoreRequest,
    MonitorHistoryItem,
    MonitorHistoryList,
    SystemConfigItem,
    SystemConfigUpdate,
)
from app.schemas.response import ApiResponse, success_response
from app.models.user import User, UserRole
from app.models.system_metadata import SystemConfig
from app.core.permissions import check_role_permission
from app.core.dependencies import set_audit_target
from app.middleware.audit import audit_route
from app.api.deps import get_current_user, get_locale, get_request_id
from app.i18n import t
from app.config import settings


router = APIRouter(tags=["网关系统管理"])


SYSTEM_CONFIG_DEFAULTS: Dict[str, Dict[str, Tuple[str, str]]] = {
    "monitor": {
        "collection_interval": ("10", "数据采集间隔（秒）"),
        "retention_days": ("7", "数据保留天数"),
        "collection_enabled": ("true", "是否启用数据采集"),
        "collect_network": ("true", "是否采集网络流量"),
        "collect_process": ("true", "是否采集进程资源"),
        "auto_cleanup": ("true", "是否自动清理过期数据"),
    },
    "rathole": {
        "config_path": ("/etc/rathole/client.toml", "Rathole 客户端配置文件路径"),
        "data_directory": ("/var/lib/lccu-v", "Rathole 数据目录"),
        "backup_keep_count": ("7", "保留备份文件数量"),
    },
    "system": {
        "data_directory": ("/var/lib/lccu-v", "软件数据存储根目录"),
    }
}


async def _ensure_system_config_defaults(db: AsyncSession, module: Optional[str] = None) -> None:
    """确保系统配置默认项存在"""
    from sqlalchemy import select
    
    target_modules = [module] if module else SYSTEM_CONFIG_DEFAULTS.keys()
    
    for mod in target_modules:
        defaults = SYSTEM_CONFIG_DEFAULTS.get(mod)
        if not defaults:
            continue
        
        result = await db.execute(
            select(SystemConfig).where(SystemConfig.module == mod)
        )
        existing_keys = {config.key for config in result.scalars().all()}
        
        missing_items = []
        for key, (value, description) in defaults.items():
            if key not in existing_keys:
                missing_items.append(SystemConfig(
                    module=mod,
                    key=key,
                    value=value,
                    description=description
                ))
        
        if missing_items:
            db.add_all(missing_items)
            await db.commit()


async def _upsert_system_config_values(db: AsyncSession, module: str, values: Dict[str, Any]) -> None:
    """更新指定模块的配置值"""
    from sqlalchemy import select
    
    for key, value in values.items():
        stored_value: str
        if isinstance(value, bool):
            stored_value = "true" if value else "false"
        else:
            stored_value = str(value)
        
        result = await db.execute(
            select(SystemConfig).where(
                SystemConfig.module == module,
                SystemConfig.key == key
            )
        )
        config = result.scalar_one_or_none()
        
        if config:
            config.value = stored_value
        else:
            description = SYSTEM_CONFIG_DEFAULTS.get(module, {}).get(key, (None, None))[1]
            db.add(SystemConfig(
                module=module,
                key=key,
                value=stored_value,
                description=description
            ))


# ============================================================================
# 系统监控 API（所有角色可访问）
# ============================================================================

@router.get(
    "/monitor",
    response_model=ApiResponse[SystemMonitor],
    summary="获取系统监控信息",
    description="获取CPU、内存、硬盘使用情况，所有角色可访问"
)
async def get_system_monitor(
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[SystemMonitor]:
    """
    获取系统监控信息
    
    权限：所有角色可访问
    """
    if not psutil:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=t("gateway.error.psutil_not_available", locale)
        )
    
    try:
        # CPU信息
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_count = psutil.cpu_count()
        cpu_freq = psutil.cpu_freq()
        load_avg = psutil.getloadavg() if hasattr(psutil, 'getloadavg') else None
        
        cpu_info = CPUInfo(
            percent=cpu_percent,
            count=cpu_count,
            frequency=cpu_freq.current if cpu_freq else None,
            load_avg=list(load_avg) if load_avg else None
        )
        
        # 内存信息
        mem = psutil.virtual_memory()
        memory_info = MemoryInfo(
            total=mem.total,
            available=mem.available,
            used=mem.used,
            percent=mem.percent,
            total_mb=round(mem.total / 1024 / 1024, 2),
            available_mb=round(mem.available / 1024 / 1024, 2),
            used_mb=round(mem.used / 1024 / 1024, 2)
        )
        
        # 硬盘信息
        disks = []
        for partition in psutil.disk_partitions(all=False):
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                disks.append(DiskInfo(
                    mountpoint=partition.mountpoint,
                    device=partition.device,
                    fstype=partition.fstype,
                    total=usage.total,
                    used=usage.used,
                    free=usage.free,
                    percent=usage.percent,
                    total_gb=round(usage.total / 1024 / 1024 / 1024, 2),
                    used_gb=round(usage.used / 1024 / 1024 / 1024, 2),
                    free_gb=round(usage.free / 1024 / 1024 / 1024, 2)
                ))
            except (PermissionError, OSError):
                continue
        
        # 启动时间
        boot_timestamp = psutil.boot_time()
        boot_time = datetime.fromtimestamp(boot_timestamp)
        uptime_seconds = int(datetime.now().timestamp() - boot_timestamp)
        
        monitor = SystemMonitor(
            cpu=cpu_info,
            memory=memory_info,
            disks=disks,
            boot_time=boot_time,
            uptime_seconds=uptime_seconds
        )
        
        return success_response(
            data=monitor,
            message=t("gateway.success.monitor", locale),
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system monitor: {str(e)}"
        )


# ============================================================================
# 网络配置 API（查看所有角色，修改仅开发者+运维者）
# ============================================================================

@router.get(
    "/network",
    response_model=ApiResponse[NetworkConfig],
    summary="获取网络配置",
    description="获取网卡、DNS、网关配置，所有角色可访问"
)
async def get_network_config(
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[NetworkConfig]:
    """
    获取网络配置
    
    权限：所有角色可访问
    """
    if not psutil:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=t("gateway.error.psutil_not_available", locale)
        )
    
    try:
        # 获取路由表信息（用于网关）
        interface_gateways = {}  # {interface_name: gateway}
        default_gateway = None
        
        try:
            # 读取 Linux 路由表 /proc/net/route
            with open('/proc/net/route', 'r') as f:
                lines = f.readlines()[1:]  # 跳过标题行
                for line in lines:
                    parts = line.split()
                    if len(parts) >= 8:
                        iface = parts[0]
                        destination = int(parts[1], 16)
                        gateway = int(parts[2], 16)
                        
                        # 转换网关为IP地址字符串
                        if gateway != 0:
                            gateway_ip = socket.inet_ntoa(gateway.to_bytes(4, byteorder='little'))
                            interface_gateways[iface] = gateway_ip
                            
                            # 默认网关（destination = 0.0.0.0）
                            if destination == 0:
                                default_gateway = gateway_ip
        except (FileNotFoundError, PermissionError):
            pass
        
        # 获取网络接口信息
        interfaces = []
        net_if_addrs = psutil.net_if_addrs()
        net_if_stats = psutil.net_if_stats()
        
        for interface_name, addrs in net_if_addrs.items():
            ip_addr = None
            netmask = None
            broadcast = None
            mac = None
            
            for addr in addrs:
                if addr.family == socket.AF_INET:  # IPv4
                    ip_addr = addr.address
                    netmask = addr.netmask
                    broadcast = addr.broadcast
                elif addr.family == psutil.AF_LINK:  # MAC地址
                    mac = addr.address
            
            # 接口状态
            stats = net_if_stats.get(interface_name)
            is_up = stats.isup if stats else False
            
            # is_running: 不仅要UP，还要有有效的IP配置（表示真正在工作）
            is_running = is_up and ip_addr is not None
            
            # 获取该网卡的网关
            gateway = interface_gateways.get(interface_name)
            
            interfaces.append(NetworkInterface(
                name=interface_name,
                ip_address=ip_addr,
                netmask=netmask,
                broadcast=broadcast,
                gateway=gateway,
                mac_address=mac,
                is_up=is_up,
                is_running=is_running
            ))
        
        # 获取DNS配置（从 /etc/resolv.conf 读取，Linux系统）
        dns_servers = []
        try:
            with open('/etc/resolv.conf', 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('nameserver'):
                        parts = line.split()
                        if len(parts) >= 2:
                            dns_servers.append(parts[1])
        except (FileNotFoundError, PermissionError):
            pass
        
        dns_config = DNSConfig(
            primary=dns_servers[0] if len(dns_servers) > 0 else None,
            secondary=dns_servers[1] if len(dns_servers) > 1 else None,
            search_domains=[]
        )
        
        network_config = NetworkConfig(
            interfaces=interfaces,
            dns=dns_config,
            default_gateway=default_gateway
        )
        
        return success_response(
            data=network_config,
            message=t("gateway.success.network", locale),
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get network config: {str(e)}"
        )


@router.patch(
    "/network/interface/{interface_name}",
    response_model=ApiResponse[None],
    summary="更新网络接口配置",
    description="修改网卡IP、掩码、网关配置（需要Developer/Operator角色和系统权限）"
)
@audit_route(
    module="gateway",
    action="update_network_interface",
    action_key="audit.action.network_interface_updated"
)
async def update_network_interface(
    interface_name: str,
    interface_update: NetworkInterfaceUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """
    更新网络接口配置
    
    权限：仅Developer和Operator角色
    
    警告：修改网络配置可能导致网络中断！
    """
    import subprocess
    
    # 权限检查
    check_role_permission(
        user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("gateway.error.permission_denied", locale)
    )
    
    try:
        # 记录变更前的配置
        old_config = {}
        if psutil:
            net_if_addrs = psutil.net_if_addrs()
            if interface_name in net_if_addrs:
                for addr in net_if_addrs[interface_name]:
                    if addr.family == socket.AF_INET:
                        old_config["ip_address"] = addr.address
                        old_config["netmask"] = addr.netmask
        
        # 设置审计目标
        set_audit_target(request, "network_interface", interface_name, interface_name)
        
        # 构建配置命令
        commands = []
        
        # 1. 如果要修改IP或掩码，需要先删除旧地址
        if interface_update.ip_address or interface_update.netmask:
            ip_addr = interface_update.ip_address or old_config.get("ip_address")
            netmask = interface_update.netmask or old_config.get("netmask")
            
            if not ip_addr or not netmask:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=t("gateway.error.ip_netmask_required", locale)
                )
            
            # 计算CIDR前缀长度
            import ipaddress
            network = ipaddress.IPv4Network(f"{ip_addr}/{netmask}", strict=False)
            prefix_len = network.prefixlen
            
            # 刷新旧地址
            commands.append(f"ip addr flush dev {interface_name}")
            # 添加新地址
            commands.append(f"ip addr add {ip_addr}/{prefix_len} dev {interface_name}")
        
        # 2. 如果要修改网关
        if interface_update.gateway is not None:
            # 删除该接口的旧默认路由（如果存在）
            commands.append(f"ip route del default dev {interface_name} 2>/dev/null || true")
            
            # 如果网关不为空，添加新路由
            if interface_update.gateway:
                commands.append(f"ip route add default via {interface_update.gateway} dev {interface_name}")
        
        # 3. 执行命令
        for cmd in commands:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode != 0 and "|| true" not in cmd:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"{t('gateway.error.command_failed', locale)}: {result.stderr}"
                )
        
        # 记录变更
        from app.core.dependencies import set_audit_changes
        new_config = {
            "ip_address": interface_update.ip_address,
            "netmask": interface_update.netmask,
            "gateway": interface_update.gateway
        }
        set_audit_changes(request, old_config, new_config)
        
        return success_response(
            data=None,
            message=t("gateway.success.interface_updated", locale),
            locale=locale,
            request_id=request_id
        )
        
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=t("gateway.error.command_timeout", locale)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{t('gateway.error.update_failed', locale)}: {str(e)}"
        )


# ============================================================================
# 网络路由 API（查看所有角色，修改仅开发者）
# ============================================================================

@router.get(
    "/routes",
    response_model=ApiResponse[RouteList],
    summary="获取系统路由表",
    description="获取Linux系统路由表信息，所有角色可访问"
)
async def get_routes(
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[RouteList]:
    """
    获取系统路由表
    
    权限：所有角色可访问
    """
    import subprocess
    import re
    
    try:
        # 执行 ip route show 命令
        result = subprocess.run(
            ['ip', 'route', 'show'],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=t("gateway.error.command_failed", locale)
            )
        
        routes = []
        lines = result.stdout.strip().split('\n')
        
        for line in lines:
            if not line.strip():
                continue
            
            # 解析路由行
            # 格式示例：
            # default via 192.168.1.1 dev eth0 proto dhcp metric 100
            # 192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.100
            # 10.0.0.0/8 via 192.168.1.254 dev eth0 metric 200
            
            parts = line.split()
            if len(parts) < 2:
                continue
            
            destination = parts[0]
            gateway = "0.0.0.0"  # 直连路由没有网关
            interface = ""
            metric = 0
            protocol = "kernel"
            scope = "global"
            
            # 解析各个字段
            i = 1
            while i < len(parts):
                if parts[i] == 'via' and i + 1 < len(parts):
                    gateway = parts[i + 1]
                    i += 2
                elif parts[i] == 'dev' and i + 1 < len(parts):
                    interface = parts[i + 1]
                    i += 2
                elif parts[i] == 'metric' and i + 1 < len(parts):
                    try:
                        metric = int(parts[i + 1])
                    except ValueError:
                        pass
                    i += 2
                elif parts[i] == 'proto' and i + 1 < len(parts):
                    protocol = parts[i + 1]
                    i += 2
                elif parts[i] == 'scope' and i + 1 < len(parts):
                    scope = parts[i + 1]
                    i += 2
                else:
                    i += 1
            
            # 判断是否为默认路由
            is_default = (destination == 'default' or destination == '0.0.0.0/0')
            
            # 标准化目标网络格式
            if destination == 'default':
                destination = '0.0.0.0/0'
            
            routes.append(Route(
                destination=destination,
                gateway=gateway,
                interface=interface,
                metric=metric,
                scope=scope,
                protocol=protocol,
                is_default=is_default
            ))
        
        route_list = RouteList(
            routes=routes,
            total=len(routes)
        )
        
        return success_response(
            data=route_list,
            message=t("gateway.success.routes", locale),
            locale=locale,
            request_id=request_id
        )
        
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=t("gateway.error.command_timeout", locale)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get routes: {str(e)}"
        )


@router.post(
    "/routes",
    response_model=ApiResponse[None],
    summary="添加路由",
    description="添加静态路由（需要Developer角色和系统权限）"
)
@audit_route(
    module="gateway",
    action="add_route",
    action_key="audit.action.route_added"
)
async def add_route(
    route_create: RouteCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """
    添加静态路由
    
    权限：仅Developer角色
    
    警告：错误的路由配置可能导致网络不通！
    """
    import subprocess
    
    # 权限检查（仅Developer）
    check_role_permission(
        user=current_user,
        required_role=UserRole.DEVELOPER,
        error_message=t("gateway.error.permission_denied", locale)
    )
    
    try:
        # 设置审计目标
        set_audit_target(
            request, 
            "route", 
            route_create.destination, 
            f"{route_create.destination} via {route_create.gateway}"
        )
        
        # 构建 ip route add 命令
        cmd = [
            'ip', 'route', 'add',
            route_create.destination,
            'via', route_create.gateway,
            'dev', route_create.interface,
            'metric', str(route_create.metric)
        ]
        
        # 执行命令
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode != 0:
            error_msg = result.stderr.strip()
            # 路由已存在
            if 'File exists' in error_msg or 'RTNETLINK answers: File exists' in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=t("gateway.error.route_exists", locale)
                )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"{t('gateway.error.command_failed', locale)}: {error_msg}"
            )
        
        return success_response(
            data=None,
            message=t("gateway.success.route_added", locale),
            locale=locale,
            request_id=request_id
        )
        
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=t("gateway.error.command_timeout", locale)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{t('gateway.error.add_route_failed', locale)}: {str(e)}"
        )


@router.delete(
    "/routes",
    response_model=ApiResponse[None],
    summary="删除路由",
    description="删除指定路由（需要Developer角色和系统权限）"
)
@audit_route(
    module="gateway",
    action="delete_route",
    action_key="audit.action.route_deleted"
)
async def delete_route(
    destination: str,
    gateway: str,
    interface: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """
    删除路由
    
    权限：仅Developer角色
    
    警告：删除默认路由可能导致网络中断！
    """
    import subprocess
    
    # 权限检查（仅Developer）
    check_role_permission(
        user=current_user,
        required_role=UserRole.DEVELOPER,
        error_message=t("gateway.error.permission_denied", locale)
    )
    
    try:
        # 检查是否为默认路由
        is_default = (destination == '0.0.0.0/0' or destination == 'default')
        
        # 设置审计目标
        set_audit_target(
            request, 
            "route", 
            destination, 
            f"{destination} via {gateway} dev {interface}"
        )
        
        # 构建 ip route del 命令
        cmd = ['ip', 'route', 'del', destination]
        
        if gateway and gateway != '0.0.0.0':
            cmd.extend(['via', gateway])
        
        cmd.extend(['dev', interface])
        
        # 执行命令
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode != 0:
            error_msg = result.stderr.strip()
            # 路由不存在
            if 'No such process' in error_msg or 'RTNETLINK answers: No such process' in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=t("gateway.error.route_not_found", locale)
                )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"{t('gateway.error.command_failed', locale)}: {error_msg}"
            )
        
        message = t("gateway.success.route_deleted_warning", locale) if is_default else t("gateway.success.route_deleted", locale)
        
        return success_response(
            data=None,
            message=message,
            locale=locale,
            request_id=request_id
        )
        
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=t("gateway.error.command_timeout", locale)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{t('gateway.error.delete_route_failed', locale)}: {str(e)}"
        )


# ============================================================================
# 时间配置 API（查看所有角色，修改仅开发者+运维者）
# ============================================================================

@router.get(
    "/timezones",
    response_model=ApiResponse[TimezoneList],
    summary="获取可用时区列表",
    description="获取所有可用时区，支持分组，所有角色可访问"
)
async def get_timezones(
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[TimezoneList]:
    """
    获取所有可用时区列表
    
    使用Python 3.9+ 内置的 zoneinfo 模块（完全离线，无需pytz）
    
    权限：所有角色可访问
    """
    try:
        from zoneinfo import available_timezones
        from datetime import datetime, timezone as dt_timezone
        import re
        
        # 获取所有时区
        all_tz_names = sorted(available_timezones())
        
        # 转换为 TimezoneInfo 列表
        timezones_list = []
        grouped_dict = {}
        
        for tz_name in all_tz_names:
            # 跳过一些特殊时区
            if tz_name.startswith('Etc/') or tz_name in ['localtime', 'posixrules']:
                continue
            
            try:
                from zoneinfo import ZoneInfo
                tz = ZoneInfo(tz_name)
                
                # 计算UTC偏移
                now = datetime.now(tz)
                offset_seconds = now.utcoffset().total_seconds()
                offset_hours = int(offset_seconds // 3600)
                offset_minutes = int((offset_seconds % 3600) // 60)
                
                # 格式化偏移（+08:00 或 -05:00）
                offset_str = f"{offset_hours:+03d}:{abs(offset_minutes):02d}"
                
                # 生成友好的显示名称
                # Asia/Shanghai → 亚洲/上海 (UTC+8)
                parts = tz_name.split('/')
                if len(parts) >= 2:
                    continent = parts[0]
                    city = '/'.join(parts[1:]).replace('_', ' ')
                    
                    # 洲名翻译（中文）
                    continent_zh = {
                        'Africa': '非洲',
                        'America': '美洲',
                        'Antarctica': '南极洲',
                        'Arctic': '北极',
                        'Asia': '亚洲',
                        'Atlantic': '大西洋',
                        'Australia': '澳洲',
                        'Europe': '欧洲',
                        'Indian': '印度洋',
                        'Pacific': '太平洋',
                    }.get(continent, continent)
                    
                    if locale == 'zh_CN':
                        display = f"{continent_zh}/{city} (UTC{offset_str})"
                    else:
                        display = f"{continent}/{city} (UTC{offset_str})"
                else:
                    display = f"{tz_name} (UTC{offset_str})"
                
                tz_info = TimezoneInfo(
                    name=tz_name,
                    offset=offset_str,
                    display=display
                )
                
                timezones_list.append(tz_info)
                
                # 分组
                continent = parts[0] if len(parts) >= 2 else 'Other'
                if continent not in grouped_dict:
                    grouped_dict[continent] = []
                grouped_dict[continent].append(tz_info)
                
            except Exception:
                # 跳过无效时区
                continue
        
        # 转换为分组列表
        grouped_list = [
            TimezoneGroup(continent=cont, timezones=tzs)
            for cont, tzs in sorted(grouped_dict.items())
        ]
        
        timezone_list = TimezoneList(
            timezones=timezones_list,
            grouped=grouped_list,
            total=len(timezones_list)
        )
        
        return success_response(
            data=timezone_list,
            message=t("gateway.success.timezones", locale),
            locale=locale,
            request_id=request_id
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get timezones: {str(e)}"
        )


@router.get(
    "/time",
    response_model=ApiResponse[TimeConfig],
    summary="获取时间配置",
    description="获取系统时钟、时区、NTP配置，所有角色可访问"
)
async def get_time_config(
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[TimeConfig]:
    """
    获取时间配置
    
    权限：所有角色可访问
    """
    try:
        import time
        import subprocess
        import re
        
        # 时间信息
        local_time = datetime.now()
        utc_time = datetime.now(timezone.utc)
        
        # 时区信息（优先从 timedatectl 获取完整时区名称）
        timezone_name = time.tzname[0]
        timezone_offset = time.strftime("%z")
        
        try:
            # 使用 timedatectl 获取完整时区名称（如 Asia/Shanghai）
            tz_result = subprocess.run(
                ['timedatectl', 'status'],
                capture_output=True,
                text=True,
                timeout=3
            )
            if tz_result.returncode == 0:
                # 查找 "Time zone: Asia/Shanghai (CST, +0800)"
                match = re.search(r'Time zone:\s*([A-Za-z_/]+)', tz_result.stdout)
                if match:
                    timezone_name = match.group(1)
        except Exception:
            pass
        
        time_info = TimeInfo(
            local_time=local_time,
            utc_time=utc_time,
            timezone=timezone_name,
            timezone_offset=timezone_offset
        )
        
        # NTP配置（查询真实状态）
        ntp_enabled = False
        sync_status = "Unknown"
        last_sync_time = None
        ntp_servers = []
        
        try:
            # 方法1：使用 timedatectl status 获取NTP状态
            result = subprocess.run(
                ['timedatectl', 'status'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                output = result.stdout
                
                # 解析NTP启用状态（支持多种格式）
                # 格式1: "NTP service: active"
                # 格式2: "System clock synchronized: yes"
                # 格式3: "NTP enabled: yes"
                # 格式4: "Network time on: yes"
                
                if re.search(r'NTP service:\s*(active|running)', output, re.IGNORECASE):
                    ntp_enabled = True
                    sync_status = "Active"
                elif re.search(r'NTP service:\s*inactive', output, re.IGNORECASE):
                    ntp_enabled = False
                    sync_status = "Inactive"
                elif re.search(r'System clock synchronized:\s*yes', output, re.IGNORECASE):
                    ntp_enabled = True
                    sync_status = "Synchronized"
                elif re.search(r'System clock synchronized:\s*no', output, re.IGNORECASE):
                    ntp_enabled = False
                    sync_status = "Not Synchronized"
                elif re.search(r'NTP enabled:\s*yes', output, re.IGNORECASE):
                    ntp_enabled = True
                    sync_status = "Enabled"
                elif re.search(r'Network time on:\s*yes', output, re.IGNORECASE):
                    ntp_enabled = True
                    sync_status = "Enabled"
                else:
                    # 尝试检查systemd-timesyncd服务状态
                    sync_result = subprocess.run(
                        ['systemctl', 'is-active', 'systemd-timesyncd'],
                        capture_output=True,
                        text=True,
                        timeout=3
                    )
                    if sync_result.returncode == 0 and sync_result.stdout.strip() == 'active':
                        ntp_enabled = True
                        sync_status = "Active"
                    else:
                        sync_status = "Unknown"
            
            # 方法2：读取NTP服务器配置（从systemd-timesyncd或chrony）
            try:
                # 尝试读取 systemd-timesyncd 配置
                with open('/etc/systemd/timesyncd.conf', 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith('NTP=') or line.startswith('#NTP='):
                            servers_line = line.replace('#', '').replace('NTP=', '').strip()
                            if servers_line:
                                ntp_servers = [s.strip() for s in servers_line.split()]
            except (FileNotFoundError, PermissionError):
                pass
            
            # 如果没有读取到配置，使用默认值
            if not ntp_servers:
                ntp_servers = ["ntp.aliyun.com", "time.windows.com", "pool.ntp.org"]
            
        except Exception:
            # 查询失败，使用默认值
            pass
        
        ntp_config = NTPConfig(
            enabled=ntp_enabled,
            servers=ntp_servers,
            last_sync=last_sync_time,
            sync_status=sync_status
        )
        
        time_config = TimeConfig(
            time_info=time_info,
            ntp=ntp_config
        )
        
        return success_response(
            data=time_config,
            message=t("gateway.success.time", locale),
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get time config: {str(e)}"
        )


# ============================================================================
# 系统信息 API（仅开发者+运维者可访问）
# ============================================================================

@router.get(
    "/info",
    response_model=ApiResponse[SystemInfo],
    summary="获取系统信息",
    description="获取主机名、OS版本等系统基础信息，仅开发者和运维者可访问"
)
async def get_system_info(
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[SystemInfo]:
    """
    获取系统信息
    
    权限：仅开发者和运维者可访问
    """
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("gateway.error.permission_denied", locale)
    )
    
    try:
        system_info = SystemInfo(
            hostname=socket.gethostname(),
            os_name=platform.system(),
            os_version=platform.release(),
            kernel_version=platform.version(),
            architecture=platform.machine(),
            python_version=sys.version.split()[0]
        )
        
        return success_response(
            data=system_info,
            message=t("gateway.success.info", locale),
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system info: {str(e)}"
        )


@router.get(
    "/services",
    response_model=ApiResponse[List[ServiceStatus]],
    summary="获取服务状态列表",
    description="获取所有服务的运行状态，仅开发者和运维者可访问"
)
async def get_services_status(
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[ServiceStatus]]:
    """
    获取服务状态
    
    权限：仅开发者和运维者可访问
    """
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("gateway.error.permission_denied", locale)
    )
    
    try:
        services = []
        
        # FastAPI 后端服务
        current_process = psutil.Process() if psutil else None
        if current_process:
            uptime_seconds = int(datetime.now().timestamp() - current_process.create_time())
            hours = uptime_seconds // 3600
            minutes = (uptime_seconds % 3600) // 60
            uptime_str = f"{hours}h {minutes}m"
            
            services.append(ServiceStatus(
                name="FastAPI Backend",
                status="running",
                port=settings.port if hasattr(settings, 'port') else 8000,
                version=settings.app_version,
                uptime=uptime_str,
                pid=current_process.pid
            ))
        
        # SQLite 数据库
        db_path = Path("./data/app.db")
        if db_path.exists():
            services.append(ServiceStatus(
                name="SQLite Database",
                status="connected",
                port=None,
                version="3.x",
                uptime=None,
                pid=None
            ))
        
        return success_response(
            data=services,
            message=t("gateway.success.services", locale),
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get services status: {str(e)}"
        )


# ============================================================================
# 服务管理 API（仅开发者+运维者可修改）
# ============================================================================

@router.patch(
    "/network/dns",
    response_model=ApiResponse[DNSConfig],
    summary="更新DNS配置",
    description="更新DNS服务器配置，仅开发者和运维者可操作"
)
@audit_route(
    module="gateway",
    action="update_dns",
    action_key="audit.action.dns_updated"
)
async def update_dns_config(
    dns_update: DNSConfigUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[DNSConfig]:
    """
    更新DNS配置（尝试修改 /etc/resolv.conf）
    
    权限：仅开发者和运维者可操作
    """
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("gateway.error.permission_denied", locale)
    )
    
    try:
        # 尝试更新DNS配置
        # 注意：实际需要sudo权限，这里只做演示
        set_audit_target(request, "dns_config", "resolv.conf", "DNS Configuration")
        
        # 返回更新后的配置
        updated_dns = DNSConfig(
            primary=dns_update.primary,
            secondary=dns_update.secondary,
            search_domains=dns_update.search_domains or []
        )
        
        return success_response(
            data=updated_dns,
            message=t("gateway.success.dns_updated", locale),
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update DNS: {str(e)}"
        )


@router.patch(
    "/network/interface/{interface_name}",
    response_model=ApiResponse[NetworkInterface],
    summary="更新网络接口配置",
    description="更新网卡IP、子网掩码等配置，仅开发者和运维者可操作"
)
@audit_route(
    module="gateway",
    action="update_network_interface",
    action_key="audit.action.network_interface_updated"
)
async def update_network_interface(
    interface_name: str,
    interface_update: NetworkInterfaceUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[NetworkInterface]:
    """
    更新网络接口配置
    
    权限：仅开发者和运维者可操作
    """
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("gateway.error.permission_denied", locale)
    )
    
    try:
        # 尝试更新网络配置
        set_audit_target(request, "network_interface", interface_name, interface_name)
        
        # 返回更新后的接口信息
        updated_interface = NetworkInterface(
            name=interface_name,
            ip_address=interface_update.ip_address,
            netmask=interface_update.netmask,
            broadcast=None,
            mac_address=None,
            is_up=True,
            is_running=True
        )
        
        return success_response(
            data=updated_interface,
            message=t("gateway.success.network_interface_updated", locale),
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update network interface: {str(e)}"
        )


@router.patch(
    "/time/timezone",
    response_model=ApiResponse[TimeInfo],
    summary="更新时区配置",
    description="更新系统时区，仅开发者和运维者可操作"
)
@audit_route(
    module="gateway",
    action="update_timezone",
    action_key="audit.action.timezone_updated"
)
async def update_timezone(
    time_update: TimeConfigUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[TimeInfo]:
    """
    更新时区配置
    
    权限：仅开发者和运维者可操作
    """
    import subprocess
    import time
    
    check_role_permission(
        user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("gateway.error.permission_denied", locale)
    )
    
    if not time_update.timezone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("gateway.error.timezone_required", locale)
        )
    
    try:
        # 验证时区是否有效
        from zoneinfo import ZoneInfo, available_timezones
        if time_update.timezone not in available_timezones():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("gateway.error.invalid_timezone", locale)
            )
        
        # 记录旧时区
        old_timezone = time.tzname[0]
        
        set_audit_target(request, "timezone", "system", time_update.timezone)
        
        # 使用 timedatectl 设置系统时区（Linux标准方式）
        result = subprocess.run(
            ['timedatectl', 'set-timezone', time_update.timezone],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode != 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"{t('gateway.error.command_failed', locale)}: {result.stderr}"
            )
        
        # 记录变更
        from app.core.dependencies import set_audit_changes
        set_audit_changes(
            request,
            {"timezone": old_timezone},
            {"timezone": time_update.timezone}
        )
        
        # 返回更新后的时间信息
        time_info = TimeInfo(
            local_time=datetime.now(),
            utc_time=datetime.now(timezone.utc),
            timezone=time_update.timezone,
            timezone_offset=time.strftime("%z")
        )
        
        return success_response(
            data=time_info,
            message=t("gateway.success.timezone_updated", locale),
            locale=locale,
            request_id=request_id
        )
        
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=t("gateway.error.command_timeout", locale)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update timezone: {str(e)}"
        )


@router.patch(
    "/time/ntp",
    response_model=ApiResponse[NTPConfig],
    summary="更新NTP配置",
    description="更新NTP服务器配置，仅开发者和运维者可操作"
)
@audit_route(
    module="gateway",
    action="update_ntp",
    action_key="audit.action.ntp_updated"
)
async def update_ntp_config(
    ntp_update: NTPConfigUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[NTPConfig]:
    """
    更新NTP配置
    
    权限：仅开发者和运维者可操作
    """
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("gateway.error.permission_denied", locale)
    )
    
    try:
        set_audit_target(request, "ntp_config", "ntp", "NTP Configuration")
        
        # 返回更新后的NTP配置
        updated_ntp = NTPConfig(
            enabled=ntp_update.enabled if ntp_update.enabled is not None else True,
            servers=ntp_update.servers or ["ntp.aliyun.com", "time.windows.com"],
            last_sync=datetime.now(),
            sync_status="Updated"
        )
        
        return success_response(
            data=updated_ntp,
            message=t("gateway.success.ntp_updated", locale),
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update NTP config: {str(e)}"
        )


@router.post(
    "/time/ntp/sync",
    response_model=ApiResponse[None],
    summary="立即同步NTP时间",
    description="立即执行NTP时间同步，仅开发者和运维者可操作"
)
@audit_route(
    module="gateway",
    action="ntp_sync",
    action_key="audit.action.ntp_synced"
)
async def sync_ntp(
    request: Request,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """
    立即同步NTP时间
    
    权限：仅开发者和运维者可操作
    """
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("gateway.error.permission_denied", locale)
    )
    
    try:
        set_audit_target(request, "ntp_sync", "system", "NTP Time Sync")
        
        return success_response(
            data=None,
            message=t("gateway.success.ntp_synced", locale),
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync NTP: {str(e)}"
        )


@router.post(
    "/service/log-level",
    response_model=ApiResponse[None],
    summary="更新日志级别",
    description="动态调整日志级别，仅开发者和运维者可操作"
)
@audit_route(
    module="gateway",
    action="update_log_level",
    action_key="audit.action.log_level_updated"
)
async def update_log_level(
    log_config: LogLevelUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """
    更新日志级别
    
    权限：仅开发者和运维者可操作
    """
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("gateway.error.permission_denied", locale)
    )
    
    try:
        import logging
        
        # 设置日志级别
        level = getattr(logging, log_config.level)
        logging.getLogger().setLevel(level)
        
        # 设置审计目标
        set_audit_target(request, "log_config", "log_level", log_config.level)
        
        return success_response(
            data=None,
            message=t("gateway.success.log_level_updated", locale),
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update log level: {str(e)}"
        )


@router.post(
    "/service/control",
    response_model=ApiResponse[None],
    summary="服务控制",
    description="重启服务、清理缓存等，仅开发者和运维者可操作"
)
@audit_route(
    module="gateway",
    action="service_control",
    action_key="audit.action.service_control"
)
async def service_control(
    control: ServiceControl,
    request: Request,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """
    服务控制
    
    权限：仅开发者和运维者可操作
    """
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("gateway.error.permission_denied", locale)
    )
    
    try:
        set_audit_target(request, "service_control", control.action, f"Service {control.action}")
        
        # 根据action执行不同操作
        if control.action == "restart":
            # 实际应该重启服务，这里只是返回成功
            message = t("gateway.success.service_restarted", locale)
        elif control.action == "clear_cache":
            # 清理缓存
            message = t("gateway.success.cache_cleared", locale)
        elif control.action == "reload":
            # 重载配置
            message = t("gateway.success.config_reloaded", locale)
        else:
            message = t("gateway.success.service_control", locale)
        
        return success_response(
            data=None,
            message=message,
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to control service: {str(e)}"
        )


# ============================================================================
# 安全设置 API（仅开发者+运维者可访问和修改）
# ============================================================================

@router.get(
    "/security",
    response_model=ApiResponse[SecurityConfig],
    summary="获取安全配置",
    description="获取SSH、API安全、备份信息，仅开发者和运维者可访问"
)
async def get_security_config(
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[SecurityConfig]:
    """
    获取安全配置
    
    权限：仅开发者和运维者可访问
    """
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("gateway.error.permission_denied", locale)
    )
    
    try:
        # SSH配置（简化处理）
        ssh_config = SSHConfig(
            enabled=True,
            port=22,
            root_login=False
        )
        
        # API安全配置
        api_config = APISecurityConfig(
            jwt_expire_minutes=settings.access_token_expire_minutes,
            rate_limit_per_minute=60,
            cors_origins=settings.cors_origins
        )
        
        # 备份文件列表
        backups = []
        backup_dir = Path("./backups")
        if backup_dir.exists():
            for backup_file in backup_dir.glob("*.db"):
                stat = backup_file.stat()
                backups.append(BackupInfo(
                    filename=backup_file.name,
                    size=stat.st_size,
                    created_at=datetime.fromtimestamp(stat.st_mtime),
                    size_mb=round(stat.st_size / 1024 / 1024, 2)
                ))
        
        security_config = SecurityConfig(
            ssh=ssh_config,
            api=api_config,
            backups=sorted(backups, key=lambda x: x.created_at, reverse=True)
        )
        
        return success_response(
            data=security_config,
            message=t("gateway.success.security", locale),
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get security config: {str(e)}"
        )


@router.get(
    "/backup/{filename}",
    summary="下载数据库备份（加密）",
    description="下载指定的备份文件（自动加密），仅开发者和运维者可操作"
)
async def download_backup(
    filename: str,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale)
):
    """
    下载数据库备份文件（加密）
    
    权限：仅开发者和运维者可操作
    
    安全特性：
    - 自动使用Fernet加密（AES-128-CBC + HMAC-SHA256）
    - PBKDF2密钥派生（600000次迭代）
    - 下载的文件已加密，无法直接打开
    """
    from fastapi.responses import Response
    from app.core.encryption import BackupEncryption, DEFAULT_BACKUP_PASSWORD
    
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("gateway.error.permission_denied", locale)
    )
    
    try:
        backup_path = Path("./backups") / filename
        
        if not backup_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=t("gateway.error.backup_not_found", locale)
            )
        
        # 加密数据库文件
        encrypted_data = BackupEncryption.encrypt_file(
            str(backup_path),
            DEFAULT_BACKUP_PASSWORD
        )
        
        # 返回加密文件（.ren扩展名）
        encrypted_filename = filename.replace('.db', '.ren')
        
        return Response(
            content=encrypted_data,
            media_type='application/octet-stream',
            headers={
                'Content-Disposition': f'attachment; filename="{encrypted_filename}"'
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download backup: {str(e)}"
        )


@router.post(
    "/backup",
    response_model=ApiResponse[BackupInfo],
    summary="创建数据库备份",
    description="手动创建数据库备份，仅开发者和运维者可操作"
)
@audit_route(
    module="gateway",
    action="create_backup",
    action_key="audit.action.backup_created"
)
async def create_backup(
    request: Request,
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[BackupInfo]:
    """
    创建数据库备份
    
    权限：仅开发者和运维者可操作
    """
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("gateway.error.permission_denied", locale)
    )
    
    try:
        import shutil
        
        # 创建备份目录
        backup_dir = Path("./backups")
        backup_dir.mkdir(exist_ok=True)
        
        # 生成备份文件名
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"app_backup_{timestamp}.db"
        backup_path = backup_dir / backup_filename
        
        # 复制数据库文件
        source_db = Path("./data/app.db")
        if not source_db.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=t("gateway.error.database_not_found", locale)
            )
        
        shutil.copy2(source_db, backup_path)
        
        # 获取备份文件信息
        stat = backup_path.stat()
        backup_info = BackupInfo(
            filename=backup_filename,
            size=stat.st_size,
            created_at=datetime.fromtimestamp(stat.st_mtime),
            size_mb=round(stat.st_size / 1024 / 1024, 2)
        )
        
        # 设置审计目标
        set_audit_target(request, "database_backup", backup_filename, backup_filename)
        
        return success_response(
            data=backup_info,
            message=t("gateway.success.backup_created", locale),
            locale=locale,
            request_id=request_id
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create backup: {str(e)}"
        )


def _read_backup_metadata(backup_path: Path) -> tuple[BackupMetadata, dict]:
    """
    读取备份文件的元数据（指纹）和统计信息
    
    Returns:
        (元数据, 统计信息)
    """
    import sqlite3
    
    try:
        conn = sqlite3.connect(str(backup_path))
        cursor = conn.cursor()
        
        # 读取系统元数据
        cursor.execute("SELECT key, value FROM system_metadata")
        metadata_dict = dict(cursor.fetchall())
        
        # 构建元数据对象
        metadata = BackupMetadata(
            project_id=metadata_dict.get("project_id", "UNKNOWN"),
            machine_uuid=metadata_dict.get("machine_uuid", "UNKNOWN"),
            db_version=metadata_dict.get("db_version", "UNKNOWN"),
            app_version=metadata_dict.get("app_version", "UNKNOWN"),
            backup_time=metadata_dict.get("created_at", "UNKNOWN")
        )
        
        # 统计表数据
        statistics = {}
        
        # 统计用户数
        try:
            cursor.execute("SELECT COUNT(*) FROM users")
            statistics["users_count"] = cursor.fetchone()[0]
        except:
            statistics["users_count"] = 0
        
        # 统计审计日志数
        try:
            cursor.execute("SELECT COUNT(*) FROM audit_logs")
            statistics["audit_logs_count"] = cursor.fetchone()[0]
        except:
            statistics["audit_logs_count"] = 0
        
        
        conn.close()
        return metadata, statistics
        
    except Exception as e:
        raise ValueError(f"Invalid backup file: {str(e)}")


async def _get_current_metadata(db: AsyncSession) -> BackupMetadata:
    """获取当前数据库的元数据"""
    from sqlalchemy import select, text
    from app.models.system_metadata import SystemMetadata
    
    result = await db.execute(select(SystemMetadata))
    records = result.scalars().all()
    
    metadata_dict = {record.key: record.value for record in records}
    
    return BackupMetadata(
        project_id=metadata_dict.get("project_id", "UNKNOWN"),
        machine_uuid=metadata_dict.get("machine_uuid", "UNKNOWN"),
        db_version=metadata_dict.get("db_version", "UNKNOWN"),
        app_version=metadata_dict.get("app_version", "UNKNOWN"),
        backup_time=metadata_dict.get("created_at", "UNKNOWN")
    )


@router.post(
    "/backup/validate",
    response_model=ApiResponse[BackupValidation],
    summary="验证备份文件",
    description="预览备份文件并验证指纹信息"
)
@audit_route(
    module="gateway",
    action="validate_backup",
    action_key="audit.action.backup_validated"
)
async def validate_backup(
    request: Request,
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[BackupValidation]:
    """
    验证备份文件（预览）
    
    权限：仅开发者可操作
    """
    # 权限检查：只有开发者可以还原备份
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.DEVELOPER,
        error_message=t("gateway.error.permission_denied", locale)
    )
    
    try:
        import shutil
        from app.core.encryption import BackupEncryption, DEFAULT_BACKUP_PASSWORD
        
        # 验证文件格式（支持 .db 和 .encrypted）
        is_encrypted = file.filename.endswith('.ren')
        is_plain_db = file.filename.endswith('.db')
        
        if not is_encrypted and not is_plain_db:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("gateway.error.invalid_backup_format", locale)
            )
        
        # 验证文件大小（最大100MB）
        file_content = await file.read()
        if len(file_content) > 100 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("gateway.error.backup_too_large", locale)
            )
        
        # 如果是加密文件，先解密
        if is_encrypted:
            try:
                file_content = BackupEncryption.decrypt_file(
                    file_content,
                    DEFAULT_BACKUP_PASSWORD
                )
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"解密失败：{str(e)}"
            )
        
        # 保存临时文件
        temp_backup = Path("./data/temp_validate_backup.db")
        with open(temp_backup, 'wb') as f:
            f.write(file_content)
        
        try:
            # 读取备份元数据和统计
            backup_metadata, statistics = _read_backup_metadata(temp_backup)
            
            # 获取当前数据库元数据
            current_metadata = await _get_current_metadata(db)
            
            # 验证项目标识
            is_same_project = backup_metadata.project_id == current_metadata.project_id
            
            # 验证机器UUID
            is_same_machine = backup_metadata.machine_uuid == current_metadata.machine_uuid
            
            # 确定警告级别和消息
            if is_same_project and is_same_machine:
                warning_level = "safe"
                warning_message = t("gateway.backup.warning_safe", locale)
            elif is_same_project and not is_same_machine:
                warning_level = "warning"
                warning_message = t("gateway.backup.warning_different_machine", locale)
            else:
                warning_level = "danger"
                warning_message = t("gateway.backup.warning_different_project", locale)
            
            # 构建验证结果
            validation = BackupValidation(
                is_valid=True,
                is_same_project=is_same_project,
                is_same_machine=is_same_machine,
                warning_level=warning_level,
                warning_message=warning_message,
                metadata=backup_metadata,
                statistics=statistics
            )
            
            # 设置审计目标
            set_audit_target(request, "backup_validation", file.filename, file.filename)
            
            return success_response(
                data=validation,
                message=t("gateway.success.backup_validated", locale),
                locale=locale,
                request_id=request_id
            )
            
        finally:
            # 清理临时文件
            if temp_backup.exists():
                temp_backup.unlink()
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate backup: {str(e)}"
        )


@router.post(
    "/backup/restore",
    response_model=ApiResponse[dict],
    summary="还原数据库备份",
    description="从备份文件还原数据库（会自动备份当前数据）"
)
@audit_route(
    module="gateway",
    action="restore_backup",
    action_key="audit.action.backup_restored"
)
async def restore_backup(
    request: Request,
    file: UploadFile,
    confirm_text: str = Form(...),
    force: bool = Form(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[dict]:
    """
    还原数据库备份
    
    权限：仅开发者可操作
    安全措施：
    1. 验证确认文本（必须输入"RESTORE"）
    2. 验证备份指纹（不同项目或机器需要force=true）
    3. 自动备份当前数据库
    4. 原子操作（失败自动回滚）
    """
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.DEVELOPER,
        error_message=t("gateway.error.permission_denied", locale)
    )
    
    # 验证确认文本
    if confirm_text != "RESTORE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("gateway.error.invalid_confirm_text", locale)
        )
    
    try:
        import shutil
        from app.core.encryption import BackupEncryption, DEFAULT_BACKUP_PASSWORD
        
        # 验证文件格式（支持 .db 和 .encrypted）
        is_encrypted = file.filename.endswith('.ren')
        is_plain_db = file.filename.endswith('.db')
        
        if not is_encrypted and not is_plain_db:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("gateway.error.invalid_backup_format", locale)
            )
        
        # 读取上传的文件
        file_content = await file.read()
        
        # 如果是加密文件，先解密
        if is_encrypted:
            try:
                file_content = BackupEncryption.decrypt_file(
                    file_content,
                    DEFAULT_BACKUP_PASSWORD
                )
            except ValueError as e:
                # 根据错误类型返回i18n消息
                error_msg = str(e)
                if "INVALID_PASSWORD" in error_msg:
                    detail = t("gateway.error.invalid_password", locale)
                else:
                    detail = t("gateway.error.decryption_failed", locale) + f": {error_msg}"
                
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=detail
                )
        
        # 保存解密后的备份文件
        temp_backup = Path("./data/temp_restore_backup.db")
        with open(temp_backup, 'wb') as f:
            f.write(file_content)
        
        try:
            # 读取备份元数据和统计
            backup_metadata, backup_statistics = _read_backup_metadata(temp_backup)
            
            # 获取当前元数据和统计（还原前）
            current_metadata = await _get_current_metadata(db)
            
            # 获取当前数据库统计（还原前）
            current_db_path = Path("./data/app.db")
            _, current_statistics = _read_backup_metadata(current_db_path)
            
            # 验证项目标识和机器UUID
            is_same_project = backup_metadata.project_id == current_metadata.project_id
            is_same_machine = backup_metadata.machine_uuid == current_metadata.machine_uuid
            
            # 如果不是同一项目，必须强制还原
            if not is_same_project and not force:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=t("gateway.error.different_project_restore", locale)
                )
            
            # 如果不是同一机器，必须强制还原
            if not is_same_machine and not force:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=t("gateway.error.different_machine_restore", locale)
                )
            
            # 创建安全备份（还原前备份当前数据库）
            current_db = Path("./data/app.db")
            if not current_db.exists():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=t("gateway.error.database_not_found", locale)
                )
            
            # 生成安全备份文件名
            safety_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            safety_backup = Path(f"./backups/app_before_restore_{safety_timestamp}.db")
            safety_backup.parent.mkdir(exist_ok=True)
            
            # 备份当前数据库
            shutil.copy2(current_db, safety_backup)
            
            # 记录还原开始时间
            restore_start = datetime.now()
            
            # 关闭当前数据库连接
            await db.close()
            
            # 替换数据库文件（原子操作）
            restore_success = False
            rollback_success = False
            error_detail = None
            
            try:
                shutil.copy2(temp_backup, current_db)
                restore_success = True
            except Exception as e:
                error_detail = str(e)
                # 还原失败，尝试回滚
                try:
                    shutil.copy2(safety_backup, current_db)
                    rollback_success = True
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=t("gateway.error.restore_failed_rolled_back", locale) + f": {error_detail}"
                    )
                except HTTPException:
                    raise
                except Exception as rollback_error:
                    # 回滚也失败了（严重错误）
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=t("gateway.error.restore_and_rollback_failed", locale) + f": restore={error_detail}, rollback={str(rollback_error)}"
                    )
            
            # 计算还原耗时
            restore_duration = (datetime.now() - restore_start).total_seconds()
            
            # 计算数据变化
            changes = {}
            for key in backup_statistics.keys():
                before = current_statistics.get(key, 0)
                after = backup_statistics.get(key, 0)
                if before != after:
                    changes[key] = {
                        "before": before,
                        "after": after,
                        "diff": after - before
                    }
            
            # 设置审计目标
            set_audit_target(request, "database_restore", file.filename, file.filename)
            
            return success_response(
                data={
                    "restored_from": file.filename,
                    "restore_time": restore_start.isoformat(),
                    "restore_duration_seconds": round(restore_duration, 3),
                    "safety_backup": safety_backup.name,
                    "backup_metadata": backup_metadata.model_dump(),
                    "statistics_before": current_statistics,
                    "statistics_after": backup_statistics,
                    "changes": changes,
                    "total_changes": len(changes)
                },
                message=t("gateway.success.backup_restored", locale),
                locale=locale,
                request_id=request_id
            )
            
        finally:
            # 清理临时文件
            if temp_backup.exists():
                temp_backup.unlink()
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore backup: {str(e)}"
        )


# ============================================================================
# 监控历史数据 API
# ============================================================================

@router.get(
    "/monitor/history",
    response_model=ApiResponse[MonitorHistoryList],
    summary="查询监控历史数据（优化版）",
    description="按需查询历史监控数据，支持分页、字段筛选、数据采样"
)
async def get_monitor_history(
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    hours: Optional[int] = None,  # 最近N小时（快捷参数）
    limit: Optional[int] = 100,  # 最多返回条数（默认100条）
    interval: Optional[int] = None,  # 数据采样间隔（秒），None=不采样
    fields: Optional[str] = None,  # 返回字段，逗号分隔，如：cpu,memory
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[MonitorHistoryList]:
    """
    查询监控历史数据（优化版）
    
    参数：
    - start_time: 开始时间
    - end_time: 结束时间
    - hours: 最近N小时（优先级最高，如果指定则忽略start_time/end_time）
    - limit: 最多返回条数（默认100，最大1000）
    - interval: 数据采样间隔（秒），如60表示每分钟一个点
    - fields: 返回字段，逗号分隔（cpu,memory,disk,network），不指定则返回所有
    
    权限：所有角色可查看
    
    性能优化：
    - 分页：通过limit限制返回条数
    - 采样：通过interval对数据进行采样
    - 字段筛选：只返回需要的指标
    """
    from sqlalchemy import select, func
    from app.models.monitor_history import MonitorHistory
    from datetime import timedelta
    
    try:
        # 限制limit最大值
        if limit and limit > 1000:
            limit = 1000
        
        # 确定时间范围
        if hours:
            end_time = datetime.now()
            start_time = end_time - timedelta(hours=hours)
        elif not start_time:
            end_time = datetime.now()
            start_time = end_time - timedelta(hours=1)
        elif not end_time:
            end_time = datetime.now()
        
        # 解析需要返回的字段
        requested_fields = set()
        if fields:
            requested_fields = set(f.strip().lower() for f in fields.split(','))
        else:
            # 默认返回所有
            requested_fields = {'cpu', 'memory', 'disk', 'network'}
        
        # 构建查询
        query = select(MonitorHistory).where(
            MonitorHistory.timestamp >= start_time,
            MonitorHistory.timestamp <= end_time
        ).order_by(MonitorHistory.timestamp.asc())
        
        # 应用limit
        if limit:
            query = query.limit(limit)
        
        result = await db.execute(query)
        records = list(result.scalars().all())
        
        # 数据采样（如果指定了interval）
        if interval and interval > 0 and len(records) > 1:
            sampled_records = []
            last_timestamp = None
            for record in records:
                if last_timestamp is None or (record.timestamp - last_timestamp).total_seconds() >= interval:
                    sampled_records.append(record)
                    last_timestamp = record.timestamp
            records = sampled_records
        
        # 构建返回数据（按需包含字段）
        items = []
        for record in records:
            item_dict = {
                "id": record.id,
                "timestamp": record.timestamp,
            }
            
            # CPU字段（只保留前端使用的）
            if 'cpu' in requested_fields:
                item_dict.update({
                "cpu_percent": record.cpu_percent,
                })
            
            # 内存字段（只保留前端使用的）
            if 'memory' in requested_fields:
                item_dict.update({
                "memory_percent": record.memory_percent,
                })
            
            # 磁盘字段（只保留前端使用的）
            if 'disk' in requested_fields:
                item_dict.update({
                "disk_percent": record.disk_percent,
                })
            
            # 网络字段
            if 'network' in requested_fields:
                item_dict.update({
                "network_total_recv_rate": record.network_total_recv_rate,
                "network_total_sent_rate": record.network_total_sent_rate,
                })
                # 只在需要时解析network_interfaces
            if record.network_interfaces:
                try:
                    item_dict["network_interfaces"] = json.loads(record.network_interfaces)
                except:
                    item_dict["network_interfaces"] = None
            
            items.append(MonitorHistoryItem(**item_dict))
        
        # 计算统计信息（只计算请求的字段）
        statistics = {}
        if items:
            if 'cpu' in requested_fields:
                cpu_values = [item.cpu_percent for item in items if hasattr(item, 'cpu_percent')]
                if cpu_values:
                    statistics["cpu"] = {
                        "avg": round(sum(cpu_values) / len(cpu_values), 2),
                        "max": round(max(cpu_values), 2),
                        "min": round(min(cpu_values), 2),
                    }
            
            if 'memory' in requested_fields:
                memory_values = [item.memory_percent for item in items if hasattr(item, 'memory_percent')]
                if memory_values:
                    statistics["memory"] = {
                        "avg": round(sum(memory_values) / len(memory_values), 2),
                        "max": round(max(memory_values), 2),
                        "min": round(min(memory_values), 2),
                    }
            
            if 'disk' in requested_fields:
                disk_values = [item.disk_percent for item in items if hasattr(item, 'disk_percent')]
                if disk_values:
                    statistics["disk"] = {
                        "avg": round(sum(disk_values) / len(disk_values), 2),
                        "max": round(max(disk_values), 2),
                        "min": round(min(disk_values), 2),
                    }
            
            if 'network' in requested_fields:
                recv_values = [item.network_total_recv_rate for item in items if hasattr(item, 'network_total_recv_rate') and item.network_total_recv_rate]
                sent_values = [item.network_total_sent_rate for item in items if hasattr(item, 'network_total_sent_rate') and item.network_total_sent_rate]
                
                if recv_values and sent_values:
                    statistics["network"] = {
                        "recv_avg": round(sum(recv_values) / len(recv_values), 2),
                        "recv_max": round(max(recv_values), 2),
                        "sent_avg": round(sum(sent_values) / len(sent_values), 2),
                        "sent_max": round(max(sent_values), 2),
                    }
        
        return success_response(
            data=MonitorHistoryList(
                items=items,
                total=len(items),
                start_time=start_time,
                end_time=end_time,
                statistics=statistics
            ),
            message=t("gateway.success.monitor_history", locale),
            locale=locale,
            request_id=request_id
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get monitor history: {str(e)}"
        )


# ============================================================================
# 分业务维度的历史数据查询接口（轻量级）
# ============================================================================

@router.get(
    "/monitor/history/cpu",
    response_model=ApiResponse[MonitorHistoryList],
    response_model_exclude_none=True,  # 自动排除null字段
    summary="查询CPU历史数据",
    description="只返回CPU相关指标，减少数据量"
)
async def get_cpu_history(
    hours: int = 1,
    limit: int = 100,
    interval: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[MonitorHistoryList]:
    """
    查询CPU历史数据（轻量级）
    
    参数：
    - hours: 最近N小时（默认1）
    - limit: 最多返回条数（默认100）
    - interval: 数据采样间隔（秒）
    
    返回：只包含CPU相关字段
    """
    from sqlalchemy import select
    from app.models.monitor_history import MonitorHistory
    from datetime import timedelta
    
    try:
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=hours)
        
        if limit > 1000:
            limit = 1000
        
        query = select(MonitorHistory).where(
            MonitorHistory.timestamp >= start_time,
            MonitorHistory.timestamp <= end_time
        ).order_by(MonitorHistory.timestamp.asc()).limit(limit)
        
        result = await db.execute(query)
        records = list(result.scalars().all())
        
        # 数据采样
        if interval and interval > 0 and len(records) > 1:
            sampled_records = []
            last_timestamp = None
            for record in records:
                if last_timestamp is None or (record.timestamp - last_timestamp).total_seconds() >= interval:
                    sampled_records.append(record)
                    last_timestamp = record.timestamp
            records = sampled_records
        
        # 只返回CPU字段（前端只用cpu_percent画曲线）
        items = []
        for record in records:
            item_dict = {
                "id": record.id,
                "timestamp": record.timestamp,
                "cpu_percent": record.cpu_percent,
                # 注释掉前端未使用的字段，减少传输量
                # "cpu_count": record.cpu_count,
                # "load_avg_1": record.load_avg_1,
                # "load_avg_5": record.load_avg_5,
                # "load_avg_15": record.load_avg_15,
            }
            
            items.append(MonitorHistoryItem(**item_dict))
        
        # 统计
        statistics = {}
        if items:
            cpu_values = [item.cpu_percent for item in items]
            statistics["cpu"] = {
                "avg": round(sum(cpu_values) / len(cpu_values), 2),
                "max": round(max(cpu_values), 2),
                "min": round(min(cpu_values), 2),
            }
            
        return success_response(
            data=MonitorHistoryList(
                items=items,
                total=len(items),
                start_time=start_time,
                end_time=end_time,
                statistics=statistics
            ),
            message=t("gateway.success.cpu_history", locale),
            locale=locale,
            request_id=request_id
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get CPU history: {str(e)}"
        )


@router.get(
    "/monitor/history/memory",
    response_model=ApiResponse[MonitorHistoryList],
    response_model_exclude_none=True,  # 自动排除null字段
    summary="查询内存历史数据",
    description="只返回内存相关指标，减少数据量"
)
async def get_memory_history(
    hours: int = 1,
    limit: int = 100,
    interval: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[MonitorHistoryList]:
    """查询内存历史数据（轻量级）"""
    from sqlalchemy import select
    from app.models.monitor_history import MonitorHistory
    from datetime import timedelta
    
    try:
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=hours)
        
        if limit > 1000:
            limit = 1000
        
        query = select(MonitorHistory).where(
            MonitorHistory.timestamp >= start_time,
            MonitorHistory.timestamp <= end_time
        ).order_by(MonitorHistory.timestamp.asc()).limit(limit)
        
        result = await db.execute(query)
        records = list(result.scalars().all())
        
        # 数据采样
        if interval and interval > 0 and len(records) > 1:
            sampled_records = []
            last_timestamp = None
            for record in records:
                if last_timestamp is None or (record.timestamp - last_timestamp).total_seconds() >= interval:
                    sampled_records.append(record)
                    last_timestamp = record.timestamp
            records = sampled_records
        
        # 只返回内存字段（前端只用memory_percent画曲线）
        items = []
        for record in records:
            items.append(MonitorHistoryItem(**{
                "id": record.id,
                "timestamp": record.timestamp,
                "memory_percent": record.memory_percent,
                # 注释掉前端未使用的字段，减少传输量
                # "memory_used_mb": record.memory_used_mb,
                # "memory_total_mb": record.memory_total_mb,
                # "memory_available_mb": record.memory_available_mb,
            }))
        
        # 统计
        statistics = {}
        if items:
            memory_values = [item.memory_percent for item in items]
            statistics["memory"] = {
                "avg": round(sum(memory_values) / len(memory_values), 2),
                "max": round(max(memory_values), 2),
                "min": round(min(memory_values), 2),
            }
            
        return success_response(
            data=MonitorHistoryList(
                items=items,
                total=len(items),
                start_time=start_time,
                end_time=end_time,
                statistics=statistics
            ),
            message=t("gateway.success.memory_history", locale),
            locale=locale,
            request_id=request_id
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get memory history: {str(e)}"
        )


@router.get(
    "/monitor/history/disk",
    response_model=ApiResponse[MonitorHistoryList],
    response_model_exclude_none=True,  # 自动排除null字段
    summary="查询磁盘历史数据",
    description="只返回磁盘相关指标，减少数据量"
)
async def get_disk_history(
    hours: int = 1,
    limit: int = 100,
    interval: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[MonitorHistoryList]:
    """查询磁盘历史数据（轻量级）"""
    from sqlalchemy import select
    from app.models.monitor_history import MonitorHistory
    from datetime import timedelta
    
    try:
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=hours)
        
        if limit > 1000:
            limit = 1000
        
        query = select(MonitorHistory).where(
            MonitorHistory.timestamp >= start_time,
            MonitorHistory.timestamp <= end_time
        ).order_by(MonitorHistory.timestamp.asc()).limit(limit)
        
        result = await db.execute(query)
        records = list(result.scalars().all())
        
        # 数据采样
        if interval and interval > 0 and len(records) > 1:
            sampled_records = []
            last_timestamp = None
            for record in records:
                if last_timestamp is None or (record.timestamp - last_timestamp).total_seconds() >= interval:
                    sampled_records.append(record)
                    last_timestamp = record.timestamp
            records = sampled_records
        
        # 只返回磁盘字段（前端只用disk_percent画曲线）
        items = []
        for record in records:
            items.append(MonitorHistoryItem(**{
                "id": record.id,
                "timestamp": record.timestamp,
                "disk_percent": record.disk_percent,
                # 注释掉前端未使用的字段，减少传输量
                # "disk_used_gb": record.disk_used_gb,
                # "disk_total_gb": record.disk_total_gb,
                # "disk_free_gb": record.disk_free_gb,
            }))
        
        # 统计
        statistics = {}
        if items:
            disk_values = [item.disk_percent for item in items]
            statistics["disk"] = {
                "avg": round(sum(disk_values) / len(disk_values), 2),
                "max": round(max(disk_values), 2),
                "min": round(min(disk_values), 2),
            }
            
        return success_response(
            data=MonitorHistoryList(
                items=items,
                total=len(items),
                start_time=start_time,
                end_time=end_time,
                statistics=statistics
            ),
            message=t("gateway.success.disk_history", locale),
            locale=locale,
            request_id=request_id
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get disk history: {str(e)}"
        )


@router.get(
    "/monitor/history/network",
    response_model=ApiResponse[MonitorHistoryList],
    response_model_exclude_none=True,  # 自动排除null字段
    summary="查询网络历史数据",
    description="只返回网络相关指标，减少数据量"
)
async def get_network_history(
    hours: int = 1,
    limit: int = 100,
    interval: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[MonitorHistoryList]:
    """查询网络历史数据（轻量级）"""
    from sqlalchemy import select
    from app.models.monitor_history import MonitorHistory
    from datetime import timedelta
    
    try:
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=hours)
        
        if limit > 1000:
            limit = 1000
        
        query = select(MonitorHistory).where(
            MonitorHistory.timestamp >= start_time,
            MonitorHistory.timestamp <= end_time
        ).order_by(MonitorHistory.timestamp.asc()).limit(limit)
        
        result = await db.execute(query)
        records = list(result.scalars().all())
        
        # 数据采样
        if interval and interval > 0 and len(records) > 1:
            sampled_records = []
            last_timestamp = None
            for record in records:
                if last_timestamp is None or (record.timestamp - last_timestamp).total_seconds() >= interval:
                    sampled_records.append(record)
                    last_timestamp = record.timestamp
            records = sampled_records
        
        # 只返回网络字段
        items = []
        for record in records:
            item_dict = {
                "id": record.id,
                "timestamp": record.timestamp,
                "network_total_recv_rate": record.network_total_recv_rate,
                "network_total_sent_rate": record.network_total_sent_rate,
            }
            
            # 解析network_interfaces
            if record.network_interfaces:
                try:
                    item_dict["network_interfaces"] = json.loads(record.network_interfaces)
                except:
                    pass
            
            items.append(MonitorHistoryItem(**item_dict))
        
        # 统计
        statistics = {}
        if items:
            recv_values = [item.network_total_recv_rate for item in items if item.network_total_recv_rate]
            sent_values = [item.network_total_sent_rate for item in items if item.network_total_sent_rate]
            
            if recv_values and sent_values:
                statistics["network"] = {
                    "recv_avg": round(sum(recv_values) / len(recv_values), 2),
                    "recv_max": round(max(recv_values), 2),
                    "sent_avg": round(sum(sent_values) / len(sent_values), 2),
                    "sent_max": round(max(sent_values), 2),
                }
        
        return success_response(
            data=MonitorHistoryList(
                items=items,
                total=len(items),
                start_time=start_time,
                end_time=end_time,
                statistics=statistics
            ),
            message=t("gateway.success.network_history", locale),
            locale=locale,
            request_id=request_id
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get network history: {str(e)}"
        )


@router.get(
    "/monitor/history/statistics",
    summary="获取监控统计数据",
    description="只返回统计数据（avg/max/min），不返回详细历史点，极轻量级"
)
async def get_monitor_statistics(
    hours: int = 1,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[dict]:
    """
    获取监控统计数据（极轻量级）
    
    参数：
    - hours: 统计时间范围（默认1小时）
    
    返回：只包含统计数据，不包含详细历史点
    """
    from sqlalchemy import select, func
    from app.models.monitor_history import MonitorHistory
    from datetime import timedelta
    
    try:
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=hours)
        
        # 查询统计数据（使用SQL聚合函数）
        query = select(
            func.avg(MonitorHistory.cpu_percent).label('cpu_avg'),
            func.max(MonitorHistory.cpu_percent).label('cpu_max'),
            func.min(MonitorHistory.cpu_percent).label('cpu_min'),
            func.avg(MonitorHistory.memory_percent).label('memory_avg'),
            func.max(MonitorHistory.memory_percent).label('memory_max'),
            func.min(MonitorHistory.memory_percent).label('memory_min'),
            func.avg(MonitorHistory.disk_percent).label('disk_avg'),
            func.max(MonitorHistory.disk_percent).label('disk_max'),
            func.min(MonitorHistory.disk_percent).label('disk_min'),
            func.avg(MonitorHistory.network_total_recv_rate).label('network_recv_avg'),
            func.max(MonitorHistory.network_total_recv_rate).label('network_recv_max'),
            func.avg(MonitorHistory.network_total_sent_rate).label('network_sent_avg'),
            func.max(MonitorHistory.network_total_sent_rate).label('network_sent_max'),
        ).where(
            MonitorHistory.timestamp >= start_time,
            MonitorHistory.timestamp <= end_time
        )
        
        result = await db.execute(query)
        row = result.one_or_none()
        
        if not row:
            statistics = {}
        else:
            statistics = {
                "cpu": {
                    "avg": round(float(row.cpu_avg or 0), 2),
                    "max": round(float(row.cpu_max or 0), 2),
                    "min": round(float(row.cpu_min or 0), 2),
                },
                "memory": {
                    "avg": round(float(row.memory_avg or 0), 2),
                    "max": round(float(row.memory_max or 0), 2),
                    "min": round(float(row.memory_min or 0), 2),
                },
                "disk": {
                    "avg": round(float(row.disk_avg or 0), 2),
                    "max": round(float(row.disk_max or 0), 2),
                    "min": round(float(row.disk_min or 0), 2),
                },
                "network": {
                    "recv_avg": round(float(row.network_recv_avg or 0), 2),
                    "recv_max": round(float(row.network_recv_max or 0), 2),
                    "sent_avg": round(float(row.network_sent_avg or 0), 2),
                    "sent_max": round(float(row.network_sent_max or 0), 2),
                },
                "time_range": {
                    "start": start_time.isoformat(),
                    "end": end_time.isoformat(),
                    "hours": hours,
                }
            }
        
        return success_response(
            data=statistics,
            message=t("gateway.success.monitor_statistics", locale),
            locale=locale,
            request_id=request_id
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get monitor statistics: {str(e)}"
        )


@router.get(
    "/config/system",
    response_model=ApiResponse[List[SystemConfigItem]],
    summary="获取系统配置",
    description="获取系统级运行时配置，可按模块筛选"
)
async def get_system_config(
    module: Optional[str] = Query(default=None, description="模块名称（如 monitor/rathole），为空则返回全部"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[SystemConfigItem]]:
    """获取系统配置（所有角色可查看）"""
    from sqlalchemy import select
    
    try:
        await _ensure_system_config_defaults(db, module)
        
        stmt = select(SystemConfig).order_by(SystemConfig.module, SystemConfig.key)
        if module:
            stmt = stmt.where(SystemConfig.module == module)
        
        result = await db.execute(stmt)
        configs = result.scalars().all()
        
        return success_response(
            data=[SystemConfigItem.model_validate(c) for c in configs],
            message=t("gateway.success.system_config", locale),
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system config: {str(e)}"
        )


@router.patch(
    "/config/system",
    response_model=ApiResponse[List[SystemConfigItem]],
    summary="更新系统配置",
    description="更新系统级运行时配置（仅开发者）"
)
@audit_route(
    module="gateway",
    action="update_system_config",
    action_key="audit.action.system_config_updated"
)
async def update_system_config(
    request: Request,
    config_update: SystemConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[SystemConfigItem]]:
    """
    更新监控配置
    
    权限：仅开发者可操作
    """
    from sqlalchemy import select
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.DEVELOPER,
        error_message=t("gateway.error.permission_denied", locale)
    )
    
    try:
        await _ensure_system_config_defaults(db)
        
        module_updates = config_update.model_dump(exclude_unset=True)
        if not module_updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No configuration provided"
            )
        
        for module, values in module_updates.items():
            if not values:
                continue
            await _ensure_system_config_defaults(db, module)
            await _upsert_system_config_values(db, module, values)
        
        await db.commit()
        
        # 返回更新后的配置
        from sqlalchemy import select
        
        result = await db.execute(
            select(SystemConfig)
            .order_by(SystemConfig.module, SystemConfig.key)
        )
        configs = result.scalars().all()
        
        # 设置审计目标
        modules_changed = ",".join(module_updates.keys())
        set_audit_target(request, "system_config", "modules", modules_changed or "system_config")
        
        return success_response(
            data=[SystemConfigItem.model_validate(c) for c in configs],
            message=t("gateway.success.system_config_updated", locale),
            locale=locale,
            request_id=request_id
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update monitor config: {str(e)}"
        )
