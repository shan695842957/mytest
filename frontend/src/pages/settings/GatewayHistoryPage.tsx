/**
 * 网关设置-历史监控页面（高性能版）
 * Tab切换设计 - 一次只渲染一个图表，性能优化
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Activity,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'

import { getCpuHistory, getMemoryHistory, getDiskHistory, getNetworkHistory } from '@/api/gateway'
import { usePageVisibility } from '@/hooks/usePageVisibility'
import type { MonitorHistoryItem } from '@/types/gateway'

export default function GatewayHistoryPage() {
  const { t } = useTranslation(['gateway', 'common'])
  const isPageVisible = usePageVisibility()
  
  const [timeRange, setTimeRange] = useState<number>(1) // 默认1小时
  const [activeTab, setActiveTab] = useState('cpu') // 当前激活的Tab
  const [selectedInterface, setSelectedInterface] = useState<string>('all') // 选中的网卡

  // 计算数据采样间隔（大时间范围自动降采样）
  const getInterval = (hours: number) => {
    if (hours <= 1) return undefined // 1小时内不采样
    if (hours <= 6) return 30 // 6小时内，30秒一个点
    if (hours <= 24) return 120 // 24小时内，2分钟一个点
    return 300 // 7天，5分钟一个点
  }

  // 计算limit（避免返回过多数据）
  const getLimit = (hours: number) => {
    if (hours <= 1) return 100 // 1小时，最多100个点
    if (hours <= 6) return 200 // 6小时，最多200个点
    if (hours <= 24) return 300 // 24小时，最多300个点
    return 500 // 7天，最多500个点
  }

  // 根据activeTab按需查询对应数据
  const queryFnMap = {
    cpu: getCpuHistory,
    memory: getMemoryHistory,
    disk: getDiskHistory,
    network: getNetworkHistory,
  }

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['monitor-history', activeTab, timeRange],
    queryFn: () => queryFnMap[activeTab as keyof typeof queryFnMap]({
      hours: timeRange,
      limit: getLimit(timeRange),
      interval: getInterval(timeRange),
    }),
    refetchInterval: (query) => {
      if (!isPageVisible) return false
      return 30000 // 30秒
    },
    staleTime: 15000,
  })

  const historyData = data?.data?.items || []
  const statistics = data?.data?.statistics || {}

  // 格式化时间戳
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    if (timeRange <= 1) {
      // 1小时内：显示时:分:秒（避免多个点在同一分钟内堆叠）
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })
    } else if (timeRange <= 6) {
      // 6小时内：显示时:分（数据已采样，不会堆叠）
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else {
      // 24小时及以上：显示月-日 时:分
      return date.toLocaleString('zh-CN', { 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  }

  // 获取当前值
  const currentData = historyData[historyData.length - 1]

  // 获取所有网卡列表
  const networkInterfaces = currentData?.network_interfaces 
    ? Object.keys(currentData.network_interfaces) 
    : []

  // 格式化基础图表数据（处理可选字段）
  const chartData = historyData.map((item: MonitorHistoryItem) => {
    const data: any = {
      timestamp: formatTimestamp(item.timestamp),
    }
    
    // CPU数据（可选）
    if (item.cpu_percent != null) {
      data.cpu = Number(item.cpu_percent.toFixed(1))
    }
    
    // 内存数据（可选）
    if (item.memory_percent != null) {
      data.memory = Number(item.memory_percent.toFixed(1))
    }
    
    // 磁盘数据（可选）
    if (item.disk_percent != null) {
      data.disk = Number(item.disk_percent.toFixed(1))
    }
    
    // 网络数据（可选）
    if (item.network_total_recv_rate != null) {
      data.netRecv = Number(item.network_total_recv_rate.toFixed(1))
    }
    if (item.network_total_sent_rate != null) {
      data.netSent = Number(item.network_total_sent_rate.toFixed(1))
    }
    
    // 每个网卡数据
    if (item.network_interfaces) {
      Object.entries(item.network_interfaces).forEach(([iface, stats]: [string, any]) => {
        data[`${iface}_recv`] = Number(stats.recv_rate.toFixed(1))
        data[`${iface}_sent`] = Number(stats.sent_rate.toFixed(1))
      })
    }
    
    return data
  })

  // Chart配置（使用 oklch 颜色空间）
  const cpuChartConfig = {
    cpu: {
      label: t('gateway:monitor.cpuUsage'),
      color: 'var(--chart-1)',  // ✅ 直接使用变量，不用 hsl() 包装
    },
  } satisfies ChartConfig

  const memoryChartConfig = {
    memory: {
      label: t('gateway:monitor.memoryUsage'),
      color: 'var(--chart-2)',
    },
  } satisfies ChartConfig

  const diskChartConfig = {
    disk: {
      label: t('gateway:monitor.diskUsage'),
      color: 'var(--chart-4)',
    },
  } satisfies ChartConfig

  const networkChartConfig = {
    netRecv: {
      label: t('gateway:monitor.recv'),
      color: 'var(--chart-1)',
    },
    netSent: {
      label: t('gateway:monitor.sent'),
      color: 'var(--chart-5)',
    },
  } satisfies ChartConfig

  // 单个网卡配置
  const getInterfaceChartConfig = (iface: string) => ({
    [`${iface}_recv`]: {
      label: `${iface} ${t('gateway:monitor.recv')}`,
      color: 'var(--chart-1)',
    },
    [`${iface}_sent`]: {
      label: `${iface} ${t('gateway:monitor.sent')}`,
      color: 'var(--chart-5)',
    },
  } satisfies ChartConfig)

  // 计算网络流量的Y轴范围（自动缩放）
  const getNetworkDomain = () => {
    if (!chartData.length) return [0, 100]
    
    const recvValues = chartData.map(d => d.netRecv || 0).filter(v => !isNaN(v))
    const sentValues = chartData.map(d => d.netSent || 0).filter(v => !isNaN(v))
    const allValues = [...recvValues, ...sentValues]
    
    if (allValues.length === 0) return [0, 100]
    
    const maxValue = Math.max(...allValues)
    
    // 智能计算上限：向上取整到合适的刻度
    let upperBound = 0
    if (maxValue <= 10) upperBound = 10
    else if (maxValue <= 50) upperBound = 50
    else if (maxValue <= 100) upperBound = 100
    else if (maxValue <= 500) upperBound = Math.ceil(maxValue / 100) * 100  // 向上取整到100
    else if (maxValue <= 1000) upperBound = Math.ceil(maxValue / 200) * 200  // 向上取整到200
    else upperBound = Math.ceil(maxValue / 500) * 500  // 向上取整到500
    
    return [0, upperBound]
  }

  // 计算单个网卡的Y轴范围
  const getInterfaceDomain = (iface: string) => {
    if (!chartData.length) return [0, 100]
    
    const recvValues = chartData.map(d => d[`${iface}_recv`] || 0).filter(v => !isNaN(v))
    const sentValues = chartData.map(d => d[`${iface}_sent`] || 0).filter(v => !isNaN(v))
    const allValues = [...recvValues, ...sentValues]
    
    if (allValues.length === 0) return [0, 100]
    
    const maxValue = Math.max(...allValues)
    
    // 同样的智能计算逻辑
    let upperBound = 0
    if (maxValue <= 10) upperBound = 10
    else if (maxValue <= 50) upperBound = 50
    else if (maxValue <= 100) upperBound = 100
    else if (maxValue <= 500) upperBound = Math.ceil(maxValue / 100) * 100
    else if (maxValue <= 1000) upperBound = Math.ceil(maxValue / 200) * 200
    else upperBound = Math.ceil(maxValue / 500) * 500
    
    return [0, upperBound]
  }

  // 统计卡片组件
  const StatCard = ({ 
    title, 
    value, 
    unit, 
    icon: Icon,
    colorClass 
  }: { 
    title: string
    value: string
    unit: string
    icon: any
    colorClass: string
  }) => (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-4 w-4 ${colorClass}`} />
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      <div className="space-y-1">
        <div className={`text-2xl font-bold ${colorClass}`}>
          {value}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {title}
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('gateway:monitor.historyTitle')}</h1>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 顶部工具栏 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('gateway:monitor.historyTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('gateway:monitor.historyDescription')}</p>
        </div>
        <div className="flex gap-2">
          <Select value={String(timeRange)} onValueChange={(v) => setTimeRange(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">{t('gateway:monitor.time_1h')}</SelectItem>
              <SelectItem value="6">{t('gateway:monitor.time_6h')}</SelectItem>
              <SelectItem value="24">{t('gateway:monitor.time_24h')}</SelectItem>
              <SelectItem value="168">{t('gateway:monitor.time_7d')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <Clock className="mr-2 h-4 w-4" />
            {t('common:action.refresh')}
          </Button>
        </div>
      </div>

      {/* 无数据提示 */}
      {historyData.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{t('gateway:monitor.noHistoryData')}</AlertDescription>
        </Alert>
      )}

      {historyData.length > 0 && currentData && (
        <>
          {/* 统计卡片（根据当前Tab显示对应卡片） */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {activeTab === 'cpu' && currentData.cpu_percent != null && (
            <StatCard
              title={t('gateway:monitor.cpu')}
              value={currentData.cpu_percent.toFixed(1)}
              unit="%"
              icon={Cpu}
              colorClass="text-blue-500"
            />
            )}
            {activeTab === 'memory' && currentData.memory_percent != null && (
            <StatCard
              title={t('gateway:monitor.memory')}
              value={currentData.memory_percent.toFixed(1)}
              unit="%"
              icon={MemoryStick}
              colorClass="text-cyan-500"
            />
            )}
            {activeTab === 'disk' && currentData.disk_percent != null && (
            <StatCard
              title={t('gateway:monitor.disk')}
              value={currentData.disk_percent.toFixed(1)}
              unit="%"
              icon={HardDrive}
              colorClass="text-amber-500"
            />
            )}
            {activeTab === 'network' && currentData.network_total_recv_rate != null && (
            <StatCard
              title={t('gateway:monitor.network')}
                value={currentData.network_total_recv_rate.toFixed(1)}
              unit="↓ KB/s"
              icon={Network}
              colorClass="text-green-500"
            />
            )}
          </div>

          {/* Tab切换图表（一次只渲染一个） */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="cpu" className="gap-2">
                <Cpu className="h-4 w-4" />
                <span className="hidden sm:inline">CPU</span>
              </TabsTrigger>
              <TabsTrigger value="memory" className="gap-2">
                <MemoryStick className="h-4 w-4" />
                <span className="hidden sm:inline">{t('gateway:monitor.memory')}</span>
              </TabsTrigger>
              <TabsTrigger value="disk" className="gap-2">
                <HardDrive className="h-4 w-4" />
                <span className="hidden sm:inline">{t('gateway:monitor.disk')}</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="gap-2">
                <Network className="h-4 w-4" />
                <span className="hidden sm:inline">{t('gateway:monitor.network')}</span>
              </TabsTrigger>
            </TabsList>

            {/* CPU Tab */}
            <TabsContent value="cpu" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Cpu className="h-5 w-5" />
                      {t('gateway:monitor.cpuUsage')}
                    </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">
                        {t('common:field.average')}: {statistics.cpu?.avg?.toFixed(1)}%
                      </Badge>
                      <Badge variant="secondary">
                        {t('common:field.peak')}: {statistics.cpu?.max?.toFixed(1)}%
                      </Badge>
                  </div>
                  <CardDescription>{t('gateway:monitor.cpuDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={cpuChartConfig} className="h-[400px] w-full">
                      <AreaChart data={chartData} accessibilityLayer margin={{ left: 12, right: 12, top: 12 }}>
                        <defs>
                          <linearGradient id="fillCpu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-cpu)" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="var(--color-cpu)" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="timestamp" 
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          minTickGap={50}
                        />
                        <YAxis 
                          domain={[0, 100]} 
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent indicator="dot" />}
                          cursor={{ strokeDasharray: '3 3' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="cpu"
                          stroke="var(--color-cpu)"
                          fill="url(#fillCpu)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 内存Tab */}
            <TabsContent value="memory" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MemoryStick className="h-5 w-5" />
                    {t('gateway:monitor.memoryUsage')}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">
                      {t('common:field.average')}: {statistics.memory?.avg?.toFixed(1)}%
                    </Badge>
                    <Badge variant="secondary">
                      {t('common:field.peak')}: {statistics.memory?.max?.toFixed(1)}%
                    </Badge>
                  </div>
                  <CardDescription>{t('gateway:monitor.memoryDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={memoryChartConfig} className="h-[400px] w-full">
                    <AreaChart data={chartData} accessibilityLayer margin={{ left: 12, right: 12, top: 12 }}>
                      <defs>
                        <linearGradient id="fillMemory" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-memory)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--color-memory)" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="timestamp" 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={50}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                      <Area
                        type="monotone"
                        dataKey="memory"
                        stroke="var(--color-memory)"
                        fill="url(#fillMemory)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 磁盘Tab */}
            <TabsContent value="disk" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    {t('gateway:monitor.diskUsage')}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">
                      {t('common:field.average')}: {statistics.disk?.avg?.toFixed(1)}%
                    </Badge>
                    <Badge variant="secondary">
                      {t('common:field.peak')}: {statistics.disk?.max?.toFixed(1)}%
                    </Badge>
                  </div>
                  <CardDescription>{t('gateway:monitor.diskDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={diskChartConfig} className="h-[400px] w-full">
                    <AreaChart data={chartData} accessibilityLayer margin={{ left: 12, right: 12, top: 12 }}>
                      <defs>
                        <linearGradient id="fillDisk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-disk)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--color-disk)" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="timestamp" 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={50}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                      <Area
                        type="monotone"
                        dataKey="disk"
                        stroke="var(--color-disk)"
                        fill="url(#fillDisk)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 网络Tab */}
            <TabsContent value="network" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Network className="h-5 w-5" />
                      {t('gateway:monitor.networkTraffic')}
                    </CardTitle>
                    {networkInterfaces.length > 1 && (
                      <Select value={selectedInterface} onValueChange={setSelectedInterface}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('gateway:monitor.allInterfaces')}</SelectItem>
                          {networkInterfaces.map((iface) => (
                            <SelectItem key={iface} value={iface}>{iface}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {statistics.network && (
                      <>
                        <Badge variant="secondary">
                          ↓ {t('common:field.average')}: {statistics.network.recv_avg?.toFixed(1)} KB/s
                        </Badge>
                        <Badge variant="secondary">
                          ↑ {t('common:field.average')}: {statistics.network.sent_avg?.toFixed(1)} KB/s
                        </Badge>
                      </>
                    )}
                  </div>
                  <CardDescription>
                    {selectedInterface === 'all' 
                      ? t('gateway:monitor.networkDescription') 
                      : t('gateway:monitor.networkInterfaceDescription', { interface: selectedInterface })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedInterface === 'all' ? (
                    <ChartContainer config={networkChartConfig} className="h-[400px] w-full">
                      <LineChart data={chartData} accessibilityLayer margin={{ left: 12, right: 12, top: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="timestamp" 
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          minTickGap={50}
                        />
                        <YAxis 
                          domain={getNetworkDomain()}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => `${value} KB/s`}
                        />
                        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="netRecv"
                          stroke="var(--color-netRecv)"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="netSent"
                          stroke="var(--color-netSent)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <ChartContainer config={getInterfaceChartConfig(selectedInterface)} className="h-[400px] w-full">
                      <LineChart data={chartData} accessibilityLayer margin={{ left: 12, right: 12, top: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="timestamp" 
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          minTickGap={50}
                        />
                        <YAxis 
                          domain={getInterfaceDomain(selectedInterface)}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => `${value} KB/s`}
                        />
                        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey={`${selectedInterface}_recv`}
                          stroke={`var(--color-${selectedInterface}_recv)`}
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey={`${selectedInterface}_sent`}
                          stroke={`var(--color-${selectedInterface}_sent)`}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
