/**
 * 审计日志详情对话框
 * 显示完整的审计日志信息
 */

import { useTranslation } from 'react-i18next'
import { FileText, User, Server, Target, Clock, AlertCircle, Code } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDateTime } from '@/utils/format'
import type { AuditLog } from '@/types'

interface AuditLogDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  log: AuditLog | null
}

export function AuditLogDetailDialog({
  open,
  onOpenChange,
  log,
}: AuditLogDetailDialogProps) {
  const { t } = useTranslation('audit')

  if (!log) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{t('audit.detailTitle')}</DialogTitle>
              <DialogDescription>
                {t('audit.id')}: {log.id} | {t('audit.request_id')}: {log.request_id}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
          <div className="space-y-6 pr-2">
            {/* 基本信息 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-primary" />
                {t('audit.detail.basicInfo')}
              </div>
              <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4">
                <div>
                  <dt className="text-xs text-muted-foreground">{t('audit.created_at')}</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {formatDateTime(log.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t('audit.duration')}</dt>
                  <dd className="mt-1 text-sm font-medium">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {log.duration_ms ? `${log.duration_ms}ms` : '-'}
                    </div>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t('audit.method')}</dt>
                  <dd className="mt-1">
                    <Badge variant="outline" className="font-mono text-xs">
                      {log.method}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t('audit.status')}</dt>
                  <dd className="mt-1">
                    <Badge variant={log.success === 'success' ? 'default' : 'destructive'}>
                      {log.success === 'success' ? t('audit.success') : t('audit.failed')}
                    </Badge>
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">{t('audit.path')}</dt>
                  <dd className="mt-1 text-sm font-mono break-all">{log.path}</dd>
                </div>
              </div>
            </div>

            <Separator />

            {/* 用户信息 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4 text-primary" />
                {t('audit.detail.userInfo')}
              </div>
              <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4">
                <div>
                  <dt className="text-xs text-muted-foreground">{t('audit.user')}</dt>
                  <dd className="mt-1 text-sm font-medium">{log.username || '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t('audit.detail.role')}</dt>
                  <dd className="mt-1">
                    {log.user_role && (
                      <Badge variant="outline">{t(`auth:role.${log.user_role}`)}</Badge>
                    )}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">{t('audit.ip_address')}</dt>
                  <dd className="mt-1 text-sm font-mono">{log.ip_address || '-'}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">{t('audit.user_agent')}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground break-all">
                    {log.user_agent || '-'}
                  </dd>
                </div>
              </div>
            </div>

            <Separator />

            {/* 操作信息 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Server className="h-4 w-4 text-primary" />
                {t('audit.detail.operationInfo')}
              </div>
              <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4">
                <div>
                  <dt className="text-xs text-muted-foreground">{t('audit.module')}</dt>
                  <dd className="mt-1">
                    <Badge variant="secondary">
                      {log.module_display || log.module}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t('audit.action')}</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {log.action_display || log.action}
                  </dd>
                </div>
              </div>
            </div>

            <Separator />

            {/* 目标信息 */}
            {log.target_type && log.target_id && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Target className="h-4 w-4 text-primary" />
                    {t('audit.detail.targetInfo')}
                  </div>
                  <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4">
                    <div>
                      <dt className="text-xs text-muted-foreground">{t('audit.detail.targetType')}</dt>
                      <dd className="mt-1 text-sm font-medium">
                        {log.target_type_display || log.target_type}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">{t('audit.detail.targetId')}</dt>
                      <dd className="mt-1 text-sm font-mono">{log.target_id}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs text-muted-foreground">{t('audit.detail.targetName')}</dt>
                      <dd className="mt-1 text-sm font-medium">{log.target_name || '-'}</dd>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* 请求内容 */}
            {log.request_body && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Code className="h-4 w-4 text-primary" />
                    {t('audit.request_body')}
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(log.request_body, null, 2)}
                    </pre>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* 变更内容 */}
            {log.changes && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Code className="h-4 w-4 text-primary" />
                    {t('audit.changes')}
                  </div>
                  <div className="space-y-3">
                    {log.changes.before && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {t('audit.detail.before')}
                        </p>
                        <div className="rounded-lg border bg-muted/30 p-4">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(log.changes.before, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                    {log.changes.after && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {t('audit.detail.after')}
                        </p>
                        <div className="rounded-lg border bg-muted/30 p-4">
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(log.changes.after, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* 错误信息 */}
            {log.error_message && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {t('audit.error_message')}
                </div>
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <p className="text-sm text-destructive">{log.error_message}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

