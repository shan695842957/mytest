/**
 * BMS 二级架构 BMU Tab 组件
 * 按配置渲染字段，从 WebSocket 缓存读取实时值
 */

import { useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { getBMSFieldConfigList, type BMSFieldConfig } from '@/api/bms'
import { getBMSHierarchyConfig, type BMSHierarchyConfig } from '@/api/bms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface BMSBmuTabLevel2Props {
  instanceId: number
  // WebSocket 缓存数据（key: field_key, value: 实时值）
  realtimeValues?: Record<string, any>
}

export function BMSBmuTabLevel2({
  instanceId,
  realtimeValues = {},
}: BMSBmuTabLevel2Props) {
  const { t, i18n } = useTranslation('bms')
  const [selectedPackId, setSelectedPackId] = useState<string>('')
  const [activeSubTab, setActiveSubTab] = useState<'cell' | 'temperature'>('cell')

  // 获取层级配置（用于获取包列表）
  const { data: hierarchyData } = useQuery({
    queryKey: ['bms-hierarchy-config', instanceId],
    queryFn: () => getBMSHierarchyConfig(instanceId),
    enabled: !!instanceId,
  })

  const hierarchyConfig = (hierarchyData?.data as BMSHierarchyConfig | null | undefined)

  // 根据层级配置生成包列表（虚拟ID）
  const packs = useMemo(() => {
    if (!hierarchyConfig) return []
    const packCount = hierarchyConfig.pack_count_per_cluster || 0
    return Array.from({ length: packCount }, (_, i) => ({
      id: `pack-${i + 1}`,
      number: i + 1,
    }))
  }, [hierarchyConfig])

  // 自动选择第一个包
  useEffect(() => {
    if (packs.length > 0 && !selectedPackId) {
      setSelectedPackId(packs[0].id)
    }
  }, [packs, selectedPackId])

  // 获取 BMU 页面字段配置
  const { data: fieldConfigsData, isLoading } = useQuery({
    queryKey: ['bms-field-configs', instanceId, 'BMU'],
    queryFn: () => getBMSFieldConfigList(instanceId, 'BMU'),
    enabled: !!instanceId,
  })

  const fieldConfigs = (fieldConfigsData?.data as BMSFieldConfig[] | null | undefined) || []

  // 按 sort_order 排序
  const sortedFields = useMemo(() => {
    return [...fieldConfigs].sort((a, b) => a.sort_order - b.sort_order)
  }, [fieldConfigs])

  // 获取字段显示值（从 WebSocket 缓存或占位）
  const getFieldValue = (field: BMSFieldConfig, packId?: string): string | number | boolean | null => {
    // TODO: 根据packId获取对应包的实时值
    const key = packId ? `${packId}.${field.field_key}` : field.field_key
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
  const formatFieldValue = (field: BMSFieldConfig, packId?: string): string => {
    const value = getFieldValue(field, packId)
    const unit = getUnitText(field)
    
    if (value === null || value === undefined) {
      return '--'
    }
    
    if (field.data_type === 'boolean') {
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

  return (
    <div className="space-y-6">
      {/* 包选择器 */}
      {packs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('select_pack')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {t('pack')}:
              </span>
              <Select
                value={selectedPackId}
                onValueChange={setSelectedPackId}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {packs.map((pack) => (
                    <SelectItem key={pack.id} value={pack.id}>
                      {i18n.language === 'zh-CN' 
                        ? `包${pack.number}` 
                        : `Pack ${pack.number}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 子Tab：单体信息 / 温度测点 */}
      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as 'cell' | 'temperature')}>
        <TabsList>
          <TabsTrigger value="cell">{t('cell_information')}</TabsTrigger>
          <TabsTrigger value="temperature">{t('temperature_points')}</TabsTrigger>
        </TabsList>

        <TabsContent value="cell" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('cell_data')}</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedFields.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {t('bms.bmu.no_fields_configured', '暂无字段配置，请在配置页面添加字段')}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {sortedFields.map((field) => (
                    <Card key={field.id} className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">
                        {getFieldDisplayText(field)}
                      </div>
                      <div className="text-lg font-bold">
                        {formatFieldValue(field, selectedPackId)}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="temperature" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('temperature_points')}</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedFields.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {t('bms.bmu.no_temperature_fields', '暂无温度字段配置')}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {sortedFields.map((field) => (
                    <Card key={field.id} className="p-4">
                      <div className="text-sm text-muted-foreground mb-1">
                        {getFieldDisplayText(field)}
                      </div>
                      <div className="text-lg font-bold">
                        {formatFieldValue(field, selectedPackId)}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 提示信息 */}
      <div className="text-xs text-muted-foreground">
        {t('bms.bmu.no_realtime_tip', '实时值依赖 WebSocket 数据，未收到时显示空值。')}
      </div>
    </div>
  )
}
