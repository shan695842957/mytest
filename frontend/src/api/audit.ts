/**
 * 审计日志相关 API
 */

import { http } from '@/utils/request'
import type { AuditLog, AuditLogQueryParams } from '@/types'

/**
 * 获取审计日志列表
 */
export const getAuditLogs = async (params?: AuditLogQueryParams) => {
  const response = await http.get<AuditLog[]>('/audit-logs', { params })
  return response.data
}

/**
 * 获取审计日志详情
 */
export const getAuditLogDetail = async (id: number) => {
  const response = await http.get<AuditLog>(`/audit-logs/${id}`)
  return response.data
}

/**
 * 获取目标操作历史
 */
export const getTargetAuditHistory = async (
  targetType: string,
  targetId: string,
  params?: { skip?: number; limit?: number }
) => {
  const response = await http.get<AuditLog[]>(
    `/audit-logs/target/${targetType}/${targetId}`,
    { params }
  )
  return response.data
}

