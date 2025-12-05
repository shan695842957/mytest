/**
 * 面包屑导航
 */

import { Fragment, useMemo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { ChevronRight, Home } from 'lucide-react'
import {
  Breadcrumb as BreadcrumbUI,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { queryKeys } from '@/config/query'

// 路由名称映射（直接使用翻译键，不带 'menu.' 前缀）
const ROUTE_NAMES: Record<string, string> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/users': 'users',
  '/audit': 'audit',
  '/profile': 'profile',
  '/settings': 'settings',
  '/settings/gateway': 'gateway_settings',
  '/settings/gateway/monitor': 'gateway_monitor',
  '/settings/gateway/history': 'gateway_history',
  '/settings/gateway/monitor-config': 'gateway_monitor_config',
  '/settings/gateway/network': 'gateway_network',
  '/settings/gateway/time': 'gateway_time',
  '/settings/gateway/info': 'gateway_info',
  '/settings/gateway/ssh': 'gateway_ssh',
  '/settings/software': 'software_settings',
  '/settings/software/service': 'software_service',
  '/settings/software/api': 'software_api',
  '/settings/software/database': 'software_database',
  '/settings/software/config-center': 'software_config_center',
  '/settings/software/system': 'software_system_config',
  '/settings/frontend': 'frontend_settings',
  '/config': 'config',
  '/config/device-templates': 'device_templates',
  '/config/comm-templates': 'comm_templates',
  '/config/comm-instances': 'comm_instances',
  '/config/protocol-types': 'protocol_types',
  '/config/peripherals': 'peripherals',
  '/config/assets': 'assets',
  '/config/assets/mappings': 'asset_mappings',
  '/theme-test': 'Theme Test',
  '/tools': 'tools',
  '/tools/ping': 'ping',
  '/tools/port-scan': 'port_scan',
  '/tools/arp': 'arp_table',
  '/tools/traceroute': 'traceroute',
  '/tools/network-capture': 'network_capture',
  '/tools/serial': 'serial_port',
  '/tools/port-forwarding': 'port_forwarding',
  '/history': 'history_data',
}

// 路径到 query key 的映射
const PATH_TO_QUERY_KEY: Record<string, (id: number) => readonly unknown[]> = {
  '/config/device-templates': (id) => queryKeys.deviceTypes.detail(id),
  '/config/comm-templates': (id) => queryKeys.pointTables.detail(id),
  '/config/comm-instances': (id) => queryKeys.commInstances.detail(id),
  '/config/protocol-types': (id) => queryKeys.protocolTypes.detail(id),
  '/config/peripherals': (id) => queryKeys.peripherals.detail(id),
  '/config/assets': (id) => queryKeys.assets.detail(id),
  '/users': (id) => queryKeys.users.detail(id),
}

/**
 * 具有名称字段的数据类型
 */
interface NameableData {
  name?: string
  title?: string
  label?: string
  code?: string
}

/**
 * 从 React Query 缓存中获取名称
 */
function getNameFromCache(
  queryClient: QueryClient,
  path: string,
  id: number
): string | null {
  const getQueryKey = PATH_TO_QUERY_KEY[path]
  if (!getQueryKey) {
    return null
  }
  
  try {
    const queryKey = getQueryKey(id)
    const data = queryClient.getQueryData<NameableData>(queryKey)
    
    if (!data) {
      return null
    }
    
    // 尝试多种可能的名称字段
    return data.name || data.title || data.label || data.code || null
  } catch {
    // 缓存获取失败时返回 null
    return null
  }
}

export function Breadcrumb() {
  const location = useLocation()
  const { t } = useTranslation('menu')
  const { t: tCommon } = useTranslation('common')
  const queryClient = useQueryClient()
  
  // 生成面包屑路径
  const pathSegments = location.pathname.split('/').filter(Boolean)
  
  // 如果是首页，只显示首页
  if (pathSegments.length === 0 || location.pathname === '/') {
    return (
      <BreadcrumbUI>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-2">
              <Home className="size-4" />
              {t('dashboard')}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </BreadcrumbUI>
    )
  }
  
  // 构建面包屑路径
  const breadcrumbs = useMemo(() => {
    return pathSegments.map((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/')
      const isLast = index === pathSegments.length - 1
      
      // 检查是否是数字 ID
      const isNumericId = /^\d+$/.test(segment)
      
      let displayText: string
      
      if (isNumericId && isLast) {
        // 最后一段是数字 ID，尝试从缓存获取名称
        const id = parseInt(segment, 10)
        const parentPath = '/' + pathSegments.slice(0, index).join('/')
        const cachedName = getNameFromCache(queryClient, parentPath, id)
        
        if (cachedName) {
          displayText = cachedName
        } else {
          // 如果缓存中没有，显示"详情"
          displayText = tCommon('detail')
        }
      } else {
        // 普通路径段，使用翻译
        let translationKey = ROUTE_NAMES[path] || segment
        if (translationKey === 'mappings') {
          translationKey = 'asset_mappings'
        }
        displayText = t(translationKey)
      }
      
      return {
        path,
        displayText,
        isLast,
      }
    })
  }, [pathSegments, queryClient, t, tCommon])
  
  return (
    <BreadcrumbUI>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="flex items-center gap-2">
              <Home className="size-4" />
              {t('dashboard')}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {breadcrumbs.map((crumb, index) => (
          <Fragment key={index}>
            <BreadcrumbSeparator>
              <ChevronRight className="size-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>
                  {crumb.displayText}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.path}>
                    {crumb.displayText}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </BreadcrumbUI>
  )
}
