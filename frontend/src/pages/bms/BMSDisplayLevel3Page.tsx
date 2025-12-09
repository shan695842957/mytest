/**
 * BMS 三级架构展示页面
 * 电池堆 → 电池簇 → 电池包 → 电池单体
 * 
 * Tab页：
 * - SYS: 系统监控（堆基本信息、断路器控制、簇拓扑）
 * - BAU: 堆控制单元（堆详细信息、遥测遥信数据）
 * - BCU: 簇控制单元（簇详细信息、遥测遥信数据）
 * - BMU: 包管理单元（包内单体信息、温度测点）
 * - EVT: 事件记录（系统遥控信息）
 */

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { getBMSInstanceList, type BMSInstance } from '@/api/bms'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { BMSSysTabLevel3 } from '@/components/bms/BMSSysTabLevel3'
import { toast } from 'sonner'
import type {
  StackBasicInfoResponse,
  ClusterListResponse,
  BreakerControlRequest,
  DynamicField,
  ClusterInfo,
  StackDetailInfoResponse,
  ClusterDetailInfoResponse,
  TelecontrolData,
  TelecontrolBoolean,
  TelecontrolEnum,
  TelecontrolBitfield,
  StatusWord,
  FaultResetRequest,
  ClusterPackCellInfoResponse,
  ClusterPackTemperatureResponse,
  CellInfo,
  TemperaturePoint,
  PackListResponse,
  PackInfo,
  EventLogResponseLevel3,
  EventLog,
  ActiveTelecontrol,
} from '@/types/bms-api'

// ========== API调用函数（临时数据，待后端接口整理好后实现） ==========

/**
 * 获取堆基本信息
 * TODO: 实现实际的后端API调用
 */
const fetchStackBasicInfo = async (): Promise<StackBasicInfoResponse> => {
  // TODO: 调用后端API获取堆基本信息
  // const response = await fetch('/api/bms/level3/stack/basic-info')
  // return response.json()
  
  // 临时数据
  return {
    fixedFields: {
      fault: true,
      voltage: 1250.5,
      current: 1320.0,
      power: 1650.6,
      breakerClosed: false,
    },
    dynamicFields: [
    ],
  }
}

/**
 * 获取簇列表
 * TODO: 实现实际的后端API调用
 */
const fetchClusterList = async (): Promise<ClusterListResponse> => {
  // TODO: 调用后端API获取簇列表
  // const response = await fetch('/api/bms/level3/clusters')
  // return response.json()
  
  // 临时数据：5个簇
  const clusterCount = 5
  const clusters: ClusterInfo[] = []
  
  for (let i = 0; i < clusterCount; i++) {
    const soc = 12.8 + i * 0.1
    const voltage = 1250.5 - i * 0.1
    
    clusters.push({
      id: `cluster-${i + 1}`,
      number: i + 1,
      fixedFields: {
        voltage,
        current: 110.0,
        fault: i % 3 === 0,
        breakerClosed: i % 2 === 0,
      },
      dynamicFields: [
        { nameEn: 'SOC', nameZh: 'SOC', valueEn: soc, valueZh: soc, unitEn: '%', unitZh: '%' },
      ],
    })
  }
  
  return { clusters }
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
 * 获取堆详细信息（三级架构BAU）
 * TODO: 实现实际的后端API调用
 */
const fetchStackDetailInfo = async (): Promise<StackDetailInfoResponse> => {
  // TODO: 调用后端API获取堆详细信息
  // const response = await fetch('/api/bms/level3/stack/detail-info')
  // return response.json()
  
  // 临时数据
  return {
    telemetryData: [
    ],
    statusWords: [], // 已移除，数据在其他地方展示
    telecontrolData: [
    ] as TelecontrolData[],
  }
}

/**
 * 获取簇详细信息（三级架构BCU、二级架构BCU）
 * TODO: 实现实际的后端API调用
 */
const fetchClusterDetailInfo = async (clusterId: string): Promise<ClusterDetailInfoResponse> => {
  // TODO: 调用后端API获取簇详细信息
  // const response = await fetch(`/api/bms/cluster/${clusterId}/detail-info`)
  // return response.json()
  
  // 临时数据（与堆详细信息类似，但字段名改为簇相关）
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
    statusWords: [], // 已移除，数据在其他地方展示
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
 * 获取事件记录（三级架构EVT）
 * TODO: 实现实际的后端API调用
 */
const fetchEventLogLevel3 = async (): Promise<EventLogResponseLevel3> => {
  // TODO: 调用后端API获取事件记录
  // const response = await fetch('/api/bms/level3/event-log')
  // return response.json()
  
  // 临时数据（与二级架构类似）
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
 * 获取簇下的包列表（三级架构BMU）
 * TODO: 实现实际的后端API调用
 */
const fetchClusterPackList = async (clusterId: string): Promise<PackListResponse> => {
  // TODO: 调用后端API获取簇下的包列表
  // const response = await fetch(`/api/bms/level3/cluster/${clusterId}/packs`)
  // return response.json()
  
  // 临时数据
  const packCount = 10 // 从后端获取
  const packs: PackInfo[] = []
  for (let i = 0; i < packCount; i++) {
    packs.push({
      id: `pack-${i + 1}`,
      number: i + 1,
      fixedFields: {
        voltage: 125.0 + i * 0.5,
        current: 13.2 + i * 0.1,
        fault: i === 2,
      },
      dynamicFields: [
        { nameEn: 'SOC', nameZh: 'SOC', valueEn: 85.0 + i * 0.5, valueZh: 85.0 + i * 0.5, unitEn: '%', unitZh: '%' },
      ],
    })
  }
  
  return { packs }
}

/**
 * 获取包内单体信息（三级架构BMU）
 * TODO: 实现实际的后端API调用
 */
const fetchClusterPackCellInfo = async (clusterId: string, packId: string): Promise<ClusterPackCellInfoResponse> => {
  // TODO: 调用后端API获取包内单体信息
  // const response = await fetch(`/api/bms/level3/cluster/${clusterId}/pack/${packId}/cells`)
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
    clusterId,
    clusterNumber: 1,
    packId,
    packNumber: 1,
    cellConfiguration: '15S 2P (30 cells total)', // 从后端获取
    cells,
  }
}

/**
 * 获取包内温度测点（三级架构BMU）
 * TODO: 实现实际的后端API调用
 */
const fetchClusterPackTemperature = async (clusterId: string, packId: string): Promise<ClusterPackTemperatureResponse> => {
  // TODO: 调用后端API获取包内温度测点
  // const response = await fetch(`/api/bms/level3/cluster/${clusterId}/pack/${packId}/temperature`)
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
    clusterId,
    clusterNumber: 1,
    packId,
    packNumber: 1,
    temperaturePoints,
  }
}

// ========== 组件 ==========

export default function BMSDisplayLevel3Page() {
  const { t, i18n } = useTranslation('bms')
  const [activeTab, setActiveTab] = useState('sys')
  const [selectedBMSInstanceId, setSelectedBMSInstanceId] = useState<number | null>(null)
  
  // WebSocket 缓存数据（key: field_key, value: 实时值）
  // TODO: 接入真实 WebSocket，从 asset_state 获取数据
  const [realtimeValues, setRealtimeValues] = useState<Record<string, any>>({})
  
  // 堆基本信息（保留用于其他 Tab）
  const [stackBasicInfo, setStackBasicInfo] = useState<StackBasicInfoResponse | null>(null)
  const [stackBreakerClosed, setStackBreakerClosed] = useState(false)
  
  // 簇列表
  const [clusterList, setClusterList] = useState<ClusterListResponse | null>(null)
  const [clusterBreakerStatuses, setClusterBreakerStatuses] = useState<Map<string, boolean>>(new Map())
  
  // BAU页面数据
  const [stackDetailInfo, setStackDetailInfo] = useState<StackDetailInfoResponse | null>(null)
  
  // BCU页面数据
  const [selectedClusterId, setSelectedClusterId] = useState<string>('')
  const [clusterDetailInfo, setClusterDetailInfo] = useState<ClusterDetailInfoResponse | null>(null)
  
  // BMU页面数据
  const [bmuSelectedClusterId, setBmuSelectedClusterId] = useState<string>('')
  const [bmuSelectedPackId, setBmuSelectedPackId] = useState<string>('')
  const [bmuPackList, setBmuPackList] = useState<PackListResponse | null>(null)
  const [clusterPackCellInfo, setClusterPackCellInfo] = useState<ClusterPackCellInfoResponse | null>(null)
  const [clusterPackTemperature, setClusterPackTemperature] = useState<ClusterPackTemperatureResponse | null>(null)
  const [bmuActiveSubTab, setBmuActiveSubTab] = useState<'cell' | 'temperature'>('cell')
  
  // EVT页面数据
  const [eventLog, setEventLog] = useState<EventLogResponseLevel3 | null>(null)
  
  // 触摸滚动相关
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  
  // 加载数据（依赖selectedBMSInstanceId）
  useEffect(() => {
    // 如果没有选择BMS实例，不加载数据
    if (!selectedBMSInstanceId) return
    
    const loadData = async () => {
      // TODO: 传递instance_id到API调用
      const [basicInfo, clusters] = await Promise.all([
        fetchStackBasicInfo(), // TODO: fetchStackBasicInfo(selectedBMSInstanceId)
        fetchClusterList(), // TODO: fetchClusterList(selectedBMSInstanceId)
      ])
      
      setStackBasicInfo(basicInfo)
      setStackBreakerClosed(basicInfo.fixedFields.breakerClosed)
      
      setClusterList(clusters)
      setClusterBreakerStatuses(
        new Map(clusters.clusters.map(c => [c.id, c.fixedFields.breakerClosed]))
      )
      
      // 设置默认选中的簇（第一个）
      if (clusters.clusters.length > 0) {
        setSelectedClusterId(clusters.clusters[0].id)
        setBmuSelectedClusterId(clusters.clusters[0].id)
      }
    }
    
    loadData()
    
    // 定时更新数据
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [selectedBMSInstanceId])
  
  // 加载BAU页面数据（依赖selectedBMSInstanceId）
  useEffect(() => {
    if (activeTab === 'bau' && selectedBMSInstanceId) {
      const loadBAUData = async () => {
        // TODO: 传递instance_id到API调用
        const data = await fetchStackDetailInfo() // TODO: fetchStackDetailInfo(selectedBMSInstanceId)
        setStackDetailInfo(data)
      }
      loadBAUData()
      
      // 定时刷新
      const interval = setInterval(loadBAUData, 5000)
      return () => clearInterval(interval)
    }
  }, [activeTab, selectedBMSInstanceId])
  
  // 加载BCU页面数据（依赖selectedBMSInstanceId）
  useEffect(() => {
    if (activeTab === 'bcu' && selectedClusterId && selectedBMSInstanceId) {
      const loadBCUData = async () => {
        // TODO: 传递instance_id到API调用
        const data = await fetchClusterDetailInfo(selectedClusterId) // TODO: fetchClusterDetailInfo(selectedBMSInstanceId, selectedClusterId)
        setClusterDetailInfo(data)
      }
      loadBCUData()
      
      // 定时刷新
      const interval = setInterval(loadBCUData, 5000)
      return () => clearInterval(interval)
    }
  }, [activeTab, selectedClusterId, selectedBMSInstanceId])
  
  // 加载BMU页面的包列表（依赖selectedBMSInstanceId）
  useEffect(() => {
    if (activeTab === 'bmu' && bmuSelectedClusterId && selectedBMSInstanceId) {
      const loadPackList = async () => {
        // TODO: 传递instance_id到API调用
        const data = await fetchClusterPackList(bmuSelectedClusterId) // TODO: fetchClusterPackList(selectedBMSInstanceId, bmuSelectedClusterId)
        setBmuPackList(data)
        if (data.packs.length > 0) {
          setBmuSelectedPackId(data.packs[0].id)
        }
      }
      loadPackList()
    }
  }, [activeTab, bmuSelectedClusterId, selectedBMSInstanceId])
  
  // 加载BMU页面数据（依赖selectedBMSInstanceId）
  useEffect(() => {
    if (activeTab === 'bmu' && bmuSelectedClusterId && bmuSelectedPackId && selectedBMSInstanceId) {
      const loadBMUData = async () => {
        if (bmuActiveSubTab === 'cell') {
          // TODO: 传递instance_id到API调用
          const data = await fetchClusterPackCellInfo(bmuSelectedClusterId, bmuSelectedPackId) // TODO: fetchClusterPackCellInfo(selectedBMSInstanceId, bmuSelectedClusterId, bmuSelectedPackId)
          setClusterPackCellInfo(data)
        } else {
          // TODO: 传递instance_id到API调用
          const data = await fetchClusterPackTemperature(bmuSelectedClusterId, bmuSelectedPackId) // TODO: fetchClusterPackTemperature(selectedBMSInstanceId, bmuSelectedClusterId, bmuSelectedPackId)
          setClusterPackTemperature(data)
        }
      }
      loadBMUData()
      
      // 定时刷新
      const interval = setInterval(loadBMUData, 5000)
      return () => clearInterval(interval)
    }
  }, [activeTab, bmuSelectedClusterId, bmuSelectedPackId, bmuActiveSubTab, selectedBMSInstanceId])
  
  // 加载EVT页面数据（依赖selectedBMSInstanceId）
  useEffect(() => {
    if (activeTab === 'evt' && selectedBMSInstanceId) {
      const loadEVTData = async () => {
        // TODO: 传递instance_id到API调用
        const data = await fetchEventLogLevel3() // TODO: fetchEventLogLevel3(selectedBMSInstanceId)
        setEventLog(data)
      }
      loadEVTData()
      
      // 定时刷新
      const interval = setInterval(loadEVTData, 5000)
      return () => clearInterval(interval)
    }
  }, [activeTab, selectedBMSInstanceId])
  
  // 控制堆断路器
  // 控制堆断路器（SYS Tab 使用）
  const handleBreakerControl = async (action: 'open' | 'close', fieldKey: string) => {
    try {
      // TODO: 调用后端API写入值
      // 根据 fieldKey 找到对应的字段配置，获取 write_device_type_tag_id, write_comm_instance_id, write_point_id
      // 以及 write_value（0 或 1）
      // await writeBMSFieldValue(selectedBMSInstanceId, fieldKey, writeValue)
      
      toast.success(
        action === 'open' ? t('breaker_opened') : t('breaker_closed')
      )
    } catch (error) {
      console.error('Breaker control error:', error)
      toast.error(t('breaker_control_failed'))
    }
  }
  
  // 控制堆断路器（其他 Tab 使用，保留兼容）
  const handleStackBreakerControl = async (action: 'close' | 'open') => {
    // TODO: 调用后端API
    await controlBreaker({
      targetId: 'stack-01',
      action,
    })
    
    setStackBreakerClosed(action === 'close')
  }
  
  // 处理故障复位
  const handleFaultReset = async (targetId: string) => {
    await resetFault({ targetId })
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
  
  // 控制簇断路器
  const handleClusterBreakerControl = async (clusterId: string, action: 'close' | 'open') => {
    // TODO: 调用后端API
    await controlBreaker({
      targetId: clusterId,
      action,
    })
    
    setClusterBreakerStatuses(prev => {
      const newMap = new Map(prev)
      newMap.set(clusterId, action === 'close')
      return newMap
    })
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

  // 获取BMS实例列表（用于选择下拉框）
  const { data: instancesData } = useQuery({
    queryKey: ['bms-instances', { architecture_id: 2, enabled: true }], // 三级架构
    queryFn: () => getBMSInstanceList({ architecture_id: 2, enabled: true }),
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
                {instances.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    暂无BMS实例
                  </SelectItem>
                ) : (
                  instances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id.toString()}>
                      {instance.display_name_zh} ({instance.instance_name})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* 如果没有选择BMS实例，显示提示 */}
      {!selectedBMSInstanceId && instances.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              请先选择一个BMS实例以查看数据
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 只有在选择了BMS实例时才显示数据 */}
      {selectedBMSInstanceId && (
        <Card>
        <CardHeader>
          <CardTitle>{t('level3_title')}</CardTitle>
          <CardDescription>{t('level3_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="sys">{t('tab_sys')}</TabsTrigger>
              <TabsTrigger value="bau">{t('tab_bau')}</TabsTrigger>
              <TabsTrigger value="bcu">{t('tab_bcu')}</TabsTrigger>
              <TabsTrigger value="bmu">{t('tab_bmu')}</TabsTrigger>
              <TabsTrigger value="evt">{t('tab_evt')}</TabsTrigger>
            </TabsList>

            <TabsContent value="sys" className="mt-4">
              {selectedBMSInstanceId ? (
                <BMSSysTabLevel3
                  instanceId={selectedBMSInstanceId}
                  realtimeValues={realtimeValues}
                  onBreakerControl={handleBreakerControl}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      {t('select_bms_instance_first')}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

                  {/* Cluster Status - Parallel Connection with Busbar */}
                  {clusterList && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('cluster_status_parallel')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Busbar - 固定显示（修复：删除"母线(并联)"文案） */}
                        <div className="relative mb-6">
                          <div className="h-2 bg-red-500 rounded-full" />
                        </div>

                        {/* Clusters in Parallel - 横向排列，支持触摸滚动 */}
                        <div 
                          ref={scrollContainerRef}
                          className="flex gap-3 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing select-none relative"
                          style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(0,0,0,0.2) transparent',
                          }}
                          onMouseDown={(e) => {
                            if (!scrollContainerRef.current) return
                            isDraggingRef.current = true
                            startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft
                            scrollLeftRef.current = scrollContainerRef.current.scrollLeft
                            e.preventDefault()
                          }}
                          onMouseLeave={() => {
                            isDraggingRef.current = false
                          }}
                          onMouseUp={() => {
                            isDraggingRef.current = false
                          }}
                          onMouseMove={(e) => {
                            if (!isDraggingRef.current || !scrollContainerRef.current) return
                            e.preventDefault()
                            const x = e.pageX - scrollContainerRef.current.offsetLeft
                            const walk = (x - startXRef.current) * 2
                            scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk
                          }}
                          onTouchStart={(e) => {
                            if (!scrollContainerRef.current) return
                            isDraggingRef.current = true
                            startXRef.current = e.touches[0].pageX - scrollContainerRef.current.offsetLeft
                            scrollLeftRef.current = scrollContainerRef.current.scrollLeft
                          }}
                          onTouchMove={(e) => {
                            if (!isDraggingRef.current || !scrollContainerRef.current) return
                            e.preventDefault()
                            const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft
                            const walk = (x - startXRef.current) * 2
                            scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk
                          }}
                          onTouchEnd={() => {
                            isDraggingRef.current = false
                          }}
                        >
                          {clusterList.clusters.map((cluster, index) => {
                            const isClosed =
                              clusterBreakerStatuses.get(cluster.id) ??
                              cluster.fixedFields.breakerClosed
                            
                            // 查找SOC字段（动态字段）
                            const socField = cluster.dynamicFields.find(
                              f => f.nameEn === 'SOC' || f.nameZh === 'SOC'
                            )
                            const soc = socField
                              ? Number(i18n.language === 'zh-CN' ? socField.valueZh : socField.valueEn)
                              : 0

                            return (
                              <div key={cluster.id} className="relative flex-shrink-0" style={{ minWidth: '280px' }}>
                                {/* Connection Line from Busbar to Cluster - 连接到上方红色母线 */}
                                {/* 母线有 mb-6 (24px)，连接线需要从簇卡片顶部向上延伸到母线底部 */}
                                <div 
                                  className="absolute left-1/2 -top-6 w-0.5 bg-blue-500 transform -translate-x-1/2 z-10"
                                  style={{ height: '24px' }}
                                />

                                {/* Cluster Card - 减小宽度以适应更多簇 */}
                                <Card className="border-2 w-full">
                                  <CardContent className="p-3 space-y-2">
                                    <div className="text-base font-semibold">
                                      {t('cluster')} C{cluster.number}
                                    </div>

                                    <div className="space-y-1.5">
                                      {/* 固定字段：电压、电流 */}
                                      <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">
                                          {t('voltage')}:
                                        </span>
                                        <span className="font-semibold">
                                          {cluster.fixedFields.voltage.toFixed(1)}V
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">
                                          {t('current')}:
                                        </span>
                                        <span className="font-semibold">
                                          {cluster.fixedFields.current.toFixed(1)}A
                                        </span>
                                      </div>
                                      
                                      {/* 动态字段 */}
                                      {cluster.dynamicFields.map((field) => (
                                        <div key={field.nameEn} className="flex justify-between text-xs">
                                          <span className="text-muted-foreground">
                                            {getDynamicFieldName(field)}:
                                          </span>
                                          <span className="font-semibold">
                                            {getDynamicFieldValue(field)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>

                                    {/* SOC Progress Bar - 如果有SOC字段 */}
                                    {socField && (
                                      <div>
                                        <Progress value={soc} className="h-1.5" />
                                      </div>
                                    )}

                                    {/* Breaker Status and Control - 固定功能 */}
                                    <div className="space-y-1.5 pt-1.5 border-t">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-muted-foreground">
                                          {t('breaker')}:
                                        </span>
                                        {isClosed ? (
                                          <Badge variant="default" className="bg-green-500 text-[10px] px-1.5 py-0 h-5">
                                            {t('closed')}
                                          </Badge>
                                        ) : (
                                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                                            {t('open')}
                                          </Badge>
                                        )}
                                      </div>

                                      <div className="flex gap-1.5">
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleClusterBreakerControl(cluster.id, 'close')
                                          }}
                                          className="bg-green-500 hover:bg-green-600 text-white text-[10px] h-5 px-2"
                                          disabled={isClosed}
                                        >
                                          {t('close')}
                                        </Button>
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleClusterBreakerControl(cluster.id, 'open')
                                          }}
                                          variant="destructive"
                                          className="text-[10px] h-5 px-2"
                                          disabled={!isClosed}
                                        >
                                          {t('open')}
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="bau" className="mt-4">
              <div className="space-y-6">
                {stackDetailInfo ? (
                  <>
                    {/* 遥测数据 */}
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('telemetry_data')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                          {stackDetailInfo.telemetryData.map((field) => (
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
                          {stackDetailInfo.telecontrolData.map((data) => (
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
                          onClick={() => handleFaultReset('stack-01')}
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

            <TabsContent value="bcu" className="mt-4">
              <div className="space-y-6">
                {/* 簇选择器 */}
                {clusterList && clusterList.clusters.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('select_cluster')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">
                          {t('cluster')}:
                        </span>
                        <Select
                          value={selectedClusterId}
                          onValueChange={setSelectedClusterId}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {clusterList.clusters.map((cluster) => (
                              <SelectItem key={cluster.id} value={cluster.id}>
                                {i18n.language === 'zh-CN' ? `簇${cluster.number}` : `Cluster ${cluster.number}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {clusterList.clusters.length > 1 && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentIndex = clusterList.clusters.findIndex(c => c.id === selectedClusterId)
                                if (currentIndex > 0) {
                                  setSelectedClusterId(clusterList.clusters[currentIndex - 1].id)
                                }
                              }}
                              disabled={clusterList.clusters.findIndex(c => c.id === selectedClusterId) === 0}
                            >
                              {t('previous')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentIndex = clusterList.clusters.findIndex(c => c.id === selectedClusterId)
                                if (currentIndex < clusterList.clusters.length - 1) {
                                  setSelectedClusterId(clusterList.clusters[currentIndex + 1].id)
                                }
                              }}
                              disabled={clusterList.clusters.findIndex(c => c.id === selectedClusterId) === clusterList.clusters.length - 1}
                            >
                              {t('next')}
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                          onClick={() => handleFaultReset(selectedClusterId)}
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
                {/* 簇和包选择器 */}
                {clusterList && clusterList.clusters.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('select_cluster')} / {t('select_pack')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium">
                            {t('cluster')}:
                          </span>
                          <Select
                            value={bmuSelectedClusterId}
                            onValueChange={(v) => {
                              setBmuSelectedClusterId(v)
                              setBmuSelectedPackId('') // 重置包选择
                            }}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {clusterList.clusters.map((cluster) => (
                                <SelectItem key={cluster.id} value={cluster.id}>
                                  {i18n.language === 'zh-CN' ? `簇${cluster.number}` : `Cluster ${cluster.number}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {clusterList.clusters.length > 1 && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentIndex = clusterList.clusters.findIndex(c => c.id === bmuSelectedClusterId)
                                  if (currentIndex > 0) {
                                    const newClusterId = clusterList.clusters[currentIndex - 1].id
                                    setBmuSelectedClusterId(newClusterId)
                                    setBmuSelectedPackId('')
                                  }
                                }}
                                disabled={clusterList.clusters.findIndex(c => c.id === bmuSelectedClusterId) === 0}
                              >
                                {t('previous')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentIndex = clusterList.clusters.findIndex(c => c.id === bmuSelectedClusterId)
                                  if (currentIndex < clusterList.clusters.length - 1) {
                                    const newClusterId = clusterList.clusters[currentIndex + 1].id
                                    setBmuSelectedClusterId(newClusterId)
                                    setBmuSelectedPackId('')
                                  }
                                }}
                                disabled={clusterList.clusters.findIndex(c => c.id === bmuSelectedClusterId) === clusterList.clusters.length - 1}
                              >
                                {t('next')}
                              </Button>
                            </>
                          )}
                        </div>

                        {bmuPackList && bmuPackList.packs.length > 0 && (
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium">
                              {t('pack')}:
                            </span>
                            <Select
                              value={bmuSelectedPackId}
                              onValueChange={setBmuSelectedPackId}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {bmuPackList.packs.map((pack) => (
                                  <SelectItem key={pack.id} value={pack.id}>
                                    {i18n.language === 'zh-CN' ? `包${pack.number}` : `Pack ${pack.number}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {bmuPackList.packs.length > 1 && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentIndex = bmuPackList.packs.findIndex(p => p.id === bmuSelectedPackId)
                                    if (currentIndex > 0) {
                                      setBmuSelectedPackId(bmuPackList.packs[currentIndex - 1].id)
                                    }
                                  }}
                                  disabled={bmuPackList.packs.findIndex(p => p.id === bmuSelectedPackId) === 0}
                                >
                                  {t('previous')}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentIndex = bmuPackList.packs.findIndex(p => p.id === bmuSelectedPackId)
                                    if (currentIndex < bmuPackList.packs.length - 1) {
                                      setBmuSelectedPackId(bmuPackList.packs[currentIndex + 1].id)
                                    }
                                  }}
                                  disabled={bmuPackList.packs.findIndex(p => p.id === bmuSelectedPackId) === bmuPackList.packs.length - 1}
                                >
                                  {t('next')}
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* BMU子标签页 */}
                {bmuSelectedClusterId && bmuSelectedPackId && (
                  <Tabs value={bmuActiveSubTab} onValueChange={(v) => setBmuActiveSubTab(v as 'cell' | 'temperature')}>
                    <TabsList>
                      <TabsTrigger value="cell">{t('cell_information')}</TabsTrigger>
                      <TabsTrigger value="temperature">{t('temperature_points')}</TabsTrigger>
                    </TabsList>

                    {/* 单体信息 */}
                    <TabsContent value="cell" className="mt-4">
                      {clusterPackCellInfo ? (
                        <div className="space-y-4">
                          {/* 单体配置 */}
                          <Card>
                            <CardHeader>
                              <CardTitle>{t('cell_configuration')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-lg font-semibold">{clusterPackCellInfo.cellConfiguration}</p>
                            </CardContent>
                          </Card>

                          {/* 单体数据网格 */}
                          <Card>
                            <CardHeader>
                              <CardTitle>{t('cell_data')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-3">
                                {clusterPackCellInfo.cells.map((cell) => {
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
                      {clusterPackTemperature ? (
                        <Card>
                          <CardHeader>
                            <CardTitle>{t('temperature_points')}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                              {clusterPackTemperature.temperaturePoints.map((point) => {
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
                )}
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
      )}
    </div>
  )
}
