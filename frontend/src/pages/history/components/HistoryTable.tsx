/**
 * 历史数据查询 - 表格组件
 * 精美的数据表格展示
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Table2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { exportHistoryData } from '@/api/history'
import type { HistoryDataQueryResponse, HistoryDataPoint, TimeRange } from '@/types/history'
import { formatDateTime } from '@/utils/format'
import { toast } from 'sonner'

interface HistoryTableProps {
  data: HistoryDataQueryResponse | null
  isLoading: boolean
  selectedPoints?: HistoryDataPoint[]
  timeRange?: TimeRange
}

export function HistoryTable({
  data,
  isLoading,
  selectedPoints = [],
  timeRange,
}: HistoryTableProps) {
  const { t } = useTranslation('history')
  
  // 转换数据为表格格式
  const tableData = useMemo(() => {
    if (!data || !data.series || data.series.length === 0) {
      return []
    }
    
    // 获取所有时间点
    const allTimes = new Set<string>()
    data.series.forEach(series => {
      series.data.forEach(value => {
        allTimes.add(value.time)
      })
    })
    
    const sortedTimes = Array.from(allTimes).sort()
    
    // 构建表格数据
    return sortedTimes.map(time => {
      const row: Record<string, unknown> = {
        time: new Date(time),
        timestamp: time,
      }
      
      // 为每个系列添加数据
      data.series.forEach(series => {
        const value = series.data.find(v => v.time === time)
        row[`${series.asset_id}_${series.tag_name}`] = value
      })
      
      return row
    })
  }, [data])
  
  // 处理导出
  const handleExport = async () => {
    if (!selectedPoints || selectedPoints.length === 0 || !timeRange) {
      toast.error(t('export.error.no_data'))
      return
    }
    
    try {
      await exportHistoryData({
        data_points: selectedPoints,
        start_time: timeRange.start.toISOString(),
        end_time: timeRange.end.toISOString(),
        format: 'csv',
      })
      toast.success(t('export.success'))
    } catch (error: unknown) {
      console.error('Export failed:', error)
      const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string }
      const errorMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || t('export.error.failed')
      toast.error(errorMsg)
    }
  }
  
  if (isLoading) {
    return (
      <div className="p-6 h-full">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }
  
  if (!data || !data.series || data.series.length === 0) {
    return (
      <div className="h-full flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <Table2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{t('table.empty')}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-3 h-full flex flex-col">
      {/* 导出按钮 */}
      {selectedPoints.length > 0 && timeRange && (
        <div className="flex justify-end px-4 pt-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t('export.button')}
          </Button>
        </div>
      )}
      
      {/* 表格 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="h-full w-full">
          <Table className="min-w-max w-full">
            <TableHeader className="sticky top-0 bg-muted/50 z-10">
              <TableRow>
                <TableHead className="min-w-[180px] font-semibold text-center">{t('table.column.time')}</TableHead>
                {data.series.map(series => (
                  <TableHead key={`${series.asset_id}_${series.tag_name}`} className="min-w-[150px] text-center">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm">{series.asset_display_name}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {series.tag_display_name}
                        {series.engineering_unit && ` (${series.engineering_unit})`}
                      </span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row, index) => (
                <TableRow key={(row.timestamp as string) || index} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm font-medium text-center">
                    {formatDateTime(row.time as Date, 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  {data.series.map(series => {
                    const key = `${series.asset_id}_${series.tag_name}`
                    const value = row[key] as { value: number | null; quality?: number | null } | undefined
                    return (
                      <TableCell key={key} className="text-center font-mono text-sm">
                        {value?.value !== null && value?.value !== undefined
                          ? value.value.toFixed(2)
                          : <span className="text-muted-foreground">N/A</span>}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  )
}
