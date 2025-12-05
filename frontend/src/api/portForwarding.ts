/**
 * 端口转发 API
 */

import { http } from '@/utils/request'
import type {
  PortForwardingRule,
  PortForwardingRuleCreate,
  PortForwardingRuleUpdate,
  PortForwardingQuery,
  BatchOperationRequest,
  BatchOperationResult,
} from '@/types'

/**
 * 获取端口转发规则列表
 */
export const getPortForwardingRules = async (params?: PortForwardingQuery) => {
  const response = await http.get<PortForwardingRule[]>('/tools/port-forwarding', { params })
  return response.data
}

/**
 * 获取端口转发规则详情
 */
export const getPortForwardingRule = async (id: number) => {
  const response = await http.get<PortForwardingRule>(`/tools/port-forwarding/${id}`)
  return response.data
}

/**
 * 创建端口转发规则
 */
export const createPortForwardingRule = async (data: PortForwardingRuleCreate) => {
  const response = await http.post<PortForwardingRule>('/tools/port-forwarding', data)
  return response.data
}

/**
 * 更新端口转发规则
 */
export const updatePortForwardingRule = async (id: number, data: PortForwardingRuleUpdate) => {
  const response = await http.patch<PortForwardingRule>(`/tools/port-forwarding/${id}`, data)
  return response.data
}

/**
 * 删除端口转发规则
 */
export const deletePortForwardingRule = async (id: number) => {
  const response = await http.delete<null>(`/tools/port-forwarding/${id}`)
  return response.data
}

/**
 * 启动端口转发
 */
export const startPortForwarding = async (id: number) => {
  const response = await http.post<PortForwardingRule>(`/tools/port-forwarding/${id}/start`)
  return response.data
}

/**
 * 停止端口转发
 */
export const stopPortForwarding = async (id: number) => {
  const response = await http.post<PortForwardingRule>(`/tools/port-forwarding/${id}/stop`)
  return response.data
}

/**
 * 重启端口转发
 */
export const restartPortForwarding = async (id: number) => {
  const response = await http.post<PortForwardingRule>(`/tools/port-forwarding/${id}/restart`)
  return response.data
}

/**
 * 检查端口转发状态
 */
export const checkPortForwardingStatus = async (id: number) => {
  const response = await http.post<PortForwardingRule>(`/tools/port-forwarding/${id}/check`)
  return response.data
}

/**
 * 批量启动端口转发
 */
export const batchStartPortForwarding = async (ids: number[]) => {
  const response = await http.post<BatchOperationResult>('/tools/port-forwarding/batch-start', { ids })
  return response.data
}

/**
 * 批量停止端口转发
 */
export const batchStopPortForwarding = async (ids: number[]) => {
  const response = await http.post<BatchOperationResult>('/tools/port-forwarding/batch-stop', { ids })
  return response.data
}

/**
 * 批量删除端口转发规则
 */
export const batchDeletePortForwardingRules = async (ids: number[]) => {
  const response = await http.post<BatchOperationResult>('/tools/port-forwarding/batch-delete', { ids })
  return response.data
}

