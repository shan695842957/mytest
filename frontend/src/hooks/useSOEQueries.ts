/**
 * SOE 事件相关的 React Query Hooks
 */

import { useQuery } from '@tanstack/react-query'
import { querySOEEvents, getSOEEventDetail } from '@/api/soe'
import { queryKeys } from '@/config/query'
import type { SOEEventQueryParams } from '@/types'

/**
 * 查询 SOE 事件
 */
export function useSOEEventList(params: SOEEventQueryParams) {
  return useQuery({
    queryKey: queryKeys.soe.list(params),
    queryFn: () => querySOEEvents(params),
  })
}

/**
 * 获取 SOE 事件详情
 */
export function useSOEEventDetail(eventId: number) {
  return useQuery({
    queryKey: queryKeys.soe.detail(eventId),
    queryFn: () => getSOEEventDetail(eventId),
    enabled: !!eventId,
  })
}

