/**
 * SOE 事件相关类型定义
 */

/**
 * SOE 事件
 */
export interface SOEEvent {
  id: number
  asset_id: number
  asset_tag_name: string
  event_type: 'ALARM_ON' | 'ALARM_OFF' | 'STATE_CHANGE' | 'CMD_SENT' | 'CMD_FAIL' | 'PARAM_CHANGE' | 'SETPOINT_CHANGE'
  severity: number
  value_num?: number
  value_text: string
  source_instance_id?: number
  source_point_name?: string
  created_at: string
  inserted_at: string
  extra_json: Record<string, any>
  asset_name?: string
  asset_display_name?: string
  tag_display_name?: string
}

/**
 * SOE 事件查询参数
 */
export interface SOEEventQueryParams {
  from_time?: string
  to_time?: string
  asset_ids?: number[]
  severity?: number[]
  event_types?: string[]
  search?: string
  skip?: number
  limit?: number
}

