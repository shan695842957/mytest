/**
 * 面包屑导航
 */

import { Fragment } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Home } from 'lucide-react'
import {
  Breadcrumb as BreadcrumbUI,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

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
}

export function Breadcrumb() {
  const location = useLocation()
  const { t } = useTranslation('menu')
  
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
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/')
    let translationKey = ROUTE_NAMES[path] || segment
    if (translationKey === 'mappings') {
      translationKey = 'asset_mappings'
    }
    const isLast = index === pathSegments.length - 1
    
    return {
      path,
      translationKey,
      isLast,
    }
  })
  
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
                  {t(crumb.translationKey)}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.path}>
                    {t(crumb.translationKey)}
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
