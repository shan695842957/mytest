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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  ClusterBasicInfoResponse,
  PackListResponse,
  BreakerControlRequest,
  DynamicField,
  PackInfo,
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

// ========== 组件 ==========

export default function BMSLevel2Page() {
  const { t, i18n } = useTranslation('testPanel')
  const [activeTab, setActiveTab] = useState('sys')
  
  // 簇基本信息
  const [clusterBasicInfo, setClusterBasicInfo] = useState<ClusterBasicInfoResponse | null>(null)
  const [clusterBreakerClosed, setClusterBreakerClosed] = useState(false)
  
  // 包列表
  const [packList, setPackList] = useState<PackListResponse | null>(null)
  
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
    }
    
    loadData()
    
    // 定时更新数据
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])
  
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('bms.level2_title')}</CardTitle>
          <CardDescription>{t('bms.level2_description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sys">{t('bms.tab_sys')}</TabsTrigger>
              <TabsTrigger value="bcu">{t('bms.tab_bcu')}</TabsTrigger>
              <TabsTrigger value="bmu">{t('bms.tab_bmu')}</TabsTrigger>
              <TabsTrigger value="evt">{t('bms.tab_evt')}</TabsTrigger>
            </TabsList>

            <TabsContent value="sys" className="mt-4">
              {clusterBasicInfo && (
                <div className="space-y-6">
                  {/* Cluster Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('bms.cluster_basic_info')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Alarm Status - 固定字段 */}
                        <div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {t('bms.alarm_status')}
                          </div>
                          <Badge
                            variant={clusterBasicInfo.fixedFields.fault ? 'destructive' : 'secondary'}
                            className="w-full justify-center"
                          >
                            {clusterBasicInfo.fixedFields.fault
                              ? t('bms.fault')
                              : t('bms.normal')}
                          </Badge>
                        </div>

                        {/* Cluster Voltage - 固定字段 */}
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="text-xs text-muted-foreground mb-1">
                            {t('bms.cluster_voltage')}
                          </div>
                          <div className="text-2xl font-bold">
                            {clusterBasicInfo.fixedFields.voltage} V
                          </div>
                        </div>

                        {/* Cluster Current - 固定字段 */}
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="text-xs text-muted-foreground mb-1">
                            {t('bms.cluster_current')}
                          </div>
                          <div className="text-2xl font-bold">
                            {clusterBasicInfo.fixedFields.current} A
                          </div>
                        </div>

                        {/* Power - 固定字段 */}
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="text-xs text-muted-foreground mb-1">
                            {t('bms.power')}
                          </div>
                          <div className="text-2xl font-bold">
                            {clusterBasicInfo.fixedFields.power} kW
                          </div>
                        </div>
                      </div>

                      {/* Breaker Status - 固定字段 */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {t('bms.breaker_status')}:
                        </span>
                        {clusterBreakerClosed ? (
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
                      <CardTitle>{t('bms.breaker_control')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4">
                        <Button
                          onClick={() => handleBreakerControl('close')}
                          className="bg-green-500 hover:bg-green-600 text-white"
                          disabled={clusterBreakerClosed}
                        >
                          {t('bms.close_breaker')}
                        </Button>
                        <Button
                          onClick={() => handleBreakerControl('open')}
                          variant="destructive"
                          disabled={!clusterBreakerClosed}
                        >
                          {t('bms.open_breaker')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Separator />

                  {/* Pack Status - Series Connection */}
                  {packList && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('bms.pack_status_series')}</CardTitle>
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
                                  {/* Series Connection Indicator - 固定显示 */}
                                  {idx > 0 && (
                                    <div className="absolute left-[100px] -top-3 flex flex-col items-center">
                                      <div className="h-3 w-0.5 bg-blue-500" />
                                      <span className="text-xs text-blue-500 mt-1">
                                        {t('bms.series')}
                                      </span>
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
                                              {t('bms.pack')} {pack.number}
                                            </div>
                                          </div>

                                          {/* 固定字段：电压、电流 */}
                                          <div className="space-y-1">
                                            <div className="text-xs text-muted-foreground">
                                              {t('bms.voltage')}
                                            </div>
                                            <div className="text-sm font-semibold">
                                              {pack.fixedFields.voltage.toFixed(1)}V
                                            </div>
                                          </div>

                                          <div className="space-y-1">
                                            <div className="text-xs text-muted-foreground">
                                              {t('bms.current')}
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
                                              ? t('bms.warning')
                                              : t('bms.normal')}
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
