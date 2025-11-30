/**
 * 网关-系统信息页面
 */
import { useTranslation } from 'react-i18next'
import { SystemInfoTab } from './tabs/SystemInfoTab'

export default function GatewayInfoPage() {
  const { t } = useTranslation(['gateway'])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('gateway:info.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('gateway:info.description')}</p>
      </div>
      
      <SystemInfoTab />
    </div>
  )
}

