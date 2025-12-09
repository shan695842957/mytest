/**
 * BMS字段配置对话框
 */

import { useEffect, useMemo } from 'react'
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
  FormDescription,
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
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  createBMSFieldConfig,
  updateBMSFieldConfig,
  getBMSInstanceDetail,
  type BMSFieldConfig,
  type CreateBMSFieldConfigRequest,
  type UpdateBMSFieldConfigRequest,
} from '@/api/bms'
import { getAssetDetail } from '@/api/assets'
import { getCommInstanceList } from '@/api/commInstances'
import { getDeviceTypeTagList } from '@/api/deviceTypes'
import type { AssetDetail, DeviceTypeTag } from '@/types'
import type { CommInstance } from '@/types/commInstance'

// SYS页面的固定字段（必须配置）
const SYS_FIXED_FIELDS = [
  'fault',
  'voltage',
  'current',
  'power',
  'breaker_status',
  'breaker_open_command',
  'breaker_close_command',
]

interface BMSFieldConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instanceId: number
  pageType: string
  fieldConfig?: BMSFieldConfig | null
  onSuccess?: () => void
}

export function BMSFieldConfigDialog({
  open,
  onOpenChange,
  instanceId,
  pageType,
  fieldConfig,
  onSuccess,
}: BMSFieldConfigDialogProps) {
  const { t } = useTranslation(['config', 'common'])
  const queryClient = useQueryClient()
  const isEdit = !!(fieldConfig && fieldConfig.id)

  // 获取BMS实例的资产信息（所有hooks必须在组件顶部无条件调用）
  const { data: instanceData } = useQuery({
    queryKey: ['bms-instance', instanceId],
    queryFn: () => getBMSInstanceDetail(instanceId),
    enabled: !!instanceId && open,
    staleTime: 5 * 60 * 1000, // 5分钟内不重新获取
  })

  const assetId = (instanceData?.data as any)?.asset_id

  // 获取资产详情
  const { data: assetDetailData } = useQuery({
    queryKey: ['asset-detail', assetId],
    queryFn: () => getAssetDetail(assetId!),
    enabled: !!assetId && open,
  })

  const assetDetail = assetDetailData?.data as AssetDetail | undefined
  const deviceTypeId = assetDetail?.device_type_id

  // 获取资产的所有字段（从device_type_tags获取）
  const { data: assetFieldsData } = useQuery({
    queryKey: ['device-type-tags', deviceTypeId],
    queryFn: () => getDeviceTypeTagList(deviceTypeId!),
    enabled: !!deviceTypeId && open,
  })

  const assetFields = (assetFieldsData?.data as DeviceTypeTag[] | null | undefined) || []

  // 预计算资产字段选项列表（避免JSX表达式中的复杂逻辑）
  const assetFieldOptions = useMemo(() => {
    return assetFields.map((assetField) => {
      const displayName = assetField.display_name || assetField.tag_name
      const tagName = assetField.tag_name
      const fullText = displayName + ' (' + tagName + ')'
      return {
        id: assetField.id,
        value: assetField.id.toString(),
        label: fullText,
      }
    })
  }, [assetFields])

  // 获取通信实例列表
  const { data: commInstancesData } = useQuery({
    queryKey: ['comm-instances', { asset_id: assetId }],
    queryFn: () => getCommInstanceList({ asset_id: assetId! }),
    enabled: !!assetId && open,
  })

  const commInstances = (commInstancesData?.data as CommInstance[] | null | undefined) || []

  // 表单Schema
  const formSchema = z.object({
    field_key: z.string().min(1, t('validation.required', { ns: 'common' })),
    display_name_zh: z.string().min(1, t('validation.required', { ns: 'common' })),
    display_name_en: z.string().min(1, t('validation.required', { ns: 'common' })),
    data_type: z.enum(['boolean', 'number', 'enum']),
    unit_zh: z.string().optional(),
    unit_en: z.string().optional(),
    is_required: z.boolean().optional(),
    source_type: z.enum(['asset_field', 'custom', 'di_point']),
    // 资产字段相关
    read_device_type_tag_id: z.number().optional(),
    write_device_type_tag_id: z.number().optional(),
    // DI点相关
    read_comm_instance_id: z.number().optional(),
    read_point_id: z.number().optional(),
    write_comm_instance_id: z.number().optional(),
    write_point_id: z.number().optional(),
    sort_order: z.number().optional(),
    description_zh: z.string().optional(),
    description_en: z.string().optional(),
  }).refine((data) => {
    // SYS 固定字段必须配置读来源；命令类需写来源；不允许 custom
    if (pageType === 'SYS' && SYS_FIXED_FIELDS.includes(data.field_key)) {
      if (data.source_type === 'custom') return false
      const isCommand = data.field_key === 'breaker_open_command' || data.field_key === 'breaker_close_command'
      if (data.source_type === 'asset_field') {
        if (!data.read_device_type_tag_id) return false
        if (isCommand && !data.write_device_type_tag_id) return false
      } else if (data.source_type === 'di_point') {
        if (!data.read_comm_instance_id || !data.read_point_id) return false
        if (isCommand && (!data.write_comm_instance_id || !data.write_point_id)) return false
      } else {
        return false
      }
    } else {
      // 非 SYS 固定字段：读来源必填；若配置写目标则写来源也需完整
      if (data.source_type === 'asset_field') {
        if (!data.read_device_type_tag_id) return false
      } else if (data.source_type === 'di_point') {
        if (!data.read_comm_instance_id || !data.read_point_id) return false
        if (data.write_comm_instance_id || data.write_point_id) {
          if (!data.write_comm_instance_id || !data.write_point_id) return false
        }
      } else if (data.source_type === 'custom') {
        // 允许无数据来源
      }
    }
    return true
  }, {
    message: t('bms.field_config.data_source_validation_error', '请配置完整的数据来源'),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      field_key: '',
      display_name_zh: '',
      display_name_en: '',
      data_type: 'number',
      unit_zh: '',
      unit_en: '',
      is_required: false,
      source_type: 'asset_field',
      read_device_type_tag_id: undefined,
      write_device_type_tag_id: undefined,
      read_comm_instance_id: undefined,
      read_point_id: undefined,
      write_comm_instance_id: undefined,
      write_point_id: undefined,
      sort_order: 0,
      description_zh: '',
      description_en: '',
    },
  })

  // 判断是否为SYS页面的固定字段（监听字段键变化）
  const currentFieldKey = form.watch('field_key')
  const isSysFixedField = pageType === 'SYS' && currentFieldKey && SYS_FIXED_FIELDS.includes(currentFieldKey)
  const lockedFixedMeta =
    pageType === 'SYS' &&
    SYS_FIXED_FIELDS.includes((currentFieldKey || fieldConfig?.field_key || '') as string)

  // 编辑模式：填充表单
  useEffect(() => {
    if (fieldConfig && open) {
      form.reset({
        field_key: fieldConfig.field_key,
        display_name_zh: fieldConfig.display_name_zh,
        display_name_en: fieldConfig.display_name_en,
        data_type: fieldConfig.data_type as 'boolean' | 'number' | 'enum',
        unit_zh: fieldConfig.unit_zh,
        unit_en: fieldConfig.unit_en,
        is_required: fieldConfig.is_required,
        source_type: fieldConfig.source_type as 'asset_field' | 'custom' | 'di_point',
        read_device_type_tag_id: fieldConfig.read_device_type_tag_id ?? undefined,
        write_device_type_tag_id: fieldConfig.write_device_type_tag_id ?? undefined,
        read_comm_instance_id: fieldConfig.read_comm_instance_id ?? undefined,
        read_point_id: fieldConfig.read_point_id ?? undefined,
        write_comm_instance_id: fieldConfig.write_comm_instance_id ?? undefined,
        write_point_id: fieldConfig.write_point_id ?? undefined,
        sort_order: fieldConfig.sort_order,
        description_zh: fieldConfig.description_zh,
        description_en: fieldConfig.description_en,
      })
    } else if (!fieldConfig && open) {
      form.reset({
        field_key: '',
        display_name_zh: '',
        display_name_en: '',
        data_type: 'number',
        unit_zh: '',
        unit_en: '',
        is_required: false,
        source_type: 'asset_field',
        read_device_type_tag_id: undefined,
        write_device_type_tag_id: undefined,
        read_comm_instance_id: undefined,
        read_point_id: undefined,
        write_comm_instance_id: undefined,
        write_point_id: undefined,
        sort_order: 0,
        description_zh: '',
        description_en: '',
      })
    }
  }, [fieldConfig, open, form])

  // 监听source_type变化，清空相关字段
  const sourceType = form.watch('source_type')
  useEffect(() => {
    if (sourceType === 'asset_field') {
      form.setValue('read_comm_instance_id', undefined)
      form.setValue('read_point_id', undefined)
      form.setValue('write_comm_instance_id', undefined)
      form.setValue('write_point_id', undefined)
    } else if (sourceType === 'di_point') {
      form.setValue('read_device_type_tag_id', undefined)
      form.setValue('write_device_type_tag_id', undefined)
    } else if (sourceType === 'custom') {
      form.setValue('read_device_type_tag_id', undefined)
      form.setValue('write_device_type_tag_id', undefined)
      form.setValue('read_comm_instance_id', undefined)
      form.setValue('read_point_id', undefined)
      form.setValue('write_comm_instance_id', undefined)
      form.setValue('write_point_id', undefined)
    }
  }, [sourceType, form])

  // 创建Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateBMSFieldConfigRequest) =>
      createBMSFieldConfig(instanceId, data),
    onSuccess: () => {
      toast.success(t('bms.field_config.created_success'))
      queryClient.invalidateQueries({ queryKey: ['bms-field-configs'] })
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(t('bms.field_config.create_failed'), {
        description: error?.response?.data?.detail || error.message,
      })
    },
  })

  // 更新Mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateBMSFieldConfigRequest) =>
      updateBMSFieldConfig(instanceId, fieldConfig!.id, data),
    onSuccess: () => {
      toast.success(t('bms.field_config.updated_success'))
      queryClient.invalidateQueries({ queryKey: ['bms-field-configs'] })
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast.error(t('bms.field_config.update_failed'), {
        description: error?.response?.data?.detail || error.message,
      })
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const isSysFixed = pageType === 'SYS' && SYS_FIXED_FIELDS.includes(values.field_key)
    const payload = {
      ...values,
      page_type: pageType,
      field_type: isSysFixed ? 'fixed' : 'dynamic',
      is_required: isSysFixed ? true : (values.is_required ?? false),
    }
    if (isEdit && fieldConfig?.id) {
      updateMutation.mutate(payload as UpdateBMSFieldConfigRequest)
    } else {
      createMutation.mutate(payload as CreateBMSFieldConfigRequest)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl md:max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t('bms.field_config.edit_title', '编辑字段配置')
              : t('bms.field_config.create_title', '创建字段配置')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('bms.field_config.edit_description', '编辑BMS字段配置信息')
              : t('bms.field_config.create_description', '创建新的BMS字段配置')}
            {isSysFixedField && (
              <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ {t('bms.field_config.sys_fixed_field_warning', '这是SYS页面的固定字段，必须配置数据来源（资产字段或DI点）')}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{t('bms.field_config.basic_info', '基本信息')}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="field_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('bms.field_config.field_key', '字段键')}
                        {isEdit && <span className="text-muted-foreground ml-2">(不可修改)</span>}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isEdit || lockedFixedMeta}
                          placeholder="例如：voltage, current, soc"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="display_name_zh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('bms.field_config.display_name_zh', '中文显示名')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例如：电压" disabled={lockedFixedMeta} />
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
                      <FormLabel>{t('bms.field_config.display_name_en', '英文显示名')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例如：Voltage" disabled={lockedFixedMeta} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="data_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('bms.field_config.data_type', '数据类型')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={lockedFixedMeta}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="boolean">Boolean</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="enum">Enum</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="unit_zh"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('bms.field_config.unit_zh', '中文单位')}</FormLabel>
                        <FormControl>
                        <Input {...field} placeholder="例如：V" disabled={lockedFixedMeta} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit_en"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('bms.field_config.unit_en', '英文单位')}</FormLabel>
                        <FormControl>
                        <Input {...field} placeholder="例如：V" disabled={lockedFixedMeta} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* 数据来源配置 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">
                {t('bms.field_config.data_source', '数据来源')}
                {isSysFixedField && <span className="text-amber-600 dark:text-amber-400 ml-2">*必填</span>}
              </h3>

              <FormField
                control={form.control}
                name="source_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('bms.field_config.source_type', '来源类型')}
                      {isSysFixedField && <span className="text-destructive ml-1">*</span>}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="asset_field">
                          {t('bms.field_config.source_asset_field', '资产字段')}
                        </SelectItem>
                        <SelectItem value="di_point">
                          {t('bms.field_config.source_di_point', 'DI点')}
                        </SelectItem>
                        {!isSysFixedField && (
                          <SelectItem value="custom">
                            {t('bms.field_config.source_custom', '自定义（仅显示）')}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {isSysFixedField
                        ? t('bms.field_config.source_type_fixed_desc', 'SYS固定字段必须配置数据来源（资产字段或DI点）')
                        : t('bms.field_config.source_type_desc', '选择字段的数据来源类型')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 资产字段配置 */}
              {sourceType === 'asset_field' && (
                <div className="space-y-4 pl-4 border-l-2">
                  {/* 读配置：非命令字段需要配置读源 */}
                  {!(currentFieldKey === 'breaker_open_command' || currentFieldKey === 'breaker_close_command') && (
                    <FormField
                      control={form.control}
                      name="read_device_type_tag_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('bms.field_config.read_asset_field', '读：资产字段')}
                            <span className="text-destructive ml-1">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('bms.field_config.select_asset_field', '请选择资产字段')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {assetFieldOptions.length === 0 ? (
                                <SelectItem value="empty" disabled>
                                  {t('bms.field_config.no_asset_fields', '暂无资产字段')}
                                </SelectItem>
                              ) : (
                                assetFieldOptions.map((option) => (
                                  <SelectItem key={option.id} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* 写配置：命令字段需要配置写源 */}
                  {(currentFieldKey === 'breaker_open_command' || currentFieldKey === 'breaker_close_command') && (
                    <FormField
                      control={form.control}
                      name="write_device_type_tag_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('bms.field_config.write_asset_field', '写：资产字段')}
                            <span className="text-destructive ml-1">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('bms.field_config.select_asset_field', '请选择资产字段')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {assetFieldOptions.length === 0 ? (
                                <SelectItem value="empty" disabled>
                                  {t('bms.field_config.no_asset_fields', '暂无资产字段')}
                                </SelectItem>
                              ) : (
                                assetFieldOptions.map((option) => (
                                  <SelectItem key={option.id} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              {/* DI点配置 */}
              {sourceType === 'di_point' && (
                <div className="space-y-4 pl-4 border-l-2">
                  {/* 读配置：非命令字段需要配置读源 */}
                  {!(currentFieldKey === 'breaker_open_command' || currentFieldKey === 'breaker_close_command') && (
                    <>
                      <FormField
                        control={form.control}
                        name="read_comm_instance_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('bms.field_config.read_comm_instance', '读：通信实例')}
                              <span className="text-destructive ml-1">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('bms.field_config.select_comm_instance', '请选择通信实例')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {commInstances.length === 0 ? (
                                  <SelectItem value="empty" disabled>
                                    {t('bms.field_config.no_comm_instances', '暂无通信实例')}
                                  </SelectItem>
                                ) : (
                                  commInstances.map((instance) => (
                                    <SelectItem key={instance.id} value={instance.id.toString()}>
                                      {instance.display_name_zh || instance.instance_name}
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
                        name="read_point_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('bms.field_config.read_point', '读：点表点')}
                              <span className="text-destructive ml-1">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('bms.field_config.select_point', '请选择点表点')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="empty" disabled>
                                  {t('bms.field_config.point_selection_coming_soon', '点表点选择功能开发中')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {t('bms.field_config.point_selection_desc', '需要先选择通信实例，然后根据通信模板的点表配置选择点')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {/* 写配置：命令字段需要配置写源 */}
                  {(currentFieldKey === 'breaker_open_command' || currentFieldKey === 'breaker_close_command') && (
                    <>
                      <FormField
                        control={form.control}
                        name="write_comm_instance_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('bms.field_config.write_comm_instance', '写：通信实例')}
                              <span className="text-destructive ml-1">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('bms.field_config.select_comm_instance', '请选择通信实例')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {commInstances.length === 0 ? (
                                  <SelectItem value="empty" disabled>
                                    {t('bms.field_config.no_comm_instances', '暂无通信实例')}
                                  </SelectItem>
                                ) : (
                                  commInstances.map((instance) => (
                                    <SelectItem key={instance.id} value={instance.id.toString()}>
                                      {instance.display_name_zh || instance.instance_name}
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
                        name="write_point_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('bms.field_config.write_point', '写：点表点')}
                              <span className="text-destructive ml-1">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('bms.field_config.select_point', '请选择点表点')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="empty" disabled>
                                  {t('bms.field_config.point_selection_coming_soon', '点表点选择功能开发中')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {t('bms.field_config.point_selection_desc', '需要先选择通信实例，然后根据通信模板的点表配置选择点')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              )}

              {/* 自定义字段提示 */}
              {sourceType === 'custom' && (
                <div className="pl-4 border-l-2">
                  <p className="text-sm text-muted-foreground">
                    {t('bms.field_config.custom_desc', '自定义字段仅用于显示，无实际数据来源')}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* 其他配置 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{t('bms.field_config.other_config', '其他配置')}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('bms.field_config.sort_order', '排序')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          disabled={lockedFixedMeta}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_required"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {t('bms.field_config.is_required', '必填字段')}
                        </FormLabel>
                        <FormDescription>
                          {t('bms.field_config.is_required_desc', '固定字段通常为必填')}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={lockedFixedMeta}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="description_zh"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('bms.field_config.description_zh', '中文描述')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="可选" disabled={lockedFixedMeta} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description_en"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('bms.field_config.description_en', '英文描述')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="可选" disabled={lockedFixedMeta} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('common:cancel')}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? t('common:saving')
                  : isEdit
                  ? t('common:update')
                  : t('common:create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
