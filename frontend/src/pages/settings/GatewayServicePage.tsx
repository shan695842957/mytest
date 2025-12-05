/**
 * 网关-服务管理页面
 */
import { useTranslation } from 'react-i18next'
import { Server } from 'lucide-react'
import { ServiceManagementTab } from './tabs/ServiceManagementTab'

export default function GatewayServicePage() {
  const { t } = useTranslation(['gateway'])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Server className="h-5 w-5" />
          {t('gateway:service.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('gateway:service.description')}</p>
      </div>
      
      <ServiceManagementTab />
    </div>
  )
}

