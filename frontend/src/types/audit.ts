/**
 * 审计日志类型定义
 */

/**
 * 审计日志
 */
export interface AuditLog {
  id: number
  request_id: string
  method: string
  path: string
  module: string
  action: string
  action_key: string | null
  user_id: number | null
  username: string | null
  user_role: string | null
  target_type: string | null
  target_id: string | null
  target_name: string | null
  request_body: any
  changes: {
    before?: any
    after?: any
  } | null
  status_code: number
  success: 'success' | 'failed'
  error_message: string | null
  ip_address: string | null
  user_agent: string | null
  locale: string | null
  created_at: string
  duration_ms: number | null
  // 后端返回的已翻译字段
  action_display?: string
  module_display?: string
  target_type_display?: string
}

/**
 * 审计日志查询参数
 */
export interface AuditLogQueryParams {
  skip?: number
  limit?: number
  user_id?: number
  module?: string
  action?: string
  target_type?: string
  target_id?: string
  success?: 'success' | 'failed'
  start_time?: string
  end_time?: string
}

