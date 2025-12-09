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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  // SYS页面固定字段预设（与配置页面保持一致）
  const sysFixedFieldPresets: Array<Partial<BMSFieldConfig> & { field_key: string; display_name_zh: string; display_name_en: string; sort_order: number }> = useMemo(
    () => [
      { field_key: 'fault', display_name_zh: '告警状态', display_name_en: 'Fault Status', field_type: 'fixed', sort_order: 1 },
      { field_key: 'voltage', display_name_zh: '电压', display_name_en: 'Voltage', field_type: 'fixed', sort_order: 2 },
      { field_key: 'current', display_name_zh: '电流', display_name_en: 'Current', field_type: 'fixed', sort_order: 3 },
      { field_key: 'power', display_name_zh: '功率', display_name_en: 'Power', field_type: 'fixed', sort_order: 4 },
      { field_key: 'breaker_status', display_name_zh: '分合闸状态', display_name_en: 'Breaker Status', field_type: 'fixed', sort_order: 5 },
      { field_key: 'breaker_open_command', display_name_zh: '分闸指令', display_name_en: 'Breaker Open Command', field_type: 'fixed', sort_order: 6 },
      { field_key: 'breaker_close_command', display_name_zh: '合闸指令', display_name_en: 'Breaker Close Command', field_type: 'fixed', sort_order: 7 },
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

  const packCards = useMemo(() => {
    if (!hierarchyConfig) return []
    return Array.from({ length: hierarchyConfig.pack_count_per_cluster }, (_, index) => ({
      id: index + 1,
      cells: hierarchyConfig.series_count * hierarchyConfig.parallel_count,
    }))
  }, [hierarchyConfig])

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
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {dynamicFields.map(renderDynamicField)}
              </div>
            </div>
          )}
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

      {/* 包拓扑概览 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('pack_status_series', '包拓扑')}</CardTitle>
        </CardHeader>
        <CardContent>
          {hierarchyConfig ? (
            hierarchyConfig.pack_count_per_cluster > 0 ? (
              <div className="max-h-96 overflow-y-auto py-6">
                <div className="flex flex-col items-center gap-8">
                  {Array.from({ length: hierarchyConfig.pack_count_per_cluster }).map((_, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {t('pack', '包')} {index + 1}
                        </span>
                        <div className="w-44 h-20 rounded-md border border-border bg-card shadow-sm flex items-center justify-center text-base font-semibold">
                          P{(index + 1).toString().padStart(2, '0')}
                        </div>
                      </div>
                      {index < hierarchyConfig.pack_count_per_cluster - 1 && (
                        <div className="w-px h-14 bg-border mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                {t('bms.hierarchy_config.pack_hint', '请在层级配置中设置包数量以生成拓扑图')}
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <Thermometer className="h-4 w-4" />
              {t('sys.no_hierarchy_config', '尚未配置层级信息，请在BMS管理中完善包参数。')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
