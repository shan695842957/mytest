/**
 * 通信实例相关类型定义
 */

/**
 * 通信实例
 */
export interface CommInstance {
  id: number
  name: string
  display_name: string
  enabled: boolean
  point_table_id: number
  protocol_type: string
  protocol_config: Record<string, any>
  polling_interval_ms: number
  timeout_ms: number
  retries: number
  created_at: string
  updated_at: string
}

/**
 * 创建通信实例请求
 */
export interface CreateCommInstanceRequest {
  name: string
  display_name: string
  enabled?: boolean
  point_table_id: number
  protocol_type: string
  protocol_config: Record<string, any>
  polling_interval_ms: number
  timeout_ms: number
  retries: number
}

/**
 * 更新通信实例请求
 */
export interface UpdateCommInstanceRequest {
  display_name?: string
  enabled?: boolean
  point_table_id?: number
  protocol_type?: string
  protocol_config?: Record<string, any>
  polling_interval_ms?: number
  timeout_ms?: number
  retries?: number
}

/**
 * 通信实例列表查询参数
 */
export interface CommInstanceListParams {
  skip?: number
  limit?: number
  search?: string
  protocol_type?: string
  point_table_id?: number
  enabled?: boolean
}

