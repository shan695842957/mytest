/**
 * 网关-SSH配置页面
 * 系统级远程访问配置
 */
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Shield, Server, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import { getSecurityConfig } from '@/api/gateway'

export default function GatewaySSHPage() {
  const { t } = useTranslation(['gateway', 'common'])

  // 优化：配置类数据，手动刷新即可（原10秒自动刷新）
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['gateway', 'security'],
    queryFn: getSecurityConfig,
    staleTime: 300000, // 5分钟内复用缓存
    // 移除自动刷新，用户点击"刷新"按钮手动更新
  })

  const sshConfig = data?.data?.ssh

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('gateway:ssh.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('gateway:ssh.description')}</p>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('gateway:ssh.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('gateway:ssh.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>{t('gateway:ssh.sshConfig')}</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('common:action.refresh')}
            </Button>
          </div>
          <CardDescription>{t('gateway:ssh.sshDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* SSH状态 */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:ssh.status')}
              </div>
              <div>
                {sshConfig?.enabled ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('gateway:ssh.enabled')}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    {t('gateway:ssh.disabled')}
                  </Badge>
                )}
              </div>
            </div>

            {/* SSH端口 */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:ssh.port')}
              </div>
              <div className="text-lg font-mono font-semibold">
                {sshConfig?.port || 22}
              </div>
            </div>

            {/* Root登录 */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:ssh.rootLogin')}
              </div>
              <div>
                {sshConfig?.root_login ? (
                  <Badge variant="destructive" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('gateway:ssh.allowed')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    {t('gateway:ssh.denied')}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* 提示信息 */}
          <div className="mt-6 p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              💡 {t('gateway:ssh.configHint')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

