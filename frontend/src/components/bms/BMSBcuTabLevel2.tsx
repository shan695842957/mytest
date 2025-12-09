/**
 * BMS 二级架构 BCU Tab 组件
 * 按配置渲染字段，从 WebSocket 缓存读取实时值
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { getBMSFieldConfigList, type BMSFieldConfig } from '@/api/bms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface BMSBcuTabLevel2Props {
  instanceId: number
  // WebSocket 缓存数据（key: field_key, value: 实时值）
  realtimeValues?: Record<string, any>
  // 故障复位回调
  onFaultReset?: () => void
}

export function BMSBcuTabLevel2({
  instanceId,
  realtimeValues = {},
  onFaultReset,
}: BMSBcuTabLevel2Props) {
  const { t, i18n } = useTranslation('bms')

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

  // 格式化字段值显示
  const formatFieldValue = (field: BMSFieldConfig): string => {
    const value = getFieldValue(field)
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
                  {formatFieldValue(field)}
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
                onFaultReset()
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
