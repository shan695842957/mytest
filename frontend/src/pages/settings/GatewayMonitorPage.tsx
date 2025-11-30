/**
 * 网关-系统监控页面
 */
import { useTranslation } from 'react-i18next'
import { SystemMonitorTab } from './tabs/SystemMonitorTab'

export default function GatewayMonitorPage() {
  const { t } = useTranslation(['gateway'])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('gateway:monitor.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('gateway:monitor.description')}</p>
      </div>
      
      <SystemMonitorTab />
    </div>
  )
}

