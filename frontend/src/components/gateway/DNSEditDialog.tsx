/**
 * DNS配置编辑对话框
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

import { updateDNSConfig } from '@/api/gateway'
import type { DNSConfig } from '@/types/gateway'

// IP地址验证正则
const IP_REGEX = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

// 表单验证Schema
const dnsFormSchema = z.object({
  primary: z
    .string()
    .regex(IP_REGEX, 'IP地址格式不正确')
    .optional()
    .or(z.literal('')),
  secondary: z
    .string()
    .regex(IP_REGEX, 'IP地址格式不正确')
    .optional()
    .or(z.literal('')),
  search_domains: z.string().optional(),
})

type DNSFormData = z.infer<typeof dnsFormSchema>

interface DNSEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dnsConfig?: DNSConfig
}

export function DNSEditDialog({ open, onOpenChange, dnsConfig }: DNSEditDialogProps) {
  const { t } = useTranslation(['gateway', 'common'])
  const queryClient = useQueryClient()

  const form = useForm<DNSFormData>({
    resolver: zodResolver(dnsFormSchema),
    defaultValues: {
      primary: '',
      secondary: '',
      search_domains: '',
    },
  })

  // 当对话框打开时，填充当前配置
  useEffect(() => {
    if (open && dnsConfig) {
      form.reset({
        primary: dnsConfig.primary || '',
        secondary: dnsConfig.secondary || '',
        search_domains: dnsConfig.search_domains?.join(', ') || '',
      })
    }
  }, [open, dnsConfig, form])

  // 更新DNS配置
  const updateMutation = useMutation({
    mutationFn: (data: DNSFormData) => {
      const domains = data.search_domains
        ? data.search_domains.split(',').map((d) => d.trim()).filter(Boolean)
        : []
      
      return updateDNSConfig({
        primary: data.primary || undefined,
        secondary: data.secondary || undefined,
        search_domains: domains.length > 0 ? domains : undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway', 'network'] })
      toast.success(t('gateway:network.dnsUpdated'))
      onOpenChange(false)
      form.reset()
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message
      toast.error(t('gateway:network.dnsUpdateFailed') + ': ' + message)
    },
  })

  const onSubmit = (data: DNSFormData) => {
    updateMutation.mutate(data)
  }

  const handleCancel = () => {
    onOpenChange(false)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('gateway:network.editDNS')}</DialogTitle>
          <DialogDescription>
            {t('gateway:network.editDNSDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 主DNS服务器 */}
            <FormField
              control={form.control}
              name="primary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('gateway:network.primaryDNS')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="8.8.8.8"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    {t('gateway:network.primaryDNSHint')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 备用DNS服务器 */}
            <FormField
              control={form.control}
              name="secondary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('gateway:network.secondaryDNS')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="8.8.4.4"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    {t('gateway:network.secondaryDNSHint')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 搜索域（可选） */}
            <FormField
              control={form.control}
              name="search_domains"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('gateway:network.searchDomains')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="example.com, local"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    {t('gateway:network.searchDomainsHint')}
                  </FormDescription>
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

