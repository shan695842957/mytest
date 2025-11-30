/**
 * 设备类型相关类型定义
 */

/**
 * 设备类型
 */
export interface DeviceType {
  id: number
  name: string
  display_name: string
  model: string
  manufacturer: string
  description: string
  tags_count?: number | null
  created_at: string
  updated_at: string
}

/**
 * 业务字段（设备类型标签）
 */
export interface DeviceTypeTag {
  id: number
  device_type_id: number
  tag_name: string
  display_name: string
  data_type: 'BOOL' | 'INT' | 'FLOAT' | 'ENUM'
  semantic_type: 'MEASURE' | 'STATUS' | 'ACCUM' | 'PARAM' | 'SETPOINT' | 'COMMAND' | 'PARAM_SET'
  engineering_unit: string
  group_name: string
  severity: number
  description: string
  enum_json: Record<string, string>
  created_at: string
  updated_at: string
}

/**
 * 设备类型详情（包含业务字段列表）
 */
export interface DeviceTypeDetail extends DeviceType {
  tags: DeviceTypeTag[]
}

/**
 * 创建设备类型请求
 */
export interface CreateDeviceTypeRequest {
  name: string
  display_name: string
  model?: string
  manufacturer?: string
  description?: string
}

/**
 * 更新设备类型请求
 */
export interface UpdateDeviceTypeRequest {
  display_name?: string
  model?: string
  manufacturer?: string
  description?: string
}

/**
 * 复制设备类型请求
 */
export interface CloneDeviceTypeRequest {
  name: string
  display_name: string
  model?: string
  manufacturer?: string
  description?: string
}

/**
 * 创建业务字段请求
 */
export interface CreateDeviceTypeTagRequest {
  tag_name: string
  display_name: string
  data_type: 'BOOL' | 'INT' | 'FLOAT' | 'ENUM'
  semantic_type: 'MEASURE' | 'STATUS' | 'ACCUM' | 'PARAM' | 'SETPOINT' | 'COMMAND' | 'PARAM_SET'
  engineering_unit?: string
  group_name?: string
  severity?: number
  description?: string
  enum_json?: Record<string, string>
}

/**
 * 更新业务字段请求
 */
export interface UpdateDeviceTypeTagRequest {
  display_name?: string
  data_type?: 'BOOL' | 'INT' | 'FLOAT' | 'ENUM'
  semantic_type?: 'MEASURE' | 'STATUS' | 'ACCUM' | 'PARAM' | 'SETPOINT' | 'COMMAND' | 'PARAM_SET'
  engineering_unit?: string
  group_name?: string
  severity?: number
  description?: string
  enum_json?: Record<string, string>
}

/**
 * 复制业务字段请求
 */
export interface CloneDeviceTypeTagRequest {
  tag_name: string
  display_name?: string
  data_type?: 'BOOL' | 'INT' | 'FLOAT' | 'ENUM'
  semantic_type?: 'MEASURE' | 'STATUS' | 'ACCUM' | 'PARAM' | 'SETPOINT' | 'COMMAND' | 'PARAM_SET'
  engineering_unit?: string
  group_name?: string
  severity?: number
  description?: string
  enum_json?: Record<string, string>
}

/**
 * 设备类型列表查询参数
 */
export interface DeviceTypeListParams {
  skip?: number
  limit?: number
  search?: string
}

