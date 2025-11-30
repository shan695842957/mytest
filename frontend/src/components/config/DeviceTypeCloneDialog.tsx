/**
 * 设备类型复制对话框
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
import { Button } from '@/components/ui/button'
import type { DeviceType } from '@/types'
import { useCloneDeviceType } from '@/hooks/useDeviceTypeQueries'
import type { CloneDeviceTypeRequest } from '@/types'

const cloneSchema = z.object({
  name: z.string().min(1, '内部名称不能为空').max(100, '内部名称最多100个字符'),
  display_name: z.string().min(1, '显示名称不能为空').max(200, '显示名称最多200个字符'),
  model: z.string().max(100, '型号最多100个字符').optional().or(z.literal('')),
  manufacturer: z.string().max(100, '厂家最多100个字符').optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
})

type CloneFormData = z.infer<typeof cloneSchema>

interface DeviceTypeCloneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deviceType?: DeviceType | null
}

export function DeviceTypeCloneDialog({
  open,
  onOpenChange,
  deviceType,
}: DeviceTypeCloneDialogProps) {
  const { t } = useTranslation('config')
  const cloneMutation = useCloneDeviceType()
  
  const form = useForm<CloneFormData>({
    resolver: zodResolver(cloneSchema),
    defaultValues: {
      name: '',
      display_name: '',
      model: '',
      manufacturer: '',
      description: '',
    },
  })
  
  useEffect(() => {
    if (deviceType) {
      form.reset({
        name: `${deviceType.name}_copy`,
        display_name: `${deviceType.display_name} (${t('deviceType.clone.copySuffix')})`,
        model: deviceType.model || '',
        manufacturer: deviceType.manufacturer || '',
        description: deviceType.description || '',
      })
    } else {
      form.reset({
        name: '',
        display_name: '',
        model: '',
        manufacturer: '',
        description: '',
      })
    }
  }, [deviceType, form, t])
  
  const onSubmit = async (data: CloneFormData) => {
    if (!deviceType) return
    const payload: CloneDeviceTypeRequest = {
      name: data.name,
      display_name: data.display_name,
      model: data.model || undefined,
      manufacturer: data.manufacturer || undefined,
      description: data.description || undefined,
    }
    try {
      await cloneMutation.mutateAsync({ id: deviceType.id, data: payload })
      onOpenChange(false)
    } catch (error) {
      // 错误在 mutation 中处理
    }
  }
  
  const isSubmitting = cloneMutation.isPending
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('deviceType.clone.title')}</DialogTitle>
          <DialogDescription>{t('deviceType.clone.description')}</DialogDescription>
        </DialogHeader>
        
        {deviceType ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('deviceType.form.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('deviceType.form.namePlaceholder')} />
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
                    <FormLabel>{t('deviceType.form.displayName')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('deviceType.form.displayNamePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('deviceType.form.model')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例如：B-2024" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('deviceType.form.manufacturer')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例如：XX公司" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('deviceType.form.description')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="设备类型描述" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t('common:common.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {t('deviceType.clone.submit')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t('deviceType.clone.noSource')}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

