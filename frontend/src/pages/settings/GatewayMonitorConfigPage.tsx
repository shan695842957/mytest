/**
 * 网关设置-监控配置页面
 * 配置监控数据采集参数
 */
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings2, Info, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { getSystemConfig, updateSystemConfig } from '@/api/gateway'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/permission'

// 表单验证Schema
const configSchema = z.object({
  collection_interval: z.number().min(5).max(300),
  retention_days: z.number().min(1).max(30),
  collection_enabled: z.boolean(),
  collect_network: z.boolean(),
  collect_process: z.boolean(),
  auto_cleanup: z.boolean(),
})

type ConfigFormValues = z.infer<typeof configSchema>

export default function GatewayMonitorConfigPage() {
  const { t } = useTranslation(['gateway', 'common'])
  const { hasAnyRole } = useAuth()
  const queryClient = useQueryClient()

  const isDeveloper = hasAnyRole([UserRole.DEVELOPER])

  const { data, isLoading } = useQuery({
    queryKey: ['system-config', 'monitor'],
    queryFn: () => getSystemConfig('monitor'),
  })

  const configItems = (data?.data || []).filter(item => item.module === 'monitor')

  // 转换配置为表单格式
  const configValues: ConfigFormValues = {
    collection_interval: Number(configItems.find((c) => c.key === 'collection_interval')?.value || 10),
    retention_days: Number(configItems.find((c) => c.key === 'retention_days')?.value || 7),
    collection_enabled: configItems.find((c) => c.key === 'collection_enabled')?.value === 'true',
    collect_network: configItems.find((c) => c.key === 'collect_network')?.value === 'true',
    collect_process: configItems.find((c) => c.key === 'collect_process')?.value === 'true',
    auto_cleanup: configItems.find((c) => c.key === 'auto_cleanup')?.value === 'true',
  }

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    values: configValues,
  })

  const updateMutation = useMutation({
    mutationFn: (values: ConfigFormValues) => updateSystemConfig({ monitor: values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
      toast.success(t('gateway:config.updateSuccess'))
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message
      toast.error(t('common:error.operationFailed') + ': ' + message)
    },
  })

  const onSubmit = (values: ConfigFormValues) => {
    updateMutation.mutate(values)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('gateway:config.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('gateway:config.description')}</p>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('gateway:config.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('gateway:config.description')}</p>
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
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            <CardTitle>{t('gateway:config.monitorSettings')}</CardTitle>
          </div>
          <CardDescription>{t('gateway:config.monitorDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 基础设置 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('gateway:config.basicSettings')}</h3>
                
                <FormField
                  control={form.control}
                  name="collection_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {t('gateway:config.collectionEnabled')}
                        </FormLabel>
                        <FormDescription>
                          {t('gateway:config.collectionEnabledDesc')}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!isDeveloper}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="collection_interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('gateway:config.collectionInterval')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={5}
                          max={300}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={!isDeveloper}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('gateway:config.collectionIntervalDesc')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="retention_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('gateway:config.retentionDays')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={!isDeveloper}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('gateway:config.retentionDaysDesc')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 高级设置 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('gateway:config.advancedSettings')}</h3>

                <FormField
                  control={form.control}
                  name="collect_network"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {t('gateway:config.collectNetwork')}
                        </FormLabel>
                        <FormDescription>
                          {t('gateway:config.collectNetworkDesc')}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!isDeveloper}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="collect_process"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {t('gateway:config.collectProcess')}
                        </FormLabel>
                        <FormDescription>
                          {t('gateway:config.collectProcessDesc')}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!isDeveloper}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="auto_cleanup"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {t('gateway:config.autoCleanup')}
                        </FormLabel>
                        <FormDescription>
                          {t('gateway:config.autoCleanupDesc')}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!isDeveloper}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {isDeveloper && (
                <div className="flex justify-end">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {updateMutation.isPending ? t('common:action.saving') : t('common:action.save')}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* 说明信息 */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t('gateway:config.hint')}
        </AlertDescription>
      </Alert>
    </div>
  )
}
