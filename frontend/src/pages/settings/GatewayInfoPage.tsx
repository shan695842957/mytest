/**
 * 网关-系统信息页面
 */
import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import { SystemInfoTab } from './tabs/SystemInfoTab'

export default function GatewayInfoPage() {
  const { t } = useTranslation(['gateway'])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Info className="h-5 w-5" />
          {t('gateway:info.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t('gateway:info.description')}</p>
      </div>
      
      <SystemInfoTab />
    </div>
  )
}

