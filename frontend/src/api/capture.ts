/**
 * 抓包任务 API
 */

import { http } from '@/utils/request'
import type { ApiResponse } from '@/types/api'
import type {
  CreateCaptureRequest,
  CaptureTaskListResponse,
  NetworkInterface
} from '@/types/capture'

/**
 * 创建抓包任务
 */
export const createCapture = async (data: CreateCaptureRequest) => {
  const response = await http.post<ApiResponse<{ id: number; status: string }>>(
    '/tools/capture',
    data
  )
  return response.data
}

/**
 * 获取抓包任务列表
 */
export const getCaptureList = async (params?: {
  status?: string
  skip?: number
  limit?: number
}) => {
  const response = await http.get<ApiResponse<CaptureTaskListResponse>>(
    '/tools/capture',
    { params }
  )
  return response.data
}

/**
 * 停止抓包任务
 */
export const stopCapture = async (taskId: number) => {
  const response = await http.post<ApiResponse<null>>(
    `/tools/capture/${taskId}/stop`
  )
  return response.data
}

/**
 * 删除抓包任务
 */
export const deleteCapture = async (taskId: number) => {
  const response = await http.delete<ApiResponse<null>>(
    `/tools/capture/${taskId}`
  )
  return response.data
}

/**
 * 下载抓包文件
 */
export const downloadCapture = async (taskId: number, filename: string) => {
  try {
    // 使用 axios 获取二进制文件，确保携带认证 token
    const response = await http.get(
      `/tools/capture/${taskId}/download`,
      {
        responseType: 'blob', // 关键：指定响应类型为 blob
      }
    )
    
    // 当 responseType 是 blob 时，response.data 就是 Blob 对象
    const blob = response.data as unknown as Blob
    const url = window.URL.createObjectURL(blob)
  
    // 创建隐藏的 a 标签触发下载
  const link = document.createElement('a')
    link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
    
    // 清理
  document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('下载文件失败:', error)
    throw error
  }
}

/**
 * 获取网络接口列表（复用现有API）
 */
export const getNetworkInterfaces = async () => {
  const response = await http.get<ApiResponse<NetworkInterface[]>>(
    '/tools/network/interfaces'
  )
  return response.data
}

