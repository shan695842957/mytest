/**
 * BMS（电池管理系统）相关 API
 */

import { http } from '@/utils/request'
import type { ApiResponse } from '@/types'

// ============================================================================
// BMS 架构和页面配置
// ============================================================================

export interface BMSArchitecture {
  id: number
  name: string
  display_name_zh: string
  display_name_en: string
  description_zh: string
  description_en: string
  created_at: string
  updated_at: string
}

export interface BMSPageConfig {
  id: number
  architecture_id: number
  page_type: string
  display_name_zh: string
  display_name_en: string
  description_zh: string
  description_en: string
  created_at: string
  updated_at: string
}

/**
 * 获取BMS架构列表
 */
export const getBMSArchitectures = async () => {
  const response = await http.get<ApiResponse<BMSArchitecture[]>>('/bms/architectures')
  return response.data
}

/**
 * 获取架构页面配置列表
 */
export const getBMSPageConfigs = async (architectureId: number) => {
  const response = await http.get<ApiResponse<BMSPageConfig[]>>(
    `/bms/architectures/${architectureId}/page-configs`
  )
  return response.data
}

// ============================================================================
// BMS 实例
// ============================================================================

export interface BMSInstance {
  id: number
  asset_id: number
  architecture_id: number
  instance_name: string
  display_name_zh: string
  display_name_en: string
  enabled: boolean
  metadata_json: Record<string, any>
  created_at: string
  updated_at: string
  asset_name?: string
  asset_display_name?: string
  architecture_name?: string
}

export interface BMSInstanceListParams {
  skip?: number
  limit?: number
  search?: string
  architecture_id?: number
  enabled?: boolean
}

export interface CreateBMSInstanceRequest {
  asset_id: number
  architecture_id: number
  instance_name: string
  display_name_zh: string
  display_name_en: string
  enabled?: boolean
  metadata_json?: Record<string, any>
}

export interface UpdateBMSInstanceRequest {
  instance_name?: string
  display_name_zh?: string
  display_name_en?: string
  enabled?: boolean
  metadata_json?: Record<string, any>
}

/**
 * 获取BMS实例列表
 */
export const getBMSInstanceList = async (params?: BMSInstanceListParams) => {
  const response = await http.get<ApiResponse<BMSInstance[]>>('/bms/instances', { params })
  return response.data
}

/**
 * 获取BMS实例详情
 */
export const getBMSInstanceDetail = async (id: number) => {
  const response = await http.get<ApiResponse<BMSInstance>>(`/bms/instances/${id}`)
  return response.data
}

/**
 * 创建BMS实例
 */
export const createBMSInstance = async (data: CreateBMSInstanceRequest) => {
  const response = await http.post<ApiResponse<BMSInstance>>('/bms/instances', data)
  return response.data
}

/**
 * 更新BMS实例
 */
export const updateBMSInstance = async (id: number, data: UpdateBMSInstanceRequest) => {
  const response = await http.patch<ApiResponse<BMSInstance>>(`/bms/instances/${id}`, data)
  return response.data
}

/**
 * 删除BMS实例
 */
export const deleteBMSInstance = async (id: number) => {
  const response = await http.delete<ApiResponse<null>>(`/bms/instances/${id}`)
  return response.data
}

// ============================================================================
// BMS 层级配置
// ============================================================================

export interface BMSHierarchyConfig {
  id: number
  bms_instance_id: number
  cluster_count: number
  pack_count_per_cluster: number
  series_count: number
  parallel_count: number
  temperature_point_count: number
  description_zh: string
  description_en: string
  metadata_json: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateBMSHierarchyConfigRequest {
  cluster_count: number
  pack_count_per_cluster: number
  series_count: number
  parallel_count: number
  temperature_point_count?: number
  description_zh?: string
  description_en?: string
  metadata_json?: Record<string, any>
}

export interface UpdateBMSHierarchyConfigRequest {
  cluster_count?: number
  pack_count_per_cluster?: number
  series_count?: number
  parallel_count?: number
  temperature_point_count?: number
  description_zh?: string
  description_en?: string
  metadata_json?: Record<string, any>
}

/**
 * 获取BMS层级配置
 */
export const getBMSHierarchyConfig = async (instanceId: number) => {
  const response = await http.get<ApiResponse<BMSHierarchyConfig>>(
    `/bms/instances/${instanceId}/hierarchy-config`
  )
  return response.data
}

/**
 * 创建BMS层级配置
 */
export const createBMSHierarchyConfig = async (
  instanceId: number,
  data: CreateBMSHierarchyConfigRequest
) => {
  const response = await http.post<ApiResponse<BMSHierarchyConfig>>(
    `/bms/instances/${instanceId}/hierarchy-config`,
    data
  )
  return response.data
}

/**
 * 更新BMS层级配置
 */
export const updateBMSHierarchyConfig = async (
  instanceId: number,
  data: UpdateBMSHierarchyConfigRequest
) => {
  const response = await http.patch<ApiResponse<BMSHierarchyConfig>>(
    `/bms/instances/${instanceId}/hierarchy-config`,
    data
  )
  return response.data
}

// ============================================================================
// BMS 字段配置
// ============================================================================

export interface BMSFieldConfig {
  id: number
  bms_instance_id: number
  page_type: string
  field_key: string
  display_name_zh: string
  display_name_en: string
  field_type: string
  data_type: string
  unit_zh: string
  unit_en: string
  is_required: boolean
  is_readable: boolean
  is_writable: boolean
  source_type: string
  read_device_type_tag_id?: number
  write_device_type_tag_id?: number
  read_comm_instance_id?: number
  read_point_id?: number
  write_comm_instance_id?: number
  write_point_id?: number
  sort_order: number
  description_zh: string
  description_en: string
  created_at: string
  updated_at: string
}

export interface CreateBMSFieldConfigRequest {
  page_type: string
  field_key: string
  display_name_zh: string
  display_name_en: string
  field_type: string
  data_type: string
  unit_zh?: string
  unit_en?: string
  is_required?: boolean
  is_readable?: boolean
  is_writable?: boolean
  source_type: string
  read_device_type_tag_id?: number
  write_device_type_tag_id?: number
  read_comm_instance_id?: number
  read_point_id?: number
  write_comm_instance_id?: number
  write_point_id?: number
  sort_order?: number
  description_zh?: string
  description_en?: string
}

export interface UpdateBMSFieldConfigRequest {
  display_name_zh?: string
  display_name_en?: string
  unit_zh?: string
  unit_en?: string
  is_required?: boolean
  is_readable?: boolean
  is_writable?: boolean
  source_type?: string
  read_device_type_tag_id?: number
  write_device_type_tag_id?: number
  read_comm_instance_id?: number
  read_point_id?: number
  write_comm_instance_id?: number
  write_point_id?: number
  sort_order?: number
  description_zh?: string
  description_en?: string
}

/**
 * 获取BMS字段配置列表
 */
export const getBMSFieldConfigList = async (instanceId: number, pageType: string) => {
  const response = await http.get<ApiResponse<BMSFieldConfig[]>>(
    `/bms/instances/${instanceId}/field-configs`,
    { params: { page_type: pageType } }
  )
  return response.data
}

/**
 * 创建BMS字段配置
 */
export const createBMSFieldConfig = async (
  instanceId: number,
  data: CreateBMSFieldConfigRequest
) => {
  const response = await http.post<ApiResponse<BMSFieldConfig>>(
    `/bms/instances/${instanceId}/field-configs`,
    data
  )
  return response.data
}

/**
 * 更新BMS字段配置
 */
export const updateBMSFieldConfig = async (
  instanceId: number,
  fieldConfigId: number,
  data: UpdateBMSFieldConfigRequest
) => {
  const response = await http.patch<ApiResponse<BMSFieldConfig>>(
    `/bms/instances/${instanceId}/field-configs/${fieldConfigId}`,
    data
  )
  return response.data
}

/**
 * 删除BMS字段配置
 */
export const deleteBMSFieldConfig = async (instanceId: number, fieldConfigId: number) => {
  const response = await http.delete<ApiResponse<null>>(
    `/bms/instances/${instanceId}/field-configs/${fieldConfigId}`
  )
  return response.data
}

/**
 * 导出BMS字段配置（CSV）
 */
export const exportBMSFieldConfigs = async (instanceId: number, pageType: string) => {
  const response = await http.get(
    `/bms/instances/${instanceId}/field-configs/export`,
    {
      params: { page_type: pageType },
      responseType: 'blob',
    }
  )
  
  // 创建下载链接
  const blob = response.data as unknown as Blob
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `bms_field_configs_${instanceId}_${pageType}_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * 导入BMS字段配置（CSV）
 */
export const importBMSFieldConfigs = async (
  instanceId: number,
  pageType: string,
  file: File,
  importMode: 'append' | 'update' = 'append'
) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await http.post<ApiResponse<{
    success_count: number
    failed_count: number
    errors: Array<{ row: number; field_key: string; error: string }>
  }>>(
    `/bms/instances/${instanceId}/field-configs/import`,
    formData,
    {
      params: {
        page_type: pageType,
        import_mode: importMode,
      },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  )
  return response.data
}
