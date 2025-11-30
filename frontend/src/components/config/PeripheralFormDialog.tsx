/**
 * 外设设备表单对话框 - 创建/编辑外设
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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Peripheral } from '@/types'
import { useCreatePeripheral, useUpdatePeripheral } from '@/hooks/usePeripheralQueries'
import type { CreatePeripheralRequest, UpdatePeripheralRequest } from '@/types'

const peripheralFormSchema = z.object({
  name: z.string().min(1, '外设名称不能为空').max(100, '外设名称最多100个字符'),
  display_name: z.string().min(1, '显示名称不能为空').max(200, '显示名称最多200个字符'),
  peripheral_type: z.enum(['serial', 'can', 'spi', 'i2c', 'gpio', 'pwm', 'adc', 'dac', 'other']),
  device_path: z.string().min(1, '设备路径不能为空').max(255, '设备路径最多255个字符'),
  enabled: z.boolean().default(true),
  description: z.string().optional().or(z.literal('')),
})

type PeripheralFormData = z.infer<typeof peripheralFormSchema>

interface PeripheralFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  peripheral?: Peripheral | null
}

export function PeripheralFormDialog({ open, onOpenChange, peripheral }: PeripheralFormDialogProps) {
  const { t } = useTranslation('config')
  const isEdit = !!peripheral
  
  const createMutation = useCreatePeripheral()
  const updateMutation = useUpdatePeripheral()
  
  const form = useForm<PeripheralFormData>({
    resolver: zodResolver(peripheralFormSchema),
    defaultValues: {
      name: '',
      display_name: '',
      peripheral_type: 'serial',
      device_path: '',
      enabled: true,
      description: '',
    },
  })
  
  // 编辑时填充数据
  useEffect(() => {
    if (peripheral) {
      form.reset({
        name: peripheral.name,
        display_name: peripheral.display_name,
        peripheral_type: peripheral.peripheral_type as any,
        device_path: peripheral.device_path,
        enabled: peripheral.enabled,
        description: peripheral.description || '',
      })
    } else {
      form.reset({
        name: '',
        display_name: '',
        peripheral_type: 'serial',
        device_path: '',
        enabled: true,
        description: '',
      })
    }
  }, [peripheral, form])
  
  const onSubmit = async (data: PeripheralFormData) => {
    try {
      if (isEdit && peripheral) {
        const updateData: UpdatePeripheralRequest = {
          display_name: data.display_name,
          peripheral_type: data.peripheral_type,
          device_path: data.device_path,
          enabled: data.enabled,
          description: data.description || undefined,
        }
        await updateMutation.mutateAsync({ id: peripheral.id, data: updateData })
      } else {
        const createData: CreatePeripheralRequest = {
          name: data.name,
          display_name: data.display_name,
          peripheral_type: data.peripheral_type,
          device_path: data.device_path,
          enabled: data.enabled,
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
            {isEdit ? t('peripheral.form.update') : t('peripheral.form.create')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? '更新外设设备信息' : '创建新的外设设备'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('peripheral.form.name')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="例如：serial_uart0"
                      disabled={isEdit}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('peripheral.form.nameDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('peripheral.form.displayName')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例如：串口 UART0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="peripheral_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('peripheral.form.type')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="serial">{t('peripheral.form.typeSerial')}</SelectItem>
                        <SelectItem value="can">{t('peripheral.form.typeCan')}</SelectItem>
                        <SelectItem value="spi">{t('peripheral.form.typeSpi')}</SelectItem>
                        <SelectItem value="i2c">{t('peripheral.form.typeI2c')}</SelectItem>
                        <SelectItem value="gpio">{t('peripheral.form.typeGpio')}</SelectItem>
                        <SelectItem value="pwm">{t('peripheral.form.typePwm')}</SelectItem>
                        <SelectItem value="adc">{t('peripheral.form.typeAdc')}</SelectItem>
                        <SelectItem value="dac">{t('peripheral.form.typeDac')}</SelectItem>
                        <SelectItem value="other">{t('peripheral.form.typeOther')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-8">
                    <div className="space-y-0.5">
                      <FormLabel>{t('peripheral.form.enabled')}</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="device_path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('peripheral.form.devicePath')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例如：/dev/ttyS0, can0" />
                  </FormControl>
                  <FormDescription>
                    {t('peripheral.form.devicePathDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('peripheral.form.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('peripheral.form.descriptionPlaceholder')}
                      rows={2}
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

