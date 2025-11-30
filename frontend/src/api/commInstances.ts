/**
 * 通信实例相关 API
 */

import { http } from '@/utils/request'
import type {
  CommInstance,
  CreateCommInstanceRequest,
  UpdateCommInstanceRequest,
  CommInstanceListParams,
  ApiResponse,
} from '@/types'

/**
 * 获取通信实例列表
 */
export const getCommInstanceList = async (params?: CommInstanceListParams) => {
  const response = await http.get<ApiResponse<CommInstance[]>>('/comm-instances', { params })
  return response.data
}

/**
 * 获取通信实例详情
 */
export const getCommInstanceDetail = async (id: number) => {
  const response = await http.get<ApiResponse<CommInstance>>(`/comm-instances/${id}`)
  return response.data
}

/**
 * 创建通信实例
 */
export const createCommInstance = async (data: CreateCommInstanceRequest) => {
  const response = await http.post<CommInstance>('/comm-instances', data)
  return response.data
}

/**
 * 更新通信实例
 */
export const updateCommInstance = async (id: number, data: UpdateCommInstanceRequest) => {
  const response = await http.put<CommInstance>(`/comm-instances/${id}`, data)
  return response.data
}

/**
 * 删除通信实例
 */
export const deleteCommInstance = async (id: number) => {
  const response = await http.delete(`/comm-instances/${id}`)
  return response.data
}

