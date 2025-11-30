/**
 * SOE 事件相关 API
 */

import { http } from '@/utils/request'
import type {
  SOEEvent,
  SOEEventQueryParams,
  ApiResponse,
} from '@/types'

/**
 * 查询 SOE 事件
 */
export const querySOEEvents = async (params: SOEEventQueryParams) => {
  const queryParams: Record<string, any> = {
    skip: params.skip ?? 0,
    limit: params.limit ?? 100,
  }
  
  if (params.from_time) {
    queryParams.from_time = params.from_time
  }
  if (params.to_time) {
    queryParams.to_time = params.to_time
  }
  if (params.asset_ids && params.asset_ids.length > 0) {
    queryParams.asset_ids = params.asset_ids.join(',')
  }
  if (params.severity && params.severity.length > 0) {
    queryParams.severity = params.severity.join(',')
  }
  if (params.event_types && params.event_types.length > 0) {
    queryParams.event_types = params.event_types.join(',')
  }
  if (params.search) {
    queryParams.search = params.search
  }
  
  const response = await http.get<ApiResponse<SOEEvent[]>>('/soe', { params: queryParams })
  return response.data
}

/**
 * 获取 SOE 事件详情
 */
export const getSOEEventDetail = async (eventId: number) => {
  const response = await http.get<ApiResponse<SOEEvent>>(`/soe/${eventId}`)
  return response.data
}

