/**
 * 点表相关类型定义
 */

/**
 * 点表模板
 */
export interface PointTableTemplate {
  id: number
  name: string
  display_name: string
  protocol_type: string
  description: string
  created_at: string
  updated_at: string
}

/**
 * 点表点
 */
export interface PointTablePoint {
  id: number
  point_table_id: number
  point_name: string
  display_name: string
  address: string
  io_type: 'AI' | 'AO' | 'DI' | 'DO' | 'STRING'
  raw_type: string
  byte_order: 'BE' | 'LE' | 'BE_SWAP' | 'LE_SWAP'
  scale_k: number
  scale_b: number
  parse_rules_json: Record<string, any>
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * 点表模板详情（包含点列表）
 */
export interface PointTableTemplateDetail extends PointTableTemplate {
  points: PointTablePoint[]
}

/**
 * 创建点表模板请求
 */
export interface CreatePointTableTemplateRequest {
  name: string
  display_name: string
  protocol_type: string
  description?: string
}

/**
 * 更新点表模板请求
 */
export interface UpdatePointTableTemplateRequest {
  display_name?: string
  protocol_type?: string
  description?: string
}

/**
 * 复制点表模板请求
 */
export interface ClonePointTableTemplateRequest {
  name: string
  display_name: string
  protocol_type?: string
  description?: string
}

/**
 * 创建点表点请求
 */
export interface CreatePointTablePointRequest {
  point_name: string
  display_name: string
  address: string
  io_type: 'AI' | 'AO' | 'DI' | 'DO' | 'STRING'
  raw_type: string
  byte_order: 'BE' | 'LE' | 'BE_SWAP' | 'LE_SWAP'
  scale_k?: number
  scale_b?: number
  parse_rules_json?: Record<string, any>
  description?: string
  is_active?: boolean
}

/**
 * 更新点表点请求
 */
export interface UpdatePointTablePointRequest {
  display_name?: string
  address?: string
  io_type?: 'AI' | 'AO' | 'DI' | 'DO' | 'STRING'
  raw_type?: string
  byte_order?: 'BE' | 'LE' | 'BE_SWAP' | 'LE_SWAP'
  scale_k?: number
  scale_b?: number
  parse_rules_json?: Record<string, any>
  description?: string
  is_active?: boolean
}

/**
 * 复制点表点请求
 */
export interface ClonePointTablePointRequest {
  point_name: string
  display_name?: string
  address?: string
  io_type?: 'AI' | 'AO' | 'DI' | 'DO' | 'STRING'
  raw_type?: string
  byte_order?: 'BE' | 'LE' | 'BE_SWAP' | 'LE_SWAP'
  scale_k?: number
  scale_b?: number
  parse_rules_json?: Record<string, any>
  description?: string
  is_active?: boolean
}

/**
 * 点表模板列表查询参数
 */
export interface PointTableTemplateListParams {
  skip?: number
  limit?: number
  search?: string
  protocol_type?: string
}

