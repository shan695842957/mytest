/**
 * 时间设置 Tab
 * 显示系统时钟、时区、NTP配置
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Clock, Globe2, Server, RefreshCw, CheckCircle2, XCircle, Zap, Edit } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import { getTimeConfig, syncNTP, updateTimezone } from '@/api/gateway'
import { formatDateTime } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/permission'

import { NTPEditDialog, TimezoneSelector } from '@/components/gateway'

export function TimeSettingsTab() {
  const { t } = useTranslation(['gateway', 'common'])
  const { hasAnyRole } = useAuth()
  const queryClient = useQueryClient()

  const canManage = hasAnyRole([UserRole.DEVELOPER, UserRole.OPERATOR])
  
  const [ntpDialogOpen, setNtpDialogOpen] = useState(false)
  const [timezoneEditMode, setTimezoneEditMode] = useState(false)
  const [selectedTimezone, setSelectedTimezone] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['gateway', 'time'],
    queryFn: getTimeConfig,
    staleTime: 60000, // 1分钟内复用缓存
    // 移除自动轮询，复用Header的缓存（Header每5分钟校准一次）
    // 用户可以点击"刷新"按钮手动刷新
  })

  // 更新时区
  const updateTimezoneMutation = useMutation({
    mutationFn: (timezone: string) => updateTimezone(timezone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway', 'time'] })
      toast.success(t('gateway:time.timezoneUpdateSuccess'))
      setTimezoneEditMode(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('gateway:time.timezoneUpdateFailed'))
    },
  })

  // NTP同步
  const syncNTPMutation = useMutation({
    mutationFn: syncNTP,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway', 'time'] })
      toast.success(t('gateway:time.syncSuccess'))
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('gateway:time.syncFailed'))
    },
  })

  const handleSyncNTP = () => {
    syncNTPMutation.mutate()
  }

  const handleTimezoneEdit = () => {
    setSelectedTimezone(timeConfig?.time_info.timezone || '')
    setTimezoneEditMode(true)
  }

  const handleTimezoneSave = () => {
    if (selectedTimezone) {
      updateTimezoneMutation.mutate(selectedTimezone)
    }
  }

  const handleTimezoneCancel = () => {
    setTimezoneEditMode(false)
    setSelectedTimezone('')
  }

  const timeConfig = data?.data

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{t('gateway:time.title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('gateway:time.description')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('common:action.refresh')}
        </Button>
      </div>

      {/* 系统时钟 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <CardTitle>{t('gateway:time.systemClock')}</CardTitle>
          </div>
          <CardDescription>{t('gateway:time.clockDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* 本地时间 */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:time.localTime')}
              </div>
              <div className="text-3xl font-bold font-mono tabular-nums">
                {timeConfig && formatDateTime(timeConfig.time_info.local_time)}
              </div>
            </div>

            {/* UTC时间 */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:time.utcTime')}
              </div>
              <div className="text-3xl font-bold font-mono tabular-nums">
                {timeConfig && formatDateTime(timeConfig.time_info.utc_time)}
              </div>
            </div>
          </div>

          {/* 时区信息 */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Globe2 className="h-4 w-4" />
                {t('gateway:time.timezone')}
              </div>
              {canManage && !timezoneEditMode && (
                <Button variant="outline" size="sm" onClick={handleTimezoneEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('common:action.edit')}
                </Button>
              )}
            </div>

            {timezoneEditMode ? (
              <div className="space-y-4">
                <TimezoneSelector
                  value={selectedTimezone}
                  onValueChange={setSelectedTimezone}
                  disabled={updateTimezoneMutation.isPending}
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleTimezoneSave}
                    disabled={updateTimezoneMutation.isPending || !selectedTimezone}
                  >
                    {updateTimezoneMutation.isPending ? t('common:action.saving') : t('common:action.save')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTimezoneCancel}
                    disabled={updateTimezoneMutation.isPending}
                  >
                    {t('common:action.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {t('gateway:time.currentTimezone')}
                  </div>
                  <div className="text-lg font-medium">
                    {timeConfig?.time_info.timezone}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {t('gateway:time.timezoneOffset')}
                  </div>
                  <div className="text-lg font-medium font-mono">
                    UTC{timeConfig?.time_info.timezone_offset}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* NTP配置 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              <CardTitle>{t('gateway:time.ntp')}</CardTitle>
            </div>
            {canManage && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncNTP}
                  disabled={syncNTPMutation.isPending}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  {syncNTPMutation.isPending ? t('gateway:time.syncing') : t('gateway:time.syncNow')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNtpDialogOpen(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {t('common:action.edit')}
                </Button>
              </div>
            )}
          </div>
          <CardDescription>{t('gateway:time.ntpDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* NTP状态 */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  timeConfig?.ntp.enabled ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  {timeConfig?.ntp.enabled ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <div className="font-medium">
                    {timeConfig?.ntp.enabled
                      ? t('gateway:time.ntpEnabled')
                      : t('gateway:time.ntpDisabled')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('gateway:time.syncStatus')}: {timeConfig?.ntp.sync_status}
                  </div>
                </div>
              </div>
              <Badge variant={timeConfig?.ntp.enabled ? 'default' : 'secondary'}>
                {timeConfig?.ntp.enabled ? t('gateway:time.active') : t('gateway:time.inactive')}
              </Badge>
            </div>

            {/* NTP服务器列表 */}
            <div className="space-y-2">
              <div className="text-sm font-medium">
                {t('gateway:time.ntpServers')}
              </div>
              <div className="space-y-2">
                {timeConfig?.ntp.servers.map((server, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-md border bg-card"
                  >
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{server}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {index === 0 ? t('gateway:time.primary') : t('gateway:time.backup')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NTP编辑对话框 */}
      <NTPEditDialog
        open={ntpDialogOpen}
        onOpenChange={setNtpDialogOpen}
        ntpConfig={timeConfig?.ntp}
      />
    </div>
  )
}

