/**
 * NTP配置编辑对话框
 * 可复用的独立组件
 */
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

import { updateNTPConfig } from '@/api/gateway'
import type { NTPConfig } from '@/types/gateway'

// 表单验证Schema
const ntpFormSchema = z.object({
  enabled: z.boolean(),
  server1: z.string().min(1, '请输入NTP服务器地址'),
  server2: z.string().optional(),
  server3: z.string().optional(),
})

type NTPFormData = z.infer<typeof ntpFormSchema>

interface NTPEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ntpConfig?: NTPConfig
}

export function NTPEditDialog({ open, onOpenChange, ntpConfig }: NTPEditDialogProps) {
  const { t } = useTranslation(['gateway', 'common'])
  const queryClient = useQueryClient()

  const form = useForm<NTPFormData>({
    resolver: zodResolver(ntpFormSchema),
    defaultValues: {
      enabled: true,
      server1: 'ntp.aliyun.com',
      server2: 'time.windows.com',
      server3: 'pool.ntp.org',
    },
  })

  // 当对话框打开时，填充当前配置
  useEffect(() => {
    if (open && ntpConfig) {
      form.reset({
        enabled: ntpConfig.enabled,
        server1: ntpConfig.servers[0] || 'ntp.aliyun.com',
        server2: ntpConfig.servers[1] || '',
        server3: ntpConfig.servers[2] || '',
      })
    }
  }, [open, ntpConfig, form])

  // 更新NTP配置
  const updateMutation = useMutation({
    mutationFn: (data: NTPFormData) => {
      const servers = [data.server1, data.server2, data.server3].filter(Boolean) as string[]
      
      return updateNTPConfig({
        enabled: data.enabled,
        servers: servers.length > 0 ? servers : undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway', 'time'] })
      toast.success(t('gateway:time.ntpUpdated'))
      onOpenChange(false)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message
      toast.error(t('gateway:time.ntpUpdateFailed') + ': ' + message)
    },
  })

  const onSubmit = (data: NTPFormData) => {
    updateMutation.mutate(data)
  }

  const handleCancel = () => {
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{t('gateway:time.editNTP')}</DialogTitle>
          <DialogDescription>
            {t('gateway:time.editNTPDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 启用NTP */}
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t('gateway:time.enableNTP')}</FormLabel>
                    <FormDescription>
                      {t('gateway:time.enableNTPHint')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* 主NTP服务器 */}
            <FormField
              control={form.control}
              name="server1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('gateway:time.primaryServer')}
                    <Badge variant="outline" className="ml-2 text-xs">
                      {t('gateway:time.required')}
                    </Badge>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="ntp.aliyun.com"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    {t('gateway:time.primaryServerHint')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 备用NTP服务器1 */}
            <FormField
              control={form.control}
              name="server2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('gateway:time.backupServer')} 1
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {t('gateway:time.optional')}
                    </Badge>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="time.windows.com"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 备用NTP服务器2 */}
            <FormField
              control={form.control}
              name="server3"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('gateway:time.backupServer')} 2
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {t('gateway:time.optional')}
                    </Badge>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="pool.ntp.org"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
              >
                {t('common:action.cancel')}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t('common:action.saving') : t('common:action.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

