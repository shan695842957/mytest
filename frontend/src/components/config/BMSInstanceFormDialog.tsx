/**
 * BMS实例表单对话框
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { toast } from 'sonner'
import {
  createBMSInstance,
  updateBMSInstance,
  getBMSArchitectures,
  type BMSInstance,
  type CreateBMSInstanceRequest,
  type UpdateBMSInstanceRequest,
} from '@/api/bms'
import { getAssetList } from '@/api/assets'

interface BMSInstanceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instance?: BMSInstance | null
  onSuccess?: () => void
}

const formSchema = z.object({
  asset_id: z.number().min(1, '请选择资产'),
  architecture_id: z.number().min(1, '请选择架构'),
  instance_name: z.string().min(1, '请输入实例名称'),
  display_name_zh: z.string().min(1, '请输入中文显示名'),
  display_name_en: z.string().min(1, '请输入英文显示名'),
  enabled: z.boolean().default(true),
})

export function BMSInstanceFormDialog({
  open,
  onOpenChange,
  instance,
  onSuccess,
}: BMSInstanceFormDialogProps) {
  const { t } = useTranslation('config')
  const queryClient = useQueryClient()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      asset_id: undefined,
      architecture_id: undefined,
      instance_name: '',
      display_name_zh: '',
      display_name_en: '',
      enabled: true,
    },
  })
  
  // 获取架构列表和资产列表
  const { data: architecturesData, isLoading: architecturesLoading } = useQuery({
    queryKey: ['bms-architectures'],
    queryFn: () => getBMSArchitectures(),
  })
  
  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets', { skip: 0, limit: 100 }],
    queryFn: () => getAssetList({ skip: 0, limit: 100 }),
  })
  
  // 创建/更新Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateBMSInstanceRequest) => createBMSInstance(data),
    onSuccess: () => {
      toast.success(t('bms.instance.created_success'))
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(t('bms.instance.create_failed'), {
        description: error?.response?.data?.detail || error.message,
      })
    },
  })
  
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; data: UpdateBMSInstanceRequest }) =>
      updateBMSInstance(data.id, data.data),
    onSuccess: () => {
      toast.success(t('bms.instance.updated_success'))
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(t('bms.instance.update_failed'), {
        description: error?.response?.data?.detail || error.message,
      })
    },
  })
  
  // 初始化表单数据
  useEffect(() => {
    if (instance) {
      form.reset({
        asset_id: instance.asset_id,
        architecture_id: instance.architecture_id,
        instance_name: instance.instance_name,
        display_name_zh: instance.display_name_zh,
        display_name_en: instance.display_name_en,
        enabled: instance.enabled,
      })
    } else {
      form.reset({
        asset_id: undefined,
        architecture_id: undefined,
        instance_name: '',
        display_name_zh: '',
        display_name_en: '',
        enabled: true,
      })
    }
  }, [instance, form])
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (instance) {
      updateMutation.mutate({
        id: instance.id,
        data: {
          instance_name: values.instance_name,
          display_name_zh: values.display_name_zh,
          display_name_en: values.display_name_en,
          enabled: values.enabled,
        },
      })
    } else {
      createMutation.mutate({
        asset_id: values.asset_id,
        architecture_id: values.architecture_id,
        instance_name: values.instance_name,
        display_name_zh: values.display_name_zh,
        display_name_en: values.display_name_en,
        enabled: values.enabled,
      })
    }
  }
  
  // 处理架构数据：getBMSArchitectures返回的是ApiResponse，需要访问.data
  // 注意：getBMSArchitectures()已经返回了response.data，所以architecturesData就是ApiResponse对象
  const architectures = (architecturesData?.data as any[] | null | undefined) || []
  
  // 处理资产数据：getAssetList返回的是ApiResponse，需要访问.data
  const assets = ((assetsData?.data as any[] | null | undefined) || []).filter(
    (asset: any) => asset.enabled
  )
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {instance ? t('bms.instance.form.edit_title') : t('bms.instance.form.create_title')}
          </DialogTitle>
          <DialogDescription>
            {instance
              ? t('bms.instance.form.edit_description')
              : t('bms.instance.form.create_description')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="asset_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('bms.instance.form.asset')}</FormLabel>
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    disabled={!!instance}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('bms.instance.form.select_asset')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {assets.map((asset: any) => (
                        <SelectItem key={asset.id} value={asset.id.toString()}>
                          {asset.display_name} ({asset.name})
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
              name="architecture_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('bms.instance.form.architecture')}</FormLabel>
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    disabled={!!instance}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('bms.instance.form.select_architecture')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {architecturesLoading ? (
                        <SelectItem value="loading" disabled>
                          {t('common.loading')}
                        </SelectItem>
                      ) : architectures.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          暂无架构数据
                        </SelectItem>
                      ) : (
                        architectures.map((arch) => (
                          <SelectItem key={arch.id} value={arch.id.toString()}>
                            {arch.display_name_zh} ({arch.name})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instance_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('bms.instance.form.instance_name')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t('bms.instance.form.instance_name_placeholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="display_name_zh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('bms.instance.form.display_name_zh')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('bms.instance.form.display_name_zh_placeholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="display_name_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('bms.instance.form.display_name_en')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('bms.instance.form.display_name_en_placeholder')} />
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t('bms.instance.form.enabled')}</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      {t('bms.instance.form.enabled_description')}
                    </div>
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
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? t('common.saving')
                  : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
