/**
 * 网关-系统监控页面
 */
import { useTranslation } from 'react-i18next'
import { Activity } from 'lucide-react'
import { SystemMonitorTab } from './tabs/SystemMonitorTab'

export default function GatewayMonitorPage() {
  const { t } = useTranslation(['gateway'])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {t('gateway:monitor.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('gateway:monitor.description')}</p>
      </div>
      
      <SystemMonitorTab />
    </div>
  )
}

