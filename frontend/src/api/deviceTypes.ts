/**
 * 设备类型相关 API
 */

import { http } from '@/utils/request'
import type {
  DeviceType,
  DeviceTypeDetail,
  DeviceTypeTag,
  CreateDeviceTypeRequest,
  UpdateDeviceTypeRequest,
  CloneDeviceTypeRequest,
  CreateDeviceTypeTagRequest,
  UpdateDeviceTypeTagRequest,
  CloneDeviceTypeTagRequest,
  DeviceTypeListParams,
  ApiResponse,
} from '@/types'

/**
 * 获取设备类型列表
 */
export const getDeviceTypeList = async (params?: DeviceTypeListParams) => {
  // 后端返回 ApiResponse<List<DeviceType>>，data 是数组，pagination 是分页信息
  const response = await http.get<ApiResponse<DeviceType[]>>('/device-types', { params })
  return response.data
}

/**
 * 获取设备类型详情
 */
export const getDeviceTypeDetail = async (id: number) => {
  const response = await http.get<ApiResponse<DeviceTypeDetail>>(`/device-types/${id}`)
  return response.data
}

/**
 * 创建设备类型
 */
export const createDeviceType = async (data: CreateDeviceTypeRequest) => {
  const response = await http.post<DeviceType>('/device-types', data)
  return response.data
}

/**
 * 更新设备类型
 */
export const updateDeviceType = async (id: number, data: UpdateDeviceTypeRequest) => {
  const response = await http.put<DeviceType>(`/device-types/${id}`, data)
  return response.data
}

/**
 * 复制设备类型
 */
export const cloneDeviceType = async (id: number, data: CloneDeviceTypeRequest) => {
  const response = await http.post<ApiResponse<DeviceTypeDetail>>(`/device-types/${id}/clone`, data)
  return response.data
}

/**
 * 删除设备类型
 */
export const deleteDeviceType = async (id: number) => {
  const response = await http.delete(`/device-types/${id}`)
  return response.data
}

/**
 * 获取业务字段列表
 */
export const getDeviceTypeTagList = async (deviceTypeId: number, semanticType?: string) => {
  const response = await http.get<ApiResponse<DeviceTypeTag[]>>(`/device-types/${deviceTypeId}/tags`, {
    params: semanticType ? { semantic_type: semanticType } : undefined,
  })
  return response.data
}

/**
 * 创建业务字段
 */
export const createDeviceTypeTag = async (deviceTypeId: number, data: CreateDeviceTypeTagRequest) => {
  const response = await http.post<DeviceTypeTag>(`/device-types/${deviceTypeId}/tags`, data)
  return response.data
}

/**
 * 更新业务字段
 */
export const updateDeviceTypeTag = async (tagId: number, data: UpdateDeviceTypeTagRequest) => {
  const response = await http.put<DeviceTypeTag>(`/device-types/tags/${tagId}`, data)
  return response.data
}

/**
 * 复制业务字段
 */
export const cloneDeviceTypeTag = async (tagId: number, data: CloneDeviceTypeTagRequest) => {
  const response = await http.post<ApiResponse<DeviceTypeTag>>(`/device-types/tags/${tagId}/clone`, data)
  return response.data
}

/**
 * 删除业务字段
 */
export const deleteDeviceTypeTag = async (tagId: number) => {
  const response = await http.delete(`/device-types/tags/${tagId}`)
  return response.data
}

