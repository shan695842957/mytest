/**
 * 协议类型表单对话框 - 创建/编辑协议类型
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import type { ProtocolType } from '@/types'
import { useCreateProtocolType, useUpdateProtocolType } from '@/hooks/useProtocolTypeQueries'
import type { CreateProtocolTypeRequest, UpdateProtocolTypeRequest } from '@/types'

const protocolTypeFormSchema = z.object({
  name: z.string().min(1, '内部名称不能为空').max(50, '内部名称最多50个字符'),
  display_name: z.string().min(1, '显示名称不能为空').max(200, '显示名称最多200个字符'),
  enabled: z.boolean().default(true),
  description: z.string().optional().or(z.literal('')),
})

type ProtocolTypeFormData = z.infer<typeof protocolTypeFormSchema>

interface ProtocolTypeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  protocolType?: ProtocolType | null
}

export function ProtocolTypeFormDialog({ open, onOpenChange, protocolType }: ProtocolTypeFormDialogProps) {
  const { t } = useTranslation('config')
  const isEdit = !!protocolType
  
  const createMutation = useCreateProtocolType()
  const updateMutation = useUpdateProtocolType()
  
  const form = useForm<ProtocolTypeFormData>({
    resolver: zodResolver(protocolTypeFormSchema),
    defaultValues: {
      name: '',
      display_name: '',
      enabled: true,
      description: '',
    },
  })
  
  // 编辑时填充数据
  useEffect(() => {
    if (protocolType) {
      form.reset({
        name: protocolType.name,
        display_name: protocolType.display_name,
        enabled: protocolType.enabled,
        description: protocolType.description || '',
      })
    } else {
      form.reset({
        name: '',
        display_name: '',
        enabled: true,
        description: '',
      })
    }
  }, [protocolType, form])
  
  const onSubmit = async (data: ProtocolTypeFormData) => {
    try {
      if (isEdit && protocolType) {
        const updateData: UpdateProtocolTypeRequest = {
          display_name: data.display_name,
          enabled: data.enabled,
          description: data.description || undefined,
        }
        await updateMutation.mutateAsync({ id: protocolType.id, data: updateData })
      } else {
        const createData: CreateProtocolTypeRequest = {
          name: data.name,
          display_name: data.display_name,
          enabled: data.enabled,
          description: data.description || undefined,
          params: [], // 参数在单独的对话框中管理
        }
        await createMutation.mutateAsync(createData)
      }
      onOpenChange(false)
    } catch (error) {
      // 错误已在 mutation 中处理
    }
  }
  
  const isLoading = createMutation.isPending || updateMutation.isPending
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('protocolType.form.update') : t('protocolType.form.create')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? '更新协议类型信息' : '创建新的协议类型'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('protocolType.form.name')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="例如：modbus_tcp"
                      disabled={isEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('protocolType.form.displayName')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例如：Modbus TCP" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('protocolType.form.enabled')}</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      {t('protocolType.form.enabledDescription')}
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('protocolType.form.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('protocolType.form.descriptionPlaceholder')}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel', { ns: 'common' })}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('common.saving', { ns: 'common' }) : (isEdit ? t('common.update', { ns: 'common' }) : t('common.create', { ns: 'common' }))}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

