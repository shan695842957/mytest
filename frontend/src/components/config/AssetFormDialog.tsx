/**
 * 资产表单对话框 - 创建/编辑资产
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
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useDeviceTypeList } from '@/hooks/useDeviceTypeQueries'
import { useCommInstanceList } from '@/hooks/useCommInstanceQueries'
import type { Asset, CommInstance } from '@/types'
import { useCreateAsset, useUpdateAsset } from '@/hooks/useAssetQueries'
import type { CreateAssetRequest, UpdateAssetRequest } from '@/types'
import { Checkbox } from '@/components/ui/checkbox'

const assetFormSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100, '名称最多100个字符'),
  display_name: z.string().min(1, '显示名称不能为空').max(200, '显示名称最多200个字符'),
  device_type_id: z.number().min(1, '请选择设备类型'),
  location: z.string().max(200).optional().or(z.literal('')),
  enabled: z.boolean().default(true),
  comm_instance_ids: z.array(z.number()).default([]),
})

type AssetFormData = z.infer<typeof assetFormSchema>

interface AssetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset?: Asset | null
}

export function AssetFormDialog({ open, onOpenChange, asset }: AssetFormDialogProps) {
  const { t } = useTranslation('config')
  const isEdit = !!asset
  
  const { data: deviceTypes } = useDeviceTypeList()
  const { data: commInstances } = useCommInstanceList()
  const createMutation = useCreateAsset()
  const updateMutation = useUpdateAsset()
  
  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: '',
      display_name: '',
      device_type_id: 0,
      location: '',
      enabled: true,
      comm_instance_ids: [],
    },
  })
  
  // 编辑时填充数据
  useEffect(() => {
    if (asset) {
      form.reset({
        name: asset.name,
        display_name: asset.display_name,
        device_type_id: asset.device_type_id,
        location: asset.location || '',
        enabled: asset.enabled,
        comm_instance_ids: asset.comm_instance_ids || [],
      })
    } else {
      form.reset({
        name: '',
        display_name: '',
        device_type_id: 0,
        location: '',
        enabled: true,
        comm_instance_ids: [],
      })
    }
  }, [asset, form])
  
  const onSubmit = async (data: AssetFormData) => {
    try {
      if (isEdit && asset) {
        const updateData: UpdateAssetRequest = {
          display_name: data.display_name,
          device_type_id: data.device_type_id,
          location: data.location || undefined,
          enabled: data.enabled,
          comm_instance_ids: data.comm_instance_ids,
        }
        await updateMutation.mutateAsync({ id: asset.id, data: updateData })
      } else {
        const createData: CreateAssetRequest = {
          name: data.name,
          display_name: data.display_name,
          device_type_id: data.device_type_id,
          location: data.location || undefined,
          enabled: data.enabled,
          comm_instance_ids: data.comm_instance_ids,
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
            {isEdit ? t('asset.form.update') : t('asset.form.create')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? '更新资产信息' : '创建新的资产'}
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
                    <FormLabel>{t('asset.form.name')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="例如：COMP_001"
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
                    <FormLabel>{t('asset.form.displayName')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例如：1号压缩机" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="device_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('asset.form.deviceTypeId')}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value, 10))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择设备类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {deviceTypes?.data?.map((dt) => (
                        <SelectItem key={dt.id} value={dt.id.toString()}>
                          {dt.display_name}
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
              name="comm_instance_ids"
              render={({ field }) => {
                const instances = (commInstances?.data as CommInstance[] | null | undefined) || []
                
                const toggleInstance = (instanceId: number, checked: boolean) => {
                  const next = new Set(field.value || [])
                  if (checked) {
                    next.add(instanceId)
                  } else {
                    next.delete(instanceId)
                  }
                  field.onChange(Array.from(next))
                }
                
                return (
                  <FormItem>
                    <FormLabel>{t('asset.wizard.bindCommInstances')}</FormLabel>
                    <div className="rounded-lg border p-3 space-y-3 max-h-64 overflow-y-auto">
                      {instances.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('asset.list.empty')}</p>
                      ) : (
                        instances.map((instance) => {
                          const checked = field.value?.includes(instance.id) ?? false
                          return (
                            <div
                              key={instance.id}
                              className="flex items-center justify-between rounded-md border px-3 py-2"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{instance.display_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {instance.protocol_type} · {t('asset.form.deviceTypeId')} #{instance.point_table_id}
                                </span>
                              </div>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) => toggleInstance(instance.id, !!value)}
                              />
                            </div>
                          )
                        })
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('asset.form.location')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例如：车间A区" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>{t('asset.form.enabled')}</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
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

