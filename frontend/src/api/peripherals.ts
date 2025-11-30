/**
 * 外设设备 API 客户端
 */

import { http } from '@/utils/request'
import type {
  Peripheral,
  CreatePeripheralRequest,
  UpdatePeripheralRequest,
  PeripheralSimpleResponse,
  PeripheralListParams,
} from '@/types'
import type { ApiResponse, PaginatedResponse } from '@/types/api'

/**
 * 获取外设列表
 */
export const getPeripherals = async (params?: PeripheralListParams) => {
  const response = await http.get<PaginatedResponse<Peripheral>>('/peripherals', { params })
  return response.data
}

/**
 * 根据类型获取外设列表（用于下拉框）
 */
export const getPeripheralsByType = async (
  peripheralType: string,
  enabledOnly: boolean = true
): Promise<ApiResponse<PeripheralSimpleResponse[]>> => {
  const response = await http.get<ApiResponse<PeripheralSimpleResponse[]>>(
    `/peripherals/by-type/${peripheralType}`,
    { params: { enabled_only: enabledOnly } }
  )
  return response.data
}

/**
 * 获取外设详情
 */
export const getPeripheral = async (id: number): Promise<ApiResponse<Peripheral>> => {
  const response = await http.get<ApiResponse<Peripheral>>(`/peripherals/${id}`)
  return response.data
}

/**
 * 创建外设
 */
export const createPeripheral = async (
  data: CreatePeripheralRequest
): Promise<ApiResponse<Peripheral>> => {
  const response = await http.post<ApiResponse<Peripheral>>('/peripherals', data)
  return response.data
}

/**
 * 更新外设
 */
export const updatePeripheral = async (
  id: number,
  data: UpdatePeripheralRequest
): Promise<ApiResponse<Peripheral>> => {
  const response = await http.patch<ApiResponse<Peripheral>>(`/peripherals/${id}`, data)
  return response.data
}

/**
 * 删除外设
 */
export const deletePeripheral = async (id: number): Promise<ApiResponse<null>> => {
  const response = await http.delete<ApiResponse<null>>(`/peripherals/${id}`)
  return response.data
}

