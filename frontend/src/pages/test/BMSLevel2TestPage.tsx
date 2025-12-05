/**
 * 二级架构 BMS 展示页面
 * 电池簇 → 电池包（通常5个） → 单体（每包50-60个）
 * 每个电池包有15-20个温度测点
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { Battery, Thermometer, ChevronDown, ChevronRight } from 'lucide-react'

// 电池单体数据
interface BatteryCell {
  id: number
  voltage: number // 电压 (V)
  temperature?: number // 温度 (°C) - 不是每个单体都有
  status: 'normal' | 'warning' | 'alarm'
}

// 电池包数据
interface BatteryPack {
  id: number
  name: string
  cells: BatteryCell[] // 50-60个单体
  tempSensors: number[] // 15-20个温度测点
  totalVoltage: number // 总电压
  avgVoltage: number // 平均电压
  minVoltage: number // 最小电压
  maxVoltage: number // 最大电压
  avgTemperature: number // 平均温度
  minTemperature: number // 最低温度
  maxTemperature: number // 最高温度
  status: 'normal' | 'warning' | 'alarm'
}

// 电池簇数据
interface BatteryCluster {
  id: number
  name: string
  displayName: string
  packs: BatteryPack[] // 通常5个电池包
  totalVoltage: number // 簇总电压
  totalCurrent: number // 簇总电流
  soc: number // SOC (%)
  soh: number // SOH (%)
  status: 'normal' | 'warning' | 'alarm'
}

// 模拟电池簇列表
const mockClusters: BatteryCluster[] = [
  { id: 1, name: 'CLUSTER_01', displayName: '1号电池簇', packs: [], totalVoltage: 0, totalCurrent: 0, soc: 0, soh: 0, status: 'normal' },
  { id: 2, name: 'CLUSTER_02', displayName: '2号电池簇', packs: [], totalVoltage: 0, totalCurrent: 0, soc: 0, soh: 0, status: 'normal' },
  { id: 3, name: 'CLUSTER_03', displayName: '3号电池簇', packs: [], totalVoltage: 0, totalCurrent: 0, soc: 0, soh: 0, status: 'normal' },
]

// 生成电池簇数据
const generateClusterData = (cluster: BatteryCluster): BatteryCluster => {
  const packCount = 5 // 通常5个电池包
  const cellsPerPack = 55 // 每包55个单体（50-60之间）
  const tempSensorsPerPack = 18 // 每包18个温度测点（15-20之间）
  
  const packs: BatteryPack[] = []
  let clusterTotalVoltage = 0
  let clusterMinVoltage = Infinity
  let clusterMaxVoltage = -Infinity
  let clusterMinTemp = Infinity
  let clusterMaxTemp = -Infinity
  let hasAlarm = false
  let hasWarning = false
  
  for (let packId = 1; packId <= packCount; packId++) {
    const cells: BatteryCell[] = []
    const tempSensors: number[] = []
    
    // 生成单体数据
    let packMinVoltage = Infinity
    let packMaxVoltage = -Infinity
    let packMinTemp = Infinity
    let packMaxTemp = -Infinity
    let packHasAlarm = false
    let packHasWarning = false
    
    for (let cellId = 1; cellId <= cellsPerPack; cellId++) {
      // 正常电压范围：3.0V - 4.2V
      const voltage = 3.5 + (Math.random() - 0.5) * 0.5
      const isAbnormal = Math.random() > 0.92 // 8%概率异常
      const abnormalVoltage = isAbnormal ? (Math.random() > 0.5 ? 2.5 : 4.5) : voltage
      
      let status: 'normal' | 'warning' | 'alarm' = 'normal'
      if (abnormalVoltage < 2.8 || abnormalVoltage > 4.3) {
        status = 'alarm'
        packHasAlarm = true
        hasAlarm = true
      } else if (abnormalVoltage < 3.0 || abnormalVoltage > 4.2) {
        status = 'warning'
        packHasWarning = true
        hasWarning = true
      }
      
      cells.push({
        id: cellId,
        voltage: abnormalVoltage,
        status,
      })
      
      packMinVoltage = Math.min(packMinVoltage, abnormalVoltage)
      packMaxVoltage = Math.max(packMaxVoltage, abnormalVoltage)
    }
    
    // 生成温度传感器数据
    for (let tempId = 1; tempId <= tempSensorsPerPack; tempId++) {
      const temp = 25 + (Math.random() - 0.5) * 10
      const isAbnormal = Math.random() > 0.95 // 5%概率异常
      const abnormalTemp = isAbnormal ? (Math.random() > 0.5 ? 55 : 0) : temp
      tempSensors.push(abnormalTemp)
      
      packMinTemp = Math.min(packMinTemp, abnormalTemp)
      packMaxTemp = Math.max(packMaxTemp, abnormalTemp)
      
      if (abnormalTemp > 50 || abnormalTemp < 5) {
        packHasAlarm = true
        hasAlarm = true
      } else if (abnormalTemp > 45 || abnormalTemp < 10) {
        packHasWarning = true
        hasWarning = true
      }
    }
    
    const packTotalVoltage = cells.reduce((sum, cell) => sum + cell.voltage, 0)
    const packAvgVoltage = packTotalVoltage / cells.length
    const packAvgTemp = tempSensors.reduce((sum, t) => sum + t, 0) / tempSensors.length
    
    packs.push({
      id: packId,
      name: `电池包${packId}`,
      cells,
      tempSensors,
      totalVoltage: packTotalVoltage,
      avgVoltage: packAvgVoltage,
      minVoltage: packMinVoltage,
      maxVoltage: packMaxVoltage,
      avgTemperature: packAvgTemp,
      minTemperature: packMinTemp,
      maxTemperature: packMaxTemp,
      status: packHasAlarm ? 'alarm' : packHasWarning ? 'warning' : 'normal',
    })
    
    clusterTotalVoltage += packTotalVoltage
    clusterMinVoltage = Math.min(clusterMinVoltage, packMinVoltage)
    clusterMaxVoltage = Math.max(clusterMaxVoltage, packMaxVoltage)
    clusterMinTemp = Math.min(clusterMinTemp, packMinTemp)
    clusterMaxTemp = Math.max(clusterMaxTemp, packMaxTemp)
  }
  
  return {
    ...cluster,
    packs,
    totalVoltage: clusterTotalVoltage,
    totalCurrent: 50 + (Math.random() - 0.5) * 20,
    soc: 80 + Math.random() * 20,
    soh: 90 + Math.random() * 10,
    status: hasAlarm ? 'alarm' : hasWarning ? 'warning' : 'normal',
  }
}

export default function BMSLevel2TestPage() {
  const [selectedClusterId, setSelectedClusterId] = useState<number>(1)
  const [clustersData, setClustersData] = useState<Map<number, BatteryCluster>>(() => {
    const map = new Map()
    mockClusters.forEach(cluster => {
      map.set(cluster.id, generateClusterData(cluster))
    })
    return map
  })
  const [expandedPacks, setExpandedPacks] = useState<Set<number>>(new Set())
  
  // 定时更新数据
  useEffect(() => {
    const interval = setInterval(() => {
      setClustersData(() => {
        const newMap = new Map()
        mockClusters.forEach(cluster => {
          newMap.set(cluster.id, generateClusterData(cluster))
        })
        return newMap
      })
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  const selectedCluster = clustersData.get(selectedClusterId)!
  
  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'alarm':
        return 'text-red-500 border-red-500 bg-red-50 dark:bg-red-950'
      case 'warning':
        return 'text-yellow-500 border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
      default:
        return 'text-green-500 border-green-500 bg-green-50 dark:bg-green-950'
    }
  }
  
  // 获取电压颜色
  const getVoltageColor = (voltage: number) => {
    if (voltage < 2.8 || voltage > 4.3) return 'text-red-500'
    if (voltage < 3.0 || voltage > 4.2) return 'text-yellow-500'
    return 'text-green-500'
  }
  
  // 获取温度颜色
  const getTemperatureColor = (temp: number) => {
    if (temp > 50 || temp < 5) return 'text-red-500'
    if (temp > 45 || temp < 10) return 'text-yellow-500'
    return 'text-green-500'
  }
  
  const togglePack = (packId: number) => {
    const newSet = new Set(expandedPacks)
    if (newSet.has(packId)) {
      newSet.delete(packId)
    } else {
      newSet.add(packId)
    }
    setExpandedPacks(newSet)
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>二级架构 BMS 展示</CardTitle>
          <CardDescription>电池簇 → 电池包 → 单体结构</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 设备选择 */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">选择电池簇</label>
            <Select value={String(selectedClusterId)} onValueChange={(v) => setSelectedClusterId(Number(v))}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockClusters.map(cluster => (
                  <SelectItem key={cluster.id} value={String(cluster.id)}>
                    {cluster.displayName} ({cluster.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* 电池簇总体信息 */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-semibold">{selectedCluster.displayName}</div>
                <div className="text-sm text-muted-foreground">{selectedCluster.name}</div>
              </div>
              <Badge variant={selectedCluster.status === 'alarm' ? 'destructive' : selectedCluster.status === 'warning' ? 'default' : 'secondary'}>
                {selectedCluster.status === 'alarm' ? '报警' : selectedCluster.status === 'warning' ? '警告' : '正常'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">总电压</div>
                <div className="text-lg font-semibold">{selectedCluster.totalVoltage.toFixed(1)}V</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">总电流</div>
                <div className="text-lg font-semibold">{selectedCluster.totalCurrent.toFixed(1)}A</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">SOC</div>
                <div className="text-lg font-semibold">{selectedCluster.soc.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">SOH</div>
                <div className="text-lg font-semibold">{selectedCluster.soh.toFixed(1)}%</div>
              </div>
            </div>
          </div>
          
          {/* 电池包展示 */}
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="space-y-4 pr-4">
              {selectedCluster.packs.map(pack => (
                <Collapsible
                  key={pack.id}
                  open={expandedPacks.has(pack.id)}
                  onOpenChange={() => togglePack(pack.id)}
                >
                  <Card className={cn('border-2', getStatusColor(pack.status))}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {expandedPacks.has(pack.id) ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Battery className="size-5" />
                              {pack.name}
                            </CardTitle>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-sm">
                              <div className="text-muted-foreground">总电压: {pack.totalVoltage.toFixed(1)}V</div>
                              <div className="text-muted-foreground">平均温度: {pack.avgTemperature.toFixed(1)}°C</div>
                            </div>
                            <Badge variant={pack.status === 'alarm' ? 'destructive' : pack.status === 'warning' ? 'default' : 'secondary'}>
                              {pack.status === 'alarm' ? '报警' : pack.status === 'warning' ? '警告' : '正常'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                    {/* 电池包总体信息 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-muted-foreground">总电压</div>
                        <div className="text-lg font-semibold">{pack.totalVoltage.toFixed(1)}V</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">平均电压</div>
                        <div className={cn('text-lg font-semibold', getVoltageColor(pack.avgVoltage))}>
                          {pack.avgVoltage.toFixed(3)}V
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">电压范围</div>
                        <div className="text-sm">
                          <span className={cn(getVoltageColor(pack.minVoltage))}>
                            {pack.minVoltage.toFixed(3)}
                          </span>
                          {' ~ '}
                          <span className={cn(getVoltageColor(pack.maxVoltage))}>
                            {pack.maxVoltage.toFixed(3)}V
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">平均温度</div>
                        <div className={cn('text-lg font-semibold', getTemperatureColor(pack.avgTemperature))}>
                          {pack.avgTemperature.toFixed(1)}°C
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    {/* 电池单体展示 - 横向进度条（紧凑布局，每行3-4个） */}
                    <div className="mb-6">
                      <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Battery className="size-4" />
                        电池单体 ({pack.cells.length}个)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {pack.cells.map(cell => {
                          // 计算电压百分比（2.5V-4.5V为显示范围，3.0V-4.2V为正常范围）
                          const voltagePercent = Math.max(0, Math.min(100, ((cell.voltage - 2.5) / (4.5 - 2.5)) * 100))
                          const progressColor = cell.status === 'alarm' ? 'bg-red-500' : 
                                               cell.status === 'warning' ? 'bg-yellow-500' : 
                                               'bg-green-500'
                          const borderColor = cell.status === 'alarm' ? 'border-red-500' : 
                                             cell.status === 'warning' ? 'border-yellow-500' : 
                                             'border-border'
                          
                          return (
                            <Tooltip key={cell.id}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    'flex flex-col gap-1.5 p-2 rounded-lg border-2 transition-all hover:bg-muted/50 cursor-pointer',
                                    borderColor,
                                    cell.status === 'alarm' && 'bg-red-50 dark:bg-red-950/20',
                                    cell.status === 'warning' && 'bg-yellow-50 dark:bg-yellow-950/20'
                                  )}
                                >
                                  {/* 电池图标、编号和电压值 */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Battery className={cn(
                                        'size-3.5',
                                        cell.status === 'alarm' ? 'text-red-500' :
                                        cell.status === 'warning' ? 'text-yellow-500' :
                                        'text-green-500'
                                      )} />
                                      <span className="text-xs font-semibold text-muted-foreground">#{cell.id}</span>
                                    </div>
                                    <span className={cn(
                                      'text-xs font-bold',
                                      getVoltageColor(cell.voltage)
                                    )}>
                                      {cell.voltage.toFixed(3)}V
                                    </span>
                                    {cell.status !== 'normal' && (
                                      <Badge 
                                        variant={cell.status === 'alarm' ? 'destructive' : 'default'}
                                        className="text-[10px] px-1 py-0 h-4"
                                      >
                                        {cell.status === 'alarm' ? '!' : '!'}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {/* 电压进度条 */}
                                  <Progress 
                                    value={voltagePercent} 
                                    className={cn('h-1.5', progressColor)}
                                  />
                                  
                                  {/* 范围提示 */}
                                  <div className="text-[10px] text-muted-foreground text-center">
                                    {cell.voltage < 3.0 ? '偏低' : cell.voltage > 4.2 ? '偏高' : '正常'}
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <div className="font-semibold">电池单体 #{cell.id}</div>
                                  <div className={cn('font-semibold', getVoltageColor(cell.voltage))}>
                                    电压: {cell.voltage.toFixed(3)}V
                                  </div>
                                  <div>状态: {cell.status === 'alarm' ? '报警' : cell.status === 'warning' ? '警告' : '正常'}</div>
                                  <div className="text-xs text-muted-foreground">
                                    范围: 2.5V - 4.5V (正常: 3.0V - 4.2V)
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )
                        })}
                      </div>
                    </div>
                    
                    {/* 温度传感器展示 - 横向进度条（紧凑布局，每行3-4个） */}
                    <div>
                      <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Thermometer className="size-4" />
                        温度传感器 ({pack.tempSensors.length}个)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {pack.tempSensors.map((temp, idx) => {
                          // 计算温度百分比（0-60°C范围）
                          const tempPercent = Math.max(0, Math.min(100, (temp / 60) * 100))
                          const isHigh = temp > 45
                          const isLow = temp < 10
                          const progressColor = isHigh ? 'bg-red-500' : isLow ? 'bg-blue-500' : 'bg-green-500'
                          const borderColor = isHigh ? 'border-red-500' : isLow ? 'border-blue-500' : 'border-border'
                          
                          return (
                            <Tooltip key={idx}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    'flex flex-col gap-1.5 p-2 rounded-lg border-2 transition-all hover:bg-muted/50 cursor-pointer',
                                    borderColor,
                                    isHigh && 'bg-red-50 dark:bg-red-950/20',
                                    isLow && 'bg-blue-50 dark:bg-blue-950/20'
                                  )}
                                >
                                  {/* 温度计图标、编号和温度值 */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Thermometer className={cn(
                                        'size-3.5',
                                        isHigh ? 'text-red-500' : isLow ? 'text-blue-500' : 'text-green-500'
                                      )} />
                                      <span className="text-xs font-semibold text-muted-foreground">T{idx + 1}</span>
                                    </div>
                                    <span className={cn(
                                      'text-xs font-bold',
                                      getTemperatureColor(temp)
                                    )}>
                                      {temp.toFixed(1)}°C
                                    </span>
                                    {(isHigh || isLow) && (
                                      <Badge 
                                        variant={isHigh ? 'destructive' : 'default'}
                                        className="text-[10px] px-1 py-0 h-4"
                                      >
                                        {isHigh ? '!' : '!'}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {/* 温度进度条 */}
                                  <Progress 
                                    value={tempPercent} 
                                    className={cn('h-1.5', progressColor)}
                                  />
                                  
                                  {/* 范围提示 */}
                                  <div className="text-[10px] text-muted-foreground text-center">
                                    {temp > 50 ? '过高' : temp < 5 ? '过低' : temp > 45 ? '偏高' : temp < 10 ? '偏低' : '正常'}
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <div className="font-semibold">温度传感器 T{idx + 1}</div>
                                  <div className={cn('font-semibold', getTemperatureColor(temp))}>
                                    温度: {temp.toFixed(1)}°C
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    范围: 0°C - 60°C (正常: 10°C - 45°C)
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )
                        })}
                      </div>
                    </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

