/**
 * 网关-安全设置页面
 */
import { useTranslation } from 'react-i18next'
import { SecuritySettingsTab } from './tabs/SecuritySettingsTab'

export default function GatewaySecurityPage() {
  const { t } = useTranslation(['gateway'])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('gateway:security.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('gateway:security.description')}</p>
      </div>
      
      <SecuritySettingsTab />
    </div>
  )
}

