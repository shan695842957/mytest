/**
 * 资产相关类型定义
 */

/**
 * 资产
 */
export interface Asset {
  id: number
  name: string
  display_name: string
  device_type_id: number
  location: string
  enabled: boolean
  metadata_json: Record<string, any>
  created_at: string
  updated_at: string
  comm_instance_ids?: number[]
}

/**
 * 资产详情（包含映射列表）
 */
export interface AssetDetail extends Asset {
  mappings: AssetMapping[]
}

/**
 * 资产映射
 */
export interface AssetMapping {
  id: number
  asset_id: number
  asset_tag_name: string
  instance_id: number
  point_name: string
  is_overridden: boolean
  created_at: string
  updated_at: string
  instance_name?: string
  instance_display_name?: string
  tag_display_name?: string
}

/**
 * 资产映射详情（包含更多信息）
 */
export interface AssetMappingDetail extends AssetMapping {
  tag_semantic_type?: string
  tag_data_type?: string
  point_address?: string
  point_raw_type?: string
  tag_group_name?: string
}

/**
 * 创建资产请求
 */
export interface CreateAssetRequest {
  name: string
  display_name: string
  device_type_id: number
  location?: string
  enabled?: boolean
  metadata_json?: Record<string, any>
  comm_instance_ids?: number[]
}

/**
 * 更新资产请求
 */
export interface UpdateAssetRequest {
  display_name?: string
  device_type_id?: number
  location?: string
  enabled?: boolean
  metadata_json?: Record<string, any>
  comm_instance_ids?: number[]
}

/**
 * 创建资产映射请求
 */
export interface CreateAssetMappingRequest {
  asset_tag_name: string
  instance_id: number
  point_name: string
  is_overridden?: boolean
}

/**
 * 更新资产映射请求
 */
export interface UpdateAssetMappingRequest {
  instance_id?: number
  point_name?: string
  is_overridden?: boolean
}

/**
 * 自动生成资产映射请求
 */
export interface SyncAssetCommInstancesRequest {
  comm_instance_ids: number[]
}

/**
 * 资产列表查询参数
 */
export interface AssetListParams {
  skip?: number
  limit?: number
  search?: string
  device_type_id?: number
  enabled?: boolean
}

