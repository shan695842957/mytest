/**
 * BMS 三级架构 BCU Tab 组件
 * 按配置渲染字段，从 WebSocket 缓存读取实时值
 */

import { useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { getBMSFieldConfigList, type BMSFieldConfig } from '@/api/bms'
import { getBMSHierarchyConfig, type BMSHierarchyConfig } from '@/api/bms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface BMSBcuTabLevel3Props {
  instanceId: number
  // WebSocket 缓存数据（key: field_key, value: 实时值）
  realtimeValues?: Record<string, any>
  // 故障复位回调
  onFaultReset?: (clusterId?: string) => void
}

export function BMSBcuTabLevel3({
  instanceId,
  realtimeValues = {},
  onFaultReset,
}: BMSBcuTabLevel3Props) {
  const { t, i18n } = useTranslation('bms')
  const [selectedClusterId, setSelectedClusterId] = useState<string>('')

  // 获取层级配置（用于获取簇列表）
  const { data: hierarchyData } = useQuery({
    queryKey: ['bms-hierarchy-config', instanceId],
    queryFn: () => getBMSHierarchyConfig(instanceId),
    enabled: !!instanceId,
  })

  const hierarchyConfig = (hierarchyData?.data as BMSHierarchyConfig | null | undefined)

  // 根据层级配置生成簇列表（虚拟ID）
  const clusters = useMemo(() => {
    if (!hierarchyConfig) return []
    const clusterCount = hierarchyConfig.cluster_count || 0
    return Array.from({ length: clusterCount }, (_, i) => ({
      id: `cluster-${i + 1}`,
      number: i + 1,
    }))
  }, [hierarchyConfig])

  // 自动选择第一个簇
  useEffect(() => {
    if (clusters.length > 0 && !selectedClusterId) {
      setSelectedClusterId(clusters[0].id)
    }
  }, [clusters, selectedClusterId])

  // 获取 BCU 页面字段配置
  const { data: fieldConfigsData, isLoading } = useQuery({
    queryKey: ['bms-field-configs', instanceId, 'BCU'],
    queryFn: () => getBMSFieldConfigList(instanceId, 'BCU'),
    enabled: !!instanceId,
  })

  const fieldConfigs = (fieldConfigsData?.data as BMSFieldConfig[] | null | undefined) || []

  // 按 sort_order 排序
  const sortedFields = useMemo(() => {
    return [...fieldConfigs].sort((a, b) => a.sort_order - b.sort_order)
  }, [fieldConfigs])

  // 获取字段显示值（从 WebSocket 缓存或占位）
  const getFieldValue = (field: BMSFieldConfig, clusterId?: string): string | number | boolean | null => {
    // TODO: 根据clusterId获取对应簇的实时值
    // 目前暂时使用全局的realtimeValues
    const key = clusterId ? `${clusterId}.${field.field_key}` : field.field_key
    const value = realtimeValues[key] ?? realtimeValues[field.field_key]
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

  // 格式化字段值显示
  const formatFieldValue = (field: BMSFieldConfig, clusterId?: string): string => {
    const value = getFieldValue(field, clusterId)
    const unit = getUnitText(field)
    
    if (value === null || value === undefined) {
      return '--'
    }
    
    if (typeof value === 'boolean') {
      return value ? t('yes') : t('no')
    }
    
    return `${value}${unit ? ' ' + unit : ''}`
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">{t('common:loading')}</div>
        </CardContent>
      </Card>
    )
  }

  if (sortedFields.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            {t('bms.bcu.no_fields_configured', '暂无字段配置，请在配置页面添加字段')}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 簇选择器 */}
      {clusters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('select_cluster')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {t('cluster')}:
              </span>
              <Select
                value={selectedClusterId}
                onValueChange={setSelectedClusterId}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clusters.map((cluster) => (
                    <SelectItem key={cluster.id} value={cluster.id}>
                      {i18n.language === 'zh-CN' 
                        ? `簇${cluster.number}` 
                        : `Cluster ${cluster.number}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 遥测数据 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('telemetry_data')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {sortedFields.map((field) => (
              <Card key={field.id} className="p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  {getFieldDisplayText(field)}
                </div>
                <div className="text-2xl font-bold">
                  {formatFieldValue(field, selectedClusterId)}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 控制命令 */}
      {onFaultReset && (
        <Card>
          <CardHeader>
            <CardTitle>{t('control_commands')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => {
                onFaultReset(selectedClusterId)
                toast.success(t('fault_reset_success', '故障复位成功'))
              }}
            >
              {t('fault_reset')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 提示信息 */}
      <div className="text-xs text-muted-foreground">
        {t('bms.bcu.no_realtime_tip', '实时值依赖 WebSocket 数据，未收到时显示空值。')}
      </div>
    </div>
  )
}
