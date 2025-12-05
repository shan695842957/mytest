/**
 * PCS 展示页面
 * 储能变流器实时监控页面
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Activity, Zap, Battery, Thermometer } from 'lucide-react'
import { PCSEnergyFlow } from '@/components/pcs'

// PCS 数据接口
interface PCSData {
  // 交流侧数据
  acVoltageAB: number // AB线电压 (V)
  acVoltageBC: number // BC线电压 (V)
  acVoltageCA: number // CA线电压 (V)
  acVoltageA: number // A相电压 (V)
  acVoltageB: number // B相电压 (V)
  acVoltageC: number // C相电压 (V)
  acCurrentA: number // A相电流 (A)
  acCurrentB: number // B相电流 (A)
  acCurrentC: number // C相电流 (A)
  acFrequency: number // 频率 (Hz)
  acActivePower: number // 总有功功率 (kW)
  acReactivePower: number // 总无功功率 (kVar)
  acApparentPower: number // 总视在功率 (kVA)
  acPowerFactor: number // 总功率因数
  
  // 直流侧数据
  dcInputVoltage: number // 直流输入电压/电池电压 (V)
  dcBusVoltage: number // 直流母线电压 (V)
  dcCurrent: number // 直流电流 (A)
  dcPower: number // 直流功率 (kW)
  
  // 运行状态
  mode: 'charging' | 'discharging' | 'standby' | 'fault' // 运行模式
  gridStatus: 'grid_tied' | 'off_grid' | 'stopped' // 并网/离网状态
  systemStatus: 'running' | 'standby' | 'stopped' | 'fault' // 系统启停状态
  
  // 温度
  moduleTemperature: number // 模块温度 (°C)
  ambientTemperature: number // 环境温度 (°C)
  
  // 保护状态
  systemFault: boolean // 系统故障状态
  systemAlarm: boolean // 系统告警状态
  systemDerating: boolean // 系统降额状态
}

// 模拟 PCS 设备列表
const mockPCSDevices = [
  { id: 1, name: 'PCS_01', displayName: '1号PCS' },
  { id: 2, name: 'PCS_02', displayName: '2号PCS' },
  { id: 3, name: 'PCS_03', displayName: '3号PCS' },
]

// 生成模拟数据
const generatePCSData = (): PCSData => {
  const modeRand = Math.random()
  const mode: PCSData['mode'] = 
    modeRand > 0.3 ? 'charging' : 
    modeRand > 0.05 ? 'discharging' : 
    modeRand > 0.01 ? 'standby' : 'fault'
  const hasFault = Math.random() > 0.85 || mode === 'fault'
  const hasAlarm = Math.random() > 0.9
  const hasDerating = Math.random() > 0.92
  
  // 交流侧电压（线电压约380V，相电压约220V）
  const acVoltageAB = 380 + (Math.random() - 0.5) * 40
  const acVoltageBC = 380 + (Math.random() - 0.5) * 40
  const acVoltageCA = 380 + (Math.random() - 0.5) * 40
  const acVoltageA = 220 + (Math.random() - 0.5) * 20
  const acVoltageB = 220 + (Math.random() - 0.5) * 20
  const acVoltageC = 220 + (Math.random() - 0.5) * 20
  
  // 交流侧电流
  const acCurrentA = 50 + Math.random() * 20
  const acCurrentB = 50 + Math.random() * 20
  const acCurrentC = 50 + Math.random() * 20
  
  // 频率
  const acFrequency = 50 + (Math.random() - 0.5) * 0.5
  
  // 功率（充电时为负数，放电时为正数）
  const powerBase = 500 + Math.random() * 200 // 500到700kW
  const acActivePower = mode === 'charging' ? -powerBase : powerBase
  const acReactivePower = (Math.random() - 0.5) * 100
  const acApparentPower = Math.sqrt(acActivePower ** 2 + acReactivePower ** 2)
  const acPowerFactor = Math.abs(acActivePower) / acApparentPower || 0.95
  
  // 直流侧（电池电压约600V）
  const dcInputVoltage = 600 + (Math.random() - 0.5) * 100
  const dcBusVoltage = dcInputVoltage + (Math.random() - 0.5) * 20
  const currentBase = 100 + Math.random() * 50 // 100到150A
  const dcCurrent = mode === 'charging' ? -currentBase : currentBase
  const powerDcBase = 60 + Math.random() * 30 // 60到90kW
  const dcPower = mode === 'charging' ? -powerDcBase : powerDcBase
  
  // 运行状态
  const gridStatus: 'grid_tied' | 'off_grid' | 'stopped' = hasFault ? 'stopped' : Math.random() > 0.5 ? 'grid_tied' : 'off_grid'
  const systemStatus: 'running' | 'standby' | 'stopped' | 'fault' = hasFault ? 'fault' : 'running'
  
  // 温度
  const moduleTemperature = 35 + Math.random() * 15
  const ambientTemperature = 25 + Math.random() * 10
  
  return {
    // 交流侧
    acVoltageAB,
    acVoltageBC,
    acVoltageCA,
    acVoltageA,
    acVoltageB,
    acVoltageC,
    acCurrentA,
    acCurrentB,
    acCurrentC,
    acFrequency,
    acActivePower,
    acReactivePower,
    acApparentPower,
    acPowerFactor,
    
    // 直流侧
    dcInputVoltage,
    dcBusVoltage,
    dcCurrent,
    dcPower,
    
    // 运行状态
    mode,
    gridStatus,
    systemStatus,
    
    // 温度
    moduleTemperature,
    ambientTemperature,
    
    // 保护状态
    systemFault: hasFault,
    systemAlarm: hasAlarm,
    systemDerating: hasDerating,
  }
}

export default function PCSTestPage() {
  const [selectedPCSId, setSelectedPCSId] = useState<number>(1)
  const [pcsData, setPcsData] = useState<Map<number, PCSData>>(() => {
    const map = new Map()
    mockPCSDevices.forEach(pcs => {
      map.set(pcs.id, generatePCSData())
    })
    return map
  })
  
  // 定时更新数据
  useEffect(() => {
    const interval = setInterval(() => {
      setPcsData(prev => {
        const newMap = new Map(prev)
        mockPCSDevices.forEach(pcs => {
          newMap.set(pcs.id, generatePCSData())
        })
        return newMap
      })
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  const selectedPCS = mockPCSDevices.find(p => p.id === selectedPCSId)!
  const data = pcsData.get(selectedPCSId)!
  
  // 判断数据是否异常
  const isAbnormal = (value: number, min: number, max: number) => {
    return value < min || value > max
  }
  
  // 获取模式文本
  const getModeText = (mode: string) => {
    switch (mode) {
      case 'charging':
        return '充电'
      case 'discharging':
        return '放电'
      case 'standby':
        return '待机'
      case 'fault':
        return '故障'
      default:
        return '未知'
    }
  }
  
  // 计算效率
  const efficiency = data.acActivePower !== 0 && data.dcPower !== 0
    ? ((Math.abs(data.dcPower) / Math.abs(data.acActivePower)) * 100)
    : 0
  
  // 确定能量流向
  const flowDirection = data.mode === 'charging' ? 'charge' : 
                       data.mode === 'discharging' ? 'discharge' : 
                       'idle'
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-5" />
            PCS 展示
          </CardTitle>
          <CardDescription>储能变流器实时监控</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 设备选择 */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">选择 PCS 设备</label>
            <Select value={String(selectedPCSId)} onValueChange={(v) => setSelectedPCSId(Number(v))}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockPCSDevices.map(pcs => (
                  <SelectItem key={pcs.id} value={String(pcs.id)}>
                    {pcs.displayName} ({pcs.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* 设备信息卡片 */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">{selectedPCS.displayName}</div>
                <div className="text-sm text-muted-foreground">{selectedPCS.name}</div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={data.systemFault ? 'destructive' : data.systemAlarm ? 'default' : 'secondary'}>
                  {getModeText(data.mode)}
                </Badge>
                <Badge variant={data.gridStatus === 'grid_tied' ? 'default' : data.gridStatus === 'off_grid' ? 'secondary' : 'outline'}>
                  {data.gridStatus === 'grid_tied' ? '并网' : data.gridStatus === 'off_grid' ? '离网' : '停机'}
                </Badge>
                <div className={cn('flex items-center gap-2', data.systemFault ? 'text-red-500' : data.systemAlarm ? 'text-yellow-500' : 'text-green-500')}>
                  <Activity className="size-4" />
                  <span className="text-sm font-medium">
                    {data.systemFault ? '故障' : data.systemAlarm ? '告警' : data.systemDerating ? '降额' : '正常'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 实时能量流向图 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">实时能量流向</CardTitle>
            </CardHeader>
            <CardContent>
              <PCSEnergyFlow
                direction={flowDirection}
                acPower={Math.abs(data.acActivePower)}
                dcPower={Math.abs(data.dcPower)}
                efficiency={efficiency}
              />
            </CardContent>
          </Card>
          
          {/* 详细数据表格 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">详细数据</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 交流侧电压 */}
                  <div className="space-y-2">
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <Zap className="size-4" />
                      交流侧电压
                    </div>
                    <Separator />
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AB线电压:</span>
                        <span className={cn(isAbnormal(data.acVoltageAB, 360, 400) && 'text-red-500 font-semibold')}>
                          {data.acVoltageAB.toFixed(1)}V
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">BC线电压:</span>
                        <span className={cn(isAbnormal(data.acVoltageBC, 360, 400) && 'text-red-500 font-semibold')}>
                          {data.acVoltageBC.toFixed(1)}V
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CA线电压:</span>
                        <span className={cn(isAbnormal(data.acVoltageCA, 360, 400) && 'text-red-500 font-semibold')}>
                          {data.acVoltageCA.toFixed(1)}V
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">A相电压:</span>
                        <span className={cn(isAbnormal(data.acVoltageA, 200, 240) && 'text-red-500 font-semibold')}>
                          {data.acVoltageA.toFixed(1)}V
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">B相电压:</span>
                        <span className={cn(isAbnormal(data.acVoltageB, 200, 240) && 'text-red-500 font-semibold')}>
                          {data.acVoltageB.toFixed(1)}V
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">C相电压:</span>
                        <span className={cn(isAbnormal(data.acVoltageC, 200, 240) && 'text-red-500 font-semibold')}>
                          {data.acVoltageC.toFixed(1)}V
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 交流侧电流 */}
                  <div className="space-y-2">
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <Zap className="size-4" />
                      交流侧电流
                    </div>
                    <Separator />
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">A相电流:</span>
                        <span className={cn(isAbnormal(data.acCurrentA, 0, 100) && 'text-red-500 font-semibold')}>
                          {data.acCurrentA.toFixed(1)}A
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">B相电流:</span>
                        <span className={cn(isAbnormal(data.acCurrentB, 0, 100) && 'text-red-500 font-semibold')}>
                          {data.acCurrentB.toFixed(1)}A
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">C相电流:</span>
                        <span className={cn(isAbnormal(data.acCurrentC, 0, 100) && 'text-red-500 font-semibold')}>
                          {data.acCurrentC.toFixed(1)}A
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">频率:</span>
                        <span className={cn(isAbnormal(data.acFrequency, 49.5, 50.5) && 'text-red-500 font-semibold')}>
                          {data.acFrequency.toFixed(2)}Hz
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 交流侧功率 */}
                  <div className="space-y-2">
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <Zap className="size-4" />
                      交流侧功率
                    </div>
                    <Separator />
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">有功功率:</span>
                        <span className={cn(Math.abs(data.acActivePower) > 700 && 'text-red-500 font-semibold')}>
                          {data.acActivePower.toFixed(1)}kW
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">无功功率:</span>
                        <span>{data.acReactivePower.toFixed(1)}kVar</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">视在功率:</span>
                        <span>{data.acApparentPower.toFixed(1)}kVA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">功率因数:</span>
                        <span>{data.acPowerFactor.toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 直流侧参数 */}
                  <div className="space-y-2">
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <Battery className="size-4" />
                      直流侧参数
                    </div>
                    <Separator />
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">电池电压:</span>
                        <span className={cn(isAbnormal(data.dcInputVoltage, 550, 650) && 'text-red-500 font-semibold')}>
                          {data.dcInputVoltage.toFixed(1)}V
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">母线电压:</span>
                        <span className={cn(isAbnormal(data.dcBusVoltage, 550, 650) && 'text-red-500 font-semibold')}>
                          {data.dcBusVoltage.toFixed(1)}V
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">直流电流:</span>
                        <span className={cn(isAbnormal(Math.abs(data.dcCurrent), 0, 200) && 'text-red-500 font-semibold')}>
                          {data.dcCurrent.toFixed(1)}A
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">直流功率:</span>
                        <span className={cn(Math.abs(data.dcPower) > 90 && 'text-red-500 font-semibold')}>
                          {data.dcPower.toFixed(1)}kW
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 运行状态 */}
                  <div className="space-y-2">
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <Activity className="size-4" />
                      运行状态
                    </div>
                    <Separator />
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">运行模式:</span>
                        <span>{getModeText(data.mode)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">并网状态:</span>
                        <span>
                          {data.gridStatus === 'grid_tied' ? '并网' : data.gridStatus === 'off_grid' ? '离网' : '停机'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">系统状态:</span>
                        <span>
                          {data.systemStatus === 'running' ? '运行' : data.systemStatus === 'standby' ? '待机' : data.systemStatus === 'fault' ? '故障' : '停机'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 温度 */}
                  <div className="space-y-2">
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <Thermometer className="size-4" />
                      温度
                    </div>
                    <Separator />
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">模块温度:</span>
                        <span className={cn(isAbnormal(data.moduleTemperature, 0, 60) && 'text-red-500 font-semibold')}>
                          {data.moduleTemperature.toFixed(1)}°C
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">环境温度:</span>
                        <span className={cn(isAbnormal(data.ambientTemperature, 0, 50) && 'text-red-500 font-semibold')}>
                          {data.ambientTemperature.toFixed(1)}°C
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 保护状态 */}
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">保护状态</div>
                    <Separator />
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">系统故障:</span>
                        <Badge variant={data.systemFault ? 'destructive' : 'secondary'}>
                          {data.systemFault ? '是' : '否'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">系统告警:</span>
                        <Badge variant={data.systemAlarm ? 'default' : 'secondary'}>
                          {data.systemAlarm ? '是' : '否'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">系统降额:</span>
                        <Badge variant={data.systemDerating ? 'default' : 'secondary'}>
                          {data.systemDerating ? '是' : '否'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
