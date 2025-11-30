/**
 * 安全设置 Tab
 * SSH、API安全、数据库备份等
 * 仅开发者和运维者可访问和操作
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Shield,
  Key,
  Database,
  Download,
  RefreshCw,
  Lock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

import { getSecurityConfig, createBackup, downloadBackup } from '@/api/gateway'
import { formatDateTime } from '@/utils/format'

export function SecuritySettingsTab() {
  const { t } = useTranslation(['gateway', 'common'])
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['gateway', 'security'],
    queryFn: getSecurityConfig,
  })

  const securityConfig = data?.data

  // 创建备份
  const createBackupMutation = useMutation({
    mutationFn: createBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway', 'security'] })
      toast.success(t('gateway:security.backupCreated'))
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('common:error.createFailed'))
    },
  })

  const handleCreateBackup = () => {
    createBackupMutation.mutate()
  }

  const handleDownloadBackup = (filename: string) => {
    try {
      const url = downloadBackup(filename)
      window.open(url, '_blank')
      toast.success(t('gateway:security.downloadStarted'))
    } catch (error) {
      toast.error(t('common:error.downloadFailed'))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* SSH配置 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>{t('gateway:security.ssh')}</CardTitle>
          </div>
          <CardDescription>{t('gateway:security.sshDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:security.sshStatus')}
              </div>
              <div className="flex items-center gap-2">
                {securityConfig?.ssh.enabled ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-600">
                      {t('gateway:security.enabled')}
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-400">
                      {t('gateway:security.disabled')}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:security.sshPort')}
              </div>
              <div className="text-lg font-medium font-mono">
                {securityConfig?.ssh.port}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:security.rootLogin')}
              </div>
              <Badge variant={securityConfig?.ssh.root_login ? 'destructive' : 'default'}>
                {securityConfig?.ssh.root_login
                  ? t('gateway:security.allowed')
                  : t('gateway:security.denied')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API安全配置 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>{t('gateway:security.api')}</CardTitle>
          </div>
          <CardDescription>{t('gateway:security.apiDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:security.jwtExpire')}
              </div>
              <div className="text-lg font-medium">
                {securityConfig?.api.jwt_expire_minutes} {t('gateway:security.minutes')}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:security.rateLimit')}
              </div>
              <div className="text-lg font-medium">
                {securityConfig?.api.rate_limit_per_minute} {t('gateway:security.requestsPerMin')}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('gateway:security.corsOrigins')}
              </div>
              <div className="text-lg font-medium">
                {securityConfig?.api.cors_origins.length} {t('gateway:security.origins')}
              </div>
            </div>
          </div>

          {/* CORS源列表 */}
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="text-sm font-medium">
              {t('gateway:security.allowedOrigins')}
            </div>
            <div className="flex flex-wrap gap-2">
              {securityConfig?.api.cors_origins.map((origin, index) => (
                <Badge key={index} variant="secondary" className="font-mono text-xs">
                  {origin}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 数据库备份 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>{t('gateway:security.backup')}</CardTitle>
            </div>
            <Button
              onClick={handleCreateBackup}
              disabled={createBackupMutation.isPending}
            >
              {createBackupMutation.isPending
                ? t('common:action.creating')
                : t('gateway:security.createBackup')}
            </Button>
          </div>
          <CardDescription>{t('gateway:security.backupDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {securityConfig?.backups && securityConfig.backups.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('gateway:security.filename')}</TableHead>
                  <TableHead className="w-[120px]">{t('gateway:security.size')}</TableHead>
                  <TableHead className="w-[200px]">{t('gateway:security.createdAt')}</TableHead>
                  <TableHead className="w-[80px] text-right">{t('common:action.title')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {securityConfig.backups.map((backup, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{backup.filename}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {backup.size_mb.toFixed(2)} MB
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(backup.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadBackup(backup.filename)}
                        title={t('common:action.download')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {t('gateway:security.noBackups')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

