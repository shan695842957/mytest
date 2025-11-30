/**
 * 抓包任务类型定义
 */

/**
 * 抓包任务状态
 */
export type CaptureTaskStatus = 'pending' | 'running' | 'completed' | 'stopped' | 'failed'

/**
 * 抓包任务
 */
export interface CaptureTask {
  id: number
  name: string
  interface: string
  filter_expression: string | null
  duration: number
  packet_count: number | null
  status: CaptureTaskStatus
  pid: number | null
  file_path: string | null
  file_size: number
  actual_duration: number
  error_message: string | null
  created_by: number
  created_at: string
  started_at: string | null
  completed_at: string | null
  expires_at: string
  updated_at: string
  
  // 计算字段
  progress: number | null
  can_download: boolean
  can_stop: boolean
  can_delete: boolean
}

/**
 * 创建抓包任务请求
 */
export interface CreateCaptureRequest {
  name: string
  interface: string
  filter_expression?: string
  duration: number
  packet_count?: number
}

/**
 * 抓包任务列表响应
 */
export interface CaptureTaskListResponse {
  items: CaptureTask[]
  total: number
  running_count: number
}

/**
 * 网络接口
 */
export interface NetworkInterface {
  name: string
  display_name: string
}

