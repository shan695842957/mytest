/**
 * 历史数据测试页面
 * 展示历史遥测遥信数据，包含位域、枚举等
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DateRangePicker } from '@/components/common/DateRangePicker'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'

// 设备信息
interface Device {
  id: number
  name: string
  displayName: string
  type: string
}

// 模拟设备列表
const mockDevices: Device[] = [
  { id: 1, name: 'COMP_01', displayName: '1号压缩机', type: '压缩机' },
  { id: 2, name: 'GEN_01', displayName: '1号发电机组', type: '发电机组' },
  { id: 3, name: 'PUMP_01', displayName: '1号水泵', type: '水泵' },
  { id: 4, name: 'VFD_01', displayName: '1号变频器', type: '变频器' },
  { id: 5, name: 'TRANS_01', displayName: '1号变压器', type: '变压器' },
  { id: 6, name: 'MOTOR_01', displayName: '1号电机', type: '电机' },
]

// 历史数据类型
type HistoryDataType = 'all' | 'measurement' | 'status' | 'bitfield' | 'enum'

// 历史数据项
interface HistoryDataItem {
  id: number
  deviceId: number
  deviceName: string
  deviceDisplayName: string
  timestamp: Date
  dataType: HistoryDataType
  name: string
  value: string | number
  rawValue?: number
  bitfieldBits?: boolean[]
  enumValue?: number
}

// 生成模拟历史数据
const generateHistoryData = (count: number = 100): HistoryDataItem[] => {
  const data: HistoryDataItem[] = []
  const now = new Date()
  
  const dataTypes: HistoryDataType[] = ['measurement', 'status', 'bitfield', 'enum']
  const names = {
    measurement: [
      '三相电压A', '三相电压B', '三相电压C',
      '三相电流A', '三相电流B', '三相电流C',
      '有功功率', '无功功率', '视在功率',
      '温度', '压力', '频率', '功率因数',
      '有功电能', '无功电能', '电压不平衡度', '电流不平衡度'
    ],
    status: [
      '运行状态', '报警状态', '开关状态',
      '保护状态', '通信状态', '故障状态',
      '维护状态', '远程/本地状态'
    ],
    bitfield: [
      '遥信状态字1', '遥信状态字2', '遥信状态字3',
      '报警状态字', '保护状态字', '控制状态字'
    ],
    enum: [
      '运行模式', '工作状态', '控制模式',
      '保护模式', '通信模式', '维护模式'
    ],
  }
  
  for (let i = 0; i < count; i++) {
    const device = mockDevices[Math.floor(Math.random() * mockDevices.length)]
    const dataType = dataTypes[Math.floor(Math.random() * dataTypes.length)] as HistoryDataType
    const nameList = names[dataType]
    const name = nameList[Math.floor(Math.random() * nameList.length)]
    
    const timestamp = new Date(now.getTime() - (count - i) * 60000) // 每分钟一条
    
    let item: HistoryDataItem = {
      id: i + 1,
      deviceId: device.id,
      deviceName: device.name,
      deviceDisplayName: device.displayName,
      timestamp,
      dataType,
      name,
      value: '',
      rawValue: undefined,
    }
    
    if (dataType === 'measurement') {
      // 根据不同的测量量生成不同的数值范围
      if (name.includes('电压')) {
        item.value = (Math.random() * 20 + 220).toFixed(2)
      } else if (name.includes('电流')) {
        item.value = (Math.random() * 50 + 10).toFixed(2)
      } else if (name.includes('功率')) {
        item.value = (Math.random() * 10000 + 5000).toFixed(2)
      } else if (name === '温度') {
        item.value = (Math.random() * 50 + 20).toFixed(2)
      } else if (name === '压力') {
        item.value = (Math.random() * 10 + 0.5).toFixed(2)
      } else if (name === '频率') {
        item.value = (Math.random() * 2 + 49).toFixed(2)
      } else if (name === '功率因数') {
        item.value = (Math.random() * 0.3 + 0.7).toFixed(3)
      } else if (name.includes('电能')) {
        item.value = (Math.random() * 100000 + 10000).toFixed(2)
      } else if (name.includes('不平衡度')) {
        item.value = (Math.random() * 5).toFixed(2)
      } else {
        item.value = (Math.random() * 100 + 10).toFixed(2)
      }
    } else if (dataType === 'status') {
      item.value = Math.random() > 0.5 ? 'ON' : 'OFF'
    } else if (dataType === 'bitfield') {
      const rawValue = Math.floor(Math.random() * 65536)
      item.rawValue = rawValue
      const bits: boolean[] = []
      for (let j = 0; j < 16; j++) {
        bits.push((rawValue & (1 << j)) !== 0)
      }
      item.bitfieldBits = bits
      item.value = `0x${rawValue.toString(16).toUpperCase().padStart(4, '0')}`
    } else if (dataType === 'enum') {
      const enumValue = Math.floor(Math.random() * 3)
      item.enumValue = enumValue
      const enumText = ['待机', '故障', '开机'][enumValue]
      item.value = enumText
      item.rawValue = enumValue
    }
    
    data.push(item)
  }
  
  // 按时间倒序排列
  return data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

export default function HistoryTestPage() {
  const { t } = useTranslation('testPanel')
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | 'all'>('all')
  const [dataType, setDataType] = useState<HistoryDataType>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    // 默认显示最近24小时
    const end = new Date()
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
    return { from: start, to: end }
  })
  const [historyData] = useState<HistoryDataItem[]>(generateHistoryData(200))
  
  // 过滤数据
  const filteredData = useMemo(() => {
    let filtered = historyData
    
    // 按设备过滤
    if (selectedDeviceId !== 'all') {
      filtered = filtered.filter(item => item.deviceId === selectedDeviceId)
    }
    
    // 按数据类型过滤
    if (dataType !== 'all') {
      filtered = filtered.filter(item => item.dataType === dataType)
    }
    
    // 按时间范围过滤
    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter(item => {
        const itemTime = item.timestamp.getTime()
        const fromTime = dateRange.from!.getTime()
        const toTime = dateRange.to!.getTime()
        return itemTime >= fromTime && itemTime <= toTime
      })
    } else if (dateRange?.from) {
      filtered = filtered.filter(item => item.timestamp.getTime() >= dateRange.from!.getTime())
    }
    
    return filtered
  }, [historyData, selectedDeviceId, dataType, dateRange])
  
  // 获取数据类型标签
  const getDataTypeLabel = (type: HistoryDataType) => {
    return t(`history.${type}`)
  }
  
  // 获取数据类型颜色
  const getDataTypeColor = (type: HistoryDataType) => {
    const colors = {
      measurement: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500',
      status: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500',
      bitfield: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500',
      enum: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500',
      all: 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500',
    }
    return colors[type] || colors.all
  }
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('history.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('history.description')}</p>
      </div>
      
      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">设备:</span>
                <Select 
                  value={selectedDeviceId === 'all' ? 'all' : String(selectedDeviceId)} 
                  onValueChange={(value) => setSelectedDeviceId(value === 'all' ? 'all' : Number(value))}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部设备</SelectItem>
                    {mockDevices.map((device) => (
                      <SelectItem key={device.id} value={String(device.id)}>
                        {device.displayName} ({device.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('history.dataType')}:</span>
                <Select value={dataType} onValueChange={(value) => setDataType(value as HistoryDataType)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('history.all')}</SelectItem>
                    <SelectItem value="measurement">{t('history.measurement')}</SelectItem>
                    <SelectItem value="status">{t('history.status')}</SelectItem>
                    <SelectItem value="bitfield">{t('history.bitfield')}</SelectItem>
                    <SelectItem value="enum">{t('history.enum')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline" className="ml-auto">
                共 {filteredData.length} 条记录
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('history.timeRange')}:</span>
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder="选择起止时间..."
                className="flex-1 max-w-[400px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">历史数据</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">{t('history.time')}</TableHead>
                  <TableHead className="w-[150px]">设备</TableHead>
                  <TableHead className="w-[120px]">数据类型</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead className="w-[200px]">{t('history.value')}</TableHead>
                  <TableHead className="w-[150px]">{t('history.rawValue')}</TableHead>
                  <TableHead>详细信息</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {t('history.noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">
                        {format(item.timestamp, 'yyyy-MM-dd HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{item.deviceDisplayName}</div>
                          <div className="text-xs text-muted-foreground">{item.deviceName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('border', getDataTypeColor(item.dataType))}>
                          {getDataTypeLabel(item.dataType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.rawValue !== undefined ? (
                          <div className="font-mono text-xs text-muted-foreground">
                            {item.rawValue} (0x{item.rawValue.toString(16).toUpperCase().padStart(4, '0')})
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.bitfieldBits && (
                          <div className="flex gap-1 flex-wrap max-w-[300px]">
                            {item.bitfieldBits.map((bit, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className={cn(
                                  'text-xs px-1 py-0',
                                  bit
                                    ? 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-400'
                                    : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                                )}
                              >
                                B{index}:{bit ? '1' : '0'}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {item.enumValue !== undefined && (
                          <div className="text-sm">
                            <Badge variant="outline" className="bg-orange-500/20 border-orange-500">
                              枚举值: {item.enumValue} ({item.value})
                            </Badge>
                          </div>
                        )}
                        {!item.bitfieldBits && item.enumValue === undefined && (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
