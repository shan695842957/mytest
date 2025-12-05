/**
 * 服务管理 Tab
 * 日志级别调整、服务控制等
 * 仅开发者和运维者可操作
 */
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Settings, FileText, AlertCircle, Info, AlertTriangle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

import { updateLogLevel, controlService } from '@/api/gateway'

const LOG_LEVELS = [
  { value: 'DEBUG', label: 'DEBUG', icon: Info, color: 'text-blue-600' },
  { value: 'INFO', label: 'INFO', icon: FileText, color: 'text-green-600' },
  { value: 'WARNING', label: 'WARNING', icon: AlertTriangle, color: 'text-yellow-600' },
  { value: 'ERROR', label: 'ERROR', icon: AlertCircle, color: 'text-red-600' },
]

interface ServiceManagementTabProps {
  readOnly?: boolean
}

export function ServiceManagementTab({ readOnly = false }: ServiceManagementTabProps) {
  const { t } = useTranslation(['gateway', 'common'])

  const [selectedLogLevel, setSelectedLogLevel] = useState<string>('INFO')

  // 更新日志级别
  const updateLogLevelMutation = useMutation({
    mutationFn: (level: string) => updateLogLevel(level),
    onSuccess: () => {
      toast.success(t('gateway:service.logLevelUpdated'))
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('common:error.updateFailed'))
    },
  })

  const handleUpdateLogLevel = () => {
    updateLogLevelMutation.mutate(selectedLogLevel)
  }

  // 服务控制
  const serviceControlMutation = useMutation({
    mutationFn: (action: 'restart' | 'clear_cache' | 'reload') => controlService(action),
    onSuccess: (_, action) => {
      const messages: Record<string, string> = {
        restart: t('gateway:service.restartSuccess'),
        clear_cache: t('gateway:service.clearCacheSuccess'),
        reload: t('gateway:service.reloadConfigSuccess'),
      }
      toast.success(messages[action] || t('common:message.success'))
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('common:error.updateFailed'))
    },
  })

  const handleServiceControl = (action: 'restart' | 'clear_cache' | 'reload') => {
    serviceControlMutation.mutate(action)
  }

  return (
    <div className="space-y-6">
      {/* 页面说明 */}
      <div>
        <h3 className="text-lg font-medium">{t('gateway:service.title')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('gateway:service.description')}
        </p>
      </div>

      {/* 日志级别设置 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>{t('gateway:service.logLevel')}</CardTitle>
          </div>
          <CardDescription>{t('gateway:service.logLevelDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 日志级别选择 */}
          <div className="space-y-2">
            <Label>{t('gateway:service.selectLogLevel')}</Label>
            <div className="flex items-center gap-4">
              <Select value={selectedLogLevel} onValueChange={setSelectedLogLevel}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOG_LEVELS.map((level) => {
                    const Icon = level.icon
                    return (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${level.color}`} />
                          <span className="font-medium">{level.label}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <Button
                onClick={handleUpdateLogLevel}
                disabled={readOnly || updateLogLevelMutation.isPending}
              >
                {updateLogLevelMutation.isPending
                  ? t('common:action.saving')
                  : t('common:action.save')}
              </Button>
            </div>
          </div>

          {/* 日志级别说明 */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="font-medium text-sm">
              {t('gateway:service.logLevelInfo')}
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>DEBUG</strong>: {t('gateway:service.debugDescription')}</li>
              <li>• <strong>INFO</strong>: {t('gateway:service.infoDescription')}</li>
              <li>• <strong>WARNING</strong>: {t('gateway:service.warningDescription')}</li>
              <li>• <strong>ERROR</strong>: {t('gateway:service.errorDescription')}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 服务控制 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>{t('gateway:service.control')}</CardTitle>
          </div>
          <CardDescription>{t('gateway:service.controlDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => handleServiceControl('restart')}
              disabled={readOnly || serviceControlMutation.isPending}
            >
              {t('gateway:service.restart')}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleServiceControl('clear_cache')}
              disabled={readOnly || serviceControlMutation.isPending}
            >
              {t('gateway:service.clearCache')}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleServiceControl('reload')}
              disabled={readOnly || serviceControlMutation.isPending}
            >
              {t('gateway:service.reloadConfig')}
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {t('gateway:service.controlHint')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
