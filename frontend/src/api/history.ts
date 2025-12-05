/**
 * 历史数据查询 API
 */

import { http } from '@/utils/request'
import type {
  DeviceTreeResponse,
  HistoryDataQueryRequest,
  HistoryDataQueryResponse,
  ExportDataRequest,
  ApiResponse,
} from '@/types'

/**
 * 获取设备树
 */
export const getDeviceTree = async (semanticTypes?: string) => {
  const response = await http.get<DeviceTreeResponse>('/history/device-tree', {
    params: semanticTypes ? { semantic_types: semanticTypes } : undefined,
  })
  // response.data 是 ApiResponse<DeviceTreeResponse> 格式
  // 返回实际的 data 字段
  return (response.data as ApiResponse<DeviceTreeResponse>).data as DeviceTreeResponse
}

/**
 * 查询历史数据
 */
export const queryHistoryData = async (query: HistoryDataQueryRequest) => {
  const response = await http.post<HistoryDataQueryResponse>('/history/query', query)
  // response.data 是 ApiResponse<HistoryDataQueryResponse> 格式
  // 返回实际的 data 字段
  return (response.data as ApiResponse<HistoryDataQueryResponse>).data as HistoryDataQueryResponse
}

/**
 * 导出历史数据
 */
export const exportHistoryData = async (
  query: ExportDataRequest,
  onDownloadProgress?: (progressEvent: any) => void
) => {
  const response = await http.post('/history/export', query, {
    responseType: 'blob',
    onDownloadProgress,
  } as any)
  
  // 创建下载链接
  const blob = (response.data as unknown) as Blob
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  
  // 从响应头获取文件名
  const contentDisposition = response.headers['content-disposition']
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/)
    if (filenameMatch) {
      link.download = filenameMatch[1]
    } else {
      link.download = `history_data_${Date.now()}.csv`
    }
  } else {
    link.download = `history_data_${Date.now()}.csv`
  }
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

