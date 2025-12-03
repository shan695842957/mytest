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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
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
      { nameEn: 'SOC', nameZh: 'SOC', valueEn: 12.7, valueZh: 12.7, unitEn: '%', unitZh: '%' },
      { nameEn: 'SOE', nameZh: 'SOE', valueEn: 0.0, valueZh: 0.0, unitEn: '%', unitZh: '%' },
      { nameEn: 'SOH', nameZh: 'SOH', valueEn: 93, valueZh: 93, unitEn: '%', unitZh: '%' },
      { nameEn: 'SOS', nameZh: 'SOS', valueEn: 50.0, valueZh: 50.0, unitEn: '%', unitZh: '%' },
      { nameEn: 'Consistency', nameZh: '一致性', valueEn: 91, valueZh: 91, unitEn: '%', unitZh: '%' },
      { nameEn: 'Insulation', nameZh: '绝缘', valueEn: 0, valueZh: 0, unitEn: 'kΩ', unitZh: 'kΩ' },
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
      { nameEn: 'SOC', nameZh: 'SOC', valueEn: 12.7, valueZh: 12.7, unitEn: '%', unitZh: '%' },
      { nameEn: 'SOE', nameZh: 'SOE', valueEn: 0.0, valueZh: 0.0, unitEn: '%', unitZh: '%' },
      { nameEn: 'SOH', nameZh: 'SOH', valueEn: 93, valueZh: 93, unitEn: '%', unitZh: '%' },
      { nameEn: 'SOS', nameZh: 'SOS', valueEn: 50.0, valueZh: 50.0, unitEn: '%', unitZh: '%' },
      { nameEn: 'Consistency', nameZh: '一致性', valueEn: 91, valueZh: 91, unitEn: '%', unitZh: '%' },
      { nameEn: 'Stack Voltage', nameZh: '堆电压', valueEn: 1250.5, valueZh: 1250.5, unitEn: 'V', unitZh: 'V' },
      { nameEn: 'Stack Current', nameZh: '堆电流', valueEn: 1320.0, valueZh: 1320.0, unitEn: 'A', unitZh: 'A' },
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

// ========== 组件 ==========

export default function BMSLevel3Page() {
  const { t, i18n } = useTranslation('testPanel')
  const [activeTab, setActiveTab] = useState('sys')
  
  // 堆基本信息
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
  
  // 触摸滚动相关
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  
  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      const [basicInfo, clusters] = await Promise.all([
        fetchStackBasicInfo(),
        fetchClusterList(),
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
      }
    }
    
    loadData()
    
    // 定时更新数据
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])
  
  // 加载BAU页面数据
  useEffect(() => {
    if (activeTab === 'bau') {
      const loadBAUData = async () => {
        const data = await fetchStackDetailInfo()
        setStackDetailInfo(data)
      }
      loadBAUData()
      
      // 定时刷新
      const interval = setInterval(loadBAUData, 5000)
      return () => clearInterval(interval)
    }
  }, [activeTab])
  
  // 加载BCU页面数据
  useEffect(() => {
    if (activeTab === 'bcu' && selectedClusterId) {
      const loadBCUData = async () => {
        const data = await fetchClusterDetailInfo(selectedClusterId)
        setClusterDetailInfo(data)
      }
      loadBCUData()
      
      // 定时刷新
      const interval = setInterval(loadBCUData, 5000)
      return () => clearInterval(interval)
    }
  }, [activeTab, selectedClusterId])
  
  // 控制堆断路器
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('bms.level3_title')}</CardTitle>
          <CardDescription>{t('bms.level3_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="sys">{t('bms.tab_sys')}</TabsTrigger>
              <TabsTrigger value="bau">{t('bms.tab_bau')}</TabsTrigger>
              <TabsTrigger value="bcu">{t('bms.tab_bcu')}</TabsTrigger>
              <TabsTrigger value="bmu">{t('bms.tab_bmu')}</TabsTrigger>
              <TabsTrigger value="evt">{t('bms.tab_evt')}</TabsTrigger>
            </TabsList>

            <TabsContent value="sys" className="mt-4">
              {stackBasicInfo && (
                <div className="space-y-6">
                  {/* Stack Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('bms.stack_basic_info')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Alarm Status - 固定字段 */}
                        <div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {t('bms.alarm_status')}
                          </div>
                          <Badge
                            variant={stackBasicInfo.fixedFields.fault ? 'destructive' : 'secondary'}
                            className="w-full justify-center"
                          >
                            {stackBasicInfo.fixedFields.fault
                              ? t('bms.fault')
                              : t('bms.normal')}
                          </Badge>
                        </div>

                        {/* Stack Voltage - 固定字段 */}
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="text-xs text-muted-foreground mb-1">
                            {t('bms.stack_voltage')}
                          </div>
                          <div className="text-2xl font-bold">
                            {stackBasicInfo.fixedFields.voltage} V
                          </div>
                        </div>

                        {/* Stack Current - 固定字段 */}
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="text-xs text-muted-foreground mb-1">
                            {t('bms.stack_current')}
                          </div>
                          <div className="text-2xl font-bold">
                            {stackBasicInfo.fixedFields.current} A
                          </div>
                        </div>

                        {/* Power - 固定字段 */}
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="text-xs text-muted-foreground mb-1">
                            {t('bms.power')}
                          </div>
                          <div className="text-2xl font-bold">
                            {stackBasicInfo.fixedFields.power} kW
                          </div>
                        </div>
                      </div>

                      {/* Breaker Status - 固定字段 */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {t('bms.breaker_status')}:
                        </span>
                        {stackBreakerClosed ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {t('bms.closed')}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            {t('bms.open')}
                          </Badge>
                        )}
                      </div>

                      {/* Dynamic Fields - 动态字段 */}
                      {stackBasicInfo.dynamicFields.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                          {stackBasicInfo.dynamicFields.map((field) => (
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
                      <CardTitle>{t('bms.breaker_control')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4">
                        <Button
                          onClick={() => handleStackBreakerControl('close')}
                          className="bg-green-500 hover:bg-green-600 text-white"
                          disabled={stackBreakerClosed}
                        >
                          {t('bms.close_breaker')}
                        </Button>
                        <Button
                          onClick={() => handleStackBreakerControl('open')}
                          variant="destructive"
                          disabled={!stackBreakerClosed}
                        >
                          {t('bms.open_breaker')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Cluster Status - Parallel Connection with Busbar */}
                  {clusterList && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('bms.cluster_status_parallel')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Busbar - 固定显示 */}
                        <div className="relative mb-6">
                          <div className="h-2 bg-red-500 rounded-full" />
                          <div className="absolute left-2 -top-6 text-xs text-muted-foreground">
                            {t('bms.busbar_parallel')}
                          </div>
                        </div>

                        {/* Clusters in Parallel - 横向排列，支持触摸滚动 */}
                        <div 
                          ref={scrollContainerRef}
                          className="flex gap-3 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing select-none"
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
                          {clusterList.clusters.map((cluster) => {
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
                                {/* Connection Line from Busbar - 固定显示 */}
                                <div className="absolute left-1/2 -top-6 w-0.5 h-6 bg-blue-500 transform -translate-x-1/2" />

                                {/* Cluster Card - 减小宽度以适应更多簇 */}
                                <Card className="border-2 w-full">
                                  <CardContent className="p-3 space-y-2">
                                    <div className="text-base font-semibold">
                                      {t('bms.cluster')} C{cluster.number}
                                    </div>

                                    <div className="space-y-1.5">
                                      {/* 固定字段：电压、电流 */}
                                      <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">
                                          {t('bms.voltage')}:
                                        </span>
                                        <span className="font-semibold">
                                          {cluster.fixedFields.voltage.toFixed(1)}V
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">
                                          {t('bms.current')}:
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
                                          {t('bms.breaker')}:
                                        </span>
                                        {isClosed ? (
                                          <Badge variant="default" className="bg-green-500 text-[10px] px-1.5 py-0 h-5">
                                            {t('bms.closed')}
                                          </Badge>
                                        ) : (
                                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                                            {t('bms.open')}
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
                                          {t('bms.close')}
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
                                          {t('bms.open')}
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
                        <CardTitle>{t('bms.telemetry_data', '遥测数据')}</CardTitle>
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
                        <CardTitle>{t('bms.telecontrol_data', '遥信数据')}</CardTitle>
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
                        <CardTitle>{t('bms.control_commands', '控制命令')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="destructive"
                          onClick={() => handleFaultReset('stack-01')}
                        >
                          {t('bms.fault_reset', '故障复位')}
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      {t('bms.loading', '加载中...')}
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
                      <CardTitle>{t('bms.select_cluster', '选择簇')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">
                          {t('bms.cluster', '簇')}:
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
                              {t('bms.previous', '上一个')}
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
                              {t('bms.next', '下一个')}
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
                        <CardTitle>{t('bms.telemetry_data', '遥测数据')}</CardTitle>
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
                        <CardTitle>{t('bms.telecontrol_data', '遥信数据')}</CardTitle>
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
                        <CardTitle>{t('bms.control_commands', '控制命令')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="destructive"
                          onClick={() => handleFaultReset(selectedClusterId)}
                        >
                          {t('bms.fault_reset', '故障复位')}
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      {t('bms.loading', '加载中...')}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="bmu" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('bms.bmu_title', '包管理单元')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {t('bms.bmu_placeholder', 'BMU 页面内容待实现...')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="evt" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('bms.evt_title', '事件记录')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {t('bms.evt_placeholder', 'EVT 页面内容待实现...')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
