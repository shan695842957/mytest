/**
 * 通信实例表单对话框 - 创建/编辑通信实例
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useWatch } from 'react-hook-form'
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
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useProtocolTypes } from '@/hooks/useDictQueries'
import { usePointTableTemplateList } from '@/hooks/usePointTableQueries'
import type { CommInstance } from '@/types'
import { useCreateCommInstance, useUpdateCommInstance } from '@/hooks/useCommInstanceQueries'
import type { CreateCommInstanceRequest, UpdateCommInstanceRequest } from '@/types'
import { ProtocolConfigFormFields } from './ProtocolConfigFormFields'

const instanceFormSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100, '名称最多100个字符'),
  display_name: z.string().min(1, '显示名称不能为空').max(200, '显示名称最多200个字符'),
  enabled: z.boolean().default(true),
  point_table_id: z.number().min(1, '请选择点表模板'),
  protocol_type: z.string().min(1, '协议类型不能为空'),
  protocol_config: z.record(z.any()).optional(),
  polling_interval_ms: z.number().min(100, '轮询周期至少100ms').default(1000),
  timeout_ms: z.number().min(100, '超时时间至少100ms').default(5000),
  retries: z.number().min(0).max(10).default(3),
})

type InstanceFormData = z.infer<typeof instanceFormSchema>

interface CommInstanceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instance?: CommInstance | null
}

export function CommInstanceFormDialog({
  open,
  onOpenChange,
  instance,
}: CommInstanceFormDialogProps) {
  const { t } = useTranslation('config')
  const isEdit = !!instance
  
  const { data: protocolTypes } = useProtocolTypes()
  const { data: pointTables } = usePointTableTemplateList()
  const createMutation = useCreateCommInstance()
  const updateMutation = useUpdateCommInstance()
  
  const form = useForm<InstanceFormData>({
    resolver: zodResolver(instanceFormSchema),
    defaultValues: {
      name: '',
      display_name: '',
      enabled: true,
      point_table_id: undefined,
      protocol_type: '',
      protocol_config: {},
      polling_interval_ms: 1000,
      timeout_ms: 5000,
      retries: 3,
    },
  })
  
  // 编辑时填充数据
  useEffect(() => {
    if (instance) {
      form.reset({
        name: instance.name,
        display_name: instance.display_name,
        enabled: instance.enabled,
        point_table_id: instance.point_table_id,
        protocol_type: instance.protocol_type,
        protocol_config: instance.protocol_config || {},
        polling_interval_ms: instance.polling_interval_ms,
        timeout_ms: instance.timeout_ms,
        retries: instance.retries,
      })
    } else {
      form.reset({
        name: '',
        display_name: '',
        enabled: true,
        point_table_id: undefined,
        protocol_type: '',
        protocol_config: {},
        polling_interval_ms: 1000,
        timeout_ms: 5000,
        retries: 3,
      })
    }
  }, [instance, form])
  
  const onSubmit = async (data: InstanceFormData) => {
    try {
      if (isEdit && instance) {
        const updateData: UpdateCommInstanceRequest = {
          display_name: data.display_name,
          enabled: data.enabled,
          point_table_id: data.point_table_id,
          protocol_type: data.protocol_type,
          protocol_config: data.protocol_config,
          polling_interval_ms: data.polling_interval_ms,
          timeout_ms: data.timeout_ms,
          retries: data.retries,
        }
        await updateMutation.mutateAsync({ id: instance.id, data: updateData })
      } else {
        const createData: CreateCommInstanceRequest = {
          name: data.name,
          display_name: data.display_name,
          enabled: data.enabled,
          point_table_id: data.point_table_id,
          protocol_type: data.protocol_type,
          protocol_config: data.protocol_config || {},
          polling_interval_ms: data.polling_interval_ms,
          timeout_ms: data.timeout_ms,
          retries: data.retries,
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('commInstance.form.update') : t('commInstance.form.create')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? '更新通信实例信息' : '创建新的通信实例'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('commInstance.form.name')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="例如：COMP_MODBUS_001"
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
                    <FormLabel>{t('commInstance.form.displayName')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例如：压缩机Modbus实例1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>{t('commInstance.form.enabled')}</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="point_table_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('commInstance.form.pointTableId')}</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : undefined)}
                      value={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择点表模板" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pointTables?.data?.map((pt) => (
                          <SelectItem key={pt.id} value={pt.id.toString()}>
                            {pt.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="protocol_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('commInstance.form.protocolType')}</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        // 清空协议配置，让 ProtocolConfigFormFields 组件设置默认值
                        form.setValue('protocol_config', {})
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择协议类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {protocolTypes?.data?.map((pt) => (
                          <SelectItem key={pt.value} value={pt.value}>
                            {pt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* 动态协议配置表单 */}
            <FormField
              control={form.control}
              name="protocol_config"
              render={() => (
                <FormItem>
                  <FormLabel>{t('commInstance.form.protocolConfig')}</FormLabel>
                  <FormControl>
                    <div className="rounded-md border p-4">
                      <ProtocolConfigFormFields protocolTypeName={form.watch('protocol_type') || null} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="polling_interval_ms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('commInstance.form.pollingIntervalMs')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="timeout_ms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('commInstance.form.timeoutMs')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="retries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('commInstance.form.retries')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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

