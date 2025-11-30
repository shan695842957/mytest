/**
 * 协议类型相关类型定义
 */

/**
 * 协议类型参数
 */
export interface ProtocolTypeParam {
  id: number
  protocol_type_id: number
  param_name: string
  display_name: string
  data_type: 'string' | 'integer' | 'float' | 'boolean' | 'enum'
  required: boolean
  default_value?: string | null
  description: string
  constraints_json: Record<string, any>
  order_index: number
  placeholder?: string | null
  input_type?: 'text' | 'number' | 'select' | 'peripheral'
  peripheral_type?: string | null
  created_at: string
  updated_at: string
}

/**
 * 协议类型
 */
export interface ProtocolType {
  id: number
  name: string
  display_name: string
  enabled: boolean
  description: string
  created_at: string
  updated_at: string
  params?: ProtocolTypeParam[]
}

/**
 * 创建协议类型请求
 */
export interface CreateProtocolTypeRequest {
  name: string
  display_name: string
  enabled?: boolean
  description?: string
  params?: CreateProtocolTypeParamRequest[]
}

/**
 * 创建协议类型参数请求
 */
export interface CreateProtocolTypeParamRequest {
  param_name: string
  display_name: string
  data_type: 'string' | 'integer' | 'float' | 'boolean' | 'enum'
  required?: boolean
  default_value?: string | null
  description?: string
  constraints_json?: Record<string, any>
  order_index?: number
  placeholder?: string | null
  input_type?: 'text' | 'number' | 'select' | 'peripheral'
  peripheral_type?: string | null
}

/**
 * 更新协议类型请求
 */
export interface UpdateProtocolTypeRequest {
  display_name?: string
  enabled?: boolean
  description?: string
}

/**
 * 更新协议类型参数请求
 */
export interface UpdateProtocolTypeParamRequest {
  display_name?: string
  data_type?: 'string' | 'integer' | 'float' | 'boolean' | 'enum'
  required?: boolean
  default_value?: string | null
  description?: string
  constraints_json?: Record<string, any>
  order_index?: number
  placeholder?: string | null
  input_type?: 'text' | 'number' | 'select' | 'peripheral'
  peripheral_type?: string | null
}

/**
 * 协议类型列表查询参数
 */
export interface ProtocolTypeListParams {
  skip?: number
  limit?: number
  search?: string
  enabled_only?: boolean
  include_params?: boolean
}

/**
 * 协议类型参数定义（用于前端表单生成）
 */
export interface ProtocolTypeParamDefinition {
  param_name: string
  display_name: string
  data_type: 'string' | 'integer' | 'float' | 'boolean' | 'enum'
  required: boolean
  default_value?: string | null
  placeholder?: string
  description?: string
  input_type?: 'text' | 'number' | 'select' | 'peripheral'
  peripheral_type?: string | null
  constraints: {
    enum?: any[]
    min?: number
    max?: number
    pattern?: string
    [key: string]: any
  }
}

