/**
 * 时间范围选择器组件 - 级联选择模式
 * 使用日历范围选择 + 时间输入
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import type { DateRange } from "react-day-picker"

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { TimeRange } from '@/types/history'

interface TimeRangePickerProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
  disabled?: boolean
}

export function TimeRangePicker({ value, onChange, disabled }: TimeRangePickerProps) {
  const { t, i18n } = useTranslation('history')
  const [open, setOpen] = useState(false)
  
  // 语言环境
  const locale = i18n.language === 'zh-CN' ? zhCN : enUS
  
  // 临时状态，用于在 Popover 内部操作
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: value.start,
    to: value.end,
  })
  
  // 时间字符串状态 (HH:mm)
  const [startTime, setStartTime] = useState(format(value.start, 'HH:mm'))
  const [endTime, setEndTime] = useState(format(value.end, 'HH:mm'))

  // 当外部 value 变化时同步状态
  useEffect(() => {
    setDateRange({ from: value.start, to: value.end })
    setStartTime(format(value.start, 'HH:mm'))
    setEndTime(format(value.end, 'HH:mm'))
  }, [value])

  // 处理时间变化
  const handleTimeChange = (type: 'start' | 'end', timeStr: string) => {
    if (type === 'start') setStartTime(timeStr)
    else setEndTime(timeStr)
    
    // 尝试更新 value
    if (dateRange?.from && dateRange?.to) {
      const newStart = new Date(dateRange.from)
      const [sh, sm] = (type === 'start' ? timeStr : startTime).split(':').map(Number)
      newStart.setHours(sh, sm)
      
      const newEnd = new Date(dateRange.to)
      const [eh, em] = (type === 'end' ? timeStr : endTime).split(':').map(Number)
      newEnd.setHours(eh, em)
      
      onChange({ start: newStart, end: newEnd })
    }
  }

  // 改进 handleSelect 逻辑以支持即时更新
  const onCalendarSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    if (range?.from) {
      const newStart = new Date(range.from)
      const [sh, sm] = startTime.split(':').map(Number)
      newStart.setHours(sh, sm)
      
      let newEnd = new Date(range.to || range.from) // 如果没有 to，默认为 from
      const [eh, em] = endTime.split(':').map(Number)
      newEnd.setHours(eh, em)
      
      // 确保 end >= start
      if (newEnd < newStart) {
        newEnd = new Date(newStart)
      }
      
      onChange({ start: newStart, end: newEnd })
    }
  }

  // 格式化显示文本
  const formatDisplay = (date: Date) => format(date, 'yyyy/MM/dd HH:mm', { locale })
  const displayText = `${formatDisplay(value.start)} - ${formatDisplay(value.end)}`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 justify-start text-left font-normal w-full",
            "text-xs"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
          <span className="truncate">{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">{t('timeRange.start')}:</span>
              <span className="font-medium">{format(value.start, 'MM-dd')}</span>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => handleTimeChange('start', e.target.value)}
                  className="h-6 w-20 text-xs px-1 py-0"
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">{t('timeRange.end')}:</span>
              <span className="font-medium">{format(value.end, 'MM-dd')}</span>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => handleTimeChange('end', e.target.value)}
                  className="h-6 w-20 text-xs px-1 py-0"
                />
              </div>
            </div>
          </div>
        </div>
        <Calendar
          mode="range"
          defaultMonth={value.start}
          selected={dateRange}
          onSelect={onCalendarSelect}
          numberOfMonths={2}
          initialFocus
          className="p-3"
        />
      </PopoverContent>
    </Popover>
  )
}
