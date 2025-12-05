/**
 * 网络接口编辑对话框
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
import { Badge } from '@/components/ui/badge'

import { updateNetworkInterface } from '@/api/gateway'
import type { NetworkInterface } from '@/types/gateway'

// IP地址验证正则
const IP_REGEX = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/

// 表单验证Schema
const interfaceFormSchema = z.object({
  ip_address: z
    .string()
    .regex(IP_REGEX, 'IP地址格式不正确')
    .optional()
    .or(z.literal('')),
  netmask: z
    .string()
    .regex(IP_REGEX, '子网掩码格式不正确')
    .optional()
    .or(z.literal('')),
  gateway: z
    .string()
    .regex(IP_REGEX, '网关地址格式不正确')
    .optional()
    .or(z.literal('')),
})

type InterfaceFormData = z.infer<typeof interfaceFormSchema>

interface NetworkInterfaceEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  networkInterface?: NetworkInterface
}

export function NetworkInterfaceEditDialog({
  open,
  onOpenChange,
  networkInterface,
}: NetworkInterfaceEditDialogProps) {
  const { t } = useTranslation(['gateway', 'common'])
  const queryClient = useQueryClient()

  const form = useForm<InterfaceFormData>({
    resolver: zodResolver(interfaceFormSchema),
    defaultValues: {
      ip_address: '',
      netmask: '',
      gateway: '',
    },
  })

  // 当对话框打开时，填充当前配置
  useEffect(() => {
    if (open && networkInterface) {
      form.reset({
        ip_address: networkInterface.ip_address || '',
        netmask: networkInterface.netmask || '',
        gateway: networkInterface.gateway || '',
      })
    }
  }, [open, networkInterface, form])

  // 更新网络接口配置
  const updateMutation = useMutation({
    mutationFn: (data: InterfaceFormData) => {
      if (!networkInterface) throw new Error('No interface selected')
      
      return updateNetworkInterface(networkInterface.name, {
        ip_address: data.ip_address || undefined,
        netmask: data.netmask || undefined,
        gateway: data.gateway || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway', 'network'] })
      toast.success(t('gateway:network.interfaceUpdated'))
      onOpenChange(false)
      form.reset()
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message
      toast.error(t('gateway:network.interfaceUpdateFailed') + ': ' + message)
    },
  })

  const onSubmit = (data: InterfaceFormData) => {
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
          <DialogTitle>
            {t('gateway:network.editInterface')} - {networkInterface?.name}
          </DialogTitle>
          <DialogDescription>
            {t('gateway:network.editInterfaceDescription')}
          </DialogDescription>
        </DialogHeader>

        {networkInterface && (
          <>
            {/* 当前信息 */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="text-sm font-medium">{t('gateway:network.currentConfig')}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">{t('gateway:network.macAddress')}:</div>
                <div className="font-mono">{networkInterface.mac_address || 'N/A'}</div>
                
                <div className="text-muted-foreground">{t('gateway:network.status')}:</div>
                <div>
                  <Badge variant={networkInterface.is_up ? 'default' : 'secondary'}>
                    {networkInterface.is_up ? t('gateway:network.up') : t('gateway:network.down')}
                  </Badge>
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* IP地址 */}
                <FormField
                  control={form.control}
                  name="ip_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('gateway:network.ipAddress')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="192.168.1.100"
                          className="font-mono"
                        />
                      </FormControl>
                      <FormDescription>
                        {t('gateway:network.ipAddressHint')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 子网掩码 */}
                <FormField
                  control={form.control}
                  name="netmask"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('gateway:network.netmask')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="255.255.255.0"
                          className="font-mono"
                        />
                      </FormControl>
                      <FormDescription>
                        {t('gateway:network.netmaskHint')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 网关地址 */}
                <FormField
                  control={form.control}
                  name="gateway"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('gateway:network.gateway')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="192.168.1.1"
                          className="font-mono"
                        />
                      </FormControl>
                      <FormDescription>
                        {t('gateway:network.gatewayHint')}
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
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

