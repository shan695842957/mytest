/**
 * 网关-网络设置页面
 * 包含：网卡设置、网络路由
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Network, Router as RouterIcon } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NetworkSettingsTab } from './tabs/NetworkSettingsTab'
import { NetworkRoutesTab } from './tabs/NetworkRoutesTab'

export default function GatewayNetworkPage() {
  const { t } = useTranslation(['gateway', 'common'])
  const [activeTab, setActiveTab] = useState('interfaces')

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('gateway:network.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('gateway:network.description')}</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="interfaces" className="gap-2">
            <Network className="h-4 w-4" />
            {t('gateway:network.tabInterfaces')}
          </TabsTrigger>
          <TabsTrigger value="routes" className="gap-2">
            <RouterIcon className="h-4 w-4" />
            {t('gateway:network.tabRoutes')}
          </TabsTrigger>
        </TabsList>

        {/* 网卡设置 */}
        <TabsContent value="interfaces">
          <NetworkSettingsTab />
        </TabsContent>

        {/* 网络路由 */}
        <TabsContent value="routes">
          <NetworkRoutesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

