/**
 * Rathole 服务对话框组件（创建/编辑）
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import type { RatholeService, RatholeServiceCreate, RatholeServiceUpdate } from '@/types'

const serviceSchema = z.object({
  service_name: z
    .string()
    .min(1, '请输入服务名称')
    .max(100, '服务名称最长 100 个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '只能包含字母、数字、下划线'),
  token: z.string().min(1, '请输入 Token'),
  target_host: z.string().min(1, '请输入目标主机'),
  target_port: z.string().min(1, '请输入端口').regex(/^\d+$/, '端口必须是数字'),
  description: z.string().optional(),
})

type ServiceFormValues = z.infer<typeof serviceSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingService: RatholeService | null
  onCreate: (data: RatholeServiceCreate) => void
  onUpdate: (old_name: string, data: RatholeServiceUpdate) => void
  isCreating: boolean
  isUpdating: boolean
}

export function RatholeServiceDialog({
  open,
  onOpenChange,
  editingService,
  onCreate,
  onUpdate,
  isCreating,
  isUpdating,
}: Props) {
  const { t } = useTranslation(['tools', 'common'])

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      service_name: '',
      token: '',
      target_host: '127.0.0.1',
      target_port: '',
      description: '',
    },
  })

  // 当打开编辑模式时，填充表单
  useEffect(() => {
    if (editingService) {
      // 解析 local_addr 为 host:port
      const [host, port] = editingService.local_addr.split(':')
      form.reset({
        service_name: editingService.service_name,
        token: editingService.token,
        target_host: host || '127.0.0.1',
        target_port: port || '',
        description: editingService.description || '',
      })
    } else {
      form.reset({
        service_name: '',
        token: '',
        target_host: '127.0.0.1',
        target_port: '',
        description: '',
      })
    }
  }, [editingService, form])

  const handleSubmit = (values: ServiceFormValues) => {
    // 组合 target_host:target_port
    const local_addr = `${values.target_host}:${values.target_port}`
    const data = {
      service_name: values.service_name,
      token: values.token,
      local_addr,
      description: values.description,
    }
    
    if (editingService) {
      onUpdate(editingService.service_name, data)
    } else {
      onCreate(data)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] md:w-full max-h-[90vh] md:max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingService ? t('rathole.editService') : t('rathole.createService')}
          </DialogTitle>
          <DialogDescription>
            {editingService
              ? t('rathole.editServiceDescription')
              : t('rathole.createServiceDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="service_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('rathole.serviceName')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="cc33314cd623"
                      className="font-mono"
                      disabled={!!editingService}
                    />
                  </FormControl>
                  <FormDescription>{t('rathole.serviceNameDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('rathole.token')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="cc33314cd623" className="font-mono" />
                  </FormControl>
                  <FormDescription>{t('rathole.tokenDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 目标地址 */}
            <FormItem>
              <FormLabel>{t('rathole.targetAddr')}</FormLabel>
              {/* 移动端：纵向布局，桌面端：横向布局 */}
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <FormField
                  control={form.control}
                  name="target_host"
                  render={({ field }) => (
                    <FormControl>
                      <Input {...field} placeholder="127.0.0.1" className="w-full md:w-48 font-mono" />
                    </FormControl>
                  )}
                />
                <span className="text-muted-foreground hidden md:inline">:</span>
                <FormField
                  control={form.control}
                  name="target_port"
                  render={({ field }) => (
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="22"
                        className="w-full md:w-24 font-mono"
                      />
                    </FormControl>
                  )}
                />
              </div>
              <FormDescription>{t('rathole.targetAddrDescription')}</FormDescription>
              <FormMessage />
            </FormItem>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('rathole.tableRatholeDescription')} ({t('common:field.optional')})</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="SSH 服务" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                {t('common:action.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating || isUpdating}
                className="w-full sm:w-auto"
              >
                {editingService ? t('common:action.save') : t('common:action.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

