/**
 * TanStack Query 配置
 */

import { QueryClient } from '@tanstack/react-query'
import type { QueryClientConfig } from '@tanstack/react-query'
import { ApiError } from '@/types'

/**
 * Query Client 配置
 */
const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // 数据过期时间（5分钟）
      staleTime: 5 * 60 * 1000,
      
      // 缓存时间（10分钟）
      gcTime: 10 * 60 * 1000,
      
      // 错误重试
      retry: (failureCount, error) => {
        // ApiError 不重试
        if (error instanceof ApiError) {
          return false
        }
        // 网络错误最多重试 2 次
        return failureCount < 2
      },
      
      // 窗口获得焦点时重新获取
      refetchOnWindowFocus: false,
      
      // 网络重连时重新获取
      refetchOnReconnect: true,
    },
    mutations: {
      // 错误重试
      retry: false,
    },
  },
}

/**
 * 创建 Query Client 实例
 */
export const queryClient = new QueryClient(queryClientConfig)

/**
 * Query Keys 工厂函数
 */
export const queryKeys = {
  // 认证相关
  auth: {
    currentUser: () => ['auth', 'currentUser'] as const,
  },
  
  // 用户相关
  users: {
    all: () => ['users'] as const,
    lists: () => ['users', 'list'] as const,
    list: (params?: any) => ['users', 'list', params] as const,
    detail: (id: number) => ['users', 'detail', id] as const,
  },
  
  // 审计日志
  audit: {
    all: () => ['audit'] as const,
    lists: () => ['audit', 'list'] as const,
    list: (params?: any) => ['audit', 'list', params] as const,
  },
  
  // 端口转发
  portForwarding: {
    all: () => ['portForwarding'] as const,
    lists: () => ['portForwarding', 'list'] as const,
    list: (keyword?: string, protocol?: string, status?: string) => 
      ['portForwarding', 'list', { keyword, protocol, status }] as const,
    detail: (id: number) => ['portForwarding', 'detail', id] as const,
  },
  
  // Rathole 内网穿透
  rathole: {
    all: () => ['rathole'] as const,
    config: () => ['rathole', 'config'] as const,
    services: () => ['rathole', 'services'] as const,
    service: (name: string) => ['rathole', 'service', name] as const,
    toml: () => ['rathole', 'toml'] as const,
    status: () => ['rathole', 'status'] as const,
    backups: () => ['rathole', 'backups'] as const,
    backupContent: (filename: string) => ['rathole', 'backup', filename] as const,
  },
  
  // 设备类型
  deviceTypes: {
    all: () => ['deviceTypes'] as const,
    lists: () => ['deviceTypes', 'list'] as const,
    list: (params?: any) => ['deviceTypes', 'list', params] as const,
    detail: (id: number) => ['deviceTypes', 'detail', id] as const,
    tags: (deviceTypeId: number, semanticType?: string) => 
      ['deviceTypes', 'tags', deviceTypeId, semanticType] as const,
  },
  
  // 点表模板
  pointTables: {
    all: () => ['pointTables'] as const,
    lists: () => ['pointTables', 'list'] as const,
    list: (params?: any) => ['pointTables', 'list', params] as const,
    detail: (id: number) => ['pointTables', 'detail', id] as const,
    points: (templateId: number, filters?: any) => 
      ['pointTables', 'points', templateId, filters] as const,
  },
  
  // 通信实例
  commInstances: {
    all: () => ['commInstances'] as const,
    lists: () => ['commInstances', 'list'] as const,
    list: (params?: any) => ['commInstances', 'list', params] as const,
    detail: (id: number) => ['commInstances', 'detail', id] as const,
  },
  
  // 协议类型
  protocolTypes: {
    all: () => ['protocolTypes'] as const,
    lists: () => ['protocolTypes', 'list'] as const,
    list: (params?: any) => ['protocolTypes', 'list', params] as const,
    detail: (id: number) => ['protocolTypes', 'detail', id] as const,
    params: (protocolTypeId: number) => ['protocolTypes', 'params', protocolTypeId] as const,
    paramsDefinition: (protocolTypeName: string) => 
      ['protocolTypes', 'paramsDefinition', protocolTypeName] as const,
  },
  
  // 外设设备
  peripherals: {
    all: () => ['peripherals'] as const,
    lists: () => ['peripherals', 'list'] as const,
    list: (params?: any) => ['peripherals', 'list', params] as const,
    detail: (id: number) => ['peripherals', 'detail', id] as const,
    byType: (peripheralType: string, enabledOnly?: boolean) => 
      ['peripherals', 'byType', peripheralType, enabledOnly] as const,
  },
  
  // 资产
  assets: {
    all: () => ['assets'] as const,
    lists: () => ['assets', 'list'] as const,
    list: (params?: any) => ['assets', 'list', params] as const,
    detail: (id: number) => ['assets', 'detail', id] as const,
    mappings: (assetId: number) => ['assets', 'mappings', assetId] as const,
    mappingDetail: (assetId: number, mappingId: number) => 
      ['assets', 'mappingDetail', assetId, mappingId] as const,
  },
  
  // SOE 事件
  soe: {
    all: () => ['soe'] as const,
    lists: () => ['soe', 'list'] as const,
    list: (params?: any) => ['soe', 'list', params] as const,
    detail: (id: number) => ['soe', 'detail', id] as const,
  },
  
  // 字典数据
  dicts: {
    protocolTypes: () => ['dicts', 'protocolTypes'] as const,
    dataTypes: () => ['dicts', 'dataTypes'] as const,
    semanticTypes: () => ['dicts', 'semanticTypes'] as const,
    ioTypes: () => ['dicts', 'ioTypes'] as const,
    rawTypes: () => ['dicts', 'rawTypes'] as const,
    byteOrders: () => ['dicts', 'byteOrders'] as const,
    eventTypes: () => ['dicts', 'eventTypes'] as const,
    severityLevels: () => ['dicts', 'severityLevels'] as const,
  },

} as const

