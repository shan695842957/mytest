/**
 * 二级架构 BMS 可视化组件
 * 电池簇 → 电池包 → 单体
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, Battery, Zap, AlertTriangle, Thermometer } from 'lucide-react'
import type { Level2BMSData, Level2BMSConfig, DataField, BreakerStatus } from '@/types/bms'

interface Level2BMSVisualizationProps {
  data: Level2BMSData
  config: Level2BMSConfig
}

export function Level2BMSVisualization({ data, config }: Level2BMSVisualizationProps) {
  const [expandedPacks, setExpandedPacks] = useState<Set<number>>(new Set([1])) // 默认展开第一个包
  
  const togglePack = (packId: number) => {
    const newSet = new Set(expandedPacks)
    if (newSet.has(packId)) {
      newSet.delete(packId)
    } else {
      newSet.add(packId)
    }
    setExpandedPacks(newSet)
  }
  
  // 渲染数据字段
  const renderFields = (fields: DataField[]) => {
    if (fields.length === 0) return null
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
        {fields.map((field, idx) => (
          <div key={idx} className="flex items-center gap-1">
            <span className="text-muted-foreground">{field.name}:</span>
            <span className="font-semibold">
              {field.value.toFixed(2)}{field.unit}
            </span>
          </div>
        ))}
      </div>
    )
  }
  
  // 渲染断路器状态
  const renderBreaker = (breaker: BreakerStatus) => {
    if (breaker.closed !== undefined) {
      // 统一模式
      return (
        <Badge variant={breaker.closed ? 'default' : 'secondary'}>
          {breaker.closed ? '合闸' : '分闸'}
        </Badge>
      )
    } else {
      // 分离模式
      return (
        <div className="flex gap-2">
          <Badge variant={breaker.positiveClosed ? 'default' : 'secondary'}>
            正极: {breaker.positiveClosed ? '合闸' : '分闸'}
          </Badge>
          <Badge variant={breaker.negativeClosed ? 'default' : 'secondary'}>
            负极: {breaker.negativeClosed ? '合闸' : '分闸'}
          </Badge>
        </div>
      )
    }
  }
  
  // 获取状态颜色
  const getStatusColor = (fault?: boolean) => {
    return fault
      ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
      : 'border-border'
  }
  
  return (
    <div className="space-y-4">
      {/* 簇高压箱 */}
      <Card className={cn('border-2', getStatusColor(data.highVoltageBox.fault))}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="size-5" />
              簇高压箱
            </CardTitle>
            <div className="flex items-center gap-2">
              {renderBreaker(data.highVoltageBox.breaker)}
              {data.highVoltageBox.fault && (
                <Badge variant="destructive">
                  <AlertTriangle className="size-3 mr-1" />
                  故障
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.highVoltageBox.faultMessage && (
            <div className="mb-3 text-sm text-red-600 dark:text-red-400">
              {data.highVoltageBox.faultMessage}
            </div>
          )}
          {renderFields(data.highVoltageBox.fields)}
          {data.highVoltageBox.fields.length === 0 && (
            <div className="text-sm text-muted-foreground">暂无数据</div>
          )}
        </CardContent>
      </Card>
      
      {/* 电池包列表 */}
      <div className="space-y-3">
        {data.packs.map(pack => {
          const isPackExpanded = expandedPacks.has(pack.id)
          
          return (
            <Card key={pack.id} className={cn('border-2', getStatusColor(pack.fault))}>
              <Collapsible open={isPackExpanded} onOpenChange={() => togglePack(pack.id)}>
                <CollapsibleTrigger className="w-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isPackExpanded ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                        <CardTitle className="flex items-center gap-2">
                          <Battery className="size-5" />
                          {pack.name}
                        </CardTitle>
                        <Badge variant="outline">
                          {pack.cells.length} 个单体
                        </Badge>
                        <Badge variant="outline">
                          {pack.temperaturePoints.length} 个温度测点
                        </Badge>
                      </div>
                      {pack.fault && (
                        <Badge variant="destructive">
                          <AlertTriangle className="size-3 mr-1" />
                          故障
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    {/* 电池包字段 */}
                    {pack.fields.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-semibold mb-2">包数据</div>
                        {renderFields(pack.fields)}
                      </div>
                    )}
                    
                    {pack.faultMessage && (
                      <div className="mb-4 text-sm text-red-600 dark:text-red-400">
                        {pack.faultMessage}
                      </div>
                    )}
                    
                    <Separator className="my-4" />
                    
                    {/* 电池单体 - 使用局部滚动 */}
                    <div className="mb-4">
                      <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Battery className="size-4" />
                        电池单体 ({pack.cells.length}个)
                      </div>
                      <ScrollArea className="h-[300px] border rounded-lg p-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                          {pack.cells.map(cell => {
                            const voltageField = cell.fields.find(f => f.name === '电压')
                            const isAbnormal = voltageField && (voltageField.value < 2.8 || voltageField.value > 4.3)
                            
                            return (
                              <div
                                key={cell.id}
                                className={cn(
                                  'p-2 rounded border text-xs',
                                  isAbnormal
                                    ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                                    : 'border-border'
                                )}
                              >
                                <div className="font-semibold mb-1">#{cell.id}</div>
                                {cell.fields.map((field, idx) => (
                                  <div key={idx} className="flex justify-between gap-1">
                                    <span className="text-muted-foreground">{field.name}:</span>
                                    <span className={cn(
                                      'font-semibold',
                                      isAbnormal && field.name === '电压' && 'text-red-600 dark:text-red-400'
                                    )}>
                                      {field.value.toFixed(2)}{field.unit}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                    
                    {/* 温度测点 - 使用局部滚动 */}
                    <div>
                      <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Thermometer className="size-4" />
                        温度测点 ({pack.temperaturePoints.length}个)
                      </div>
                      <ScrollArea className="h-[200px] border rounded-lg p-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                          {pack.temperaturePoints.map(tp => {
                            const isAbnormal = tp.temperature > 45 || tp.temperature < 10
                            
                            return (
                              <div
                                key={tp.id}
                                className={cn(
                                  'p-2 rounded border text-xs',
                                  isAbnormal
                                    ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                                    : 'border-border'
                                )}
                              >
                                <div className="font-semibold mb-1">T{tp.id}</div>
                                <div className={cn(
                                  'font-semibold',
                                  isAbnormal && 'text-red-600 dark:text-red-400'
                                )}>
                                  {tp.temperature.toFixed(1)}°C
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )
        })}
      </div>
      
      {/* 配置信息 */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">配置信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1 text-muted-foreground">
            <div>电池包数量: {config.packCount}</div>
            <div>每包单体数量: {config.cellCountPerPack}</div>
            <div>每包温度测点数量: {config.temperaturePointCountPerPack}</div>
            <div>单体配置: {config.cellConfiguration.series}串 {config.cellConfiguration.parallel}并</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
