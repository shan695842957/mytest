/**
 * Rathole 备份管理组件
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { RefreshCw, Eye, Trash2, History, MoreHorizontal, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { MaterialListItem } from '@/components/common/MaterialListItem'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import type { RatholeBackupInfo } from '@/types'
import { getBackupContent, restoreBackup, deleteBackup } from '@/api/rathole'
import { formatDateTime } from '@/utils/format'

interface Props {
  backups: RatholeBackupInfo[]
  onRefreshBackups: () => void
  onRefreshToml: () => void
}

export function RatholeBackupManagement({ backups, onRefreshBackups, onRefreshToml }: Props) {
  const { t } = useTranslation(['tools', 'common'])
  const [viewBackupDialogOpen, setViewBackupDialogOpen] = useState(false)
  const [viewingBackupContent, setViewingBackupContent] = useState('')
  const [restoreBackupDialogOpen, setRestoreBackupDialogOpen] = useState(false)
  const [restoringBackupFilename, setRestoringBackupFilename] = useState('')

  // 恢复备份 mutation
  const restoreBackupMutation = useMutation({
    mutationFn: restoreBackup,
    onSuccess: () => {
      toast.success(t('rathole.backupRestoreSuccess'))
      setRestoreBackupDialogOpen(false)
      setRestoringBackupFilename('')
      onRefreshToml()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('rathole.backupRestoreFailed'))
    },
  })

  // 删除备份 mutation
  const deleteBackupMutation = useMutation({
    mutationFn: deleteBackup,
    onSuccess: () => {
      toast.success(t('rathole.backupDeleteSuccess'))
      onRefreshBackups()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('rathole.backupDeleteFailed'))
    },
  })

  // 查看备份
  const handleViewBackup = async (backup_filename: string) => {
    try {
      const response = await getBackupContent(backup_filename)
      setViewingBackupContent(response.data)
      setViewBackupDialogOpen(true)
    } catch (error: any) {
      toast.error(error.response?.data?.detail || t('rathole.backupViewFailed'))
    }
  }

  // 恢复备份
  const handleRestoreBackup = (backup_filename: string) => {
    setRestoringBackupFilename(backup_filename)
    setRestoreBackupDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              <History className="inline mr-2 h-5 w-5" />
              {t('rathole.backupManagement')}
            </span>
            <Button variant="outline" size="sm" onClick={onRefreshBackups}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription>{t('rathole.backupDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {backups.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 px-4">
              <History className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p>{t('rathole.noBackups')}</p>
            </div>
          ) : (
            <>
              {/* 桌面端：原有布局 */}
              <div className="hidden md:block p-4 md:p-6 space-y-2">
                {backups.map((backup) => (
                  <div
                    key={backup.filename}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-mono text-sm font-medium">{backup.timestamp}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {(backup.size / 1024).toFixed(2)} KB •{' '}
                        {formatDateTime(backup.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewBackup(backup.filename)}
                        title={t('rathole.viewBackup')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreBackup(backup.filename)}
                      >
                        {t('rathole.restore')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBackupMutation.mutate(backup.filename)}
                        title={t('common:action.delete')}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 移动端：卡片列表 */}
              <div className="md:hidden">
                <div className="divide-y divide-border">
                  {backups.map((backup) => (
                    <MaterialListItem
                      key={backup.filename}
                      icon={
                        <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
                          <History className="size-5" />
                        </div>
                      }
                      title={backup.timestamp}
                      description={
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">
                            {(backup.size / 1024).toFixed(2)} KB
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(backup.created_at)}
                          </span>
                        </div>
                      }
                      actions={
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewBackup(backup.filename)}>
                              <Eye className="mr-2 size-4" />
                              {t('rathole.viewBackup')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRestoreBackup(backup.filename)}>
                              <RotateCcw className="mr-2 size-4" />
                              {t('rathole.restore')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteBackupMutation.mutate(backup.filename)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 size-4" />
                              {t('common:action.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      }
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 查看备份对话框 */}
      <Dialog open={viewBackupDialogOpen} onOpenChange={setViewBackupDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] md:max-h-[80vh] w-[95vw] md:w-full">
          <DialogHeader>
            <DialogTitle>{t('rathole.viewBackup')}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-180px)] md:max-h-[calc(80vh-180px)]">
            <Textarea
              value={viewingBackupContent}
              readOnly
              className="font-mono text-sm min-h-[300px] md:min-h-[500px] resize-none"
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setViewBackupDialogOpen(false)} className="w-full md:w-auto">
              {t('common:common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 恢复备份确认对话框 */}
      <AlertDialog open={restoreBackupDialogOpen} onOpenChange={setRestoreBackupDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('rathole.confirmRestore')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('rathole.confirmRestoreDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRestoringBackupFilename('')}>
              {t('common:action.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreBackupMutation.mutate(restoringBackupFilename)}
            >
              {t('rathole.restore')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

