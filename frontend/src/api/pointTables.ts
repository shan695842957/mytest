/**
 * 点表相关 API
 */

import { http } from '@/utils/request'
import type {
  PointTableTemplate,
  PointTableTemplateDetail,
  PointTablePoint,
  CreatePointTableTemplateRequest,
  UpdatePointTableTemplateRequest,
  ClonePointTableTemplateRequest,
  CreatePointTablePointRequest,
  UpdatePointTablePointRequest,
  ClonePointTablePointRequest,
  PointTableTemplateListParams,
  ApiResponse,
} from '@/types'

/**
 * 获取点表模板列表
 */
export const getPointTableTemplateList = async (params?: PointTableTemplateListParams) => {
  const response = await http.get<ApiResponse<PointTableTemplate[]>>('/point-tables', { params })
  return response.data
}

/**
 * 获取点表模板详情
 */
export const getPointTableTemplateDetail = async (id: number) => {
  const response = await http.get<ApiResponse<PointTableTemplateDetail>>(`/point-tables/${id}`)
  return response.data
}

/**
 * 创建点表模板
 */
export const createPointTableTemplate = async (data: CreatePointTableTemplateRequest) => {
  const response = await http.post<PointTableTemplate>('/point-tables', data)
  return response.data
}

/**
 * 更新点表模板
 */
export const updatePointTableTemplate = async (id: number, data: UpdatePointTableTemplateRequest) => {
  const response = await http.put<PointTableTemplate>(`/point-tables/${id}`, data)
  return response.data
}

/**
 * 复制点表模板
 */
export const clonePointTableTemplate = async (id: number, data: ClonePointTableTemplateRequest) => {
  const response = await http.post<ApiResponse<PointTableTemplateDetail>>(`/point-tables/${id}/clone`, data)
  return response.data
}

/**
 * 删除点表模板
 */
export const deletePointTableTemplate = async (id: number) => {
  const response = await http.delete(`/point-tables/${id}`)
  return response.data
}

/**
 * 获取点表点列表
 */
export const getPointTablePointList = async (
  templateId: number,
  pointName?: string,
  address?: string
) => {
  const response = await http.get<ApiResponse<PointTablePoint[]>>(`/point-tables/${templateId}/points`, {
    params: {
      ...(pointName && { point_name: pointName }),
      ...(address && { address }),
    },
  })
  return response.data
}

/**
 * 创建点表点
 */
export const createPointTablePoint = async (templateId: number, data: CreatePointTablePointRequest) => {
  const response = await http.post<PointTablePoint>(`/point-tables/${templateId}/points`, data)
  return response.data
}

/**
 * 更新点表点
 */
export const updatePointTablePoint = async (pointId: number, data: UpdatePointTablePointRequest) => {
  const response = await http.put<PointTablePoint>(`/point-tables/points/${pointId}`, data)
  return response.data
}

/**
 * 删除点表点
 */
export const deletePointTablePoint = async (pointId: number) => {
  const response = await http.delete(`/point-tables/points/${pointId}`)
  return response.data
}

/**
 * 复制点表点
 */
export const clonePointTablePoint = async (pointId: number, data: ClonePointTablePointRequest) => {
  const response = await http.post<ApiResponse<PointTablePoint>>(`/point-tables/points/${pointId}/clone`, data)
  return response.data
}

