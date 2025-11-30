/**
 * Rathole 内网穿透类型定义
 */

/**
 * Rathole 服务
 */
export interface RatholeService {
  service_name: string
  token: string
  local_addr: string
  description?: string
}

/**
 * 创建 Rathole 服务
 */
export interface RatholeServiceCreate {
  service_name: string
  token: string
  local_addr: string
  description?: string
}

/**
 * 更新 Rathole 服务
 */
export interface RatholeServiceUpdate {
  service_name?: string
  token?: string
  local_addr?: string
  description?: string
}

/**
 * Rathole 全局配置
 */
export interface RatholeGlobalConfig {
  remote_addr: string
  config_path: string
}

/**
 * Rathole 配置响应
 */
export interface RatholeConfigResponse {
  remote_addr: string
  config_path: string
  services: Record<string, RatholeService>
  service_count: number
}

/**
 * Rathole 服务状态
 */
export interface RatholeServiceStatus {
  status: 'active' | 'inactive' | 'failed' | 'unknown'
  is_active: boolean
  pid: number | null
  uptime: string | null
  memory_usage: string | null
}

/**
 * 备份文件信息
 */
export interface RatholeBackupInfo {
  filename: string
  timestamp: string
  size: number
  created_at: string
}

