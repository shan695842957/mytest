/**
 * 系统设置主页
 * 展示所有系统设置选项，按分组显示
 * 移动端：卡片列表布局
 * 桌面端：卡片网格布局
 */

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Network, Activity, LineChart, Clock, Info, Shield, 
  Cog, Server, Settings2, Palette, Settings
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MaterialListItem } from '@/components/common/MaterialListItem'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types'
import { cn } from '@/lib/utils'

interface SettingItem {
  key: string
  label: string
  icon: React.ReactNode
  path: string
  roles: UserRole[]
  description?: string
}

interface SettingGroup {
  key: string
  label: string
  icon: React.ReactNode
  items: SettingItem[]
}

export default function SettingsPage() {
  const { t } = useTranslation(['menu', 'settings'])
  const navigate = useNavigate()
  const { hasAnyRole } = useAuth()

  // 定义所有设置项
  const settingGroups: SettingGroup[] = useMemo(() => [
    {
      key: 'gateway',
      label: 'gateway_settings',
      icon: <Network className="size-5" />,
      items: [
        {
          key: 'gateway-monitor',
          label: 'gateway_monitor',
          icon: <Activity className="size-5" />,
          path: '/settings/gateway/monitor',
          roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
        },
        {
          key: 'gateway-history',
          label: 'gateway_history',
          icon: <LineChart className="size-5" />,
          path: '/settings/gateway/history',
          roles: [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.USER],
        },
        {
          key: 'gateway-network',
          label: 'gateway_network',
          icon: <Network className="size-5" />,
          path: '/settings/gateway/network',
          roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
        },
        {
          key: 'gateway-time',
          label: 'gateway_time',
          icon: <Clock className="size-5" />,
          path: '/settings/gateway/time',
          roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
        },
        {
          key: 'gateway-info',
          label: 'gateway_info',
          icon: <Info className="size-5" />,
          path: '/settings/gateway/info',
          roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
        },
        {
          key: 'gateway-ssh',
          label: 'gateway_ssh',
          icon: <Shield className="size-5" />,
          path: '/settings/gateway/ssh',
          roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
        },
      ],
    },
    {
      key: 'software',
      label: 'software_settings',
      icon: <Cog className="size-5" />,
      items: [
        {
          key: 'software-service',
          label: 'software_service',
          icon: <Server className="size-5" />,
          path: '/settings/software/service',
          roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
        },
        {
          key: 'software-api',
          label: 'software_api',
          icon: <Shield className="size-5" />,
          path: '/settings/software/api',
          roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
        },
        {
          key: 'software-database',
          label: 'software_database',
          icon: <Server className="size-5" />,
          path: '/settings/software/database',
          roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
        },
        {
          key: 'software-config-center',
          label: 'software_config_center',
          icon: <Settings2 className="size-5" />,
          path: '/settings/software/config-center',
          roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
        },
      ],
    },
    {
      key: 'frontend',
      label: 'frontend_settings',
      icon: <Palette className="size-5" />,
      items: [
        {
          key: 'frontend-settings',
          label: 'frontend_settings',
          icon: <Palette className="size-5" />,
          path: '/settings/frontend',
          roles: [UserRole.DEVELOPER, UserRole.OPERATOR, UserRole.USER],
        },
      ],
    },
  ], [])

  // 过滤可见的设置组和项
  const visibleGroups = useMemo(() => {
    return settingGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => 
          item.roles.length === 0 || hasAnyRole(item.roles)
        ),
      }))
      .filter(group => group.items.length > 0) // 只显示有可见项的组
  }, [settingGroups, hasAnyRole])

  const handleNavigate = (path: string) => {
    navigate(path)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t('menu:settings')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('settings:settings.description', { defaultValue: '系统设置和配置管理' })}
        </p>
      </div>

      {/* 设置分组 - 移动端卡片列表，桌面端卡片网格 */}
      {visibleGroups.map((group) => (
        <Card key={group.key}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
                {group.icon}
              </div>
              <div>
                <CardTitle className="text-lg">{t(`menu:${group.label}`)}</CardTitle>
                <CardDescription className="text-sm">
                  {t(`settings:settings.group.${group.key}.description`, { 
                    defaultValue: `${group.items.length} 个设置项` 
                  })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* 移动端：卡片列表 */}
            <div className="md:hidden">
              <div className="divide-y divide-border">
                {group.items.map((item) => (
                  <MaterialListItem
                    key={item.key}
                    icon={
                      <div className="flex items-center justify-center size-10 rounded-lg bg-muted">
                        {item.icon}
                      </div>
                    }
                    title={t(`menu:${item.label}`)}
                    onClick={() => handleNavigate(item.path)}
                    showArrow
                  />
                ))}
              </div>
            </div>

            {/* 桌面端：网格布局 */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {group.items.map((item) => (
                <Card
                  key={item.key}
                  className={cn(
                    'cursor-pointer transition-all duration-200',
                    'hover:shadow-md hover:border-primary/50',
                    'active:scale-[0.98]'
                  )}
                  onClick={() => handleNavigate(item.path)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base leading-tight truncate">
                        {t(`menu:${item.label}`)}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* 空状态 */}
      {visibleGroups.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings2 className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {t('settings:settings.no_access', { defaultValue: '您没有访问任何设置的权限' })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
