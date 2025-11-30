/**
 * 软件设置-API安全页面
 * 应用层：JWT、限流、CORS配置
 */
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Shield, RefreshCw, Info } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

import { getSecurityConfig } from '@/api/gateway'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/permission'

export default function SoftwareAPIPage() {
  const { t } = useTranslation(['gateway', 'common'])
  const { hasAnyRole } = useAuth()

  const isDeveloper = hasAnyRole([UserRole.DEVELOPER])

  // 优化：配置类数据，手动刷新即可（原10秒自动刷新）
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['gateway', 'security'],
    queryFn: getSecurityConfig,
    staleTime: 300000, // 5分钟内复用缓存（与SSH页面共享缓存）
    // 移除自动刷新
  })

  const apiConfig = data?.data?.api

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('gateway:software.apiTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('gateway:software.apiDescription')}</p>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('gateway:software.apiTitle')}</h1>
        <p className="text-muted-foreground mt-2">{t('gateway:software.apiDescription')}</p>
      </div>

      {/* 运维者只读提示 */}
      {!isDeveloper && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {t('gateway:software.readOnlyHint')}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>{t('gateway:security.api')}</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('common:action.refresh')}
            </Button>
          </div>
          <CardDescription>{t('gateway:security.apiDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* JWT过期时间 */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:security.jwtExpire')}
              </div>
              <div className="text-2xl font-semibold">
                {apiConfig?.jwt_expire_minutes || 0}
                <span className="text-sm text-muted-foreground ml-2">
                  {t('gateway:security.minutes')}
                </span>
              </div>
            </div>

            {/* 请求限流 */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:security.rateLimit')}
              </div>
              <div className="text-2xl font-semibold">
                {apiConfig?.rate_limit_per_minute || 0}
                <span className="text-sm text-muted-foreground ml-2">
                  {t('gateway:security.requestsPerMin')}
                </span>
              </div>
            </div>

            {/* CORS源 */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:security.corsOrigins')}
              </div>
              <div className="text-2xl font-semibold">
                {apiConfig?.cors_origins?.length || 0}
                <span className="text-sm text-muted-foreground ml-2">
                  {t('gateway:security.origins')}
                </span>
              </div>
            </div>
          </div>

          {/* CORS源详情 */}
          {apiConfig?.cors_origins && apiConfig.cors_origins.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <div className="text-sm font-medium text-muted-foreground mb-3">
                {t('gateway:security.allowedOrigins')}
              </div>
              <div className="flex flex-wrap gap-2">
                {apiConfig.cors_origins.map((origin, index) => (
                  <code key={index} className="px-3 py-1 rounded-md bg-muted text-sm font-mono">
                    {origin}
                  </code>
                ))}
              </div>
            </div>
          )}

          {/* 配置提示 */}
          <div className="mt-6 p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              💡 {t('gateway:software.apiConfigHint')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

