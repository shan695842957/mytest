/**
 * BMS 二级架构 SYS Tab 组件
 * 按配置渲染字段，从 WebSocket 缓存读取实时值
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  getBMSFieldConfigList,
  getBMSHierarchyConfig,
  type BMSFieldConfig,
  type BMSHierarchyConfig,
} from '@/api/bms'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Thermometer, XCircle } from 'lucide-react'
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
  const {
    data: fieldConfigsData,
    isLoading: isFieldLoading,
  } = useQuery({
    queryKey: ['bms-field-configs', instanceId, 'SYS'],
    queryFn: () => getBMSFieldConfigList(instanceId, 'SYS'),
    enabled: !!instanceId,
  })

  // 获取层级配置，用于渲染包拓扑概览
  const {
    data: hierarchyData,
    isLoading: isHierarchyLoading,
  } = useQuery({
    queryKey: ['bms-hierarchy-config', instanceId],
    queryFn: () => getBMSHierarchyConfig(instanceId),
    enabled: !!instanceId,
  })

  const fieldConfigs = (fieldConfigsData?.data as BMSFieldConfig[] | null | undefined) || []
  const hierarchyConfig = hierarchyData?.data as BMSHierarchyConfig | undefined

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
      const unknown = value === null || value === undefined
      return (
        <div key={field.id} className="bg-muted/50 rounded-lg p-4 flex flex-col justify-end">
          <div className="text-xs text-muted-foreground mb-1">{displayName}</div>
          {unknown ? (
            <Badge variant="secondary" className="w-full justify-center">
              --
            </Badge>
          ) : (
            <Badge
              variant={hasFault ? 'destructive' : 'secondary'}
              className="w-full justify-center"
            >
              {hasFault ? t('fault') : t('normal')}
            </Badge>
          )}
        </div>
      )
    }

    // 断路器状态特殊处理
    if (field.field_key === 'breaker_status') {
      const isClosed = value === true || value === 1
      const unknown = value === null || value === undefined
      return (
        <div key={field.id} className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{displayName}:</span>
          {unknown ? (
            <Badge variant="secondary">--</Badge>
          ) : isClosed ? (
            <Badge variant="default" className="bg-green-500 text-white">
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

  const isLoading = isFieldLoading || isHierarchyLoading

  const packCards = useMemo(() => {
    if (!hierarchyConfig) return []
    return Array.from({ length: hierarchyConfig.pack_count_per_cluster }, (_, index) => ({
      id: index + 1,
      cells: hierarchyConfig.series_count * hierarchyConfig.parallel_count,
    }))
  }, [hierarchyConfig])

  const summaryChips = useMemo(() => {
    if (!hierarchyConfig) return []
    return [
      {
        label: t('sys.series_parallel', '串并配置'),
        value: `${hierarchyConfig.series_count}S × ${hierarchyConfig.parallel_count}P`,
      },
      {
        label: t('sys.pack_total', '包数量'),
        value: hierarchyConfig.pack_count_per_cluster,
      },
      {
        label: t('sys.temperature_points', '温度测点'),
        value: hierarchyConfig.temperature_point_count || 0,
      },
    ]
  }, [hierarchyConfig, t])

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
          {summaryChips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {summaryChips.map((chip) => (
                <div
                  key={chip.label}
                  className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                >
                  {chip.label}:{' '}
                  <span className="font-semibold text-foreground">{chip.value}</span>
                </div>
              ))}
            </div>
          )}
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

      {/* 包拓扑概览 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('pack_status_series', '包拓扑')}</CardTitle>
          {hierarchyConfig && (
            <CardDescription>
              {t('sys.pack_overview_desc', {
                count: hierarchyConfig.pack_count_per_cluster,
                cells: hierarchyConfig.series_count * hierarchyConfig.parallel_count,
              })}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {hierarchyConfig ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {packCards.map((pack) => (
                <div
                  key={pack.id}
                  className="rounded-2xl border bg-card/60 p-4 shadow-sm transition hover:border-primary/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      {t('pack', '包')} #{pack.id.toString().padStart(2, '0')}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {hierarchyConfig.series_count}S · {hierarchyConfig.parallel_count}P
                    </Badge>
                  </div>
                  <div className="mt-3 text-2xl font-bold">--</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('sys.pack_temperature_points', {
                      count: hierarchyConfig.temperature_point_count ?? 0,
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <Thermometer className="h-4 w-4" />
              {t('sys.no_hierarchy_config', '尚未配置层级信息，请在BMS管理中完善簇/包数量。')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
