/**
 * Rathole 内网穿透 API
 */

import { http } from '@/utils/request'
import type {
  RatholeService,
  RatholeServiceCreate,
  RatholeServiceUpdate,
  RatholeGlobalConfig,
  RatholeConfigResponse,
  RatholeServiceStatus,
  RatholeBackupInfo,
} from '@/types'

/**
 * 获取 Rathole 配置
 */
export const getRatholeConfig = async () => {
  const response = await http.get<RatholeConfigResponse>('/tools/rathole/config')
  return response.data
}

/**
 * 更新远程服务器地址
 */
export const updateRemoteAddr = async (remote_addr: string) => {
  const response = await http.put<{ remote_addr: string }>('/tools/rathole/config/remote-addr', {
    remote_addr,
  })
  return response.data
}

/**
 * 获取服务列表
 */
export const getRatholeServices = async () => {
  const response = await http.get<RatholeService[]>('/tools/rathole/services')
  return response.data
}

/**
 * 获取服务详情
 */
export const getRatholeService = async (service_name: string) => {
  const response = await http.get<RatholeService>(`/tools/rathole/services/${service_name}`)
  return response.data
}

/**
 * 创建服务
 */
export const createRatholeService = async (data: RatholeServiceCreate) => {
  const response = await http.post<RatholeService>('/tools/rathole/services', data)
  return response.data
}

/**
 * 更新服务
 */
export const updateRatholeService = async (service_name: string, data: RatholeServiceUpdate) => {
  const response = await http.patch<RatholeService>(`/tools/rathole/services/${service_name}`, data)
  return response.data
}

/**
 * 删除服务
 */
export const deleteRatholeService = async (service_name: string) => {
  const response = await http.delete<null>(`/tools/rathole/services/${service_name}`)
  return response.data
}

/**
 * 获取 TOML 内容
 */
export const getTomlContent = async () => {
  const response = await http.get<string>('/tools/rathole/toml/content')
  return response.data
}

/**
 * 下载 TOML 文件
 */
export const downloadToml = async () => {
  const response = await http.get('/tools/rathole/toml/download', {
    responseType: 'blob',
  })
  
  const blob = response.data as unknown as Blob
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'rathole_client.toml'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * 启动 Rathole 服务
 */
export const startRatholeService = async () => {
  const response = await http.post<{ success: boolean; message: string }>(
    '/tools/rathole/systemctl/start'
  )
  return response.data
}

/**
 * 停止 Rathole 服务
 */
export const stopRatholeService = async () => {
  const response = await http.post<{ success: boolean; message: string }>(
    '/tools/rathole/systemctl/stop'
  )
  return response.data
}

/**
 * 重启 Rathole 服务
 */
export const restartRatholeService = async () => {
  const response = await http.post<{ success: boolean; message: string }>(
    '/tools/rathole/systemctl/restart'
  )
  return response.data
}

/**
 * 获取 Rathole 服务状态
 */
export const getRatholeStatus = async () => {
  const response = await http.get<RatholeServiceStatus>('/tools/rathole/systemctl/status')
  return response.data
}

/**
 * 获取备份列表
 */
export const getBackups = async () => {
  const response = await http.get<RatholeBackupInfo[]>('/tools/rathole/backups')
  return response.data
}

/**
 * 查看备份内容
 */
export const getBackupContent = async (backup_filename: string) => {
  const response = await http.get<string>(`/tools/rathole/backups/${backup_filename}/content`)
  return response.data
}

/**
 * 恢复备份
 */
export const restoreBackup = async (backup_filename: string) => {
  const response = await http.post<null>(`/tools/rathole/backups/${backup_filename}/restore`)
  return response.data
}

/**
 * 删除备份
 */
export const deleteBackup = async (backup_filename: string) => {
  const response = await http.delete<null>(`/tools/rathole/backups/${backup_filename}`)
  return response.data
}

