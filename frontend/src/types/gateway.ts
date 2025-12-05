/**
 * 网关系统管理类型定义
 */

// ============================================================================
// 系统监控
// ============================================================================

export interface CPUInfo {
  percent: number
  count: number
  frequency?: number
  load_avg?: number[]
}

export interface MemoryInfo {
  total: number
  available: number
  used: number
  percent: number
  total_mb: number
  available_mb: number
  used_mb: number
}

export interface DiskInfo {
  mountpoint: string
  device: string
  fstype: string
  total: number
  used: number
  free: number
  percent: number
  total_gb: number
  used_gb: number
  free_gb: number
}

export interface SystemMonitor {
  cpu: CPUInfo
  memory: MemoryInfo
  disks: DiskInfo[]
  boot_time: string
  uptime_seconds: number
}

// ============================================================================
// 网络配置
// ============================================================================

export interface NetworkInterface {
  name: string
  ip_address?: string
  netmask?: string
  broadcast?: string
  gateway?: string
  mac_address?: string
  is_up: boolean
  is_running: boolean
}

export interface DNSConfig {
  primary?: string
  secondary?: string
  search_domains: string[]
}

export interface NetworkConfig {
  interfaces: NetworkInterface[]
  dns: DNSConfig
  default_gateway?: string
}

// ============================================================================
// 网络路由
// ============================================================================

export interface Route {
  destination: string     // 目标网络（CIDR格式）
  gateway: string         // 网关地址
  interface: string       // 出接口
  metric: number          // 路由权重
  scope: string           // 路由范围
  protocol: string        // 路由协议
  is_default: boolean     // 是否为默认路由
}

export interface RouteCreate {
  destination: string
  gateway: string
  interface: string
  metric?: number
}

export interface RouteList {
  routes: Route[]
  total: number
}

// ============================================================================
// 时间配置
// ============================================================================

export interface TimeInfo {
  local_time: string
  utc_time: string
  timezone: string
  timezone_offset: string
}

export interface NTPConfig {
  enabled: boolean
  servers: string[]
  last_sync?: string
  sync_status: string
}

export interface TimezoneInfo {
  name: string
  offset: string
  display: string
}

export interface TimezoneGroup {
  continent: string
  timezones: TimezoneInfo[]
}

export interface TimezoneList {
  timezones: TimezoneInfo[]
  grouped: TimezoneGroup[]
  total: number
}

export interface TimeConfig {
  time_info: TimeInfo
  ntp: NTPConfig
}

// ============================================================================
// 系统信息
// ============================================================================

export interface SystemInfo {
  hostname: string
  os_name: string
  os_version: string
  kernel_version: string
  architecture: string
  python_version: string
}

export interface ServiceStatus {
  name: string
  status: 'running' | 'stopped' | 'error' | 'connected'
  port?: number
  version?: string
  uptime?: string
  pid?: number
}

// ============================================================================
// 服务管理
// ============================================================================

export interface LogLevelUpdate {
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'
}

// ============================================================================
// 安全设置
// ============================================================================

export interface SSHConfig {
  enabled: boolean
  port: number
  root_login: boolean
}

export interface APISecurityConfig {
  jwt_expire_minutes: number
  rate_limit_per_minute: number
  cors_origins: string[]
}

export interface BackupInfo {
  filename: string
  size: number
  created_at: string
  size_mb: number
}

export interface BackupMetadata {
  project_id: string
  machine_uuid: string
  db_version: string
  app_version: string
  backup_time: string
}

export interface BackupValidation {
  is_valid: boolean
  is_same_project: boolean
  is_same_machine: boolean
  warning_level: 'safe' | 'warning' | 'danger'
  warning_message: string | null
  metadata: BackupMetadata
  statistics: Record<string, number>
}

export interface BackupRestoreRequest {
  confirm_text: string
  force: boolean
}

export interface MonitorHistoryItem {
  id: number
  timestamp: string
  
  // CPU数据（可选，支持分业务接口）
  cpu_percent?: number
  cpu_count?: number
  load_avg_1?: number
  load_avg_5?: number
  load_avg_15?: number
  
  // 内存数据（可选，支持分业务接口）
  memory_percent?: number
  memory_used_mb?: number
  memory_total_mb?: number
  memory_available_mb?: number
  
  // 磁盘数据（可选，支持分业务接口）
  disk_percent?: number
  disk_used_gb?: number
  disk_total_gb?: number
  disk_free_gb?: number
  
  // 网络数据（可选，支持分业务接口）
  network_interfaces?: Record<string, {
    recv_rate: number
    sent_rate: number
    bytes_recv: number
    bytes_sent: number
  }>
  network_total_recv_rate?: number
  network_total_sent_rate?: number
  
  // 进程数据
  process_cpu_percent?: number
  process_memory_percent?: number
  process_memory_mb?: number
  process_threads?: number
}

export interface MonitorHistoryList {
  items: MonitorHistoryItem[]
  total: number
  start_time: string
  end_time: string
  statistics: {
    cpu?: { avg: number; max: number; min: number }
    memory?: { avg: number; max: number; min: number }
    disk?: { avg: number; max: number; min: number }
    network?: {
      recv_avg: number
      recv_max: number
      sent_avg: number
      sent_max: number
    }
  }
}

export interface SystemConfigItem {
  module: string
  key: string
  value: string
  description?: string
}

export interface MonitorModuleConfig {
  collection_interval?: number
  retention_days?: number
  collection_enabled?: boolean
  collect_network?: boolean
  collect_process?: boolean
  auto_cleanup?: boolean
}

export interface RatholeModuleConfig {
  config_path?: string
  data_directory?: string
  backup_keep_count?: number
}

export interface SystemModuleConfig {
  data_directory?: string
}

export interface SystemConfigUpdate {
  monitor?: MonitorModuleConfig
  rathole?: RatholeModuleConfig
  system?: SystemModuleConfig
}

export interface SecurityConfig {
  ssh: SSHConfig
  api: APISecurityConfig
  backups: BackupInfo[]
}
