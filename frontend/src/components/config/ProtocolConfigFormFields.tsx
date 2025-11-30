/**
 * 协议配置参数表单字段组件
 * 根据协议类型动态生成参数表单
 */

import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormContext, useWatch } from 'react-hook-form'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useProtocolTypeParamsDefinition } from '@/hooks/useProtocolTypeQueries'
import { usePeripheralsByType } from '@/hooks/usePeripheralQueries'
import type { ProtocolTypeParamDefinition } from '@/types'
import { Badge } from '@/components/ui/badge'

interface ProtocolConfigFormFieldsProps {
  protocolTypeName: string | null
}

/**
 * 外设选择字段组件
 */
function PeripheralSelectField({
  field,
  param,
  peripheralType,
}: {
  field: any
  param: ProtocolTypeParamDefinition
  peripheralType: string
}) {
  const { t } = useTranslation('config')
  const { data: peripheralsData, isLoading } = usePeripheralsByType(peripheralType, true)
  const peripherals = peripheralsData?.data || []
  
  return (
    <Select
      onValueChange={field.onChange}
      value={String(field.value || '')}
      disabled={isLoading || peripherals.length === 0}
    >
      <SelectTrigger>
        <SelectValue
          placeholder={
            isLoading
              ? t('common.loading', { ns: 'common' })
              : peripherals.length === 0
              ? t('commInstance.form.noPeripheralsAvailable')
              : param.placeholder || t('commInstance.form.selectPeripheral')
          }
        />
      </SelectTrigger>
      <SelectContent>
        {peripherals.map((peripheral) => (
          <SelectItem key={peripheral.value} value={peripheral.value}>
            {peripheral.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function ProtocolConfigFormFields({ protocolTypeName }: ProtocolConfigFormFieldsProps) {
  const { t } = useTranslation('config')
  const { control, setValue, formState } = useFormContext<{
    protocol_config: Record<string, any>
  }>()
  
  // 获取协议类型参数定义
  const { data: paramsDefinitionData } = useProtocolTypeParamsDefinition(protocolTypeName)
  const params = (paramsDefinitionData?.data?.params as ProtocolTypeParamDefinition[] | undefined) || []
  
  // 监听协议类型变化，重置配置并设置默认值（仅在新建时或协议类型变化时）
  const currentProtocolConfig = useWatch({ control, name: 'protocol_config' })
  const protocolTypeChangedRef = useRef<string | null>(null)
  
  useEffect(() => {
    if (!protocolTypeName || params.length === 0) {
      // 如果没有选择协议类型或没有参数定义，保持现有配置
      return
    }
    
    // 如果协议类型变化了，重置配置
    if (protocolTypeChangedRef.current !== protocolTypeName) {
      protocolTypeChangedRef.current = protocolTypeName
      
      // 获取当前配置中已存在的参数（编辑模式保留用户已填写的值）
      const existingConfig = currentProtocolConfig || {}
      const defaultConfig: Record<string, any> = {}
      
      params.forEach((param) => {
        // 如果已存在该参数的值，保留（编辑模式）
        if (param.param_name in existingConfig) {
          defaultConfig[param.param_name] = existingConfig[param.param_name]
        } else if (param.default_value !== null && param.default_value !== undefined) {
          // 根据数据类型转换默认值
          if (param.data_type === 'integer') {
            defaultConfig[param.param_name] = parseInt(String(param.default_value), 10)
          } else if (param.data_type === 'float') {
            defaultConfig[param.param_name] = parseFloat(String(param.default_value))
          } else if (param.data_type === 'boolean') {
            defaultConfig[param.param_name] = param.default_value === 'true' || param.default_value === true
          } else {
            defaultConfig[param.param_name] = param.default_value
          }
        } else if (param.required) {
          // 必填参数但没有默认值，根据类型设置空值
          if (param.data_type === 'boolean') {
            defaultConfig[param.param_name] = false
          } else if (param.data_type === 'integer' || param.data_type === 'float') {
            defaultConfig[param.param_name] = null // 保持null，让表单验证处理
          } else {
            defaultConfig[param.param_name] = ''
          }
        }
        // 可选参数且没有默认值，不设置
      })
      
      setValue('protocol_config', defaultConfig, { shouldValidate: false })
    }
  }, [protocolTypeName, params, setValue, currentProtocolConfig])
  
  if (!protocolTypeName || params.length === 0) {
    return (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        {protocolTypeName
          ? t('commInstance.form.noParams')
          : t('commInstance.form.selectProtocolType')}
      </div>
    )
  }
  
  // 按 order_index 排序（后端已经排序，这里直接使用）
  const sortedParams = params
  
  return (
    <div className="space-y-4">
      {sortedParams.map((param) => (
        <FormField
          key={param.param_name}
          control={control}
          name={`protocol_config.${param.param_name}`}
          rules={{
            required: param.required ? t('commInstance.form.paramRequired', { name: param.display_name }) : false,
            validate: (value) => {
              // 类型验证
              if (value === '' || value === null || value === undefined) {
                if (param.required) {
                  return t('commInstance.form.paramRequired', { name: param.display_name })
                }
                return true
              }
              
              // 数据类型验证
              if (param.data_type === 'integer') {
                const num = typeof value === 'string' ? parseInt(value, 10) : value
                if (isNaN(num)) {
                  return t('commInstance.form.paramInvalidType', { name: param.display_name, type: 'integer' })
                }
                // 范围验证
                if (param.constraints.min !== undefined && num < param.constraints.min) {
                  return t('commInstance.form.paramMinError', { name: param.display_name, min: param.constraints.min })
                }
                if (param.constraints.max !== undefined && num > param.constraints.max) {
                  return t('commInstance.form.paramMaxError', { name: param.display_name, max: param.constraints.max })
                }
              } else if (param.data_type === 'float') {
                const num = typeof value === 'string' ? parseFloat(value) : value
                if (isNaN(num)) {
                  return t('commInstance.form.paramInvalidType', { name: param.display_name, type: 'float' })
                }
              } else if (param.data_type === 'boolean' && typeof value !== 'boolean') {
                return t('commInstance.form.paramInvalidType', { name: param.display_name, type: 'boolean' })
              } else if (param.data_type === 'enum') {
                if (param.constraints.enum && !param.constraints.enum.includes(value)) {
                  return t('commInstance.form.paramEnumError', {
                    name: param.display_name,
                    values: param.constraints.enum.join(', '),
                  })
                }
              }
              
              // 正则表达式验证
              if (param.constraints.pattern && typeof value === 'string') {
                const regex = new RegExp(param.constraints.pattern)
                if (!regex.test(value)) {
                  return t('commInstance.form.paramPatternError', { name: param.display_name })
                }
              }
              
              return true
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                {param.display_name}
                {param.required && (
                  <Badge variant="destructive" className="text-xs">
                    {t('common.required', { ns: 'common' })}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {param.data_type}
                </Badge>
              </FormLabel>
              <FormControl>
                {(() => {
                  // 外设选择类型
                  if (param.input_type === 'peripheral' && param.peripheral_type) {
                    return <PeripheralSelectField
                      field={field}
                      param={param}
                      peripheralType={param.peripheral_type}
                    />
                  }
                  
                  // 布尔类型
                  if (param.data_type === 'boolean') {
                    return (
                      <div className="flex items-center space-x-2 rounded-lg border p-3">
                        <Switch checked={field.value || false} onCheckedChange={field.onChange} />
                        <span className="text-sm text-muted-foreground">
                          {field.value ? t('common.yes', { ns: 'common' }) : t('common.no', { ns: 'common' })}
                        </span>
                      </div>
                    )
                  }
                  
                  // 枚举类型
                  if (param.data_type === 'enum' && param.constraints.enum) {
                    return (
                      <Select onValueChange={field.onChange} value={String(field.value || '')}>
                        <SelectTrigger>
                          <SelectValue placeholder={param.placeholder || t('commInstance.form.selectValue')} />
                        </SelectTrigger>
                        <SelectContent>
                          {param.constraints.enum.map((enumValue) => (
                            <SelectItem key={String(enumValue)} value={String(enumValue)}>
                              {String(enumValue)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  }
                  
                  // 数字类型
                  if (param.data_type === 'integer' || param.data_type === 'float') {
                    return (
                      <Input
                        type="number"
                        step={param.data_type === 'float' ? 'any' : '1'}
                        min={param.constraints.min}
                        max={param.constraints.max}
                        placeholder={param.placeholder || param.default_value || ''}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '') {
                            field.onChange(null)
                          } else if (param.data_type === 'integer') {
                            field.onChange(parseInt(value, 10))
                          } else {
                            field.onChange(parseFloat(value))
                          }
                        }}
                      />
                    )
                  }
                  
                  // 文本类型（默认）
                  return (
                    <Input
                      type="text"
                      placeholder={param.placeholder || param.default_value || ''}
                      {...field}
                      value={field.value ?? ''}
                    />
                  )
                })()}
              </FormControl>
              {param.description && (
                <FormDescription>{param.description}</FormDescription>
              )}
              {param.default_value && (
                <FormDescription className="text-xs text-muted-foreground">
                  {t('commInstance.form.defaultValue')}: {param.default_value}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  )
}

