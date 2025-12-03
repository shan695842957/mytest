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
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  StackBasicInfoResponse,
  ClusterListResponse,
  BreakerControlRequest,
  DynamicField,
  ClusterInfo,
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
    }
    
    loadData()
    
    // 定时更新数据
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])
  
  // 控制堆断路器
  const handleStackBreakerControl = async (action: 'close' | 'open') => {
    // TODO: 调用后端API
    await controlBreaker({
      targetId: 'stack-01',
      action,
    })
    
    setStackBreakerClosed(action === 'close')
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
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('bms.bau_title', '堆控制单元')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {t('bms.bau_placeholder', 'BAU 页面内容待实现...')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="bcu" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('bms.bcu_title', '簇控制单元')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {t('bms.bcu_placeholder', 'BCU 页面内容待实现...')}
                    </p>
                  </CardContent>
                </Card>
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
