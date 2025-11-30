"""
网关系统管理相关 Schema
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


# ============================================================================
# 系统监控 Schema
# ============================================================================

class CPUInfo(BaseModel):
    """CPU信息"""
    percent: float = Field(..., description="CPU使用率（百分比）")
    count: int = Field(..., description="CPU核心数")
    frequency: Optional[float] = Field(None, description="CPU频率（MHz）")
    load_avg: Optional[List[float]] = Field(None, description="系统负载（1/5/15分钟）")


class MemoryInfo(BaseModel):
    """内存信息"""
    total: int = Field(..., description="总内存（字节）")
    available: int = Field(..., description="可用内存（字节）")
    used: int = Field(..., description="已用内存（字节）")
    percent: float = Field(..., description="使用率（百分比）")
    
    # 格式化显示
    total_mb: float = Field(..., description="总内存（MB）")
    available_mb: float = Field(..., description="可用内存（MB）")
    used_mb: float = Field(..., description="已用内存（MB）")


class DiskInfo(BaseModel):
    """磁盘信息"""
    mountpoint: str = Field(..., description="挂载点")
    device: str = Field(..., description="设备名称")
    fstype: str = Field(..., description="文件系统类型")
    total: int = Field(..., description="总容量（字节）")
    used: int = Field(..., description="已用容量（字节）")
    free: int = Field(..., description="剩余容量（字节）")
    percent: float = Field(..., description="使用率（百分比）")
    
    # 格式化显示
    total_gb: float = Field(..., description="总容量（GB）")
    used_gb: float = Field(..., description="已用容量（GB）")
    free_gb: float = Field(..., description="剩余容量（GB）")


class SystemMonitor(BaseModel):
    """系统监控汇总"""
    cpu: CPUInfo
    memory: MemoryInfo
    disks: List[DiskInfo]
    boot_time: datetime = Field(..., description="系统启动时间")
    uptime_seconds: int = Field(..., description="运行时长（秒）")


# ============================================================================
# 网络配置 Schema
# ============================================================================

class NetworkInterface(BaseModel):
    """网络接口信息"""
    name: str = Field(..., description="接口名称（如 eth0）")
    ip_address: Optional[str] = Field(None, description="IP地址")
    netmask: Optional[str] = Field(None, description="子网掩码")
    broadcast: Optional[str] = Field(None, description="广播地址")
    gateway: Optional[str] = Field(None, description="网关地址")
    mac_address: Optional[str] = Field(None, description="MAC地址")
    is_up: bool = Field(..., description="是否启用")
    is_running: bool = Field(..., description="是否运行中")


class DNSConfig(BaseModel):
    """DNS配置"""
    primary: Optional[str] = Field(None, description="主DNS服务器")
    secondary: Optional[str] = Field(None, description="备用DNS服务器")
    search_domains: List[str] = Field(default=[], description="搜索域列表")


class NetworkConfig(BaseModel):
    """网络配置"""
    interfaces: List[NetworkInterface]
    dns: DNSConfig
    default_gateway: Optional[str] = Field(None, description="默认网关")


class NetworkInterfaceUpdate(BaseModel):
    """更新网络接口配置"""
    ip_address: Optional[str] = None
    netmask: Optional[str] = None
    gateway: Optional[str] = None


class Route(BaseModel):
    """路由表条目"""
    destination: str = Field(..., description="目标网络（CIDR格式，如 192.168.1.0/24 或 0.0.0.0/0）")
    gateway: str = Field(..., description="网关地址（如 192.168.1.1）")
    interface: str = Field(..., description="出接口（如 eth0）")
    metric: int = Field(default=0, description="路由权重（越小越优先，0表示直连）")
    scope: str = Field(default="global", description="路由范围（global/link/host）")
    protocol: str = Field(default="static", description="路由协议（kernel/boot/static/dhcp）")
    is_default: bool = Field(default=False, description="是否为默认路由")


class RouteCreate(BaseModel):
    """创建路由"""
    destination: str = Field(..., description="目标网络（CIDR格式）")
    gateway: str = Field(..., description="网关地址")
    interface: str = Field(..., description="出接口")
    metric: int = Field(default=100, ge=0, le=1000, description="路由权重（0-1000）")


class RouteList(BaseModel):
    """路由列表响应"""
    routes: List[Route]
    total: int


class DNSConfigUpdate(BaseModel):
    """更新DNS配置"""
    primary: Optional[str] = None
    secondary: Optional[str] = None
    search_domains: Optional[List[str]] = None


# ============================================================================
# 时间配置 Schema
# ============================================================================

class TimeInfo(BaseModel):
    """时间信息"""
    local_time: datetime = Field(..., description="本地时间")
    utc_time: datetime = Field(..., description="UTC时间")
    timezone: str = Field(..., description="时区（如 Asia/Shanghai）")
    timezone_offset: str = Field(..., description="时区偏移（如 +08:00）")


class NTPConfig(BaseModel):
    """NTP配置"""
    enabled: bool = Field(..., description="是否启用NTP")
    servers: List[str] = Field(..., description="NTP服务器列表")
    last_sync: Optional[datetime] = Field(None, description="上次同步时间")
    sync_status: str = Field(..., description="同步状态")


class TimeConfig(BaseModel):
    """时间配置"""
    time_info: TimeInfo
    ntp: NTPConfig


class TimezoneInfo(BaseModel):
    """时区信息"""
    name: str = Field(..., description="时区名称（如 Asia/Shanghai）")
    offset: str = Field(..., description="UTC偏移（如 +08:00）")
    display: str = Field(..., description="显示名称（如 亚洲/上海 (UTC+8)）")


class TimezoneGroup(BaseModel):
    """时区分组"""
    continent: str = Field(..., description="洲名（如 Asia）")
    timezones: List[TimezoneInfo] = Field(..., description="该洲的时区列表")


class TimezoneList(BaseModel):
    """时区列表"""
    timezones: List[TimezoneInfo] = Field(..., description="所有时区（扁平列表）")
    grouped: List[TimezoneGroup] = Field(..., description="分组时区")
    total: int = Field(..., description="总数")


class TimeConfigUpdate(BaseModel):
    """更新时间配置"""
    timezone: Optional[str] = None


class NTPConfigUpdate(BaseModel):
    """更新NTP配置"""
    enabled: Optional[bool] = None
    servers: Optional[List[str]] = None


# ============================================================================
# 系统信息 Schema
# ============================================================================

class SystemInfo(BaseModel):
    """系统基础信息"""
    hostname: str = Field(..., description="主机名")
    os_name: str = Field(..., description="操作系统名称")
    os_version: str = Field(..., description="操作系统版本")
    kernel_version: str = Field(..., description="内核版本")
    architecture: str = Field(..., description="系统架构")
    python_version: str = Field(..., description="Python版本")


class ServiceStatus(BaseModel):
    """服务状态"""
    name: str = Field(..., description="服务名称")
    status: str = Field(..., description="状态（running/stopped/error）")
    port: Optional[int] = Field(None, description="监听端口")
    version: Optional[str] = Field(None, description="版本号")
    uptime: Optional[str] = Field(None, description="运行时长")
    pid: Optional[int] = Field(None, description="进程ID")


# ============================================================================
# 服务管理 Schema
# ============================================================================

class LogLevelUpdate(BaseModel):
    """更新日志级别"""
    level: str = Field(..., description="日志级别（DEBUG/INFO/WARNING/ERROR）", pattern="^(DEBUG|INFO|WARNING|ERROR)$")


class ServiceControl(BaseModel):
    """服务控制"""
    action: str = Field(..., description="操作（restart/stop/start）", pattern="^(restart|stop|start)$")


# ============================================================================
# 安全设置 Schema
# ============================================================================

class SSHConfig(BaseModel):
    """SSH配置"""
    enabled: bool = Field(..., description="是否启用SSH")
    port: int = Field(..., description="SSH端口")
    root_login: bool = Field(..., description="是否允许root登录")


class APISecurityConfig(BaseModel):
    """API安全配置"""
    jwt_expire_minutes: int = Field(..., description="JWT过期时间（分钟）")
    rate_limit_per_minute: int = Field(..., description="每分钟请求限制")
    cors_origins: List[str] = Field(..., description="CORS允许的源")


class BackupInfo(BaseModel):
    """备份信息"""
    filename: str = Field(..., description="备份文件名")
    size: int = Field(..., description="文件大小（字节）")
    created_at: datetime = Field(..., description="创建时间")
    size_mb: float = Field(..., description="文件大小（MB）")


class BackupMetadata(BaseModel):
    """备份元数据（指纹信息）"""
    project_id: str = Field(..., description="项目标识")
    machine_uuid: str = Field(..., description="主机UUID")
    db_version: str = Field(..., description="数据库版本")
    app_version: str = Field(..., description="应用版本")
    backup_time: str = Field(..., description="备份时间")


class BackupValidation(BaseModel):
    """备份验证结果"""
    is_valid: bool = Field(..., description="备份文件是否有效")
    is_same_project: bool = Field(..., description="是否同一项目")
    is_same_machine: bool = Field(..., description="是否同一机器")
    warning_level: str = Field(..., description="警告级别：safe/warning/danger")
    warning_message: Optional[str] = Field(None, description="警告信息")
    metadata: BackupMetadata = Field(..., description="备份元数据")
    statistics: Dict = Field(..., description="数据统计")


class BackupRestoreRequest(BaseModel):
    """备份还原请求"""
    confirm_text: str = Field(..., description="确认文本（必须输入RESTORE）")
    force: bool = Field(default=False, description="强制还原（即使不是同一机器）")


class MonitorHistoryItem(BaseModel):
    """
    监控历史数据项（精简版）
    
    只包含前端实际使用的字段：
    - CPU: cpu_percent（用于画曲线）
    - Memory: memory_percent（用于画曲线）
    - Disk: disk_percent（用于画曲线）
    - Network: 全部字段（用于多网卡展示）
    
    优化效果：字段数从 21个 → 6个，减少 71%
    """
    id: int
    timestamp: datetime
    
    # CPU数据（只保留使用率）
    cpu_percent: Optional[float] = None
    
    # 内存数据（只保留使用率）
    memory_percent: Optional[float] = None
    
    # 磁盘数据（只保留使用率）
    disk_percent: Optional[float] = None
    
    # 网络数据（保留全部，用于多网卡展示）
    network_interfaces: Optional[Dict] = None  # 解析后的对象
    network_total_recv_rate: Optional[float] = None
    network_total_sent_rate: Optional[float] = None
    
    model_config = {"from_attributes": True}


class MonitorHistoryList(BaseModel):
    """监控历史数据列表"""
    items: List[MonitorHistoryItem]
    total: int
    start_time: datetime
    end_time: datetime
    statistics: Dict  # 统计信息（平均值、峰值等）


class SystemConfigItem(BaseModel):
    """系统配置项"""
    module: str
    key: str
    value: str
    description: Optional[str] = None
    
    model_config = {"from_attributes": True}


class MonitorConfigUpdate(BaseModel):
    """监控配置更新"""
    collection_interval: Optional[int] = Field(None, ge=5, le=300, description="采集间隔（5-300秒）")
    retention_days: Optional[int] = Field(None, ge=1, le=30, description="保留天数（1-30天）")
    collection_enabled: Optional[bool] = Field(None, description="是否启用采集")
    collect_network: Optional[bool] = Field(None, description="是否采集网络")
    collect_process: Optional[bool] = Field(None, description="是否采集进程")
    auto_cleanup: Optional[bool] = Field(None, description="是否自动清理")


class RatholeConfigUpdate(BaseModel):
    """Rathole 配置更新"""
    config_path: Optional[str] = Field(None, min_length=1, description="客户端配置路径")
    data_directory: Optional[str] = Field(None, min_length=1, description="数据目录")
    backup_keep_count: Optional[int] = Field(None, ge=1, le=30, description="备份保留数量")


class SystemModuleConfigUpdate(BaseModel):
    """系统模块配置更新"""
    data_directory: Optional[str] = Field(None, min_length=1, description="软件数据存储根目录")


class SystemConfigUpdate(BaseModel):
    """系统配置更新"""
    monitor: Optional[MonitorConfigUpdate] = None
    rathole: Optional[RatholeConfigUpdate] = None
    system: Optional[SystemModuleConfigUpdate] = None


class SecurityConfig(BaseModel):
    """安全配置"""
    ssh: SSHConfig
    api: APISecurityConfig
    backups: List[BackupInfo]
