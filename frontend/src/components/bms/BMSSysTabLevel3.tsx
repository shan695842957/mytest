/**
 * BMS 三级架构 SYS Tab 组件
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
import { CheckCircle2, Layers3, XCircle } from 'lucide-react'

interface BMSSysTabLevel3Props {
  instanceId: number
  // WebSocket 缓存数据（key: field_key, value: 实时值）
  realtimeValues?: Record<string, any>
  // 断路器控制回调
  onBreakerControl?: (action: 'open' | 'close', fieldKey: string) => void
}

export function BMSSysTabLevel3({
  instanceId,
  realtimeValues = {},
  onBreakerControl,
}: BMSSysTabLevel3Props) {
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

  // 获取层级配置，用于簇概览
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

  // SYS页面固定字段预设（与配置页面保持一致）
  const sysFixedFieldPresets: Array<Partial<BMSFieldConfig> & { field_key: string; display_name_zh: string; display_name_en: string; data_type: string; sort_order: number }> = useMemo(
    () => [
      { field_key: 'fault', display_name_zh: '告警状态', display_name_en: 'Fault Status', data_type: 'boolean', field_type: 'fixed', sort_order: 1, is_required: true },
      { field_key: 'voltage', display_name_zh: '电压', display_name_en: 'Voltage', data_type: 'number', field_type: 'fixed', sort_order: 2, is_required: true },
      { field_key: 'current', display_name_zh: '电流', display_name_en: 'Current', data_type: 'number', field_type: 'fixed', sort_order: 3, is_required: true },
      { field_key: 'power', display_name_zh: '功率', display_name_en: 'Power', data_type: 'number', field_type: 'fixed', sort_order: 4, is_required: true },
      { field_key: 'breaker_status', display_name_zh: '分合闸状态', display_name_en: 'Breaker Status', data_type: 'boolean', field_type: 'fixed', sort_order: 5, is_required: true },
      { field_key: 'breaker_open_command', display_name_zh: '分闸指令', display_name_en: 'Breaker Open Command', data_type: 'boolean', field_type: 'fixed', sort_order: 6, is_required: true },
      { field_key: 'breaker_close_command', display_name_zh: '合闸指令', display_name_en: 'Breaker Close Command', data_type: 'boolean', field_type: 'fixed', sort_order: 7, is_required: true },
    ],
    []
  )

  // 分离固定字段和动态字段（合并配置和预设）
  const { fixedFields, dynamicFields, commandFields } = useMemo(() => {
    const fixed: BMSFieldConfig[] = []
    const dynamic: BMSFieldConfig[] = []
    const commands: BMSFieldConfig[] = []

    // 创建字段配置映射
    const configMap = new Map(fieldConfigs.map((field) => [field.field_key, field]))

    // 处理固定字段：优先使用配置，如果没有则使用预设
    sysFixedFieldPresets.forEach((preset) => {
      const config = configMap.get(preset.field_key)
      const field = (config || {
        ...preset,
        id: 0, // 临时ID，用于key
        bms_instance_id: instanceId,
        page_type: 'SYS',
        unit_zh: '',
        unit_en: '',
        is_required: true,
        is_readable: true,
        is_writable: preset.field_key?.includes('command') ?? false,
        source_type: config?.source_type || '-',
        description_zh: '',
        description_en: '',
        created_at: '',
        updated_at: '',
      }) as BMSFieldConfig

      if (preset.field_key === 'breaker_open_command' || preset.field_key === 'breaker_close_command') {
        commands.push(field)
      } else {
        fixed.push(field)
      }
    })

    // 处理动态字段（排除固定字段）
    const presetKeys = new Set(sysFixedFieldPresets.map((p) => p.field_key))
    fieldConfigs.forEach((field) => {
      if (!presetKeys.has(field.field_key) && field.field_type !== 'fixed') {
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
  }, [fieldConfigs, sysFixedFieldPresets, instanceId])

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
        <div key={field.id || field.field_key} className="bg-muted/50 rounded-lg p-4 flex flex-col justify-end">
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
        <div key={field.id || field.field_key} className="flex items-center gap-2">
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
      <div key={field.id || field.field_key} className="bg-muted/50 rounded-lg p-4">
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
      <div key={field.id || field.field_key}>
        <div className="text-xs text-muted-foreground mb-1">{displayName}</div>
        <div className="text-lg font-semibold">
          {value !== null ? `${value} ${unit ? ' ' + unit : ''}` : '--'}
        </div>
      </div>
    )
  }

  const isLoading = isFieldLoading || isHierarchyLoading

  const summaryChips = useMemo(() => {
    if (!hierarchyConfig) return []
    return [
      {
        label: t('sys.cluster_total', '簇数量'),
        value: hierarchyConfig.cluster_count,
      },
      {
        label: t('sys.pack_total', '每簇包数量'),
        value: hierarchyConfig.pack_count_per_cluster,
      },
      {
        label: t('sys.series_parallel', '串并配置'),
        value: `${hierarchyConfig.series_count}S × ${hierarchyConfig.parallel_count}P`,
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
          <CardTitle>{t('stack_basic_info', '堆基本信息')}</CardTitle>
          <CardDescription>{t('level3.sys.basic_info_desc', '包含固定字段与可配置字段')}</CardDescription>
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
                {t('level3.sys.dynamic_fields', '可配置字段')}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {dynamicFields.map(renderDynamicField)}
              </div>
            </div>
          )}

          {/* 提示信息 */}
          <div className="text-xs text-muted-foreground">
            {t('level3.sys.no_realtime_tip', '实时值依赖 WebSocket 数据，未收到时显示空值。')}
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
                      key={field.id || field.field_key}
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
                      key={field.id || field.field_key}
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

      {/* 簇拓扑概览 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('cluster_topology', '簇拓扑')}</CardTitle>
          {hierarchyConfig && (
            <CardDescription>
              {t('sys.cluster_overview_desc', {
                count: hierarchyConfig.cluster_count,
                packs: hierarchyConfig.pack_count_per_cluster,
              })}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {hierarchyConfig ? (
            hierarchyConfig.cluster_count > 0 ? (
              <div className="overflow-x-auto py-4">
                <div className="min-w-[360px]">
                  <div className="relative mb-8">
                    <div className="h-1 w-full rounded-full bg-red-500" />
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-semibold uppercase tracking-[0.2em] text-red-500">
                      {t('level3.sys.dc_bus', 'DC BUS')}
                    </span>
                  </div>
                  <div className="flex items-start gap-6 min-w-max">
                    {Array.from({ length: hierarchyConfig.cluster_count }).map((_, index) => (
                      <div key={index} className="flex flex-col items-center gap-2">
                        <div className="w-px h-6 bg-red-500" />
                        <div className="w-16 h-16 rounded-lg border-2 border-red-500 bg-card flex items-center justify-center text-sm font-semibold">
                          C{(index + 1).toString().padStart(2, '0')}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {t('cluster', '簇')} {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                {t('bms.hierarchy_config.cluster_hint', '请在层级配置中设置簇数量以生成拓扑图')}
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <Layers3 className="h-4 w-4" />
              {t('sys.no_hierarchy_config', '尚未配置层级信息，请在BMS管理中完善簇/包数量。')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
