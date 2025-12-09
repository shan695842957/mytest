/**
 * BMS EVT Tab 组件（通用，适用于二级和三级架构）
 * 按配置渲染事件记录，从 WebSocket 缓存读取实时值
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { getBMSFieldConfigList, type BMSFieldConfig } from '@/api/bms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface BMSEvtTabProps {
  instanceId: number
  // WebSocket 缓存数据（key: field_key, value: 实时值）
  realtimeValues?: Record<string, any>
}

export function BMSEvtTab({
  instanceId,
  realtimeValues = {},
}: BMSEvtTabProps) {
  const { t, i18n } = useTranslation('bms')

  // 获取 EVT 页面字段配置
  const { data: fieldConfigsData, isLoading } = useQuery({
    queryKey: ['bms-field-configs', instanceId, 'EVT'],
    queryFn: () => getBMSFieldConfigList(instanceId, 'EVT'),
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

  // 格式化字段值显示
  const formatFieldValue = (field: BMSFieldConfig): string => {
    const value = getFieldValue(field)
    
    if (value === null || value === undefined) {
      return '--'
    }
    
    if (typeof value === 'boolean') {
      return value ? t('yes') : t('no')
    }
    
    return String(value)
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

  // TODO: 这里应该显示事件记录列表，而不是字段配置
  // 目前暂时显示字段配置，等后端提供事件记录API后再替换
  if (sortedFields.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            {t('bms.evt.no_events', '暂无事件记录')}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 当前激活的遥信量 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('active_telecontrols')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {sortedFields
              .filter(field => {
                const value = getFieldValue(field)
                return value === true || value === 1
              })
              .map((field) => (
                <Badge key={field.id} variant="destructive" className="text-xs px-3 py-1">
                  {getFieldDisplayText(field)}
                </Badge>
              ))}
            {sortedFields.filter(field => {
              const value = getFieldValue(field)
              return value === true || value === 1
            }).length === 0 && (
              <span className="text-sm text-muted-foreground">
                {t('bms.evt.no_active_telecontrols', '暂无激活的遥信量')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 事件记录表 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('event_log')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('time')}</TableHead>
                <TableHead>{t('category')}</TableHead>
                <TableHead>{t('details')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* TODO: 这里应该显示实际的事件记录数据，而不是字段配置 */}
              {/* 等后端提供事件记录API后，替换为实际数据 */}
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  {t('bms.evt.event_log_coming_soon', '事件记录功能开发中，将显示系统遥控信息')}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 提示信息 */}
      <div className="text-xs text-muted-foreground">
        {t('bms.evt.no_realtime_tip', '实时值依赖 WebSocket 数据，未收到时显示空值。')}
      </div>
    </div>
  )
}
