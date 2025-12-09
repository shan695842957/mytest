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
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { BMSSysTabLevel2 } from '@/components/bms/BMSSysTabLevel2'
import { BMSBcuTabLevel2 } from '@/components/bms/BMSBcuTabLevel2'
import { BMSBmuTabLevel2 } from '@/components/bms/BMSBmuTabLevel2'
import { BMSEvtTab } from '@/components/bms/BMSEvtTab'
import { toast } from 'sonner'
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
    ],
    telecontrolData: [
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

  ]
  
  const activeTelecontrols: ActiveTelecontrol[] = [

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
  
  // WebSocket 缓存数据（key: field_key, value: 实时值）
  // TODO: 接入真实 WebSocket，从 asset_state 获取数据
  const [realtimeValues, setRealtimeValues] = useState<Record<string, any>>({})
  
  // 簇基本信息（保留用于其他 Tab）
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
  
  // 加载数据（依赖selectedBMSInstanceId）
  useEffect(() => {
    // 如果没有选择BMS实例，不加载数据
    if (!selectedBMSInstanceId) return
    
    const loadData = async () => {
      // TODO: 传递instance_id到API调用
      const [basicInfo, packs] = await Promise.all([
        fetchClusterBasicInfo(), // TODO: fetchClusterBasicInfo(selectedBMSInstanceId)
        fetchPackList(), // TODO: fetchPackList(selectedBMSInstanceId)
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
  }, [selectedBMSInstanceId])
  
  // 加载BCU页面数据（依赖selectedBMSInstanceId）
  useEffect(() => {
    if (activeTab === 'bcu' && selectedBMSInstanceId) {
      const loadBCUData = async () => {
        // TODO: 传递instance_id到API调用
        const data = await fetchClusterDetailInfo() // TODO: fetchClusterDetailInfo(selectedBMSInstanceId)
        setClusterDetailInfo(data)
      }
      loadBCUData()
      
      // 定时刷新
      const interval = setInterval(loadBCUData, 5000)
      return () => clearInterval(interval)
    }
  }, [activeTab, selectedBMSInstanceId])
  
  // 加载BMU页面数据（依赖selectedBMSInstanceId）
  useEffect(() => {
    if (activeTab === 'bmu' && selectedPackId && selectedBMSInstanceId) {
      const loadBMUData = async () => {
        if (bmuActiveSubTab === 'cell') {
          // TODO: 传递instance_id到API调用
          const data = await fetchPackCellInfo(selectedPackId) // TODO: fetchPackCellInfo(selectedBMSInstanceId, selectedPackId)
          setPackCellInfo(data)
        } else {
          // TODO: 传递instance_id到API调用
          const data = await fetchPackTemperature(selectedPackId) // TODO: fetchPackTemperature(selectedBMSInstanceId, selectedPackId)
          setPackTemperature(data)
        }
      }
      loadBMUData()
      
      // 定时刷新
      const interval = setInterval(loadBMUData, 5000)
      return () => clearInterval(interval)
    }
  }, [activeTab, selectedPackId, bmuActiveSubTab, selectedBMSInstanceId])
  
  // 加载EVT页面数据（依赖selectedBMSInstanceId）
  useEffect(() => {
    if (activeTab === 'evt' && selectedBMSInstanceId) {
      const loadEVTData = async () => {
        // TODO: 传递instance_id到API调用
        const data = await fetchEventLog() // TODO: fetchEventLog(selectedBMSInstanceId)
        setEventLog(data)
      }
      loadEVTData()
      
      // 定时刷新
      const interval = setInterval(loadEVTData, 5000)
      return () => clearInterval(interval)
    }
  }, [activeTab, selectedBMSInstanceId])
  
  // 控制簇断路器（SYS Tab 使用）
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
  
  // 控制簇断路器（其他 Tab 使用，保留兼容）
  const handleBreakerControlLegacy = async (action: 'close' | 'open') => {
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
              {selectedBMSInstanceId ? (
                <BMSSysTabLevel2
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

            <TabsContent value="bcu" className="mt-4">
              {selectedBMSInstanceId ? (
                <BMSBcuTabLevel2
                  instanceId={selectedBMSInstanceId}
                  realtimeValues={realtimeValues}
                  onFaultReset={() => {
                    // TODO: 实现故障复位API调用
                    console.log('Fault reset for cluster')
                  }}
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

            <TabsContent value="bmu" className="mt-4">
              {selectedBMSInstanceId ? (
                <BMSBmuTabLevel2
                  instanceId={selectedBMSInstanceId}
                  realtimeValues={realtimeValues}
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

            <TabsContent value="evt" className="mt-4">
              {selectedBMSInstanceId ? (
                <BMSEvtTab
                  instanceId={selectedBMSInstanceId}
                  realtimeValues={realtimeValues}
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
          </Tabs>
        </CardContent>
      </Card>
      )}
    </div>
  )
}
