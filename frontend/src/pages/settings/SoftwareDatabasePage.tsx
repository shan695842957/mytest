/**
 * 软件设置-数据库管理页面
 * 应用数据：备份、还原、下载
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Database, Download, Plus, RefreshCw, Info, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

import { getSecurityConfig, createBackup, downloadBackup } from '@/api/gateway'
import { RestoreBackupDialog } from '@/components/gateway'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/permission'
import { formatDateTime } from '@/utils/format'

export default function SoftwareDatabasePage() {
  const { t } = useTranslation(['gateway', 'common'])
  const { hasAnyRole } = useAuth()
  const queryClient = useQueryClient()

  const isDeveloper = hasAnyRole([UserRole.DEVELOPER])
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['gateway', 'security'],
    queryFn: getSecurityConfig,
  })

  const backups = data?.data?.backups || []

  // 创建备份
  const createMutation = useMutation({
    mutationFn: createBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway', 'security'] })
      toast.success(t('gateway:security.backupCreated'))
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message
      toast.error(t('common:error.operationFailed') + ': ' + message)
    },
  })

  // 下载备份
  const handleDownload = async (filename: string) => {
    try {
      await downloadBackup(filename)
      toast.success(t('gateway:security.downloadStarted'))
    } catch (error: any) {
      const message = error.response?.data?.message || error.message
      toast.error(t('common:error.operationFailed') + ': ' + message)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('gateway:software.databaseTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('gateway:software.databaseDescription')}</p>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('gateway:software.databaseTitle')}</h1>
        <p className="text-muted-foreground mt-2">{t('gateway:software.databaseDescription')}</p>
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
              <Database className="h-5 w-5" />
              <CardTitle>{t('gateway:security.backup')}</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('common:action.refresh')}
              </Button>
              {isDeveloper && (
                <>
                  <Button 
                    variant="outline"
                    size="sm" 
                    onClick={() => setRestoreDialogOpen(true)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {t('common:action.restore')}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('gateway:security.createBackup')}
                  </Button>
                </>
              )}
            </div>
          </div>
          <CardDescription>{t('gateway:security.backupDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('gateway:security.filename')}</TableHead>
                <TableHead>{t('gateway:security.size')}</TableHead>
                <TableHead>{t('gateway:security.createdAt')}</TableHead>
                <TableHead className="w-[100px] text-right">{t('common:action.title')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.length > 0 ? (
                backups.map((backup, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{backup.filename}</TableCell>
                    <TableCell>{backup.size_mb.toFixed(2)} MB</TableCell>
                    <TableCell>{formatDateTime(backup.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(backup.filename)}
                        disabled={!isDeveloper}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    {t('gateway:security.noBackups')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 还原备份对话框 */}
      <RestoreBackupDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
      />
    </div>
  )
}

