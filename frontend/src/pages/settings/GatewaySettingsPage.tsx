/**
 * 网关设置页面
 * 系统级管理：监控、网络、时间、服务、安全
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  Network,
  Clock,
  Server,
  Settings,
  Shield,
} from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  SystemMonitorTab,
  NetworkSettingsTab,
  TimeSettingsTab,
  SystemInfoTab,
  ServiceManagementTab,
  SecuritySettingsTab,
} from './tabs'

import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/permission'

export default function GatewaySettingsPage() {
  const { t } = useTranslation(['gateway', 'common'])
  const { hasAnyRole } = useAuth()

  const [activeTab, setActiveTab] = useState('monitor')

  const canManage = hasAnyRole([UserRole.DEVELOPER, UserRole.OPERATOR])

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('gateway:title')}</h2>
        <p className="text-muted-foreground">
          {t('gateway:description')}
        </p>
      </div>

      {/* Tabs导航 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {/* 系统监控 - 所有角色 */}
          <TabsTrigger value="monitor" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">{t('gateway:tabs.monitor')}</span>
          </TabsTrigger>

          {/* 网络设置 - 所有角色 */}
          <TabsTrigger value="network" className="gap-2">
            <Network className="h-4 w-4" />
            <span className="hidden sm:inline">{t('gateway:tabs.network')}</span>
          </TabsTrigger>

          {/* 时间设置 - 所有角色 */}
          <TabsTrigger value="time" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">{t('gateway:tabs.time')}</span>
          </TabsTrigger>

          {/* 系统信息 - 仅开发者+运维者 */}
          {canManage && (
            <TabsTrigger value="info" className="gap-2">
              <Server className="h-4 w-4" />
              <span className="hidden sm:inline">{t('gateway:tabs.info')}</span>
            </TabsTrigger>
          )}

          {/* 服务管理 - 仅开发者+运维者 */}
          {canManage && (
            <TabsTrigger value="service" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t('gateway:tabs.service')}</span>
            </TabsTrigger>
          )}

          {/* 安全设置 - 仅开发者+运维者 */}
          {canManage && (
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{t('gateway:tabs.security')}</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab内容 */}
        <TabsContent value="monitor" className="space-y-4">
          <SystemMonitorTab />
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <NetworkSettingsTab />
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <TimeSettingsTab />
        </TabsContent>

        {canManage && (
          <>
            <TabsContent value="info" className="space-y-4">
              <SystemInfoTab />
            </TabsContent>

            <TabsContent value="service" className="space-y-4">
              <ServiceManagementTab />
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <SecuritySettingsTab />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
