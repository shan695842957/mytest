/**
 * 协议类型相关 API
 */

import { http } from '@/utils/request'
import type {
  ProtocolType,
  ProtocolTypeParam,
  CreateProtocolTypeRequest,
  UpdateProtocolTypeRequest,
  CreateProtocolTypeParamRequest,
  UpdateProtocolTypeParamRequest,
  ProtocolTypeListParams,
  ProtocolTypeParamDefinition,
  ApiResponse,
} from '@/types'

/**
 * 获取协议类型列表
 */
export const getProtocolTypeList = async (params?: ProtocolTypeListParams) => {
  const response = await http.get<ApiResponse<ProtocolType[]>>('/protocol-types', { params })
  return response.data
}

/**
 * 获取协议类型详情
 */
export const getProtocolTypeDetail = async (id: number) => {
  const response = await http.get<ApiResponse<ProtocolType>>(`/protocol-types/${id}`)
  return response.data
}

/**
 * 创建协议类型
 */
export const createProtocolType = async (data: CreateProtocolTypeRequest) => {
  const response = await http.post<ProtocolType>('/protocol-types', data)
  return response.data
}

/**
 * 更新协议类型
 */
export const updateProtocolType = async (id: number, data: UpdateProtocolTypeRequest) => {
  const response = await http.patch<ProtocolType>(`/protocol-types/${id}`, data)
  return response.data
}

/**
 * 删除协议类型
 */
export const deleteProtocolType = async (id: number) => {
  const response = await http.delete(`/protocol-types/${id}`)
  return response.data
}

/**
 * 获取协议类型参数列表
 */
export const getProtocolTypeParams = async (protocolTypeId: number) => {
  const response = await http.get<ApiResponse<ProtocolTypeParam[]>>(
    `/protocol-types/${protocolTypeId}/params`
  )
  return response.data
}

/**
 * 创建协议类型参数
 */
export const createProtocolTypeParam = async (
  protocolTypeId: number,
  data: CreateProtocolTypeParamRequest
) => {
  const response = await http.post<ProtocolTypeParam>(
    `/protocol-types/${protocolTypeId}/params`,
    data
  )
  return response.data
}

/**
 * 更新协议类型参数
 */
export const updateProtocolTypeParam = async (
  paramId: number,
  data: UpdateProtocolTypeParamRequest
) => {
  const response = await http.patch<ProtocolTypeParam>(`/protocol-types/params/${paramId}`, data)
  return response.data
}

/**
 * 删除协议类型参数
 */
export const deleteProtocolTypeParam = async (paramId: number) => {
  const response = await http.delete(`/protocol-types/params/${paramId}`)
  return response.data
}

/**
 * 获取协议类型参数定义（用于前端表单生成）
 */
export const getProtocolTypeParamsDefinition = async (protocolTypeName: string) => {
  const response = await http.get<ApiResponse<{ params: ProtocolTypeParamDefinition[] }>>(
    `/protocol-types/${protocolTypeName}/params-definition`
  )
  return response.data
}

