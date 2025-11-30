/**
 * 设备类型表单对话框 - 创建/编辑设备类型
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
import { useCreateDeviceType, useUpdateDeviceType } from '@/hooks/useDeviceTypeQueries'
import type { CreateDeviceTypeRequest, UpdateDeviceTypeRequest } from '@/types'

const deviceTypeFormSchema = z.object({
  name: z.string().min(1, '内部名称不能为空').max(100, '内部名称最多100个字符'),
  display_name: z.string().min(1, '显示名称不能为空').max(200, '显示名称最多200个字符'),
  model: z.string().max(100, '型号最多100个字符').optional().or(z.literal('')),
  manufacturer: z.string().max(100, '厂家最多100个字符').optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
})

type DeviceTypeFormData = z.infer<typeof deviceTypeFormSchema>

interface DeviceTypeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deviceType?: DeviceType | null
}

export function DeviceTypeFormDialog({ open, onOpenChange, deviceType }: DeviceTypeFormDialogProps) {
  const { t } = useTranslation('config')
  const isEdit = !!deviceType
  
  const createMutation = useCreateDeviceType()
  const updateMutation = useUpdateDeviceType()
  
  const form = useForm<DeviceTypeFormData>({
    resolver: zodResolver(deviceTypeFormSchema),
    defaultValues: {
      name: '',
      display_name: '',
      model: '',
      manufacturer: '',
      description: '',
    },
  })
  
  // 编辑时填充数据
  useEffect(() => {
    if (deviceType) {
      form.reset({
        name: deviceType.name,
        display_name: deviceType.display_name,
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
  }, [deviceType, form])
  
  const onSubmit = async (data: DeviceTypeFormData) => {
    try {
      if (isEdit && deviceType) {
        const updateData: UpdateDeviceTypeRequest = {
          display_name: data.display_name,
          model: data.model || undefined,
          manufacturer: data.manufacturer || undefined,
          description: data.description || undefined,
        }
        await updateMutation.mutateAsync({ id: deviceType.id, data: updateData })
      } else {
        const createData: CreateDeviceTypeRequest = {
          name: data.name,
          display_name: data.display_name,
          model: data.model || undefined,
          manufacturer: data.manufacturer || undefined,
          description: data.description || undefined,
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
            {isEdit ? t('deviceType.form.update') : t('deviceType.form.create')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? '更新设备类型信息' : '创建新的设备类型模板'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('deviceType.form.name')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('deviceType.form.namePlaceholder')}
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
                  <FormLabel>{t('deviceType.form.displayName')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t('deviceType.form.displayNamePlaceholder')}
                    />
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
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t('common:common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('common:common.loading') : t('common:common.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

