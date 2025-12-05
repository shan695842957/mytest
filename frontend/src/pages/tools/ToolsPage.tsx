/**
 * 系统工具主页
 * 展示所有系统工具选项
 * 移动端：卡片列表布局
 * 桌面端：卡片网格布局
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Network, Search, Route, PackageSearch, Usb, 
  ArrowRightLeft, Globe2, Wrench
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MaterialListItem } from '@/components/common/MaterialListItem'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types'
import { cn } from '@/lib/utils'

interface ToolItem {
  key: string
  label: string
  icon: React.ReactNode
  path: string
  roles: UserRole[]
  description?: string
}

export default function ToolsPage() {
  const { t } = useTranslation(['menu', 'tools'])
  const navigate = useNavigate()
  const { hasAnyRole } = useAuth()

  // 定义所有工具项
  const tools: ToolItem[] = useMemo(() => [
    {
      key: 'ping',
      label: 'ping',
      icon: <Network className="size-5" />,
      path: '/tools/ping',
      roles: [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.USER],
    },
    {
      key: 'port-scan',
      label: 'port_scan',
      icon: <Search className="size-5" />,
      path: '/tools/port-scan',
      roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
    },
    {
      key: 'arp',
      label: 'arp_table',
      icon: <Network className="size-5" />,
      path: '/tools/arp',
      roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
    },
    {
      key: 'traceroute',
      label: 'traceroute',
      icon: <Route className="size-5" />,
      path: '/tools/traceroute',
      roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
    },
    {
      key: 'network-capture',
      label: 'network_capture',
      icon: <PackageSearch className="size-5" />,
      path: '/tools/network-capture',
      roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
    },
    {
      key: 'serial',
      label: 'serial_port',
      icon: <Usb className="size-5" />,
      path: '/tools/serial',
      roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
    },
    {
      key: 'port-forwarding',
      label: 'port_forwarding',
      icon: <ArrowRightLeft className="size-5" />,
      path: '/tools/port-forwarding',
      roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
    },
    {
      key: 'rathole',
      label: 'rathole',
      icon: <Globe2 className="size-5" />,
      path: '/tools/rathole',
      roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
    },
  ], [])

  // 过滤可见的工具项
  const visibleTools = useMemo(() => {
    return tools.filter(tool => 
      tool.roles.length === 0 || hasAnyRole(tool.roles)
    )
  }, [tools, hasAnyRole])

  const handleNavigate = (path: string) => {
    navigate(path)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          {t('menu:tools')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('tools:tools.description', { defaultValue: '系统工具和网络诊断' })}
        </p>
      </div>

      {/* 工具列表 */}
      {visibleTools.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
                <Wrench className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('menu:tools')}</CardTitle>
                <CardDescription className="text-sm">
                  {t('tools:tools.total_count', { count: visibleTools.length })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* 移动端：卡片列表 */}
            <div className="md:hidden">
              <div className="divide-y divide-border">
                {visibleTools.map((tool) => (
                  <MaterialListItem
                    key={tool.key}
                    icon={
                      <div className="flex items-center justify-center size-10 rounded-lg bg-muted">
                        {tool.icon}
                      </div>
                    }
                    title={t(`menu:${tool.label}`)}
                    onClick={() => handleNavigate(tool.path)}
                    showArrow
                  />
                ))}
              </div>
            </div>

            {/* 桌面端：网格布局 */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {visibleTools.map((tool) => (
                <Card
                  key={tool.key}
                  className={cn(
                    'cursor-pointer transition-all duration-200',
                    'hover:shadow-md hover:border-primary/50',
                    'active:scale-[0.98]'
                  )}
                  onClick={() => handleNavigate(tool.path)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary shrink-0">
                      {tool.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base leading-tight truncate">
                        {t(`menu:${tool.label}`)}
                      </h3>
                      {tool.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {tool.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        // 空状态
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {t('tools:tools.no_access', { defaultValue: '您没有访问任何工具的权限' })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
