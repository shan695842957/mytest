/**
 * 审计日志相关的 React Query Hooks
 */

import { useQuery } from '@tanstack/react-query'
import { getAuditLogs, getAuditLogDetail } from '@/api/audit'
import { queryKeys } from '@/config/query'
import type { AuditLogQueryParams } from '@/types'

/**
 * 获取审计日志列表
 */
export function useAuditLogs(params?: AuditLogQueryParams) {
  return useQuery({
    queryKey: queryKeys.audit.list(params),
    queryFn: () => getAuditLogs(params),
  })
}

/**
 * 获取审计日志详情
 */
export function useAuditLogDetail(id: number) {
  return useQuery({
    queryKey: ['audit', 'detail', id],
    queryFn: () => getAuditLogDetail(id),
    enabled: !!id,
  })
}

