/**
 * 网关-时间设置页面
 */
import { useTranslation } from 'react-i18next'
import { TimeSettingsTab } from './tabs/TimeSettingsTab'

export default function GatewayTimePage() {
  const { t } = useTranslation(['gateway'])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('gateway:time.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('gateway:time.description')}</p>
      </div>
      
      <TimeSettingsTab />
    </div>
  )
}

