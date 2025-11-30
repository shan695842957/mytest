/**
 * 业务字段表单对话框 - 创建/编辑业务字段
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Trash2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSemanticTypes, useDataTypes } from '@/hooks/useDictQueries'
import type { DeviceTypeTag } from '@/types'
import { useCreateDeviceTypeTag, useUpdateDeviceTypeTag } from '@/hooks/useDeviceTypeQueries'
import type { CreateDeviceTypeTagRequest, UpdateDeviceTypeTagRequest } from '@/types'

const enumOptionSchema = z.object({
  code: z.string().min(1, '枚举编码不能为空'),
  label: z.string().min(1, '枚举标签不能为空'),
})

const tagFormSchema = z
  .object({
    tag_name: z.string().min(1, '字段名不能为空').max(100, '字段名最多100个字符'),
    display_name: z.string().min(1, '显示名不能为空').max(200, '显示名最多200个字符'),
    data_type: z.enum(['BOOL', 'INT', 'FLOAT', 'ENUM']),
    semantic_type: z.enum(['MEASURE', 'STATUS', 'ACCUM', 'PARAM', 'SETPOINT', 'COMMAND', 'PARAM_SET']),
    engineering_unit: z.string().max(50).optional().or(z.literal('')),
    group_name: z.string().max(100).optional().or(z.literal('')),
    severity: z.number().min(0).max(5).default(0),
    description: z.string().optional().or(z.literal('')),
    enum_options: z.array(enumOptionSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.data_type === 'ENUM') {
      if (!data.enum_options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ENUM 类型至少需要一个枚举值',
          path: ['enum_options'],
        })
      }
      const seen = new Set<string>()
      data.enum_options.forEach((option, index) => {
        if (seen.has(option.code)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '枚举编码不能重复',
            path: ['enum_options', index, 'code'],
          })
        } else {
          seen.add(option.code)
        }
      })
    }
  })

type TagFormData = z.infer<typeof tagFormSchema>

interface DeviceTypeTagFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deviceTypeId: number
  tag?: DeviceTypeTag | null
}

export function DeviceTypeTagFormDialog({
  open,
  onOpenChange,
  deviceTypeId,
  tag,
}: DeviceTypeTagFormDialogProps) {
  const { t } = useTranslation('config')
  const isEdit = !!tag
  
  const { data: semanticTypes } = useSemanticTypes()
  const { data: dataTypes } = useDataTypes()
  
  const createMutation = useCreateDeviceTypeTag()
  const updateMutation = useUpdateDeviceTypeTag()
  
  const form = useForm<TagFormData>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      tag_name: '',
      display_name: '',
      data_type: 'FLOAT',
      semantic_type: 'MEASURE',
      engineering_unit: '',
      group_name: '',
      severity: 0,
      description: '',
      enum_options: [],
    },
  })
  
  // 编辑时填充数据
  useEffect(() => {
    if (tag) {
      form.reset({
        tag_name: tag.tag_name,
        display_name: tag.display_name,
        data_type: tag.data_type as 'BOOL' | 'INT' | 'FLOAT' | 'ENUM',
        semantic_type: tag.semantic_type as any,
        engineering_unit: tag.engineering_unit || '',
        group_name: tag.group_name || '',
        severity: tag.severity,
        description: tag.description || '',
        enum_options: Object.entries(tag.enum_json || {}).map(([code, label]) => ({
          code,
          label: String(label ?? ''),
        })),
      })
    } else {
      form.reset({
        tag_name: '',
        display_name: '',
        data_type: 'FLOAT',
        semantic_type: 'MEASURE',
        engineering_unit: '',
        group_name: '',
        severity: 0,
        description: '',
        enum_options: [],
      })
    }
  }, [tag, form])

  const dataType = form.watch('data_type')
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'enum_options',
  })
  const enumOptionsError = (form.formState.errors.enum_options as { message?: string } | undefined)?.message
  
  const onSubmit = async (data: TagFormData) => {
    try {
      const isEnum = data.data_type === 'ENUM'
      const enumJson = isEnum
        ? data.enum_options.reduce<Record<string, string>>((acc, option) => {
            if (option.code) {
              acc[option.code] = option.label
            }
            return acc
          }, {})
        : {}
      if (isEdit && tag) {
        const updateData: UpdateDeviceTypeTagRequest = {
          display_name: data.display_name,
          data_type: data.data_type,
          semantic_type: data.semantic_type,
          engineering_unit: data.engineering_unit || undefined,
          group_name: data.group_name || undefined,
          severity: data.severity,
          description: data.description || undefined,
          enum_json: enumJson,
        }
        await updateMutation.mutateAsync({ tagId: tag.id, data: updateData })
      } else {
        const createData: CreateDeviceTypeTagRequest = {
          tag_name: data.tag_name,
          display_name: data.display_name,
          data_type: data.data_type,
          semantic_type: data.semantic_type,
          engineering_unit: data.engineering_unit || undefined,
          group_name: data.group_name || undefined,
          severity: data.severity,
          description: data.description || undefined,
          enum_json: enumJson,
        }
        await createMutation.mutateAsync({ deviceTypeId, data: createData })
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
            {isEdit ? t('deviceType.detail.editTag') : t('deviceType.detail.addTag')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? '更新业务字段信息' : '为设备类型添加新的业务字段'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tag_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('deviceType.tagForm.tagName')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="例如：OUTLET_PRESSURE"
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
                    <FormLabel>{t('deviceType.tagForm.displayName')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例如：出口压力" />
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
                    <FormLabel>{t('deviceType.tagForm.dataType')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dataTypes?.data?.map((dt) => (
                          <SelectItem key={dt.value} value={dt.value}>
                            {dt.label}
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
                name="semantic_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('deviceType.tagForm.semanticType')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {semanticTypes?.data?.map((st) => (
                          <SelectItem key={st.value} value={st.value}>
                            {st.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="engineering_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('deviceType.tagForm.engineeringUnit')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例如：bar" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="group_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('deviceType.tagForm.groupName')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="例如：运行模式" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('deviceType.tagForm.severity')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={5}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('deviceType.tagForm.description')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="业务字段描述" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {dataType === 'ENUM' && (
              <div className="space-y-3 rounded-md border border-dashed p-4">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{t('deviceType.tagForm.enumJson')}</p>
                      <p className="text-xs text-muted-foreground">{t('deviceType.tagForm.enumHint')}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => append({ code: '', label: '' })}
                      disabled={isLoading}
                    >
                      <Plus className="mr-2 size-4" />
                      {t('deviceType.tagForm.enumAdd')}
                    </Button>
                  </div>
                  {enumOptionsError && (
                    <p className="text-sm text-destructive">{enumOptionsError}</p>
                  )}
                </div>
                {fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('deviceType.tagForm.enumEmpty')}</p>
                ) : (
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <FormField
                          control={form.control}
                          name={`enum_options.${index}.code`}
                          render={({ field: codeField }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">
                                {t('deviceType.tagForm.enumCode')}
                              </FormLabel>
                              <FormControl>
                                <Input {...codeField} placeholder="AUTO" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`enum_options.${index}.label`}
                          render={({ field: labelField }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">
                                {t('deviceType.tagForm.enumLabel')}
                              </FormLabel>
                              <FormControl>
                                <Input {...labelField} placeholder="自动" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="self-end"
                          onClick={() => remove(index)}
                          disabled={isLoading}
                        >
                          <Trash2 className="size-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
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

