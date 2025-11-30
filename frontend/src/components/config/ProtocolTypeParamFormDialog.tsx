/**
 * 协议类型参数表单对话框 - 创建/编辑参数
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm, useWatch } from 'react-hook-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import type { ProtocolType, ProtocolTypeParam } from '@/types'
import {
  useCreateProtocolTypeParam,
  useUpdateProtocolTypeParam,
} from '@/hooks/useProtocolTypeQueries'
import type {
  CreateProtocolTypeParamRequest,
  UpdateProtocolTypeParamRequest,
} from '@/types'

const paramFormSchema = z.object({
  param_name: z.string().min(1, '参数名称不能为空').max(100, '参数名称最多100个字符'),
  display_name: z.string().min(1, '显示名称不能为空').max(200, '显示名称最多200个字符'),
  data_type: z.enum(['string', 'integer', 'float', 'boolean', 'enum']),
  required: z.boolean().default(true),
  default_value: z.string().optional().nullable(),
  description: z.string().optional().or(z.literal('')),
  order_index: z.number().min(0).default(0),
  placeholder: z.string().optional().nullable(),
  input_type: z.enum(['text', 'number', 'select', 'peripheral']).optional(),
  peripheral_type: z.string().optional().nullable(),
}).refine(
  (data) => {
    // 如果 input_type 是 'peripheral'，则 peripheral_type 必填
    if (data.input_type === 'peripheral' && !data.peripheral_type) {
      return false
    }
    return true
  },
  {
    message: '选择外设类型时，必须指定外设类型',
    path: ['peripheral_type'],
  }
)

type ParamFormData = z.infer<typeof paramFormSchema>

interface ProtocolTypeParamFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  protocolType: ProtocolType | null
  param?: ProtocolTypeParam | null
}

export function ProtocolTypeParamFormDialog({
  open,
  onOpenChange,
  protocolType,
  param,
}: ProtocolTypeParamFormDialogProps) {
  const { t } = useTranslation('config')
  const isEdit = !!param
  
  const form = useForm<ParamFormData>({
    resolver: zodResolver(paramFormSchema),
    defaultValues: {
      param_name: '',
      display_name: '',
      data_type: 'string',
      required: true,
      default_value: null,
      description: '',
      order_index: 0,
      placeholder: null,
      input_type: 'text',
      peripheral_type: null,
    },
  })
  
  // 监听 input_type 变化
  const inputType = useWatch({ control: form.control, name: 'input_type' })
  
  const createMutation = useCreateProtocolTypeParam()
  const updateMutation = useUpdateProtocolTypeParam()
  
  // 编辑时填充数据
  useEffect(() => {
    if (param && protocolType) {
      form.reset({
        param_name: param.param_name,
        display_name: param.display_name,
        data_type: param.data_type as any,
        required: param.required,
        default_value: param.default_value || null,
        description: param.description || '',
        order_index: param.order_index,
        placeholder: param.placeholder || null,
        input_type: (param.input_type as any) || 'text',
        peripheral_type: param.peripheral_type || null,
      })
    } else if (protocolType) {
      // 新建时，order_index 设为参数列表长度
      form.reset({
        param_name: '',
        display_name: '',
        data_type: 'string',
        required: true,
        default_value: null,
        description: '',
        order_index: protocolType.params?.length || 0,
        placeholder: null,
        input_type: 'text',
        peripheral_type: null,
      })
    }
  }, [param, protocolType, form])
  
  const onSubmit = async (data: ParamFormData) => {
    if (!protocolType) return
    
    try {
      if (isEdit && param) {
        const updateData: UpdateProtocolTypeParamRequest = {
          display_name: data.display_name,
          data_type: data.data_type,
          required: data.required,
          default_value: data.default_value || undefined,
          description: data.description || undefined,
          order_index: data.order_index,
          placeholder: data.placeholder || undefined,
          input_type: data.input_type,
          peripheral_type: data.peripheral_type || undefined,
        }
        await updateMutation.mutateAsync({
          paramId: param.id,
          protocolTypeId: protocolType.id,
          data: updateData,
        })
      } else {
        const createData: CreateProtocolTypeParamRequest = {
          param_name: data.param_name,
          display_name: data.display_name,
          data_type: data.data_type,
          required: data.required,
          default_value: data.default_value || undefined,
          description: data.description || undefined,
          order_index: data.order_index,
          placeholder: data.placeholder || undefined,
          constraints_json: {}, // TODO: 后续可以添加约束配置UI
          input_type: data.input_type,
          peripheral_type: data.peripheral_type || undefined,
        }
        await createMutation.mutateAsync({
          protocolTypeId: protocolType.id,
          data: createData,
        })
      }
      onOpenChange(false)
    } catch (error) {
      // 错误已在 mutation 中处理
    }
  }
  
  const isLoading = createMutation.isPending || updateMutation.isPending
  
  if (!protocolType) return null
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('protocolType.param.form.update') : t('protocolType.param.form.create')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('protocolType.param.form.updateDescription')
              : t('protocolType.param.form.createDescription', { name: protocolType.display_name })}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="param_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('protocolType.param.form.paramName')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="例如：ip, port, unit_id"
                      disabled={isEdit}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('protocolType.param.form.paramNameDescription')}
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
                  <FormLabel>{t('protocolType.param.form.displayName')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="例如：IP地址, 端口, 站号" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('protocolType.param.form.dataType')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="integer">Integer</SelectItem>
                        <SelectItem value="float">Float</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="enum">Enum</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-8">
                    <FormLabel className="text-sm">{t('protocolType.param.form.required')}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="default_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('protocolType.param.form.defaultValue')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder={t('protocolType.param.form.defaultValuePlaceholder')}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('protocolType.param.form.defaultValueDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="placeholder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('protocolType.param.form.placeholder')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="例如：例如：192.168.1.100"
                    />
                  </FormControl>
                  <FormDescription>
                    {t('protocolType.param.form.placeholderDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="input_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('protocolType.param.form.inputType')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'text'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="text">{t('protocolType.param.form.inputTypeText')}</SelectItem>
                        <SelectItem value="number">{t('protocolType.param.form.inputTypeNumber')}</SelectItem>
                        <SelectItem value="select">{t('protocolType.param.form.inputTypeSelect')}</SelectItem>
                        <SelectItem value="peripheral">{t('protocolType.param.form.inputTypePeripheral')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t('protocolType.param.form.inputTypeDescription')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="peripheral_type"
                render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('protocolType.param.form.peripheralType')}</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ''}
                          disabled={inputType !== 'peripheral'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('protocolType.param.form.peripheralTypePlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="serial">{t('protocolType.param.form.peripheralTypeSerial')}</SelectItem>
                            <SelectItem value="can">{t('protocolType.param.form.peripheralTypeCan')}</SelectItem>
                            <SelectItem value="spi">{t('protocolType.param.form.peripheralTypeSpi')}</SelectItem>
                            <SelectItem value="i2c">{t('protocolType.param.form.peripheralTypeI2c')}</SelectItem>
                            <SelectItem value="gpio">{t('protocolType.param.form.peripheralTypeGpio')}</SelectItem>
                            <SelectItem value="pwm">{t('protocolType.param.form.peripheralTypePwm')}</SelectItem>
                            <SelectItem value="adc">{t('protocolType.param.form.peripheralTypeAdc')}</SelectItem>
                            <SelectItem value="dac">{t('protocolType.param.form.peripheralTypeDac')}</SelectItem>
                            <SelectItem value="other">{t('protocolType.param.form.peripheralTypeOther')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        {t('protocolType.param.form.peripheralTypeDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="order_index"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('protocolType.param.form.orderIndex')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('protocolType.param.form.orderIndexDescription')}
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
                  <FormLabel>{t('protocolType.param.form.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t('protocolType.param.form.descriptionPlaceholder')}
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
                {isLoading
                  ? t('common.saving', { ns: 'common' })
                  : isEdit
                    ? t('common.update', { ns: 'common' })
                    : t('common.create', { ns: 'common' })}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

