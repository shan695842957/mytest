/**
 * 日期范围选择器组件
 * 一个复合组件，同时选择开始和结束时间
 */

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = '选择日期范围...',
  className,
}: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>(value)

  useEffect(() => {
    setDate(value)
  }, [value])

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range)
    onChange?.(range)
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'yyyy-MM-dd HH:mm', { locale: zhCN })} 至{' '}
                  {format(date.to, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </>
              ) : (
                format(date.from, 'yyyy-MM-dd HH:mm', { locale: zhCN })
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={zhCN}
          />
          <div className="flex items-center justify-between border-t p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSelect(undefined)}
            >
              清除
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = new Date()
                handleSelect({ from: today, to: today })
              }}
            >
              今天
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
