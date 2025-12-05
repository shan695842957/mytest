/**
 * 网关-时间设置页面
 */
import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'
import { TimeSettingsTab } from './tabs/TimeSettingsTab'

export default function GatewayTimePage() {
  const { t } = useTranslation(['gateway'])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t('gateway:time.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('gateway:time.description')}</p>
      </div>
      
      <TimeSettingsTab />
    </div>
  )
}

