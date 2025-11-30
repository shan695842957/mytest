/**
 * 网关-服务管理页面
 */
import { useTranslation } from 'react-i18next'
import { ServiceManagementTab } from './tabs/ServiceManagementTab'

export default function GatewayServicePage() {
  const { t } = useTranslation(['gateway'])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('gateway:service.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('gateway:service.description')}</p>
      </div>
      
      <ServiceManagementTab />
    </div>
  )
}

