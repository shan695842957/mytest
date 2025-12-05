/**
 * 历史数据查询 - 图表组件
 * 基于 shadcn/ui Chart 组件，优化大量数据性能
 * 参考: https://ui.shadcn.com/charts/line
 */

import { useMemo, useCallback, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { HistoryDataQueryResponse } from '@/types/history'
import { formatDateTime } from '@/utils/format'
import { BarChart3, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HistoryChartProps {
  data: HistoryDataQueryResponse | null
  isLoading: boolean
}

// 精美的颜色配置 - Material Design 3 调色板
const COLORS = [
  '#1976d2', // blue
  '#d32f2f', // red
  '#388e3c', // green
  '#f57c00', // orange
  '#7b1fa2', // purple
  '#c2185b', // pink
  '#0097a7', // cyan
  '#5d4037', // brown
]

// 性能阈值：超过此数量的数据点将进行降采样
const PERFORMANCE_THRESHOLD = 2000

/**
 * 数据降采样算法 - LTTB (Largest-Triangle-Three-Buckets)
 * 保持数据趋势的同时大幅减少数据点数量
 */
function downsampleData<T extends Record<string, unknown>>(
  data: T[],
  threshold: number
): T[] {
  if (data.length <= threshold) {
    return data
  }

  // 简单均匀采样（对于超大数据集）
  // 对于更精确的采样，可以使用 LTTB 算法
  const step = Math.ceil(data.length / threshold)
  const sampled: T[] = []
  
  // 保留第一个和最后一个点
  sampled.push(data[0])
  
  for (let i = step; i < data.length - step; i += step) {
    sampled.push(data[i])
  }
  
  sampled.push(data[data.length - 1])
  
  return sampled
}

export function HistoryChart({ data, isLoading }: HistoryChartProps) {
  const { t } = useTranslation('history')
  const [seriesVisibility, setSeriesVisibility] = useState<Record<string, boolean>>({})
  
  // 缩放状态
  const [left, setLeft] = useState<string | number>('dataMin')
  const [right, setRight] = useState<string | number>('dataMax')
  const [refAreaLeft, setRefAreaLeft] = useState<string | number>('')
  const [refAreaRight, setRefAreaRight] = useState<string | number>('')
  
  // 为每个系列生成友好的名称和唯一标识
  const seriesConfig = useMemo(() => {
    if (!data || !data.series || data.series.length === 0) {
      return []
    }
    
    return data.series.map((series, index) => {
      const key = `${series.asset_id}_${series.tag_name}`
      const friendlyName = `${series.tag_display_name}${series.engineering_unit ? ` (${series.engineering_unit})` : ''}`
      
      return {
        key,
        color: COLORS[index % COLORS.length],
        friendlyName,
        series,
      }
    })
  }, [data])
  
  useEffect(() => {
    setSeriesVisibility(prev => {
      const next: Record<string, boolean> = {}
      seriesConfig.forEach(({ key }) => {
        next[key] = prev[key] ?? true
      })
      return next
    })
  }, [seriesConfig])
  
  // 转换数据格式为 recharts 需要的格式（带性能优化）
  const chartData = useMemo(() => {
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
    
    // 构建图表数据
    const rawData = sortedTimes.map((time) => {
      const date = new Date(time)
      const item: Record<string, unknown> = {
        time: formatDateTime(date, 'MM/dd HH:mm'),
        timestamp: date.getTime(),
        timeLabel: formatDateTime(date, 'HH:mm'),
      }
      
      // 为每个系列添加数据
      seriesConfig.forEach(({ key }) => {
        const series = data.series.find(s => `${s.asset_id}_${s.tag_name}` === key)
        const value = series?.data.find(v => v.time === time)
        item[key] = value?.value ?? null
      })
      
      return item
    })
    
    // 性能优化：如果数据点过多，进行降采样
    return downsampleData(rawData, PERFORMANCE_THRESHOLD)
  }, [data, seriesConfig])
  
  // 判断是否需要禁用动画（大数据集时）
  const shouldAnimate = chartData.length < 500
  
  // 自定义X轴标签渲染函数 - 使用高对比度颜色确保深色模式可见，紧凑布局
  const renderXAxisTick = useCallback((props: { x: number; y: number; payload: { value: number } }) => {
    const { x, y, payload } = props
    // 当使用 number 类型轴时，payload.value 是时间戳
    const timestamp = payload.value
    
    // 使用高对比度颜色，确保在深色和浅色模式下都清晰可见
    const textColor = '#d1d5db' // gray-300，在深色背景下非常清晰
    
    const date = new Date(timestamp)
    const timeLabel = formatDateTime(date, 'HH:mm')
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={10} 
          textAnchor="middle" 
          fill={textColor}
          fontSize="8"
          fontWeight="400"
        >
          {timeLabel}
        </text>
      </g>
    )
  }, [])
  
  // 缩放处理函数
  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === '' || refAreaLeft === '') {
      setRefAreaLeft('')
      setRefAreaRight('')
      return
    }

    // 确保 left < right
    let newLeft = refAreaLeft
    let newRight = refAreaRight
    if (newLeft > newRight) {
      [newLeft, newRight] = [newRight, newLeft]
    }

    setRefAreaLeft('')
    setRefAreaRight('')
    setLeft(newLeft)
    setRight(newRight)
  }

  const zoomOut = () => {
    setLeft('dataMin')
    setRight('dataMax')
  }

  // Chart 配置
  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {}
    seriesConfig.forEach(({ key, friendlyName, color }) => {
      config[key] = {
        label: friendlyName,
        color,
      }
    })
    return config
  }, [seriesConfig])
  
  // Tooltip 格式化函数 - 兼容 ChartTooltipContent 的 formatter 签名
  const formatTooltipValue = useCallback((value: number | string | Array<number | string>, name: string | number, item: any) => {
    if (value === null || value === undefined) return null
    const config = seriesConfig.find(c => c.key === String(name))
    const unit = config?.series.engineering_unit ? ` ${config.series.engineering_unit}` : ''
    const color = item?.color || config?.color || '#94a3b8'
    const formatted = `${Number(value).toFixed(2)}${unit}`
    return (
      <div className="flex items-center justify-between gap-4 min-w-[12rem]">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-muted-foreground text-xs">
            {config?.friendlyName || name}
          </span>
        </div>
        <span className="font-mono font-semibold text-sm text-foreground">
          {formatted}
        </span>
      </div>
    )
  }, [seriesConfig])
  
  // Tooltip 标签格式化函数
  const formatTooltipLabel = useCallback((label: string | number) => {
    // label 可能是 timestamp (number)
    if (typeof label === 'number') {
      return formatDateTime(new Date(label), 'MM/dd HH:mm')
    }
    return label
  }, [])
  
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-full space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    )
  }
  
  if (!data || !data.series || data.series.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t('chart.empty')}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full w-full flex flex-col relative select-none">
      {/* 顶部工具栏：图例 + 缩放操作 */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-4 pt-2">
        <div className="flex flex-wrap gap-2 flex-1">
          {seriesConfig.map(({ key, color, friendlyName }) => {
            const isVisible = seriesVisibility[key] !== false
            return (
              <button
                key={key}
                type="button"
                onClick={() =>
                  setSeriesVisibility(prev => {
                    const currentlyVisible = prev[key] !== false
                    return { ...prev, [key]: !currentlyVisible }
                  })
                }
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] transition-colors',
                  isVisible
                    ? 'bg-primary/5 border-primary/40 text-foreground shadow-sm'
                    : 'opacity-50 border-border text-muted-foreground'
                )}
              >
                <span
                  className="h-1.5 w-5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="whitespace-nowrap">{friendlyName}</span>
              </button>
            )
          })}
        </div>
        
        {/* 缩放还原按钮 */}
        {(left !== 'dataMin' || right !== 'dataMax') && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs gap-1"
            onClick={zoomOut}
          >
            <RotateCcw className="h-3 w-3" />
            {t('chart.resetZoom') || '还原'}
          </Button>
        )}
      </div>
      
      {/* 图表区域 */}
      <div className="flex-1 min-h-0">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              margin={{ top: 0, right: 20, left: 2, bottom: 20 }}
              onMouseDown={(e) => e && e.activeLabel && setRefAreaLeft(e.activeLabel)}
              onMouseMove={(e) => refAreaLeft && e && e.activeLabel && setRefAreaRight(e.activeLabel)}
              onMouseUp={zoom}
            >
              {/* 网格线 - 水平和垂直，使用固定颜色 */}
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#6b7280" 
                strokeOpacity={0.25}
                vertical={true}
                horizontal={true}
              />
              
              {/* X轴 - 使用 timestamp 并指定 domain 实现缩放 */}
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={[left, right]}
                allowDataOverflow
                tick={renderXAxisTick}
                stroke="#d1d5db"
                strokeOpacity={0.6}
                tickLine={false}
                height={25}
                tickCount={8}
              />
              
              {/* Y轴 - 使用高对比度颜色，确保深色模式清晰可见 */}
              <YAxis
                tick={{ 
                  fill: '#d1d5db', // gray-300，在深色背景下非常清晰可见
                  fontSize: 8,
                  textAnchor: 'end',
                  fontWeight: '400',
                }}
                stroke="#d1d5db"
                strokeOpacity={0.6}
                tickLine={false}
                width={35}
                tickFormatter={(value) => {
                  // 格式化数值，使显示更紧凑
                  if (value >= 1000) {
                    return `${(value / 1000).toFixed(1)}k`
                  }
                  if (value >= 100) {
                    return value.toFixed(0)
                  }
                  return value.toFixed(1)
                }}
              />
              
              {/* Tooltip - 使用 shadcn/ui 的 ChartTooltipContent */}
              <ChartTooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  
                  return (
                    <ChartTooltipContent
                      active={active}
                      payload={payload}
                      label={formatTooltipLabel(label)}
                      formatter={formatTooltipValue}
                      indicator="dot"
                    />
                  )
                }}
              />
              
              {/* 数据系列 */}
              {seriesConfig.map(({ key, color }) => {
                const isVisible = seriesVisibility[key] !== false
                return (
                  <Line
                    key={key}
                    type="linear"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: '#fff' }}
                    name={key}
                    connectNulls={false}
                    isAnimationActive={shouldAnimate}
                    animationDuration={shouldAnimate ? 300 : 0}
                    hide={!isVisible}
                  />
                )
              })}

              {/* 缩放选区高亮
                  使用 CSS 变量 --history-zoom-bg，在 index.css 中为亮/暗模式分别配置
                  这样可以保证在深色模式下依然有足够对比度，不会“看不见” */}
              {refAreaLeft && refAreaRight ? (
                <ReferenceArea 
                  x1={refAreaLeft} 
                  x2={refAreaRight} 
                  strokeOpacity={0.3} 
                  fill="var(--history-zoom-bg)" 
                  fillOpacity={1}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
