/**
 * PCS 展示页面
 * 显示变压器、交直流侧，充电时交流→直流，放电时直流→交流
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Activity } from 'lucide-react'
import { PcsEnergyFlow } from '@/components/pcs'


// PCS 数据接口（基于瑞能、恩玖、盛宏三家厂商协议）
interface PCSData {
  // 交流侧数据
  acVoltageAB: number // AB线电压 (V) - 瑞能/恩玖: 输出AB线电压, 盛宏: L1-L2 voltage
  acVoltageBC: number // BC线电压 (V) - 瑞能/恩玖: 输出BC线电压, 盛宏: L2-L3 voltage
  acVoltageCA: number // CA线电压 (V) - 瑞能/恩玖: 输出CA线电压, 盛宏: L3-L1 voltage
  acVoltageA: number // A相电压 (V) - 瑞能/恩玖: 输出A相电压, 盛宏: L1-N voltage
  acVoltageB: number // B相电压 (V) - 瑞能/恩玖: 输出B相电压, 盛宏: L2-N voltage
  acVoltageC: number // C相电压 (V) - 瑞能/恩玖: 输出C相电压, 盛宏: L3-N voltage
  acCurrentA: number // A相电流 (A) - 瑞能/恩玖: 输出A相电流, 盛宏: L1 current
  acCurrentB: number // B相电流 (A) - 瑞能/恩玖: 输出B相电流, 盛宏: L2 current
  acCurrentC: number // C相电流 (A) - 瑞能/恩玖: 输出C相电流, 盛宏: L3 current
  acFrequency: number // 频率 (Hz) - 瑞能/恩玖: 电网频率, 盛宏: AC bus frequency
  acActivePower: number // 总有功功率 (kW) - 瑞能/恩玖: 交流输出总有功功率, 盛宏: Total active power
  acReactivePower: number // 总无功功率 (kVar) - 瑞能/恩玖: 交流输出总无功功率, 盛宏: Total reactive power
  acApparentPower: number // 总视在功率 (kVA) - 瑞能/恩玖: 交流输出总视在功率, 盛宏: Total apparent power
  acPowerFactor: number // 总功率因数 - 瑞能/恩玖: 交流功率因数, 盛宏: Total PF
  acPowerFactorA: number // A相功率因数 - 瑞能/恩玖: A相功率因数, 盛宏: L1 PF
  acPowerFactorB: number // B相功率因数 - 瑞能/恩玖: B相功率因数, 盛宏: L2 PF
  acPowerFactorC: number // C相功率因数 - 瑞能/恩玖: C相功率因数, 盛宏: L3 PF
  
  // 直流侧数据
  dcInputVoltage: number // 直流输入电压/电池电压 (V) - 瑞能/恩玖: 电池电压, 盛宏: DC input voltage
  dcBusVoltage: number // 直流母线电压 (V) - 瑞能/恩玖: 总母线电压, 盛宏: DC bus voltage
  dcBusVoltagePos: number // 正母线电压 (V) - 瑞能/恩玖: 正母线电压
  dcBusVoltageNeg: number // 负母线电压 (V) - 瑞能/恩玖: 负母线电压
  dcCurrent: number // 直流电流 (A) - 瑞能/恩玖: 电池电流, 盛宏: DC current
  dcPower: number // 直流功率 (kW) - 瑞能/恩玖: 直流功率, 盛宏: DC power
  
  // 运行状态
  mode: 'charging' | 'discharging' | 'standby' | 'fault' // 运行模式
  gridStatus: 'grid_tied' | 'off_grid' | 'stopped' // 并网/离网状态 - 瑞能/恩玖: 并网/离网状态, 盛宏: System Grid-tied/Off-grid status
  systemStatus: 'running' | 'standby' | 'stopped' | 'fault' // 系统启停状态 - 盛宏: System ON/OFF status
  chargingStatus: boolean // 充电状态 - 盛宏: System Charging status
  dischargingStatus: boolean // 放电状态 - 盛宏: System Discharging status
  availableActivePower: number // 可用有功容量 (kW) - 盛宏: Available active power capacity (考虑降额)
  
  // 温度
  moduleTemperature: number // 模块温度 (°C) - 瑞能/恩玖: IGBT温度, 盛宏: Module temperature
  ambientTemperature: number // 环境温度 (°C) - 瑞能/恩玖: 环境温度, 盛宏: Ambient temperature
  inductorTemperature: number // 电感温度 (°C) - 瑞能/恩玖: 电感温度
  
  // 保护状态（基于盛宏协议的系统状态位）
  systemFault: boolean // 系统故障状态 - 盛宏: System Fault status
  systemAlarm: boolean // 系统告警状态 - 盛宏: System Alarm status
  systemDerating: boolean // 系统降额状态 - 盛宏: System Derating status
  systemFailed: boolean // 系统失效状态 - 盛宏: System Failed status
}

// 模拟 PCS 设备列表
const mockPCSDevices = [
  { id: 1, name: 'PCS_01', displayName: '1号PCS' },
  { id: 2, name: 'PCS_02', displayName: '2号PCS' },
  { id: 3, name: 'PCS_03', displayName: '3号PCS' },
]

// 生成模拟数据（基于实际协议范围）
const generatePCSData = (): PCSData => {
  // 随机选择充放电模式（70%充电，25%放电，4%待机，1%故障）
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
  
  // 交流侧电流（充电时为正，从网侧流入）
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
  const acPowerFactorA = acPowerFactor + (Math.random() - 0.5) * 0.05
  const acPowerFactorB = acPowerFactor + (Math.random() - 0.5) * 0.05
  const acPowerFactorC = acPowerFactor + (Math.random() - 0.5) * 0.05
  
  // 直流侧（电池电压约600V，母线电压略高）
  const dcInputVoltage = 600 + (Math.random() - 0.5) * 100
  const dcBusVoltage = dcInputVoltage + (Math.random() - 0.5) * 20
  const dcBusVoltagePos = dcBusVoltage / 2 + (Math.random() - 0.5) * 10
  const dcBusVoltageNeg = dcBusVoltage / 2 + (Math.random() - 0.5) * 10
  // 直流电流和功率（充电时为负，放电时为正）
  const currentBase = 100 + Math.random() * 50 // 100到150A
  const dcCurrent = mode === 'charging' ? -currentBase : currentBase
  const powerDcBase = 60 + Math.random() * 30 // 60到90kW
  const dcPower = mode === 'charging' ? -powerDcBase : powerDcBase
  
  // 运行状态
  const gridStatus: 'grid_tied' | 'off_grid' | 'stopped' = hasFault ? 'stopped' : Math.random() > 0.5 ? 'grid_tied' : 'off_grid'
  const systemStatus: 'running' | 'standby' | 'stopped' | 'fault' = hasFault ? 'fault' : 'running'
  const chargingStatus = mode === 'charging'
  const dischargingStatus = mode === 'discharging'
  const availableActivePower = hasDerating ? (500 + Math.random() * 200) * 0.8 : (500 + Math.random() * 200)
  
  // 温度
  const moduleTemperature = 35 + Math.random() * 15
  const ambientTemperature = 25 + Math.random() * 10
  const inductorTemperature = 40 + Math.random() * 15
  
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
    acPowerFactorA,
    acPowerFactorB,
    acPowerFactorC,
    
    // 直流侧
    dcInputVoltage,
    dcBusVoltage,
    dcBusVoltagePos,
    dcBusVoltageNeg,
    dcCurrent,
    dcPower,
    
    // 运行状态
    mode,
    gridStatus,
    systemStatus,
    chargingStatus,
    dischargingStatus,
    availableActivePower,
    
    // 温度
    moduleTemperature,
    ambientTemperature,
    inductorTemperature,
    
    // 保护状态
    systemFault: hasFault,
    systemAlarm: hasAlarm,
    systemDerating: hasDerating,
    systemFailed: hasFault && Math.random() > 0.5,
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
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>PCS 展示</CardTitle>
          <CardDescription>功率变换系统实时监控</CardDescription>
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
          
          {/* 设备信息 */}
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
          <div className="mb-6">
            <PcsEnergyFlow
              title="实时能量流向"
              variant="light"
              flowDirection={
                data.mode === 'charging' ? 'charge' : 
                data.mode === 'discharging' ? 'discharge' : 
                'idle'
              }
              grid={{
                title: 'Grid',
                subtitle: 'AC Side',
                badge: 'AC',
                headline: {
                  value: Math.abs(data.acActivePower),
                  unit: 'kW',
                  label: 'AC Power',
                },
                metrics: [
                  { label: 'Voltage AB', value: data.acVoltageAB, unit: 'V' },
                  { label: 'Voltage BC', value: data.acVoltageBC, unit: 'V' },
                  { label: 'Voltage CA', value: data.acVoltageCA, unit: 'V' },
                  { label: 'Frequency', value: data.acFrequency, unit: 'Hz' },
                  { label: 'Power Factor', value: data.acPowerFactor, unit: '' },
                ],
              }}
              dc={{
                title: 'Battery Array',
                subtitle: 'DC Side',
                badge: 'DC',
                headline: {
                  value: Math.abs(data.dcPower),
                  unit: 'kW',
                  label: 'DC Power',
                },
                metrics: [
                  { label: 'Voltage', value: data.dcInputVoltage, unit: 'V' },
                  { label: 'Bus Voltage', value: data.dcBusVoltage, unit: 'V' },
                  { label: 'Current', value: data.dcCurrent, unit: 'A' },
                  { 
                    label: 'SOC', 
                    value: Math.min(100, Math.max(0, ((data.dcInputVoltage - 550) / 100 * 100))), 
                    unit: '%' 
                  },
                ],
              }}
              pcs={{
                title: 'PCS',
                efficiency: {
                  label: 'Efficiency',
                  value: data.acActivePower !== 0 
                    ? ((Math.abs(data.dcPower) / Math.abs(data.acActivePower)) * 100)
                    : 0,
                  unit: '%',
                },
                metric: {
                  label: 'Conversion Loss',
                  value: Math.abs(Math.abs(data.acActivePower) - Math.abs(data.dcPower)),
                  unit: 'kW',
                },
                metrics: [
                  { label: 'Module Temp', value: data.moduleTemperature, unit: '°C' },
                  { label: 'Ambient Temp', value: data.ambientTemperature, unit: '°C' },
                ],
              }}
            />
          </div>
          
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
                    <div className="text-sm font-semibold">交流侧电压</div>
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
                    <div className="text-sm font-semibold">交流侧电流</div>
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
                    <div className="text-sm font-semibold">交流侧功率</div>
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
                        <span className="text-muted-foreground">总功率因数:</span>
                        <span>{data.acPowerFactor.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">A相功率因数:</span>
                        <span>{data.acPowerFactorA.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">B相功率因数:</span>
                        <span>{data.acPowerFactorB.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">C相功率因数:</span>
                        <span>{data.acPowerFactorC.toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 直流侧参数 */}
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">直流侧参数</div>
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
                        <span className="text-muted-foreground">正母线电压:</span>
                        <span>{data.dcBusVoltagePos.toFixed(1)}V</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">负母线电压:</span>
                        <span>{data.dcBusVoltageNeg.toFixed(1)}V</span>
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
                    <div className="text-sm font-semibold">运行状态</div>
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
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">充电状态:</span>
                        <Badge variant={data.chargingStatus ? 'default' : 'secondary'}>
                          {data.chargingStatus ? '是' : '否'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">放电状态:</span>
                        <Badge variant={data.dischargingStatus ? 'default' : 'secondary'}>
                          {data.dischargingStatus ? '是' : '否'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">可用容量:</span>
                        <span>{data.availableActivePower.toFixed(1)}kW</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 温度 */}
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">温度</div>
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
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">电感温度:</span>
                        <span className={cn(isAbnormal(data.inductorTemperature, 0, 70) && 'text-red-500 font-semibold')}>
                          {data.inductorTemperature.toFixed(1)}°C
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
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">系统失效:</span>
                        <Badge variant={data.systemFailed ? 'destructive' : 'secondary'}>
                          {data.systemFailed ? '是' : '否'}
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

