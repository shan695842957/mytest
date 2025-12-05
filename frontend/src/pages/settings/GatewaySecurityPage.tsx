/**
 * 网关-安全设置页面
 */
import { useTranslation } from 'react-i18next'
import { Shield } from 'lucide-react'
import { SecuritySettingsTab } from './tabs/SecuritySettingsTab'

export default function GatewaySecurityPage() {
  const { t } = useTranslation(['gateway'])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {t('gateway:security.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('gateway:security.description')}</p>
      </div>
      
      <SecuritySettingsTab />
    </div>
  )
}

