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
      <CardContent className="pt-4 md:pt-6">
        {/* 移动端：纵向布局，桌面端：横向布局 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* 状态信息 */}
          <div className="flex-1 min-w-0">
            <div className="text-xs md:text-sm font-medium text-muted-foreground mb-2">
              {t('rathole.serviceStatus')}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {serviceStatus && (
                <>
                  {getStatusBadge(serviceStatus.status)}
                  {serviceStatus.pid && (
                    <Badge variant="outline" className="font-mono text-xs">
                      PID: {serviceStatus.pid}
                    </Badge>
                  )}
                  {serviceStatus.memory_usage && (
                    <Badge variant="outline" className="text-xs">
                      {serviceStatus.memory_usage}
                    </Badge>
                  )}
                  {serviceStatus.uptime && (
                    <Badge variant="outline" className="text-xs">
                      {serviceStatus.uptime}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
            {/* 移动端：按钮全宽，桌面端：自动宽度 */}
            <Button
              onClick={onStart}
              disabled={isStarting || isActive || isTransitioning}
              size="sm"
              className="w-full md:w-auto"
            >
              <Play className="mr-2 h-4 w-4" />
              {t('rathole.start')}
            </Button>
            <Button
              variant="outline"
              onClick={onStop}
              disabled={isStopping || !isActive}
              size="sm"
              className="w-full md:w-auto"
            >
              <Square className="mr-2 h-4 w-4" />
              {t('rathole.stop')}
            </Button>
            <Button
              variant="outline"
              onClick={onRestart}
              disabled={isRestarting || isTransitioning}
              size="sm"
              className="w-full md:w-auto"
            >
              <RotateCw className="mr-2 h-4 w-4" />
              {t('rathole.restart')}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRefresh}
              className="w-full md:w-auto"
            >
              <RefreshCw className="h-4 w-4 md:mr-0" />
              <span className="ml-2 md:hidden">{t('common:action.refresh')}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

