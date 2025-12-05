/**
 * 历史数据查询 - 已选数据点和时间范围组件
 * 精致紧凑的设计，参考 Material Design 3
 */

import { useTranslation } from 'react-i18next'
import { X, Play, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { TimeRangePicker } from './TimeRangePicker'
import type { SelectedDataPoint, TimeRange } from '@/types/history'

interface HistorySelectedPointsProps {
  selectedPoints: SelectedDataPoint[]
  timeRange: TimeRange
  onRemovePoint: (pointId: string) => void
  onTimeRangeChange: (range: TimeRange) => void
  onAnalyze: () => void
  isLoading: boolean
}

export function HistorySelectedPoints({
  selectedPoints,
  timeRange,
  onRemovePoint,
  onTimeRangeChange,
  onAnalyze,
  isLoading,
}: HistorySelectedPointsProps) {
  const { t } = useTranslation('history')
  
  return (
    <div className="space-y-3">
      {/* 已选数据点 - 紧凑展示 */}
      <div>
        <Label className="text-xs font-medium text-muted-foreground mb-2 block">
          {t('selected.title')}
        </Label>
        
        {selectedPoints.length === 0 ? (
          <div className="h-10 flex items-center justify-center border border-dashed rounded-md bg-muted/30">
            <p className="text-xs text-muted-foreground">{t('selected.empty')}</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {selectedPoints.map(point => (
              <Badge
                key={point.id}
                variant="secondary"
                className="flex items-center gap-1 h-7 px-2 text-xs font-normal"
              >
                <span className="max-w-[280px] truncate">{point.fullPath}</span>
                <button
                  onClick={() => onRemovePoint(point.id)}
                  className="ml-0.5 hover:bg-destructive/20 rounded-full p-0.5 transition-colors -mr-0.5"
                  title={t('selected.remove')}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      {/* 时间范围选择和操作按钮 - 紧凑布局 */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label className="text-xs font-medium text-muted-foreground mb-2 block">
            {t('timeRange.label')}
          </Label>
          <TimeRangePicker
            value={timeRange}
            onChange={onTimeRangeChange}
            disabled={isLoading}
          />
        </div>
        
        {/* 开始分析按钮 - 主要操作 */}
        <Button
          onClick={onAnalyze}
          disabled={selectedPoints.length === 0 || isLoading}
          size="default"
          className="h-9 px-4 min-w-[100px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              <span className="text-xs">{t('analyze.loading')}</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 mr-1.5" />
              <span className="text-xs">{t('analyze.button')}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
