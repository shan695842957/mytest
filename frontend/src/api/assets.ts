/**
 * 资产相关 API
 */

import { http } from '@/utils/request'
import type {
  Asset,
  AssetDetail,
  AssetMapping,
  AssetMappingDetail,
  CreateAssetRequest,
  UpdateAssetRequest,
  CreateAssetMappingRequest,
  UpdateAssetMappingRequest,
  SyncAssetCommInstancesRequest,
  AssetListParams,
  ApiResponse,
} from '@/types'

/**
 * 获取资产列表
 */
export const getAssetList = async (params?: AssetListParams) => {
  const response = await http.get<ApiResponse<Asset[]>>('/assets', { params })
  return response.data
}

/**
 * 获取资产详情
 */
export const getAssetDetail = async (id: number) => {
  const response = await http.get<ApiResponse<AssetDetail>>(`/assets/${id}`)
  return response.data
}

/**
 * 创建资产
 */
export const createAsset = async (data: CreateAssetRequest) => {
  const response = await http.post<Asset>('/assets', data)
  return response.data
}

/**
 * 更新资产
 */
export const updateAsset = async (id: number, data: UpdateAssetRequest) => {
  const response = await http.put<Asset>(`/assets/${id}`, data)
  return response.data
}

/**
 * 删除资产
 */
export const deleteAsset = async (id: number) => {
  const response = await http.delete(`/assets/${id}`)
  return response.data
}

/**
 * 获取资产映射列表
 */
export const getAssetMappingList = async (assetId: number) => {
  const response = await http.get<ApiResponse<AssetMappingDetail[]>>(`/assets/${assetId}/mappings`)
  return response.data
}

/**
 * 获取资产映射详情
 */
export const getAssetMappingDetail = async (assetId: number, mappingId: number) => {
  const response = await http.get<AssetMappingDetail>(`/assets/${assetId}/mappings/${mappingId}`)
  return response.data
}

/**
 * 创建资产映射
 */
export const createAssetMapping = async (assetId: number, data: CreateAssetMappingRequest) => {
  const response = await http.post<AssetMapping>(`/assets/${assetId}/mappings`, data)
  return response.data
}

/**
 * 更新资产映射
 */
export const updateAssetMapping = async (mappingId: number, data: UpdateAssetMappingRequest) => {
  const response = await http.put<AssetMapping>(`/assets/mappings/${mappingId}`, data)
  return response.data
}

/**
 * 删除资产映射
 */
export const deleteAssetMapping = async (mappingId: number) => {
  const response = await http.delete(`/assets/mappings/${mappingId}`)
  return response.data
}

/**
 * 自动生成资产映射
 */
export const syncAssetCommInstances = async (
  assetId: number,
  data: SyncAssetCommInstancesRequest
) => {
  const response = await http.post<ApiResponse<{ created_count: number; comm_instance_ids: number[] }>>(
    `/assets/${assetId}/mappings/auto-generate`,
    data
  )
  return response.data
}

