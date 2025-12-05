/**
 * 端口转发类型定义
 */

/**
 * 协议类型
 */
export type Protocol = 'tcp' | 'udp'

/**
 * 转发状态
 */
export type ForwardingStatus = 'stopped' | 'running' | 'error'

/**
 * 端口转发规则（基础）
 */
export interface PortForwardingRuleBase {
  name: string
  source_host: string
  source_port: number
  target_host: string
  target_port: number
  protocol: Protocol
  is_enabled: boolean
}

/**
 * 创建端口转发规则
 */
export interface PortForwardingRuleCreate extends PortForwardingRuleBase {}

/**
 * 更新端口转发规则
 */
export interface PortForwardingRuleUpdate {
  name?: string
  source_host?: string
  source_port?: number
  target_host?: string
  target_port?: number
  protocol?: Protocol
  is_enabled?: boolean
}

/**
 * 端口转发规则（完整）
 */
export interface PortForwardingRule extends PortForwardingRuleBase {
  id: number
  status: ForwardingStatus
  process_id: number | null
  error_message: string | null
  created_by: number | null
  created_at: string
  updated_at: string
}

/**
 * 批量操作请求
 */
export interface BatchOperationRequest {
  ids: number[]
}

/**
 * 批量操作结果
 */
export interface BatchOperationResult {
  success_count: number
  failed_count: number
  success_ids: number[]
  failed_ids: number[]
  errors: Record<number, string>
}

/**
 * 查询参数
 */
export interface PortForwardingQuery {
  skip?: number
  limit?: number
  keyword?: string
  protocol?: Protocol
  status?: ForwardingStatus
  is_enabled?: boolean
}

