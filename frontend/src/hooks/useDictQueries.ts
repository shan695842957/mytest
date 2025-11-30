/**
 * 字典数据相关的 React Query Hooks
 */

import { useQuery } from '@tanstack/react-query'
import {
  getProtocolTypes,
  getDataTypes,
  getSemanticTypes,
  getIOTypes,
  getRawTypes,
  getByteOrders,
  getEventTypes,
  getSeverityLevels,
} from '@/api/dicts'
import { queryKeys } from '@/config/query'

/**
 * 获取协议类型列表
 */
export function useProtocolTypes() {
  return useQuery({
    queryKey: queryKeys.dicts.protocolTypes(),
    queryFn: getProtocolTypes,
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  })
}

/**
 * 获取数据类型列表
 */
export function useDataTypes() {
  return useQuery({
    queryKey: queryKeys.dicts.dataTypes(),
    queryFn: getDataTypes,
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * 获取语义类型列表
 */
export function useSemanticTypes() {
  return useQuery({
    queryKey: queryKeys.dicts.semanticTypes(),
    queryFn: getSemanticTypes,
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * 获取 IO 类型列表
 */
export function useIOTypes() {
  return useQuery({
    queryKey: queryKeys.dicts.ioTypes(),
    queryFn: getIOTypes,
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * 获取原始数据类型列表
 */
export function useRawTypes() {
  return useQuery({
    queryKey: queryKeys.dicts.rawTypes(),
    queryFn: getRawTypes,
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * 获取字节序列表
 */
export function useByteOrders() {
  return useQuery({
    queryKey: queryKeys.dicts.byteOrders(),
    queryFn: getByteOrders,
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * 获取事件类型列表
 */
export function useEventTypes() {
  return useQuery({
    queryKey: queryKeys.dicts.eventTypes(),
    queryFn: getEventTypes,
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * 获取严重性级别列表
 */
export function useSeverityLevels() {
  return useQuery({
    queryKey: queryKeys.dicts.severityLevels(),
    queryFn: getSeverityLevels,
    staleTime: 10 * 60 * 1000,
  })
}

