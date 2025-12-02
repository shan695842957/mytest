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

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BatteryStack, BreakerStatus, DataField } from '@/types/bms-new'

// 生成模拟数据
const generateMockData = (): BatteryStack => {
  const clusterCount = 3
  const clusters = []
  
  for (let i = 0; i < clusterCount; i++) {
    const soc = 12.8 + i * 0.1
    const voltage = 1250.5 - i * 0.1
    
    clusters.push({
      id: `cluster-${i + 1}`,
      packs: [],
      highVoltageBox: {
        fields: [
          { name: 'SOC', value: soc, unit: '%' },
          { name: 'Voltage', value: voltage, unit: 'V' },
          { name: 'Current', value: 110.0, unit: 'A' },
        ],
        breaker: { closed: i % 2 === 0 },
      },
    })
  }
  
  return {
    id: 'stack-01',
    clusters,
    mainHighVoltageBox: {
      fields: [
        { name: 'Stack Voltage', value: 1250.5, unit: 'V' },
        { name: 'Stack Current', value: 1320.0, unit: 'A' },
        { name: 'Power', value: 1650.6, unit: 'kW' },
        { name: 'SOC', value: 12.7, unit: '%' },
        { name: 'SOE', value: 0.0, unit: '%' },
        { name: 'SOH', value: 93, unit: '%' },
        { name: 'SOS', value: 50.0, unit: '%' },
        { name: 'Consistency', value: 91, unit: '%' },
        { name: 'Insulation', value: 0, unit: 'kΩ' },
      ],
      breaker: { closed: false },
      fault: true,
    },
  }
}

export default function BMSLevel3Page() {
  const { t } = useTranslation('testPanel')
  const [activeTab, setActiveTab] = useState('sys')
  const [stackData, setStackData] = useState<BatteryStack>(generateMockData)
  const [breakerStatus, setBreakerStatus] = useState<BreakerStatus>(stackData.mainHighVoltageBox.breaker)
  const [clusterBreakerStatuses, setClusterBreakerStatuses] = useState<Map<string, BreakerStatus>>(
    new Map(stackData.clusters.map(c => [c.id, c.highVoltageBox.breaker]))
  )
  
  // 定时更新数据
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = generateMockData()
      setStackData(newData)
      setClusterBreakerStatuses(
        new Map(newData.clusters.map(c => [c.id, c.highVoltageBox.breaker]))
      )
    }, 5000)
    return () => clearInterval(interval)
  }, [])
  
  // 同步断路器状态
  useEffect(() => {
    setBreakerStatus(stackData.mainHighVoltageBox.breaker)
  }, [stackData])
  
  const handleBreakerControl = (action: 'close' | 'open') => {
    const newStatus: BreakerStatus = { closed: action === 'close' }
    setBreakerStatus(newStatus)
    // TODO: 调用后端API控制断路器
  }
  
  const handleClusterBreakerControl = (clusterId: string, action: 'close' | 'open') => {
    const newStatus: BreakerStatus = { closed: action === 'close' }
    setClusterBreakerStatuses(prev => {
      const newMap = new Map(prev)
      newMap.set(clusterId, newStatus)
      return newMap
    })
    // TODO: 调用后端API控制簇断路器
  }
  
  const getFieldValue = (fields: DataField[], name: string): number | string => {
    const field = fields.find(f => f.name === name || f.name.toLowerCase().includes(name.toLowerCase()))
    return field?.value ?? 0
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('bms_level3_title', 'BMS 三级架构')}</CardTitle>
          <CardDescription>
            {t('bms_level3_description', '电池堆 → 电池簇 → 电池包 → 电池单体结构')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="sys">
                {t('bms_tab_sys', 'SYS')}
              </TabsTrigger>
              <TabsTrigger value="bau">
                {t('bms_tab_bau', 'BAU')}
              </TabsTrigger>
              <TabsTrigger value="bcu">
                {t('bms_tab_bcu', 'BCU')}
              </TabsTrigger>
              <TabsTrigger value="bmu">
                {t('bms_tab_bmu', 'BMU')}
              </TabsTrigger>
              <TabsTrigger value="evt">
                {t('bms_tab_evt', 'EVT')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sys" className="mt-4">
              <div className="space-y-6">
                {/* Stack Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('bms_stack_basic_info', 'Stack Basic Information', '堆基本信息')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Alarm Status */}
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {t('bms_alarm_status', 'Alarm Status', '告警状态')}
                        </div>
                        <Badge 
                          variant={stackData.mainHighVoltageBox.fault ? 'destructive' : 'secondary'}
                          className="w-full justify-center"
                        >
                          {stackData.mainHighVoltageBox.fault 
                            ? t('bms_fault', 'Fault', '故障')
                            : t('bms_normal', 'Normal', '正常')}
                        </Badge>
                      </div>
                      
                      {/* Main Metrics */}
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="text-xs text-muted-foreground mb-1">
                          {t('bms_stack_voltage', 'Stack Voltage', '堆电压')}
                        </div>
                        <div className="text-2xl font-bold">
                          {getFieldValue(stackData.mainHighVoltageBox.fields, 'Stack Voltage')} V
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="text-xs text-muted-foreground mb-1">
                          {t('bms_stack_current', 'Stack Current', '堆电流')}
                        </div>
                        <div className="text-2xl font-bold">
                          {getFieldValue(stackData.mainHighVoltageBox.fields, 'Stack Current')} A
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="text-xs text-muted-foreground mb-1">
                          {t('bms_power', 'Power', '功率')}
                        </div>
                        <div className="text-2xl font-bold">
                          {getFieldValue(stackData.mainHighVoltageBox.fields, 'Power')} kW
                        </div>
                      </div>
                    </div>
                    
                    {/* Breaker Status */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {t('bms_breaker_status', 'Breaker Status', '断路器状态')}:
                      </span>
                      {breakerStatus.closed ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {t('bms_closed', 'Closed', '合闸')}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          {t('bms_open', 'Open', '分闸')}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Additional Indicators */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {['SOC', 'SOE', 'SOH', 'SOS', 'Consistency', 'Insulation'].map((key) => {
                        const value = getFieldValue(stackData.mainHighVoltageBox.fields, key)
                        const unit = stackData.mainHighVoltageBox.fields.find(
                          f => f.name === key || f.name.toLowerCase().includes(key.toLowerCase())
                        )?.unit || ''
                        return (
                          <div key={key}>
                            <div className="text-xs text-muted-foreground mb-1">{key}</div>
                            <div className="text-lg font-semibold">
                              {typeof value === 'number' ? value.toFixed(1) : value} {unit}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
                
                <Separator />
                
                {/* Breaker Control */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('bms_breaker_control', 'Breaker Control', '断路器控制')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <Button
                        onClick={() => handleBreakerControl('close')}
                        className="bg-green-500 hover:bg-green-600 text-white"
                        disabled={breakerStatus.closed}
                      >
                        {t('bms_close_breaker', 'Close Breaker', '合闸')}
                      </Button>
                      <Button
                        onClick={() => handleBreakerControl('open')}
                        variant="destructive"
                        disabled={!breakerStatus.closed}
                      >
                        {t('bms_open_breaker', 'Open Breaker', '分闸')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Separator />
                
                {/* Cluster Status - Parallel Connection with Busbar */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {t('bms_cluster_status_parallel', 'Cluster Status (Parallel Connection)', '簇状态（并联连接）')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Busbar */}
                    <div className="relative mb-6">
                      <div className="h-2 bg-red-500 rounded-full" />
                      <div className="absolute left-2 -top-6 text-xs text-muted-foreground">
                        {t('bms_busbar_parallel', 'Busbar (Parallel)', '母线（并联）')}
                      </div>
                    </div>
                    
                    {/* Clusters in Parallel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stackData.clusters.map((cluster, idx) => {
                        const soc = Number(getFieldValue(cluster.highVoltageBox.fields, 'SOC'))
                        const voltage = Number(getFieldValue(cluster.highVoltageBox.fields, 'Voltage'))
                        const current = Number(getFieldValue(cluster.highVoltageBox.fields, 'Current'))
                        const clusterBreaker = clusterBreakerStatuses.get(cluster.id) || cluster.highVoltageBox.breaker
                        const isClosed = clusterBreaker.closed ?? false
                        
                        return (
                          <div key={cluster.id} className="relative">
                            {/* Connection Line from Busbar */}
                            <div className="absolute left-1/2 -top-6 w-0.5 h-6 bg-blue-500 transform -translate-x-1/2" />
                            
                            {/* Cluster Card */}
                            <Card className="border-2">
                              <CardContent className="p-4 space-y-3">
                                <div className="text-lg font-semibold">
                                  {t('bms_cluster', 'Cluster', '簇')} C{idx + 1}
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">SOC:</span>
                                    <span className="font-semibold">{soc.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                      {t('bms_voltage', 'Voltage', '电压')}:
                                    </span>
                                    <span className="font-semibold">{voltage.toFixed(1)}V</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                      {t('bms_current', 'Current', '电流')}:
                                    </span>
                                    <span className="font-semibold">{current.toFixed(1)}A</span>
                                  </div>
                                </div>
                                
                                {/* SOC Progress Bar */}
                                <div>
                                  <Progress value={soc} className="h-2" />
                                </div>
                                
                                {/* Breaker Status and Control */}
                                <div className="space-y-2 pt-2 border-t">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                      {t('bms_breaker', 'Breaker', '断路器')}:
                                    </span>
                                    {isClosed ? (
                                      <Badge variant="default" className="bg-green-500 text-xs">
                                        {t('bms_closed', 'Closed', '合闸')}
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive" className="text-xs">
                                        {t('bms_open', 'Open', '分闸')}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleClusterBreakerControl(cluster.id, 'close')}
                                      className="bg-green-500 hover:bg-green-600 text-white text-xs h-6 px-2"
                                      disabled={isClosed}
                                    >
                                      {t('bms_close', 'Close', '合闸')}
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleClusterBreakerControl(cluster.id, 'open')}
                                      variant="destructive"
                                      className="text-xs h-6 px-2"
                                      disabled={!isClosed}
                                    >
                                      {t('bms_open', 'Open', '分闸')}
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
              </div>
            </TabsContent>

            <TabsContent value="bau" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('bms_bau_title', '堆控制单元')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {t('bms_bau_placeholder', 'BAU 页面内容待实现...')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="bcu" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('bms_bcu_title', '簇控制单元')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {t('bms_bcu_placeholder', 'BCU 页面内容待实现...')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="bmu" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('bms_bmu_title', '包管理单元')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {t('bms_bmu_placeholder', 'BMU 页面内容待实现...')}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="evt" className="mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('bms_evt_title', '事件记录')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {t('bms_evt_placeholder', 'EVT 页面内容待实现...')}
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
