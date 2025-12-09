/**
 * BMS 二级架构 SYS Tab 组件
 * 按配置渲染字段，从 WebSocket 缓存读取实时值
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { getBMSFieldConfigList, type BMSFieldConfig } from '@/api/bms'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BMSSysTabLevel2Props {
  instanceId: number
  // WebSocket 缓存数据（key: field_key, value: 实时值）
  realtimeValues?: Record<string, any>
  // 断路器控制回调
  onBreakerControl?: (action: 'open' | 'close', fieldKey: string) => void
}

export function BMSSysTabLevel2({
  instanceId,
  realtimeValues = {},
  onBreakerControl,
}: BMSSysTabLevel2Props) {
  const { t, i18n } = useTranslation('bms')

  // 获取 SYS 页面字段配置
  const { data: fieldConfigsData, isLoading } = useQuery({
    queryKey: ['bms-field-configs', instanceId, 'SYS'],
    queryFn: () => getBMSFieldConfigList(instanceId, 'SYS'),
    enabled: !!instanceId,
  })

  const fieldConfigs = (fieldConfigsData?.data as BMSFieldConfig[] | null | undefined) || []

  // 分离固定字段和动态字段
  const { fixedFields, dynamicFields, commandFields } = useMemo(() => {
    const fixed: BMSFieldConfig[] = []
    const dynamic: BMSFieldConfig[] = []
    const commands: BMSFieldConfig[] = []

    fieldConfigs.forEach((field) => {
      if (field.field_type === 'fixed') {
        if (field.field_key === 'breaker_open_command' || field.field_key === 'breaker_close_command') {
          commands.push(field)
        } else {
          fixed.push(field)
        }
      } else {
        dynamic.push(field)
      }
    })

    // 按 sort_order 排序
    fixed.sort((a, b) => a.sort_order - b.sort_order)
    dynamic.sort((a, b) => a.sort_order - b.sort_order)
    commands.sort((a, b) => a.sort_order - b.sort_order)

    return {
      fixedFields: fixed,
      dynamicFields: dynamic,
      commandFields: commands,
    }
  }, [fieldConfigs])

  // 获取字段显示值（从 WebSocket 缓存或占位）
  const getFieldValue = (field: BMSFieldConfig): string | number | boolean | null => {
    const value = realtimeValues[field.field_key]
    return value !== undefined ? value : null
  }

  // 获取字段显示文本
  const getFieldDisplayText = (field: BMSFieldConfig): string => {
    const isZh = i18n.language === 'zh-CN'
    return isZh ? field.display_name_zh : field.display_name_en
  }

  // 获取单位文本
  const getUnitText = (field: BMSFieldConfig): string => {
    const isZh = i18n.language === 'zh-CN'
    return isZh ? field.unit_zh : field.unit_en
  }

  // 渲染固定字段卡片
  const renderFixedFieldCard = (field: BMSFieldConfig) => {
    const value = getFieldValue(field)
    const displayName = getFieldDisplayText(field)
    const unit = getUnitText(field)

    // 故障状态特殊处理
    if (field.field_key === 'fault') {
      const hasFault = value === true || value === 1
      return (
        <div key={field.id} className="bg-muted/50 rounded-lg p-4 flex flex-col justify-end">
          <div className="text-xs text-muted-foreground mb-1">{displayName}</div>
          <Badge
            variant={hasFault ? 'destructive' : 'secondary'}
            className="w-full justify-center"
          >
            {hasFault ? t('fault') : t('normal')}
          </Badge>
        </div>
      )
    }

    // 断路器状态特殊处理
    if (field.field_key === 'breaker_status') {
      const isClosed = value === true || value === 1
      return (
        <div key={field.id} className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{displayName}:</span>
          {isClosed ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {t('closed')}
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="w-3 h-3 mr-1" />
              {t('open')}
            </Badge>
          )}
        </div>
      )
    }

    // 普通数值字段
    return (
      <div key={field.id} className="bg-muted/50 rounded-lg p-4">
        <div className="text-xs text-muted-foreground mb-1">{displayName}</div>
        <div className="text-2xl font-bold">
          {value !== null ? `${value} ${unit || ''}` : '--'}
        </div>
      </div>
    )
  }

  // 渲染动态字段
  const renderDynamicField = (field: BMSFieldConfig) => {
    const value = getFieldValue(field)
    const displayName = getFieldDisplayText(field)
    const unit = getUnitText(field)

    return (
      <div key={field.id}>
        <div className="text-xs text-muted-foreground mb-1">{displayName}</div>
        <div className="text-lg font-semibold">
          {value !== null ? `${value} ${unit ? ' ' + unit : ''}` : '--'}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">{t('common:loading')}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 固定字段区域 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('cluster_basic_info')}</CardTitle>
          <CardDescription>{t('bms.level2.sys.basic_info_desc', '包含固定字段与可配置字段')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 固定字段网格 */}
          {fixedFields.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {fixedFields.map(renderFixedFieldCard)}
            </div>
          )}

          {/* 动态字段网格 */}
          {dynamicFields.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">
                {t('bms.level2.sys.dynamic_fields', '可配置字段')}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {dynamicFields.map(renderDynamicField)}
              </div>
            </div>
          )}

          {/* 提示信息 */}
          <div className="text-xs text-muted-foreground">
            {t('bms.level2.sys.no_realtime_tip', '实时值依赖 WebSocket 数据，未收到时显示空值。')}
          </div>
        </CardContent>
      </Card>

      {/* 断路器控制区域 */}
      {commandFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('breaker_control')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {commandFields.map((field) => {
                const isOpenCommand = field.field_key === 'breaker_open_command'
                const isCloseCommand = field.field_key === 'breaker_close_command'
                const displayName = getFieldDisplayText(field)

                if (isOpenCommand) {
                  return (
                    <Button
                      key={field.id}
                      variant="destructive"
                      onClick={() => onBreakerControl?.('open', field.field_key)}
                    >
                      {displayName}
                    </Button>
                  )
                }
                if (isCloseCommand) {
                  return (
                    <Button
                      key={field.id}
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => onBreakerControl?.('close', field.field_key)}
                    >
                      {displayName}
                    </Button>
                  )
                }
                return null
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 拓扑图区域（暂时占位，后续实现） */}
      <Card>
        <CardHeader>
          <CardTitle>{t('pack_status_series', '包拓扑')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {t('bms.level2.sys.topology_coming_soon', '拓扑图功能开发中，将根据层级配置显示包节点')}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
