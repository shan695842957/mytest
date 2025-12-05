/**
 * 系统信息 Tab
 * 显示主机名、OS版本、内核等纯系统信息
 * 仅开发者和运维者可访问
 */
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Package } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { getSystemInfo } from '@/api/gateway'

export function SystemInfoTab() {
  const { t } = useTranslation(['gateway', 'common'])

  const { data: infoData, isLoading: infoLoading } = useQuery({
    queryKey: ['gateway', 'info'],
    queryFn: getSystemInfo,
  })

  const systemInfo = infoData?.data

  if (infoLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 系统基础信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <CardTitle>{t('gateway:info.title')}</CardTitle>
          </div>
          <CardDescription>{t('gateway:info.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* 主机名 */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:info.hostname')}
              </div>
              <div className="text-lg font-medium font-mono">
                {systemInfo?.hostname}
              </div>
            </div>

            {/* 操作系统 */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:info.os')}
              </div>
              <div className="text-lg font-medium">
                {systemInfo?.os_name} {systemInfo?.os_version}
              </div>
            </div>

            {/* 内核版本 */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:info.kernel')}
              </div>
              <div className="text-sm font-mono text-muted-foreground">
                {systemInfo?.kernel_version}
              </div>
            </div>

            {/* 系统架构 */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:info.architecture')}
              </div>
              <div className="text-lg font-medium font-mono">
                {systemInfo?.architecture}
              </div>
            </div>

            {/* Python版本 */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:info.pythonVersion')}
              </div>
              <div className="text-lg font-medium font-mono">
                {systemInfo?.python_version}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
