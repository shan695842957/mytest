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
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BatteryClusterLevel2, BreakerStatus, DataField } from '@/types/bms-new'

// 生成模拟数据
const generateMockData = (): BatteryClusterLevel2 => {
  const packCount = 8
  const packs = []
  
  for (let i = 0; i < packCount; i++) {
    const soc = 93.0 - i * 0.7
    const voltage = 125.0 - i * 0.1
    const tempDiff = 1.4 + i * 0.2
    
    packs.push({
      id: `pack-${i + 1}`,
      cells: [],
      temperaturePoints: [],
      fields: [
        { name: 'SOC', value: soc, unit: '%' },
        { name: 'Voltage', value: voltage, unit: 'V' },
        { name: 'Current', value: 110.0, unit: 'A' },
        { name: 'Temperature Diff', value: tempDiff, unit: '°C' },
      ],
      fault: i % 4 === 0,
    })
  }
  
  return {
    id: 'cluster-01',
    packs,
    highVoltageBox: {
      fields: [
        { name: 'Cluster Voltage', value: 1250.5, unit: 'V' },
        { name: 'Cluster Current', value: 1320.0, unit: 'A' },
        { name: 'Power', value: 1650.6, unit: 'kW' },
        { name: 'SOC', value: 12.7, unit: '%' },
        { name: 'SOE', value: 0.0, unit: '%' },
        { name: 'SOH', value: 93, unit: '%' },
        { name: 'SOS', value: 50.0, unit: '%' },
        { name: 'Consistency', value: 91, unit: '%' },
        { name: 'Insulation', value: 980, unit: 'kΩ' },
      ],
      breaker: { closed: true },
      fault: true,
    },
  }
}

export default function BMSLevel2Page() {
  const { t } = useTranslation('testPanel')
  const [activeTab, setActiveTab] = useState('sys')
  const [clusterData, setClusterData] = useState<BatteryClusterLevel2>(generateMockData)
  const [breakerStatus, setBreakerStatus] = useState<BreakerStatus>(clusterData.highVoltageBox.breaker)
  
  // 定时更新数据
  useEffect(() => {
    const interval = setInterval(() => {
      setClusterData(generateMockData())
    }, 5000)
    return () => clearInterval(interval)
  }, [])
  
  // 同步断路器状态
  useEffect(() => {
    setBreakerStatus(clusterData.highVoltageBox.breaker)
  }, [clusterData])
  
  const handleBreakerControl = (action: 'close' | 'open') => {
    const newStatus: BreakerStatus = { closed: action === 'close' }
    setBreakerStatus(newStatus)
    // TODO: 调用后端API控制断路器
  }
  
  const getFieldValue = (fields: DataField[], name: string): number | string => {
    const field = fields.find(f => f.name === name || f.name.toLowerCase().includes(name.toLowerCase()))
    return field?.value ?? 0
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('bms_level2_title', 'BMS 二级架构')}</CardTitle>
          <CardDescription>
            {t('bms_level2_description', '电池簇 → 电池包 → 电池单体结构')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sys">
                {t('bms_tab_sys', 'SYS')}
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
                {/* Cluster Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('bms_cluster_basic_info', 'Cluster Basic Information', '簇基本信息')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Alarm Status */}
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {t('bms_alarm_status', 'Alarm Status', '告警状态')}
                        </div>
                        <Badge 
                          variant={clusterData.highVoltageBox.fault ? 'destructive' : 'secondary'}
                          className="w-full justify-center"
                        >
                          {clusterData.highVoltageBox.fault 
                            ? t('bms_fault', 'Fault', '故障')
                            : t('bms_normal', 'Normal', '正常')}
                        </Badge>
                      </div>
                      
                      {/* Main Metrics */}
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="text-xs text-muted-foreground mb-1">
                          {t('bms_cluster_voltage', 'Cluster Voltage', '簇电压')}
                        </div>
                        <div className="text-2xl font-bold">
                          {getFieldValue(clusterData.highVoltageBox.fields, 'Cluster Voltage')} V
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="text-xs text-muted-foreground mb-1">
                          {t('bms_cluster_current', 'Cluster Current', '簇电流')}
                        </div>
                        <div className="text-2xl font-bold">
                          {getFieldValue(clusterData.highVoltageBox.fields, 'Cluster Current')} A
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="text-xs text-muted-foreground mb-1">
                          {t('bms_power', 'Power', '功率')}
                        </div>
                        <div className="text-2xl font-bold">
                          {getFieldValue(clusterData.highVoltageBox.fields, 'Power')} kW
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
                        const value = getFieldValue(clusterData.highVoltageBox.fields, key)
                        const unit = clusterData.highVoltageBox.fields.find(
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
                
                {/* Pack Status - Series Connection */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {t('bms_pack_status_series', 'Pack Status (Series Connection)', '包状态（串联连接）')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-3 pr-4">
                        {clusterData.packs.map((pack, idx) => {
                          const soc = Number(getFieldValue(pack.fields, 'SOC'))
                          const voltage = Number(getFieldValue(pack.fields, 'Voltage'))
                          const current = Number(getFieldValue(pack.fields, 'Current'))
                          const tempDiff = Number(getFieldValue(pack.fields, 'Temperature Diff'))
                          const isFault = pack.fault || false
                          
                          return (
                            <div key={pack.id} className="relative">
                              {/* Series Connection Indicator */}
                              {idx > 0 && (
                                <div className="absolute left-[100px] -top-3 flex flex-col items-center">
                                  <div className="h-3 w-0.5 bg-blue-500" />
                                  <span className="text-xs text-blue-500 mt-1">
                                    {t('bms_series', 'Series', '串联')}
                                  </span>
                                </div>
                              )}
                              
                              {/* Pack Card */}
                              <Card className={cn(
                                'border-2',
                                isFault ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : ''
                              )}>
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 grid grid-cols-4 gap-4">
                                      <div>
                                        <div className="text-sm font-semibold mb-1">
                                          {t('bms_pack', 'Pack', '包')} {idx + 1}
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <div className="text-xs text-muted-foreground">SOC</div>
                                        <div className="text-sm font-semibold">{soc.toFixed(1)}%</div>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <div className="text-xs text-muted-foreground">
                                          {t('bms_voltage', 'Voltage', '电压')}
                                        </div>
                                        <div className="text-sm font-semibold">{voltage.toFixed(1)}V</div>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        <div className="text-xs text-muted-foreground">
                                          {t('bms_current', 'Current', '电流')}
                                        </div>
                                        <div className="text-sm font-semibold">{current.toFixed(1)}A</div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                      {/* SOC Progress Bar */}
                                      <div className="w-64">
                                        <Progress value={soc} className="h-2" />
                                      </div>
                                      
                                      {/* Temperature Difference */}
                                      <Badge 
                                        variant={tempDiff > 2.0 ? 'default' : 'secondary'}
                                        className={cn(tempDiff > 2.0 && 'bg-yellow-500')}
                                      >
                                        ΔT: {tempDiff.toFixed(1)}°C
                                      </Badge>
                                      
                                      {/* Status */}
                                      <Badge variant={isFault ? 'default' : 'secondary'}>
                                        {isFault 
                                          ? t('bms_warning', 'Warning', '警告')
                                          : t('bms_normal', 'Normal', '正常')}
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
