/**
 * Rathole 服务控制组件（状态卡片）
 */

import { useTranslation } from 'react-i18next'
import { Play, Square, RotateCw, RefreshCw, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { RatholeServiceStatus } from '@/types'

interface Props {
  serviceStatus: RatholeServiceStatus | undefined
  onStart: () => void
  onStop: () => void
  onRestart: () => void
  onRefresh: () => void
  isStarting: boolean
  isStopping: boolean
  isRestarting: boolean
}

export function RatholeServiceControl({
  serviceStatus,
  onStart,
  onStop,
  onRestart,
  onRefresh,
  isStarting,
  isStopping,
  isRestarting,
}: Props) {
  const { t } = useTranslation(['tools', 'common'])

  // 状态 Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-500">
            <Activity className="mr-1 h-3 w-3" />
            {t('rathole.active')}
          </Badge>
        )
      case 'activating':
        return (
          <Badge variant="default" className="bg-blue-500">
            <Activity className="mr-1 h-3 w-3 animate-pulse" />
            {t('rathole.activating')}
          </Badge>
        )
      case 'deactivating':
        return (
          <Badge variant="default" className="bg-orange-500">
            <Activity className="mr-1 h-3 w-3 animate-pulse" />
            {t('rathole.deactivating')}
          </Badge>
        )
      case 'reloading':
        return (
          <Badge variant="default" className="bg-blue-500">
            <Activity className="mr-1 h-3 w-3 animate-spin" />
            {t('rathole.reloading')}
          </Badge>
        )
      case 'inactive':
        return (
          <Badge variant="secondary">
            {t('rathole.inactive')}
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive">
            {t('rathole.failed')}
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            {t('rathole.unknown')}
          </Badge>
        )
    }
  }

  const isActive = serviceStatus?.status === 'active'
  const isTransitioning = ['activating', 'deactivating', 'reloading'].includes(
    serviceStatus?.status || ''
  )

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">
                {t('rathole.serviceStatus')}
              </div>
              <div className="flex items-center gap-2">
                {serviceStatus && (
                  <>
                    {getStatusBadge(serviceStatus.status)}
                    {serviceStatus.pid && (
                      <Badge variant="outline" className="font-mono">
                        PID: {serviceStatus.pid}
                      </Badge>
                    )}
                    {serviceStatus.memory_usage && (
                      <Badge variant="outline">{serviceStatus.memory_usage}</Badge>
                    )}
                    {serviceStatus.uptime && (
                      <Badge variant="outline">{serviceStatus.uptime}</Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onStart}
              disabled={isStarting || isActive || isTransitioning}
              size="sm"
            >
              <Play className="mr-2 h-4 w-4" />
              {t('rathole.start')}
            </Button>
            <Button
              variant="outline"
              onClick={onStop}
              disabled={isStopping || !isActive}
              size="sm"
            >
              <Square className="mr-2 h-4 w-4" />
              {t('rathole.stop')}
            </Button>
            <Button
              variant="outline"
              onClick={onRestart}
              disabled={isRestarting || isTransitioning}
              size="sm"
            >
              <RotateCw className="mr-2 h-4 w-4" />
              {t('rathole.restart')}
            </Button>
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

