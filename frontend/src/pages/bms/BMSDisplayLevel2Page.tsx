/**
 * BMS 二级架构展示页面
 * 电池簇 → 电池包 → 电池单体
 * 
 * Tab页：
 * - SYS: 系统监控（簇基本信息、断路器控制、包拓扑）
 * - BCU: 簇控制单元（簇详细信息、遥测遥信数据）
 * - BMU: 包管理单元（包内单体信息、温度测点）
 * - EVT: 事件记录（系统遥控信息）
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { getBMSInstanceList, type BMSInstance } from '@/api/bms'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  ClusterBasicInfoResponse,
  PackListResponse,
  BreakerControlRequest,
  DynamicField,
  PackInfo,
  ClusterDetailInfoResponse,
  TelecontrolData,
  TelecontrolBoolean,
  TelecontrolEnum,
  TelecontrolBitfield,
  FaultResetRequest,
  PackCellInfoResponse,
  PackTemperatureResponse,
  CellInfo,
  TemperaturePoint,
  EventLogResponse,
  EventLog,
  ActiveTelecontrol,
} from '@/types/bms-api'

// ========== API调用函数（临时数据，待后端接口整理好后实现） ==========

/**
 * 获取簇基本信息
 * TODO: 实现实际的后端API调用
 */
const fetchClusterBasicInfo = async (): Promise<ClusterBasicInfoResponse> => {
  // TODO: 调用后端API获取簇基本信息
  // const response = await fetch('/api/bms/level2/cluster/basic-info')
  // return response.json()
  
  // 临时数据
  return {
    fixedFields: {
      fault: true,
      voltage: 1250.5,
      current: 1320.0,
      power: 1650.6,
      breakerClosed: true,
    },
    dynamicFields: [
      { nameEn: 'SOC', nameZh: 'SOC', valueEn: 12.7, valueZh: 12.7, unitEn: '%', unitZh: '%' },
      { nameEn: 'SOE', nameZh: 'SOE', valueEn: 0.0, valueZh: 0.0, unitEn: '%', unitZh: '%' },
      { nameEn: 'SOH', nameZh: 'SOH', valueEn: 93, valueZh: 93, unitEn: '%', unitZh: '%' },
      { nameEn: 'SOS', nameZh: 'SOS', valueEn: 50.0, valueZh: 50.0, unitEn: '%', unitZh: '%' },
      { nameEn: 'Consistency', nameZh: '一致性', valueEn: 91, valueZh: 91, unitEn: '%', unitZh: '%' },
      { nameEn: 'Insulation', nameZh: '绝缘', valueEn: 980, valueZh: 980, unitEn: 'kΩ', unitZh: 'kΩ' },
    ],
  }
}

/**
 * 获取包列表
 * TODO: 实现实际的后端API调用
 */
const fetchPackList = async (): Promise<PackListResponse> => {
  // TODO: 调用后端API获取包列表
  // const response = await fetch('/api/bms/level2/packs')
  // return response.json()
  
  // 临时数据：8个包
  const packCount = 8
  const packs: PackInfo[] = []
  
  for (let i = 0; i < packCount; i++) {
    const soc = 93.0 - i * 0.7
    const voltage = 125.0 - i * 0.1
    const tempDiff = 1.4 + i * 0.2
    
    packs.push({
      id: `pack-${i + 1}`,
      number: i + 1,
      fixedFields: {
        voltage,
        current: 110.0,
        fault: i % 4 === 0,
      },
      dynamicFields: [
        { nameEn: 'SOC', nameZh: 'SOC', valueEn: soc, valueZh: soc, unitEn: '%', unitZh: '%' },
        { nameEn: 'Temperature Diff', nameZh: '温度差', valueEn: tempDiff, valueZh: tempDiff, unitEn: '°C', unitZh: '°C' },
      ],
    })
  }
  
  return { packs }
}

/**
 * 控制断路器
 * TODO: 实现实际的后端API调用
 */
const controlBreaker = async (request: BreakerControlRequest): Promise<void> => {
  // TODO: 调用后端API控制断路器
  // await fetch('/api/bms/breaker/control', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(request),
  // })
  
  console.log('Breaker control:', request)
}

/**
 * 获取簇详细信息（二级架构BCU）
 * TODO: 实现实际的后端API调用
 */
const fetchClusterDetailInfo = async (): Promise<ClusterDetailInfoResponse> => {
  // TODO: 调用后端API获取簇详细信息
  // const response = await fetch('/api/bms/level2/cluster/detail-info')
  // return response.json()
  
  // 临时数据（与三级架构BCU类似）
  return {
    telemetryData: [
      { nameEn: 'SOC', nameZh: 'SOC', valueEn: 12.7, valueZh: 12.7, unitEn: '%', unitZh: '%' },
      { nameEn: 'SOE', nameZh: 'SOE', valueEn: 0.0, valueZh: 0.0, unitEn: '%', unitZh: '%' },
      { nameEn: 'SOH', nameZh: 'SOH', valueEn: 93, valueZh: 93, unitEn: '%', unitZh: '%' },
      { nameEn: 'SOS', nameZh: 'SOS', valueEn: 50.0, valueZh: 50.0, unitEn: '%', unitZh: '%' },
      { nameEn: 'Consistency', nameZh: '一致性', valueEn: 91, valueZh: 91, unitEn: '%', unitZh: '%' },
      { nameEn: 'Cluster Voltage', nameZh: '簇电压', valueEn: 1250.5, valueZh: 1250.5, unitEn: 'V', unitZh: 'V' },
      { nameEn: 'Cluster Current', nameZh: '簇电流', valueEn: 1320.0, valueZh: 1320.0, unitEn: 'A', unitZh: 'A' },
      { nameEn: 'Power', nameZh: '功率', valueEn: 1650.6, valueZh: 1650.6, unitEn: 'kW', unitZh: 'kW' },
      { nameEn: 'Max Cell Voltage', nameZh: '最大单体电压', valueEn: 3209, valueZh: 3209, unitEn: 'mV', unitZh: 'mV' },
      { nameEn: 'Min Cell Voltage', nameZh: '最小单体电压', valueEn: 3200, valueZh: 3200, unitEn: 'mV', unitZh: 'mV' },
      { nameEn: 'Max Cell Temp', nameZh: '最大单体温度', valueEn: 13.0, valueZh: 13.0, unitEn: '°C', unitZh: '°C' },
      { nameEn: 'Min Cell Temp', nameZh: '最小单体温度', valueEn: 12.8, valueZh: 12.8, unitEn: '°C', unitZh: '°C' },
    ],
    telecontrolData: [
      // 布尔类型
      { id: 'total_overvoltage', nameZh: '总过压', nameEn: 'Total Overvoltage', active: false, faultLevel: 1 },
      { id: 'total_undervoltage', nameZh: '总欠压', nameEn: 'Total Undervoltage', active: false, faultLevel: 1 },
      { id: 'insulation_failure', nameZh: '绝缘故障', nameEn: 'Insulation Failure', active: true, faultLevel: 4 },
      { id: 'soc_high', nameZh: 'SOC过高', nameEn: 'SOC High', active: false, faultLevel: 2 },
      { id: 'soc_low', nameZh: 'SOC过低', nameEn: 'SOC Low', active: true, faultLevel: 3 },
      { id: 'cell_overvoltage', nameZh: '单体过压', nameEn: 'Cell Overvoltage', active: false, faultLevel: 2 },
      { id: 'cell_undervoltage', nameZh: '单体欠压', nameEn: 'Cell Undervoltage', active: false, faultLevel: 2 },
      { id: 'cell_overtemp', nameZh: '单体过温', nameEn: 'Cell Overtemp', active: false, faultLevel: 2 },
      { id: 'cell_undertemp', nameZh: '单体欠温', nameEn: 'Cell Undertemp', active: false, faultLevel: 2 },
      { id: 'voltage_diff', nameZh: '电压差', nameEn: 'Voltage Diff', active: false, faultLevel: 1 },
      { id: 'temp_diff', nameZh: '温度差', nameEn: 'Temp Diff', active: false, faultLevel: 1 },
      { id: 'temp_sensor', nameZh: '温度传感器', nameEn: 'Temp Sensor', active: true, faultLevel: 4 },
      { id: 'voltage_sensor', nameZh: '电压传感器', nameEn: 'Voltage Sensor', active: true, faultLevel: 4 },
      { id: 'current_sensor', nameZh: '电流传感器', nameEn: 'Current Sensor', active: true, faultLevel: 4 },
      { id: 'dc_contactor', nameZh: '直流接触器', nameEn: 'DC Contactor', active: true, faultLevel: 4 },
      { id: 'fuse', nameZh: '熔断器', nameEn: 'Fuse', active: true, faultLevel: 4 },
      // 枚举类型示例
      {
        id: 'run_status',
        nameZh: '运行状态',
        nameEn: 'Run Status',
        currentValue: 1,
        faultLevel: 2,
        enumValues: [
          { value: 0, labelZh: '待机', labelEn: 'Standby' },
          { value: 1, labelZh: '故障', labelEn: 'Fault' },
          { value: 2, labelZh: '开机', labelEn: 'Running' },
        ],
      },
      // 复杂位域示例
      {
        id: 'complex_bitfield',
        nameZh: '复杂位域',
        nameEn: 'Complex Bitfield',
        rawValue: 0x8F01, // bit0, bit7, bit12~bit15 为1
        booleanBits: [
          { bitIndex: 0, nameZh: '报警1', nameEn: 'Alarm 1', active: true, faultLevel: 2 },
          { bitIndex: 1, nameZh: '报警2', nameEn: 'Alarm 2', active: false, faultLevel: 1 },
          { bitIndex: 2, nameZh: '报警3', nameEn: 'Alarm 3', active: false, faultLevel: 1 },
          { bitIndex: 3, nameZh: '报警4', nameEn: 'Alarm 4', active: false, faultLevel: 1 },
          { bitIndex: 4, nameZh: '报警5', nameEn: 'Alarm 5', active: false, faultLevel: 1 },
          { bitIndex: 5, nameZh: '报警6', nameEn: 'Alarm 6', active: false, faultLevel: 1 },
          { bitIndex: 6, nameZh: '报警7', nameEn: 'Alarm 7', active: false, faultLevel: 1 },
          { bitIndex: 7, nameZh: '报警8', nameEn: 'Alarm 8', active: true, faultLevel: 3 },
        ],
        reservedBits: { startBit: 8, endBit: 11 },
        enumBit: {
          startBit: 12,
          endBit: 15,
          nameZh: '运行模式',
          nameEn: 'Run Mode',
          currentValue: 8, // 0x8 = 8
          faultLevel: 2,
          enumValues: [
            { value: 0, labelZh: '待机', labelEn: 'Standby' },
            { value: 1, labelZh: '运行', labelEn: 'Running' },
            { value: 2, labelZh: '故障', labelEn: 'Fault' },
            { value: 8, labelZh: '维护', labelEn: 'Maintenance' },
          ],
        },
      },
    ] as TelecontrolData[],
  }
}

/**
 * 故障复位
 * TODO: 实现实际的后端API调用
 */
const resetFault = async (request: FaultResetRequest): Promise<void> => {
  // TODO: 调用后端API故障复位
  // await fetch('/api/bms/fault/reset', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(request),
  // })
  
  console.log('Fault reset:', request)
}

/**
 * 获取事件记录（二级架构EVT）
 * TODO: 实现实际的后端API调用
 */
const fetchEventLog = async (): Promise<EventLogResponse> => {
  // TODO: 调用后端API获取事件记录
  // const response = await fetch('/api/bms/level2/event-log')
  // return response.json()
  
  // 临时数据
  const events: EventLog[] = [
    { id: '1', timestamp: '2025/11/22 08:13:29', category: 'Fault', details: 'BEMU Communication Timeout', device: 'BEMU' },
    { id: '2', timestamp: '2025/11/22 08:09:29', category: 'Alarm', details: 'BEMU Communication Timeout', device: 'BEMU' },
    { id: '3', timestamp: '2025/11/22 08:08:34', category: 'Status', details: 'System Alarm - Open All Contactors' },
    { id: '4', timestamp: '2025/11/22 08:08:31', category: 'Fault', details: 'Insulation Failure, 0kohm', device: 'BCMU7' },
    { id: '5', timestamp: '2025/11/22 08:08:31', category: 'Status', details: 'Insulation Detection Enabled', device: 'BCMU7' },
    { id: '6', timestamp: '2025/11/22 08:08:31', category: 'Status', details: 'Fault Occurred 400', device: 'BCMU7' },
    { id: '7', timestamp: '2025/11/22 08:08:31', category: 'Fault', details: 'Insulation Failure, 0kohm', device: 'BCMU6' },
    { id: '8', timestamp: '2025/11/22 08:08:31', category: 'Status', details: 'Insulation Detection Enabled', device: 'BCMU6' },
    { id: '9', timestamp: '2025/11/22 08:08:31', category: 'Status', details: 'Fault Occurred 400', device: 'BCMU6' },
    { id: '10', timestamp: '2025/11/22 08:08:30', category: 'Fault', details: 'Insulation Failure, 0kohm', device: 'BCMU5' },
    { id: '11', timestamp: '2025/11/22 08:08:30', category: 'Status', details: 'Insulation Detection Enabled', device: 'BCMU5' },
    { id: '12', timestamp: '2025/11/22 08:08:30', category: 'Status', details: 'Fault Occurred 400', device: 'BCMU5' },
  ]
  
  const activeTelecontrols: ActiveTelecontrol[] = [
    { id: 'insulation_failure', nameZh: '绝缘故障', nameEn: 'Insulation Failure', active: true, faultLevel: 4 },
    { id: 'soc_low', nameZh: 'SOC过低', nameEn: 'SOC Low', active: true, faultLevel: 3 },
    { id: 'temp_sensor', nameZh: '温度传感器', nameEn: 'Temp Sensor', active: true, faultLevel: 4 },
    { id: 'voltage_sensor', nameZh: '电压传感器', nameEn: 'Voltage Sensor', active: true, faultLevel: 4 },
    { id: 'current_sensor', nameZh: '电流传感器', nameEn: 'Current Sensor', active: true, faultLevel: 4 },
    { id: 'dc_contactor', nameZh: '直流接触器', nameEn: 'DC Contactor', active: true, faultLevel: 4 },
    { id: 'fuse', nameZh: '熔断器', nameEn: 'Fuse', active: true, faultLevel: 4 },
  ]
  
  return {
    events,
    activeTelecontrols,
  }
}

/**
 * 获取包内单体信息（二级架构BMU）
 * TODO: 实现实际的后端API调用
 */
const fetchPackCellInfo = async (packId: string): Promise<PackCellInfoResponse> => {
  // TODO: 调用后端API获取包内单体信息
  // const response = await fetch(`/api/bms/level2/pack/${packId}/cells`)
  // return response.json()
  
  // 临时数据
  const cellCount = 30 // 从后端获取
  const cells: CellInfo[] = []
  for (let i = 0; i < cellCount; i++) {
    const voltage = 3.54 + (i % 5) * 0.02
    const soc = 85.0 + (i % 3) * 2.0
    const soh = 93.0 - (i % 2) * 1.0
    
    let status: 'normal' | 'warning' | 'alarm' = 'normal'
    if (voltage > 3.60 || voltage < 3.50) {
      status = 'warning'
    }
    if (voltage > 3.65 || voltage < 3.45) {
      status = 'alarm'
    }
    
    cells.push({
      id: `cell-${i + 1}`,
      number: i + 1,
      dynamicFields: [
        { nameEn: 'Voltage', nameZh: '电压', valueEn: voltage, valueZh: voltage, unitEn: 'V', unitZh: 'V' },
        { nameEn: 'SOC', nameZh: 'SOC', valueEn: soc, valueZh: soc, unitEn: '%', unitZh: '%' },
        { nameEn: 'SOH', nameZh: 'SOH', valueEn: soh, valueZh: soh, unitEn: '%', unitZh: '%' },
      ],
      status,
    })
  }
  
  return {
    packId,
    packNumber: 1,
    cellConfiguration: '15S 2P (30 cells total)', // 从后端获取
    cells,
  }
}

/**
 * 获取包内温度测点（二级架构BMU）
 * TODO: 实现实际的后端API调用
 */
const fetchPackTemperature = async (packId: string): Promise<PackTemperatureResponse> => {
  // TODO: 调用后端API获取包内温度测点
  // const response = await fetch(`/api/bms/level2/pack/${packId}/temperature`)
  // return response.json()
  
  // 临时数据
  const tempCount = 8 // 从后端获取
  const temperaturePoints: TemperaturePoint[] = []
  for (let i = 0; i < tempCount; i++) {
    const temp = 27.0 + i * 0.6
    let status: 'normal' | 'warning' | 'alarm' = 'normal'
    if (temp > 31.0) {
      status = 'warning'
    }
    if (temp > 35.0) {
      status = 'alarm'
    }
    
    temperaturePoints.push({
      id: `temp-${i + 1}`,
      number: i + 1,
      temperature: temp,
      unit: '°C',
      status,
    })
  }
  
  return {
    packId,
    packNumber: 1,
    temperaturePoints,
  }
}

// ========== 组件 ==========

export default function BMSDisplayLevel2Page() {
  const { t, i18n } = useTranslation('bms')
  const [activeTab, setActiveTab] = useState('sys')
  const [selectedBMSInstanceId, setSelectedBMSInstanceId] = useState<number | null>(null)
  
  // 簇基本信息
  const [clusterBasicInfo, setClusterBasicInfo] = useState<ClusterBasicInfoResponse | null>(null)
  const [clusterBreakerClosed, setClusterBreakerClosed] = useState(false)
  
  // 包列表
  const [packList, setPackList] = useState<PackListResponse | null>(null)
  
  // BCU页面数据
  const [clusterDetailInfo, setClusterDetailInfo] = useState<ClusterDetailInfoResponse | null>(null)
  
  // BMU页面数据
  const [selectedPackId, setSelectedPackId] = useState<string>('')
  const [packCellInfo, setPackCellInfo] = useState<PackCellInfoResponse | null>(null)
  const [packTemperature, setPackTemperature] = useState<PackTemperatureResponse | null>(null)
  const [bmuActiveSubTab, setBmuActiveSubTab] = useState<'cell' | 'temperature'>('cell')
  
  // EVT页面数据
  const [eventLog, setEventLog] = useState<EventLogResponse | null>(null)
  
  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      const [basicInfo, packs] = await Promise.all([
        fetchClusterBasicInfo(),
        fetchPackList(),
      ])
      
      setClusterBasicInfo(basicInfo)
      setClusterBreakerClosed(basicInfo.fixedFields.breakerClosed)
      setPackList(packs)
      
      // 设置默认选中的包（第一个）
      if (packs.packs.length > 0) {
        setSelectedPackId(packs.packs[0].id)
      }
    }
    
    loadData()
    
    // 定时更新数据
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])
  
  // 加载BCU页面数据
  useEffect(() => {
    if (activeTab === 'bcu') {
      const loadBCUData = async () => {
        const data = await fetchClusterDetailInfo()
        setClusterDetailInfo(data)
      }
      loadBCUData()
      
      // 定时刷新
      const interval = setInterval(loadBCUData, 5000)
      return () => clearInterval(interval)
    }
  }, [activeTab])
  
  // 加载BMU页面数据
  useEffect(() => {
    if (activeTab === 'bmu' && selectedPackId) {
      const loadBMUData = async () => {
        if (bmuActiveSubTab === 'cell') {
          const data = await fetchPackCellInfo(selectedPackId)
          setPackCellInfo(data)
        } else {
          const data = await fetchPackTemperature(selectedPackId)
          setPackTemperature(data)
        }
      }
      loadBMUData()
      
      // 定时刷新
      const interval = setInterval(loadBMUData, 5000)
      return () => clearInterval(interval)
    }
  }, [activeTab, selectedPackId, bmuActiveSubTab])
  
  // 加载EVT页面数据
  useEffect(() => {
    if (activeTab === 'evt') {
      const loadEVTData = async () => {
        const data = await fetchEventLog()
        setEventLog(data)
      }
      loadEVTData()
      
      // 定时刷新
      const interval = setInterval(loadEVTData, 5000)
      return () => clearInterval(interval)
    }
  }, [activeTab])
  
  // 控制簇断路器
  const handleBreakerControl = async (action: 'close' | 'open') => {
    // TODO: 调用后端API
    await controlBreaker({
      targetId: 'cluster-01',
      action,
    })
    
    setClusterBreakerClosed(action === 'close')
  }
  
  // 获取动态字段的显示值（根据当前语言）
  const getDynamicFieldValue = (field: DynamicField): string => {
    const isZh = i18n.language === 'zh-CN'
    const value = isZh ? (field.valueZh ?? field.valueEn) : field.valueEn
    const unit = isZh ? (field.unitZh ?? field.unitEn) : (field.unitEn ?? '')
    return `${value}${unit ? ' ' + unit : ''}`
  }
  
  // 获取动态字段的显示名称（根据当前语言）
  const getDynamicFieldName = (field: DynamicField): string => {
    return i18n.language === 'zh-CN' ? field.nameZh : field.nameEn
  }
  
  // 处理故障复位
  const handleFaultReset = async () => {
    await resetFault({ targetId: 'cluster-01' })
    // TODO: 刷新数据
  }
  
  // 渲染遥信数据
  const renderTelecontrolData = (data: TelecontrolData, i18n: any) => {
    const isZh = i18n.language === 'zh-CN'
    
    // 布尔类型
    if ('active' in data && 'faultLevel' in data && !('currentValue' in data)) {
      const boolData = data as TelecontrolBoolean
      const getFaultColor = (level: number) => {
        if (level === 4) return 'bg-red-600 hover:bg-red-700'
        if (level === 3) return 'bg-orange-600 hover:bg-orange-700'
        if (level === 2) return 'bg-yellow-600 hover:bg-yellow-700'
        return 'bg-gray-500 hover:bg-gray-600'
      }
      
      return (
        <Button
          key={boolData.id}
          variant={boolData.active ? 'destructive' : 'outline'}
          size="sm"
          className={cn(
            'text-xs min-w-[100px]',
            boolData.active && getFaultColor(boolData.faultLevel),
            boolData.active && 'font-semibold'
          )}
          disabled
        >
          {isZh ? boolData.nameZh : boolData.nameEn}
        </Button>
      )
    }
    
    // 枚举类型
    if ('currentValue' in data && 'enumValues' in data && !('rawValue' in data)) {
      const enumData = data as TelecontrolEnum
      return (
        <div key={enumData.id} className="w-full space-y-1">
          <div className="text-xs text-muted-foreground">
            {isZh ? enumData.nameZh : enumData.nameEn}:
          </div>
          <div className="flex flex-wrap gap-1">
            {enumData.enumValues.map((ev) => {
              const isActive = ev.value === enumData.currentValue
              return (
                <Button
                  key={ev.value}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'text-xs min-w-[60px]',
                    isActive && 'font-semibold'
                  )}
                  disabled
                >
                  {isZh ? ev.labelZh : ev.labelEn}
                </Button>
              )
            })}
          </div>
        </div>
      )
    }
    
    // 复杂位域类型
    if ('rawValue' in data && 'booleanBits' in data) {
      const bitfieldData = data as TelecontrolBitfield
      return (
        <div key={bitfieldData.id} className="w-full space-y-2">
          <div className="text-xs text-muted-foreground">
            {isZh ? bitfieldData.nameZh : bitfieldData.nameEn}: 值: {bitfieldData.rawValue.toString(16).toUpperCase().padStart(4, '0')}
          </div>
          {/* 布尔位 (bit0~bit7) */}
          <div className="grid grid-cols-4 gap-1">
            {bitfieldData.booleanBits.map((bit) => {
              const getFaultColor = (level: number) => {
                if (level === 4) return 'bg-red-600 text-white border-red-700'
                if (level === 3) return 'bg-orange-600 text-white border-orange-700'
                if (level === 2) return 'bg-yellow-600 text-white border-yellow-700'
                return 'bg-gray-500 text-white border-gray-600'
              }
              
              return (
                <div
                  key={bit.bitIndex}
                  className={cn(
                    'p-1.5 text-xs text-center rounded border min-h-[3rem] flex flex-col items-center justify-center',
                    bit.active
                      ? getFaultColor(bit.faultLevel)
                      : 'bg-muted/50 text-muted-foreground border-border'
                  )}
                >
                  <div className="font-medium text-[10px] mb-0.5">Bit {bit.bitIndex}</div>
                  <div className="text-[10px] font-semibold">
                    {isZh ? bit.nameZh : bit.nameEn}
                  </div>
                </div>
              )
            })}
          </div>
          {/* 枚举位 (bit12~bit15) */}
          {bitfieldData.enumBit && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                {isZh ? bitfieldData.enumBit.nameZh : bitfieldData.enumBit.nameEn} (Bit {bitfieldData.enumBit.startBit}~{bitfieldData.enumBit.endBit}):
              </div>
              <div className="flex flex-wrap gap-1">
                {bitfieldData.enumBit.enumValues.map((ev) => {
                  const isActive = ev.value === bitfieldData.enumBit!.currentValue
                  return (
                    <Button
                      key={ev.value}
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'text-xs min-w-[60px]',
                        isActive && 'font-semibold'
                      )}
                      disabled
                    >
                      {isZh ? ev.labelZh : ev.labelEn}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )
    }
    
    return null
  }

  // 获取BMS实例列表（用于选择下拉框）
  const { data: instancesData } = useQuery({
    queryKey: ['bms-instances', { architecture_id: 1, enabled: true }], // 二级架构
    queryFn: () => getBMSInstanceList({ architecture_id: 1, enabled: true }),
  })
  
  const instances = (instancesData?.data as BMSInstance[] | null | undefined) || []
  
  // 设置默认选中的BMS实例（第一个）
  useEffect(() => {
    if (instances.length > 0 && !selectedBMSInstanceId) {
      setSelectedBMSInstanceId(instances[0].id)
    }
  }, [instances, selectedBMSInstanceId])
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* BMS选择下拉框 */}
      {instances.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {t('select_bms_instance')}:
              </span>
              <Select
                value={selectedBMSInstanceId?.toString() || ''}
                onValueChange={(value) => setSelectedBMSInstanceId(parseInt(value))}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder={t('select_bms_instance_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {instances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id.toString()}>
                      {instance.display_name_zh} ({instance.instance_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>{t('level2_title')}</CardTitle>
          <CardDescription>{t('level2_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sys">{t('tab_sys')}</TabsTrigger>
              <TabsTrigger value="bcu">{t('tab_bcu')}</TabsTrigger>
              <TabsTrigger value="bmu">{t('tab_bmu')}</TabsTrigger>
              <TabsTrigger value="evt">{t('tab_evt')}</TabsTrigger>
            </TabsList>

            <TabsContent value="sys" className="mt-4">
              {clusterBasicInfo && (
                <div className="space-y-6">
                  {/* Cluster Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('cluster_basic_info')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Fault Status - 固定字段（修复：告警状态→故障状态，对齐样式） */}
                        <div className="bg-muted/50 rounded-lg p-4 flex flex-col justify-end">
                          <div className="text-xs text-muted-foreground mb-1">
                            {t('fault_status')}
                          </div>
                          <Badge
                            variant={clusterBasicInfo.fixedFields.fault ? 'destructive' : 'secondary'}
                            className="w-full justify-center"
                          >
                            {clusterBasicInfo.fixedFields.fault
                              ? t('fault')
                              : t('normal')}
                          </Badge>
                        </div>

                        {/* Cluster Voltage - 固定字段 */}
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="text-xs text-muted-foreground mb-1">
                            {t('cluster_voltage')}
                          </div>
                          <div className="text-2xl font-bold">
                            {clusterBasicInfo.fixedFields.voltage} V
                          </div>
                        </div>

                        {/* Cluster Current - 固定字段 */}
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="text-xs text-muted-foreground mb-1">
                            {t('cluster_current')}
                          </div>
                          <div className="text-2xl font-bold">
                            {clusterBasicInfo.fixedFields.current} A
                          </div>
                        </div>

                        {/* Power - 固定字段 */}
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="text-xs text-muted-foreground mb-1">
                            {t('power')}
                          </div>
                          <div className="text-2xl font-bold">
                            {clusterBasicInfo.fixedFields.power} kW
                          </div>
                        </div>
                      </div>

                      {/* Breaker Status - 固定字段 */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {t('breaker_status')}:
                        </span>
                        {clusterBreakerClosed ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {t('closed')}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            {t('open')}
                          </Badge>
                        )}
                      </div>

                      {/* Dynamic Fields - 动态字段 */}
                      {clusterBasicInfo.dynamicFields.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                          {clusterBasicInfo.dynamicFields.map((field) => (
                            <div key={field.nameEn}>
                              <div className="text-xs text-muted-foreground mb-1">
                                {getDynamicFieldName(field)}
                              </div>
                              <div className="text-lg font-semibold">
                                {getDynamicFieldValue(field)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Breaker Control - 固定功能 */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('breaker_control')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4">
                        <Button
                          onClick={() => handleBreakerControl('close')}
                          className="bg-green-500 hover:bg-green-600 text-white"
                          disabled={clusterBreakerClosed}
                        >
                          {t('close_breaker')}
                        </Button>
                        <Button
                          onClick={() => handleBreakerControl('open')}
                          variant="destructive"
                          disabled={!clusterBreakerClosed}
                        >
                          {t('open_breaker')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Pack Status - Series Connection */}
                  {packList && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('pack_status_series')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[600px]">
                          <div className="space-y-3 pr-4">
                            {packList.packs.map((pack, idx) => {
                              // 查找SOC字段（动态字段）
                              const socField = pack.dynamicFields.find(
                                f => f.nameEn === 'SOC' || f.nameZh === 'SOC'
                              )
                              const soc = socField
                                ? Number(i18n.language === 'zh-CN' ? socField.valueZh : socField.valueEn)
                                : 0
                              
                              // 查找温度差字段（动态字段）
                              const tempDiffField = pack.dynamicFields.find(
                                f => f.nameEn === 'Temperature Diff' || f.nameZh === '温度差'
                              )
                              const tempDiff = tempDiffField
                                ? Number(i18n.language === 'zh-CN' ? tempDiffField.valueZh : tempDiffField.valueEn)
                                : 0

                              return (
                                <div key={pack.id} className="relative">
                                  {/* Series Connection Indicator - 固定显示（只显示连接线，不显示文字） */}
                                  {idx > 0 && (
                                    <div className="absolute left-[100px] -top-3 flex flex-col items-center">
                                      <div className="h-3 w-0.5 bg-blue-500" />
                                    </div>
                                  )}

                                  {/* Pack Card */}
                                  <Card
                                    className={cn(
                                      'border-2',
                                      pack.fixedFields.fault
                                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                                        : ''
                                    )}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1 grid grid-cols-4 gap-4">
                                          <div>
                                            <div className="text-sm font-semibold mb-1">
                                              {t('pack')} {pack.number}
                                            </div>
                                          </div>

                                          {/* 固定字段：电压、电流 */}
                                          <div className="space-y-1">
                                            <div className="text-xs text-muted-foreground">
                                              {t('voltage')}
                                            </div>
                                            <div className="text-sm font-semibold">
                                              {pack.fixedFields.voltage.toFixed(1)}V
                                            </div>
                                          </div>

                                          <div className="space-y-1">
                                            <div className="text-xs text-muted-foreground">
                                              {t('current')}
                                            </div>
                                            <div className="text-sm font-semibold">
                                              {pack.fixedFields.current.toFixed(1)}A
                                            </div>
                                          </div>

                                          {/* 动态字段：SOC */}
                                          {socField && (
                                            <div className="space-y-1">
                                              <div className="text-xs text-muted-foreground">
                                                {getDynamicFieldName(socField)}
                                              </div>
                                              <div className="text-sm font-semibold">
                                                {getDynamicFieldValue(socField)}
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-4">
                                          {/* SOC Progress Bar - 如果有SOC字段 */}
                                          {socField && (
                                            <div className="w-64">
                                              <Progress value={soc} className="h-2" />
                                            </div>
                                          )}

                                          {/* 动态字段：温度差 */}
                                          {tempDiffField && (
                                            <Badge
                                              variant={tempDiff > 2.0 ? 'default' : 'secondary'}
                                              className={cn(tempDiff > 2.0 && 'bg-yellow-500')}
                                            >
                                              {getDynamicFieldName(tempDiffField)}: {getDynamicFieldValue(tempDiffField)}
                                            </Badge>
                                          )}

                                          {/* 状态 - 固定字段 */}
                                          <Badge variant={pack.fixedFields.fault ? 'default' : 'secondary'}>
                                            {pack.fixedFields.fault
                                              ? t('warning')
                                              : t('normal')}
                                          </Badge>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              )
                            })}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="bcu" className="mt-4">
              <div className="space-y-6">
                {clusterDetailInfo ? (
                  <>
                    {/* 遥测数据 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('telemetry_data')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                          {clusterDetailInfo.telemetryData.map((field) => (
                            <Card key={field.nameEn} className="p-4">
                              <div className="text-sm text-muted-foreground mb-1">
                                {getDynamicFieldName(field)}
                              </div>
                              <div className="text-2xl font-bold">
                                {getDynamicFieldValue(field)}
                              </div>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* 遥信数据 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('telecontrol_data')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {clusterDetailInfo.telecontrolData.map((data) => (
                            <div key={data.id} className="w-full">
                              {renderTelecontrolData(data, i18n)}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* 控制命令 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('control_commands')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="destructive"
                          onClick={handleFaultReset}
                        >
                          {t('fault_reset')}
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      {t('loading')}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="bmu" className="mt-4">
              <div className="space-y-6">
                {/* 包选择器 */}
                {packList && packList.packs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('select_pack')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">
                          {t('pack')}:
                        </span>
                        <Select
                          value={selectedPackId}
                          onValueChange={setSelectedPackId}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {packList.packs.map((pack) => (
                              <SelectItem key={pack.id} value={pack.id}>
                                {i18n.language === 'zh-CN' ? `包${pack.number}` : `Pack ${pack.number}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {packList.packs.length > 1 && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentIndex = packList.packs.findIndex(p => p.id === selectedPackId)
                                if (currentIndex > 0) {
                                  setSelectedPackId(packList.packs[currentIndex - 1].id)
                                }
                              }}
                              disabled={packList.packs.findIndex(p => p.id === selectedPackId) === 0}
                            >
                              {t('previous')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentIndex = packList.packs.findIndex(p => p.id === selectedPackId)
                                if (currentIndex < packList.packs.length - 1) {
                                  setSelectedPackId(packList.packs[currentIndex + 1].id)
                                }
                              }}
                              disabled={packList.packs.findIndex(p => p.id === selectedPackId) === packList.packs.length - 1}
                            >
                              {t('next')}
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* BMU子标签页 */}
                <Tabs value={bmuActiveSubTab} onValueChange={(v) => setBmuActiveSubTab(v as 'cell' | 'temperature')}>
                  <TabsList>
                    <TabsTrigger value="cell">{t('cell_information')}</TabsTrigger>
                    <TabsTrigger value="temperature">{t('temperature_points')}</TabsTrigger>
                  </TabsList>

                  {/* 单体信息 */}
                  <TabsContent value="cell" className="mt-4">
                    {packCellInfo ? (
                      <div className="space-y-4">
                        {/* 单体配置 */}
                        <Card>
                          <CardHeader>
                            <CardTitle>{t('cell_configuration')}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-lg font-semibold">{packCellInfo.cellConfiguration}</p>
                          </CardContent>
                        </Card>

                        {/* 单体数据网格 */}
                        <Card>
                          <CardHeader>
                            <CardTitle>{t('cell_data')}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-3">
                              {packCellInfo.cells.map((cell) => {
                                const voltageField = cell.dynamicFields.find(f => f.nameEn === 'Voltage' || f.nameZh === '电压')
                                const socField = cell.dynamicFields.find(f => f.nameEn === 'SOC' || f.nameZh === 'SOC')
                                const sohField = cell.dynamicFields.find(f => f.nameEn === 'SOH' || f.nameZh === 'SOH')
                                
                                const getStatusColor = (status?: string) => {
                                  if (status === 'alarm') return 'border-red-500 bg-red-50 dark:bg-red-950/20'
                                  if (status === 'warning') return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                                  return 'border-green-500 bg-green-50 dark:bg-green-950/20'
                                }
                                
                                return (
                                  <Card
                                    key={cell.id}
                                    className={cn('p-3', getStatusColor(cell.status))}
                                  >
                                    <div className="space-y-1">
                                      <div className="text-xs font-semibold">
                                        {i18n.language === 'zh-CN' ? `单体${cell.number}` : `Cell ${cell.number}`}
                                      </div>
                                      {voltageField && (
                                        <div className="text-xs">
                                          {getDynamicFieldName(voltageField)}: {getDynamicFieldValue(voltageField)}
                                        </div>
                                      )}
                                      {socField && (
                                        <div className="text-xs">
                                          {getDynamicFieldName(socField)}: {getDynamicFieldValue(socField)}
                                        </div>
                                      )}
                                      {sohField && (
                                        <div className="text-xs">
                                          {getDynamicFieldName(sohField)}: {getDynamicFieldValue(sohField)}
                                        </div>
                                      )}
                                      <div className="flex justify-end mt-1">
                                        <div
                                          className={cn(
                                            'w-3 h-3 rounded-full',
                                            cell.status === 'alarm' && 'bg-red-500',
                                            cell.status === 'warning' && 'bg-yellow-500',
                                            !cell.status || cell.status === 'normal' ? 'bg-green-500' : ''
                                          )}
                                        />
                                      </div>
                                    </div>
                                  </Card>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                          {t('loading')}
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* 温度测点 */}
                  <TabsContent value="temperature" className="mt-4">
                    {packTemperature ? (
                      <Card>
                        <CardHeader>
                          <CardTitle>{t('temperature_points')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                            {packTemperature.temperaturePoints.map((point) => {
                              const getStatusColor = (status?: string) => {
                                if (status === 'alarm') return 'border-red-500 bg-red-50 dark:bg-red-950/20'
                                if (status === 'warning') return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                                return 'border-green-500 bg-green-50 dark:bg-green-950/20'
                              }
                              
                              return (
                                <Card
                                  key={point.id}
                                  className={cn('p-4', getStatusColor(point.status))}
                                >
                                  <div className="space-y-2">
                                    <div className="text-sm font-semibold">
                                      {i18n.language === 'zh-CN' ? `测点${point.number}` : `Point ${point.number}`}
                                    </div>
                                    <div className="text-2xl font-bold">
                                      {point.temperature.toFixed(1)} {point.unit}
                                    </div>
                                    <div className="flex justify-end">
                                      <div
                                        className={cn(
                                          'w-3 h-3 rounded-full',
                                          point.status === 'alarm' && 'bg-red-500',
                                          point.status === 'warning' && 'bg-yellow-500',
                                          !point.status || point.status === 'normal' ? 'bg-green-500' : ''
                                        )}
                                      />
                                    </div>
                                  </div>
                                </Card>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                          {t('loading')}
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            <TabsContent value="evt" className="mt-4">
              <div className="space-y-6">
                {eventLog ? (
                  <>
                    {/* 当前激活的遥信量 */}
                    {eventLog.activeTelecontrols.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>{t('active_telecontrols')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {eventLog.activeTelecontrols.map((telecontrol) => {
                              const getFaultColor = (level: number) => {
                                if (level === 4) return 'bg-red-600 hover:bg-red-700'
                                if (level === 3) return 'bg-orange-600 hover:bg-orange-700'
                                if (level === 2) return 'bg-yellow-600 hover:bg-yellow-700'
                                return 'bg-gray-500 hover:bg-gray-600'
                              }
                              
                              return (
                                <Badge
                                  key={telecontrol.id}
                                  variant="destructive"
                                  className={cn(
                                    'text-xs px-3 py-1',
                                    getFaultColor(telecontrol.faultLevel)
                                  )}
                                >
                                  {i18n.language === 'zh-CN' ? telecontrol.nameZh : telecontrol.nameEn}
                                </Badge>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* 事件记录表格 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('event_log')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                                  {t('time')}
                                </th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                                  {t('category')}
                                </th>
                                <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                                  {t('details')}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {eventLog.events.map((event) => {
                                const getCategoryLabel = () => {
                                  const isZh = i18n.language === 'zh-CN'
                                  if (event.device) {
                                    if (event.category === 'Fault') {
                                      return isZh ? `${event.device} 故障` : `${event.device} Fault`
                                    }
                                    if (event.category === 'Alarm') {
                                      return isZh ? `${event.device} 告警` : `${event.device} Alarm`
                                    }
                                    return isZh ? `${event.device} 状态` : `${event.device} Status`
                                  }
                                  if (event.category === 'Fault') {
                                    return t('system_fault')
                                  }
                                  if (event.category === 'Alarm') {
                                    return t('system_alarm')
                                  }
                                  return t('system_status')
                                }
                                
                                const getCategoryColor = () => {
                                  if (event.category === 'Fault') return 'bg-red-600 hover:bg-red-700'
                                  if (event.category === 'Alarm') return 'bg-yellow-600 hover:bg-yellow-700'
                                  return 'bg-blue-600 hover:bg-blue-700'
                                }
                                
                                return (
                                  <tr key={event.id} className="border-b hover:bg-muted/50">
                                    <td className="p-3 text-sm">{event.timestamp}</td>
                                    <td className="p-3">
                                      <Badge
                                        variant="default"
                                        className={cn('text-xs', getCategoryColor())}
                                      >
                                        {getCategoryLabel()}
                                      </Badge>
                                    </td>
                                    <td className="p-3 text-sm">{event.details}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      {t('loading')}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
