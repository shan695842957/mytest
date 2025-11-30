/**
 * 系统监控 Tab
 * 实时显示CPU、内存、硬盘使用情况
 */
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Cpu, MemoryStick, HardDrive, Activity, RefreshCw } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import { getSystemMonitor } from '@/api/gateway'
import { formatDateTime } from '@/utils/format'
import { usePageVisibility } from '@/hooks/usePageVisibility'

export function SystemMonitorTab() {
  const { t } = useTranslation(['gateway', 'common'])
  const isPageVisible = usePageVisibility()

  // 优化：30秒刷新 + 页面不可见时停止（原5秒）
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['gateway', 'monitor'],
    queryFn: getSystemMonitor,
    refetchInterval: (query) => {
      if (!isPageVisible) return false // 页面不可见时停止
      return 30000 // 30秒（原5秒，性能提升83%）
    },
  })

  const monitor = data?.data

  // 格式化运行时间
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    const parts = []
    if (days > 0) parts.push(`${days}${t('gateway:monitor.days')}`)
    if (hours > 0) parts.push(`${hours}${t('gateway:monitor.hours')}`)
    if (minutes > 0) parts.push(`${minutes}${t('gateway:monitor.minutes')}`)
    
    return parts.join(' ') || `0${t('gateway:monitor.minutes')}`
  }

  // 获取使用率颜色
  const getPercentColor = (percent: number): string => {
    if (percent >= 90) return 'text-red-600 dark:text-red-400'
    if (percent >= 75) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getProgressColor = (percent: number): string => {
    if (percent >= 90) return 'bg-red-500'
    if (percent >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3" />
            {t('gateway:monitor.autoRefresh')}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {t('gateway:monitor.refreshInterval', { seconds: 5 })}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('common:action.refresh')}
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* CPU使用率 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('gateway:monitor.cpu')}
            </CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPercentColor(monitor?.cpu.percent || 0)}`}>
              {monitor?.cpu.percent.toFixed(1)}%
            </div>
            <Progress 
              value={monitor?.cpu.percent || 0} 
              className="mt-2"
              indicatorClassName={getProgressColor(monitor?.cpu.percent || 0)}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {monitor?.cpu.count} {t('gateway:monitor.cores')}
              {monitor?.cpu.load_avg && (
                <span className="ml-2">
                  {t('gateway:monitor.load')}: {monitor.cpu.load_avg[0].toFixed(2)}
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* 内存使用率 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('gateway:monitor.memory')}
            </CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPercentColor(monitor?.memory.percent || 0)}`}>
              {monitor?.memory.percent.toFixed(1)}%
            </div>
            <Progress 
              value={monitor?.memory.percent || 0} 
              className="mt-2"
              indicatorClassName={getProgressColor(monitor?.memory.percent || 0)}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {monitor?.memory.used_mb.toFixed(0)} / {monitor?.memory.total_mb.toFixed(0)} MB
            </p>
          </CardContent>
        </Card>

        {/* 硬盘使用率 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('gateway:monitor.disk')}
            </CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {monitor?.disks && monitor.disks.length > 0 ? (
              <>
                <div className={`text-2xl font-bold ${getPercentColor(monitor.disks[0].percent)}`}>
                  {monitor.disks[0].percent.toFixed(1)}%
                </div>
                <Progress 
                  value={monitor.disks[0].percent} 
                  className="mt-2"
                  indicatorClassName={getProgressColor(monitor.disks[0].percent)}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {monitor.disks[0].used_gb.toFixed(1)} / {monitor.disks[0].total_gb.toFixed(1)} GB
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                {t('gateway:monitor.noData')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 系统运行时间 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('gateway:monitor.uptime')}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {monitor && formatUptime(monitor.uptime_seconds)}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t('gateway:monitor.bootTime')}: {monitor && formatDateTime(monitor.boot_time)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 磁盘分区详情 */}
      {monitor?.disks && monitor.disks.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('gateway:monitor.diskPartitions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monitor.disks.map((disk, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{disk.mountpoint}</span>
                      <Badge variant="secondary" className="text-xs">
                        {disk.fstype}
                      </Badge>
                    </div>
                    <div className={`text-sm font-medium ${getPercentColor(disk.percent)}`}>
                      {disk.percent.toFixed(1)}%
                    </div>
                  </div>
                  <Progress 
                    value={disk.percent} 
                    className="h-2"
                    indicatorClassName={getProgressColor(disk.percent)}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{disk.device}</span>
                    <span>
                      {disk.used_gb.toFixed(1)} GB / {disk.total_gb.toFixed(1)} GB
                      <span className="ml-2 text-green-600 dark:text-green-400">
                        ({t('gateway:monitor.free')}: {disk.free_gb.toFixed(1)} GB)
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

