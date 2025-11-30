/**
 * 字典数据相关 API
 */

import { http } from '@/utils/request'
import type { DictItem, ApiResponse } from '@/types'

/**
 * 获取协议类型列表
 */
export const getProtocolTypes = async () => {
  const response = await http.get<ApiResponse<DictItem[]>>('/dicts/protocol-types')
  return response.data
}

/**
 * 获取数据类型列表
 */
export const getDataTypes = async () => {
  const response = await http.get<ApiResponse<DictItem[]>>('/dicts/data-types')
  return response.data
}

/**
 * 获取语义类型列表
 */
export const getSemanticTypes = async () => {
  const response = await http.get<ApiResponse<DictItem[]>>('/dicts/semantic-types')
  return response.data
}

/**
 * 获取 IO 类型列表
 */
export const getIOTypes = async () => {
  const response = await http.get<ApiResponse<DictItem[]>>('/dicts/io-types')
  return response.data
}

/**
 * 获取原始数据类型列表
 */
export const getRawTypes = async () => {
  const response = await http.get<ApiResponse<DictItem[]>>('/dicts/raw-types')
  return response.data
}

/**
 * 获取字节序列表
 */
export const getByteOrders = async () => {
  const response = await http.get<ApiResponse<DictItem[]>>('/dicts/byte-orders')
  return response.data
}

/**
 * 获取事件类型列表
 */
export const getEventTypes = async () => {
  const response = await http.get<ApiResponse<DictItem[]>>('/dicts/event-types')
  return response.data
}

/**
 * 获取严重性级别列表
 */
export const getSeverityLevels = async () => {
  const response = await http.get<ApiResponse<DictItem[]>>('/dicts/severity-levels')
  return response.data
}

