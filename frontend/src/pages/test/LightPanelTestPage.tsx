/**
 * 光字牌测试页面
 * 展示位域、枚举、复杂位域解析、遥测量等数据
 * 支持多种展示方式：光字牌、仪表盘、列表、卡片网格
 */

import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Gauge, List, Grid, Activity, Thermometer, Search, ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react'
import { format } from 'date-fns'

// 设备信息
interface Device {
  id: number
  name: string
  displayName: string
  type: string
}

// 电池单体数据（用于储能系统）
interface BatteryCell {
  id: number
  voltage: number // V
  position: { row: number; col: number }
  status: 'normal' | 'warning' | 'alarm'
  lastUpdate: Date
}

// 温度传感器数据（与电池单体不一一对应）
interface TemperatureSensor {
  id: number
  temperature: number // °C
  position: { row: number; col: number }
  status: 'normal' | 'warning' | 'alarm'
  lastUpdate: Date
  // 关联的电池单体ID范围（这个传感器监测哪些单体）
  cellIds: number[]
}

// 变量数据类型
type VariableType = 'measurement' | 'status' | 'bitfield' | 'enum' | 'accum' | 'param' | 'setpoint' | 'command'

// 变量数据
interface Variable {
  id: string
  name: string
  displayName: string
  category: string // 分类：如"电压"、"温度"、"状态"等
  type: VariableType
  value: number | string | boolean
  unit?: string
  status?: 'normal' | 'warning' | 'alarm'
  lastUpdate: Date
  // 位域相关
  bitfieldBits?: boolean[]
  // 枚举相关
  enumValue?: number
  enumText?: string
}

// 设备数据
interface DeviceData {
  device: Device
  variables: Variable[] // 所有变量
  // 储能系统专用数据
  batteryCells?: BatteryCell[] // 200-300个电池单体
  tempSensors?: TemperatureSensor[] // 约80个温度传感器（3-4个单体一个）
}

// 状态时间戳记录（已简化，不再需要复杂的时间戳跟踪）

// 模拟设备列表（储能集装箱子设备）
const mockDevices: Device[] = [
  { id: 1, name: 'BATTERY_CLUSTER_01', displayName: '1号电池簇', type: '电池簇' },
  { id: 2, name: 'BATTERY_CLUSTER_02', displayName: '2号电池簇', type: '电池簇' },
  { id: 3, name: 'PCS_01', displayName: '1号PCS', type: 'PCS' },
  { id: 4, name: 'PCS_02', displayName: '2号PCS', type: 'PCS' },
  { id: 5, name: 'METER_01', displayName: '1号电表', type: '电表' },
  { id: 6, name: 'METER_02', displayName: '2号电表', type: '电表' },
  { id: 7, name: 'DEHUMIDIFIER_01', displayName: '1号除湿机', type: '除湿机' },
  { id: 8, name: 'DEHUMIDIFIER_02', displayName: '2号除湿机', type: '除湿机' },
  { id: 9, name: 'FIRE_SUPPRESSION_01', displayName: '1号消防', type: '消防' },
  { id: 10, name: 'LIQUID_COOLER_01', displayName: '1号液冷机', type: '液冷机' },
  { id: 11, name: 'LIQUID_COOLER_02', displayName: '2号液冷机', type: '液冷机' },
  { id: 12, name: 'CONTROLLER', displayName: '控制器', type: '控制器' },
]

// 根据设备类型生成变量数量
const getVariableCount = (deviceType: string): number => {
  switch (deviceType) {
    case '电池簇':
      return 500
    case 'PCS':
      return 100
    case '电表':
      return 50
    case '除湿机':
    case '消防':
    case '液冷机':
      return 30
    case '控制器':
      return 100
    default:
      return 50
  }
}

// 根据设备类型获取变量模板
const getVariableTemplates = (deviceType: string): Array<{category: string, name: string, displayName: string, type: VariableType, unit?: string}> => {
  const templates: Array<{category: string, name: string, displayName: string, type: VariableType, unit?: string}> = []
  
  if (deviceType === '电池簇') {
    // 电池簇：500个变量
    // 电池单体电压（200-300个）
    for (let i = 1; i <= 250; i++) {
      templates.push({
        category: '电池单体',
        name: `CELL_VOLTAGE_${i}`,
        displayName: `电池单体${i}电压`,
        type: 'measurement',
        unit: 'V'
      })
    }
    // 电池单体温度（80个）
    for (let i = 1; i <= 80; i++) {
      templates.push({
        category: '温度',
        name: `CELL_TEMP_${i}`,
        displayName: `温度传感器${i}`,
        type: 'measurement',
        unit: '°C'
      })
    }
    // 电池簇总电压、总电流
    templates.push({ category: '电压', name: 'CLUSTER_VOLTAGE', displayName: '电池簇总电压', type: 'measurement', unit: 'V' })
    templates.push({ category: '电流', name: 'CLUSTER_CURRENT', displayName: '电池簇总电流', type: 'measurement', unit: 'A' })
    templates.push({ category: '功率', name: 'CLUSTER_POWER', displayName: '电池簇功率', type: 'measurement', unit: 'kW' })
    templates.push({ category: '功率', name: 'CLUSTER_ENERGY', displayName: '电池簇电量', type: 'accum', unit: 'kWh' })
    // SOC、SOH
    templates.push({ category: '状态', name: 'CLUSTER_SOC', displayName: '电池簇SOC', type: 'measurement', unit: '%' })
    templates.push({ category: '状态', name: 'CLUSTER_SOH', displayName: '电池簇SOH', type: 'measurement', unit: '%' })
    // 保护状态（位域）
    for (let i = 1; i <= 20; i++) {
      templates.push({
        category: '保护',
        name: `PROTECT_STATUS_${i}`,
        displayName: `保护状态${i}`,
        type: 'bitfield'
      })
    }
    // 运行状态（枚举）
    for (let i = 1; i <= 10; i++) {
      templates.push({
        category: '状态',
        name: `RUN_STATUS_${i}`,
        displayName: `运行状态${i}`,
        type: 'enum'
      })
    }
    // 报警信息（位域）
    for (let i = 1; i <= 30; i++) {
      templates.push({
        category: '报警',
        name: `ALARM_STATUS_${i}`,
        displayName: `报警状态${i}`,
        type: 'bitfield'
      })
    }
    // 通信状态
    for (let i = 1; i <= 50; i++) {
      templates.push({
        category: '通信',
        name: `COMM_STATUS_${i}`,
        displayName: `通信状态${i}`,
        type: 'status'
      })
    }
    // 控制参数
    for (let i = 1; i <= 30; i++) {
      templates.push({
        category: '控制',
        name: `CTRL_PARAM_${i}`,
        displayName: `控制参数${i}`,
        type: 'param'
      })
    }
    // 设定值
    for (let i = 1; i <= 20; i++) {
      templates.push({
        category: '控制',
        name: `SETPOINT_${i}`,
        displayName: `设定值${i}`,
        type: 'setpoint'
      })
    }
  } else if (deviceType === 'PCS') {
    // PCS：100个变量
    // 三相电压、电流
    templates.push({ category: '电压', name: 'VOLTAGE_A', displayName: 'A相电压', type: 'measurement', unit: 'V' })
    templates.push({ category: '电压', name: 'VOLTAGE_B', displayName: 'B相电压', type: 'measurement', unit: 'V' })
    templates.push({ category: '电压', name: 'VOLTAGE_C', displayName: 'C相电压', type: 'measurement', unit: 'V' })
    templates.push({ category: '电流', name: 'CURRENT_A', displayName: 'A相电流', type: 'measurement', unit: 'A' })
    templates.push({ category: '电流', name: 'CURRENT_B', displayName: 'B相电流', type: 'measurement', unit: 'A' })
    templates.push({ category: '电流', name: 'CURRENT_C', displayName: 'C相电流', type: 'measurement', unit: 'A' })
    // 功率
    templates.push({ category: '功率', name: 'ACTIVE_POWER', displayName: '有功功率', type: 'measurement', unit: 'kW' })
    templates.push({ category: '功率', name: 'REACTIVE_POWER', displayName: '无功功率', type: 'measurement', unit: 'kVar' })
    templates.push({ category: '功率', name: 'APPARENT_POWER', displayName: '视在功率', type: 'measurement', unit: 'kVA' })
    templates.push({ category: '功率', name: 'POWER_FACTOR', displayName: '功率因数', type: 'measurement' })
    // 频率
    templates.push({ category: '频率', name: 'FREQUENCY', displayName: '频率', type: 'measurement', unit: 'Hz' })
    // 运行状态
    for (let i = 1; i <= 10; i++) {
      templates.push({
        category: '状态',
        name: `RUN_STATUS_${i}`,
        displayName: `运行状态${i}`,
        type: 'enum'
      })
    }
    // 保护状态
    for (let i = 1; i <= 15; i++) {
      templates.push({
        category: '保护',
        name: `PROTECT_${i}`,
        displayName: `保护${i}`,
        type: 'bitfield'
      })
    }
    // 报警
    for (let i = 1; i <= 20; i++) {
      templates.push({
        category: '报警',
        name: `ALARM_${i}`,
        displayName: `报警${i}`,
        type: 'bitfield'
      })
    }
    // 控制参数
    for (let i = 1; i <= 20; i++) {
      templates.push({
        category: '控制',
        name: `PARAM_${i}`,
        displayName: `参数${i}`,
        type: 'param'
      })
    }
    // 设定值
    for (let i = 1; i <= 10; i++) {
      templates.push({
        category: '控制',
        name: `SETPOINT_${i}`,
        displayName: `设定值${i}`,
        type: 'setpoint'
      })
    }
    // 命令
    for (let i = 1; i <= 5; i++) {
      templates.push({
        category: '控制',
        name: `COMMAND_${i}`,
        displayName: `命令${i}`,
        type: 'command'
      })
    }
  } else if (deviceType === '电表') {
    // 电表：50个变量
    // 三相电压、电流
    templates.push({ category: '电压', name: 'VOLTAGE_A', displayName: 'A相电压', type: 'measurement', unit: 'V' })
    templates.push({ category: '电压', name: 'VOLTAGE_B', displayName: 'B相电压', type: 'measurement', unit: 'V' })
    templates.push({ category: '电压', name: 'VOLTAGE_C', displayName: 'C相电压', type: 'measurement', unit: 'V' })
    templates.push({ category: '电流', name: 'CURRENT_A', displayName: 'A相电流', type: 'measurement', unit: 'A' })
    templates.push({ category: '电流', name: 'CURRENT_B', displayName: 'B相电流', type: 'measurement', unit: 'A' })
    templates.push({ category: '电流', name: 'CURRENT_C', displayName: 'C相电流', type: 'measurement', unit: 'A' })
    // 功率
    templates.push({ category: '功率', name: 'ACTIVE_POWER', displayName: '有功功率', type: 'measurement', unit: 'kW' })
    templates.push({ category: '功率', name: 'REACTIVE_POWER', displayName: '无功功率', type: 'measurement', unit: 'kVar' })
    templates.push({ category: '功率', name: 'APPARENT_POWER', displayName: '视在功率', type: 'measurement', unit: 'kVA' })
    // 电能
    templates.push({ category: '电能', name: 'ACTIVE_ENERGY', displayName: '有功电能', type: 'accum', unit: 'kWh' })
    templates.push({ category: '电能', name: 'REACTIVE_ENERGY', displayName: '无功电能', type: 'accum', unit: 'kVarh' })
    // 频率、功率因数
    templates.push({ category: '频率', name: 'FREQUENCY', displayName: '频率', type: 'measurement', unit: 'Hz' })
    templates.push({ category: '功率', name: 'POWER_FACTOR', displayName: '功率因数', type: 'measurement' })
    // 状态和报警
    for (let i = 1; i <= 20; i++) {
      templates.push({
        category: '状态',
        name: `STATUS_${i}`,
        displayName: `状态${i}`,
        type: 'status'
      })
    }
    // 通信状态
    for (let i = 1; i <= 10; i++) {
      templates.push({
        category: '通信',
        name: `COMM_${i}`,
        displayName: `通信${i}`,
        type: 'status'
      })
    }
  } else if (deviceType === '除湿机') {
    // 除湿机：30个变量
    templates.push({ category: '温度', name: 'TEMP_IN', displayName: '进风温度', type: 'measurement', unit: '°C' })
    templates.push({ category: '温度', name: 'TEMP_OUT', displayName: '出风温度', type: 'measurement', unit: '°C' })
    templates.push({ category: '湿度', name: 'HUMIDITY_IN', displayName: '进风湿度', type: 'measurement', unit: '%' })
    templates.push({ category: '湿度', name: 'HUMIDITY_OUT', displayName: '出风湿度', type: 'measurement', unit: '%' })
    templates.push({ category: '功率', name: 'POWER', displayName: '功率', type: 'measurement', unit: 'kW' })
    templates.push({ category: '状态', name: 'RUN_STATUS', displayName: '运行状态', type: 'enum' })
    for (let i = 1; i <= 10; i++) {
      templates.push({
        category: '状态',
        name: `STATUS_${i}`,
        displayName: `状态${i}`,
        type: 'status'
      })
    }
    for (let i = 1; i <= 8; i++) {
      templates.push({
        category: '报警',
        name: `ALARM_${i}`,
        displayName: `报警${i}`,
        type: 'bitfield'
      })
    }
  } else if (deviceType === '消防') {
    // 消防：30个变量
    templates.push({ category: '状态', name: 'FIRE_STATUS', displayName: '火警状态', type: 'enum' })
    templates.push({ category: '状态', name: 'SMOKE_STATUS', displayName: '烟感状态', type: 'enum' })
    templates.push({ category: '状态', name: 'WATER_PRESSURE', displayName: '水压', type: 'measurement', unit: 'bar' })
    templates.push({ category: '状态', name: 'WATER_LEVEL', displayName: '水位', type: 'measurement', unit: '%' })
    for (let i = 1; i <= 15; i++) {
      templates.push({
        category: '报警',
        name: `ALARM_${i}`,
        displayName: `报警${i}`,
        type: 'bitfield'
      })
    }
    for (let i = 1; i <= 8; i++) {
      templates.push({
        category: '控制',
        name: `CTRL_${i}`,
        displayName: `控制${i}`,
        type: 'command'
      })
    }
  } else if (deviceType === '液冷机') {
    // 液冷机：30个变量
    templates.push({ category: '温度', name: 'TEMP_IN', displayName: '进液温度', type: 'measurement', unit: '°C' })
    templates.push({ category: '温度', name: 'TEMP_OUT', displayName: '出液温度', type: 'measurement', unit: '°C' })
    templates.push({ category: '流量', name: 'FLOW_RATE', displayName: '流量', type: 'measurement', unit: 'L/min' })
    templates.push({ category: '压力', name: 'PRESSURE', displayName: '压力', type: 'measurement', unit: 'bar' })
    templates.push({ category: '功率', name: 'POWER', displayName: '功率', type: 'measurement', unit: 'kW' })
    templates.push({ category: '状态', name: 'RUN_STATUS', displayName: '运行状态', type: 'enum' })
    for (let i = 1; i <= 10; i++) {
      templates.push({
        category: '状态',
        name: `STATUS_${i}`,
        displayName: `状态${i}`,
        type: 'status'
      })
    }
    for (let i = 1; i <= 8; i++) {
      templates.push({
        category: '报警',
        name: `ALARM_${i}`,
        displayName: `报警${i}`,
        type: 'bitfield'
      })
    }
  } else if (deviceType === '控制器') {
    // 控制器：100个变量
    // 系统状态
    templates.push({ category: '状态', name: 'SYS_STATUS', displayName: '系统状态', type: 'enum' })
    templates.push({ category: '状态', name: 'CPU_USAGE', displayName: 'CPU使用率', type: 'measurement', unit: '%' })
    templates.push({ category: '状态', name: 'MEM_USAGE', displayName: '内存使用率', type: 'measurement', unit: '%' })
    templates.push({ category: '状态', name: 'DISK_USAGE', displayName: '磁盘使用率', type: 'measurement', unit: '%' })
    // 网络状态
    for (let i = 1; i <= 10; i++) {
      templates.push({
        category: '通信',
        name: `NET_STATUS_${i}`,
        displayName: `网络${i}状态`,
        type: 'status'
      })
    }
    // 设备连接状态
    for (let i = 1; i <= 20; i++) {
      templates.push({
        category: '通信',
        name: `DEV_CONN_${i}`,
        displayName: `设备${i}连接`,
        type: 'status'
      })
    }
    // 报警信息
    for (let i = 1; i <= 30; i++) {
      templates.push({
        category: '报警',
        name: `ALARM_${i}`,
        displayName: `报警${i}`,
        type: 'bitfield'
      })
    }
    // 运行参数
    for (let i = 1; i <= 20; i++) {
      templates.push({
        category: '控制',
        name: `PARAM_${i}`,
        displayName: `参数${i}`,
        type: 'param'
      })
    }
    // 统计信息
    for (let i = 1; i <= 15; i++) {
      templates.push({
        category: '统计',
        name: `STAT_${i}`,
        displayName: `统计${i}`,
        type: 'accum'
      })
    }
  }
  
  return templates
}

// 生成变量数据
const generateVariables = (device: Device, count: number): Variable[] => {
  const variables: Variable[] = []
  const templates = getVariableTemplates(device.type)
  
  // 如果模板数量不够，用通用模板补充
  const genericCategories = ['电压', '电流', '功率', '温度', '状态', '保护', '通信', '控制', '报警', '统计']
  const genericTypes: VariableType[] = ['measurement', 'status', 'bitfield', 'enum', 'accum', 'param', 'setpoint', 'command']
  
  for (let i = 0; i < count; i++) {
    let template: {category: string, name: string, displayName: string, type: VariableType, unit?: string}
    
    if (i < templates.length) {
      template = templates[i]
    } else {
      // 使用通用模板
      const category = genericCategories[i % genericCategories.length]
      const type = genericTypes[i % genericTypes.length]
      template = {
        category,
        name: `${device.name}_VAR_${String(i + 1).padStart(3, '0')}`,
        displayName: `${category}_${i + 1}`,
        type
      }
    }
    
    const name = `${device.name}_${template.name}`
    const displayName = template.displayName
    
    let value: number | string | boolean
    let unit: string | undefined = template.unit
    let bitfieldBits: boolean[] | undefined
    let enumValue: number | undefined
    let enumText: string | undefined
    
    if (template.type === 'measurement') {
      // 根据变量名称生成合理的值
      if (template.name.includes('VOLTAGE') || template.name.includes('电压')) {
        value = Math.random() * 100 + 200 // 200-300V
      } else if (template.name.includes('CURRENT') || template.name.includes('电流')) {
        value = Math.random() * 50 + 10 // 10-60A
      } else if (template.name.includes('POWER') || template.name.includes('功率')) {
        value = Math.random() * 1000 + 500 // 500-1500kW
      } else if (template.name.includes('TEMP') || template.name.includes('温度')) {
        value = Math.random() * 30 + 20 // 20-50°C
      } else if (template.name.includes('FREQUENCY') || template.name.includes('频率')) {
        value = Math.random() * 2 + 49 // 49-51Hz
      } else if (template.name.includes('SOC') || template.name.includes('SOH')) {
        value = Math.random() * 20 + 80 // 80-100%
      } else if (template.name.includes('USAGE') || template.name.includes('使用率')) {
        value = Math.random() * 50 + 20 // 20-70%
      } else {
        value = Math.random() * 100
      }
    } else if (template.type === 'status') {
      value = Math.random() > 0.5
    } else if (template.type === 'bitfield') {
      const bitValue = Math.floor(Math.random() * 65536)
      bitfieldBits = []
      for (let j = 0; j < 16; j++) {
        bitfieldBits.push((bitValue & (1 << j)) !== 0)
      }
      value = bitValue
    } else if (template.type === 'enum') {
      enumValue = Math.floor(Math.random() * 4)
      enumText = ['待机', '运行', '故障', '维护'][enumValue]
      value = enumValue
    } else if (template.type === 'accum') {
      value = Math.random() * 10000 + 1000 // 累计量
    } else {
      value = Math.random() * 100
    }
    
    // 判断状态
    let status: 'normal' | 'warning' | 'alarm' = 'normal'
    if (typeof value === 'number') {
      if (template.name.includes('VOLTAGE') || template.name.includes('电压')) {
        if (value < 180 || value > 260) status = 'warning'
        if (value < 150 || value > 300) status = 'alarm'
      } else if (template.name.includes('TEMP') || template.name.includes('温度')) {
        if (value > 45) status = 'warning'
        if (value > 50) status = 'alarm'
      } else if (template.name.includes('ALARM') || template.name.includes('报警')) {
        if (Math.random() > 0.7) status = 'alarm'
      }
    }
    
    variables.push({
      id: name,
      name,
      displayName,
      category: template.category,
      type: template.type,
      value,
      unit,
      status,
      lastUpdate: new Date(),
      bitfieldBits,
      enumValue,
      enumText,
    })
  }
  
  return variables
}

// 生成电池单体数据
const generateBatteryCells = (count: number): BatteryCell[] => {
  const cells: BatteryCell[] = []
  const cols = 20 // 每行20个
  // const rows = Math.ceil(count / cols) // 未使用
  
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols
    
    // 生成正常范围内的电压（3.0-4.2V）
    const baseVoltage = 3.6
    const voltage = baseVoltage + (Math.random() - 0.5) * 0.3
    
    // 判断状态
    let status: 'normal' | 'warning' | 'alarm' = 'normal'
    if (voltage < 3.2 || voltage > 4.1) {
      status = 'warning'
    }
    if (voltage < 3.0 || voltage > 4.2) {
      status = 'alarm'
    }
    
    cells.push({
      id: i + 1,
      voltage,
      position: { row, col },
      status,
      lastUpdate: new Date(),
    })
  }
  
  return cells
}

// 生成温度传感器数据（3-4个单体一个传感器）
const generateTempSensors = (cellCount: number): TemperatureSensor[] => {
  const sensors: TemperatureSensor[] = []
  const cellsPerSensor = 3.5 // 平均3.5个单体一个传感器
  const sensorCount = Math.ceil(cellCount / cellsPerSensor)
  const cols = 10 // 每行10个传感器
  // const rows = Math.ceil(sensorCount / cols) // 未使用
  
  for (let i = 0; i < sensorCount; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols
    
    // 生成温度（20-45°C）
    const temperature = Math.random() * 25 + 20
    
    // 判断状态
    let status: 'normal' | 'warning' | 'alarm' = 'normal'
    if (temperature > 40) {
      status = 'warning'
    }
    if (temperature > 45) {
      status = 'alarm'
    }
    
    // 计算这个传感器监测的单体ID范围
    const startCellId = Math.floor(i * cellsPerSensor) + 1
    const endCellId = Math.min(cellCount, Math.floor((i + 1) * cellsPerSensor))
    const cellIds = Array.from({ length: endCellId - startCellId + 1 }, (_, idx) => startCellId + idx)
    
    sensors.push({
      id: i + 1,
      temperature,
      position: { row, col },
      status,
      lastUpdate: new Date(),
      cellIds,
    })
  }
  
  return sensors
}

// 模拟数据生成函数
const generateMockData = (device: Device): DeviceData => {
  // 生成变量数据
  const variableCount = getVariableCount(device.type)
  const variables = generateVariables(device, variableCount)
  
  // 如果是电池簇，生成电池单体和温度传感器数据
  let batteryCells: BatteryCell[] | undefined
  let tempSensors: TemperatureSensor[] | undefined
  
  if (device.type === '电池簇') {
    const cellCount = Math.floor(Math.random() * 100) + 200 // 200-300个
    batteryCells = generateBatteryCells(cellCount)
    tempSensors = generateTempSensors(cellCount)
  }
  
  return {
    device,
    variables,
    batteryCells,
    tempSensors,
  }
}

type ViewMode = 'light-panel' | 'dashboard' | 'list' | 'grid' | 'heatmap' | 'grouped' | 'searchable' | 'tree'

export default function LightPanelTestPage() {
  const { t } = useTranslation('testPanel')
  const [selectedDeviceId, setSelectedDeviceId] = useState<number>(1)
  const [viewMode, setViewMode] = useState<ViewMode>('light-panel')
  const [devicesData, setDevicesData] = useState<Map<number, DeviceData>>(() => {
    const map = new Map()
    mockDevices.forEach(device => {
      map.set(device.id, generateMockData(device))
    })
    return map
  })
  
  // 状态时间戳记录（已简化，不再需要复杂的时间戳跟踪）
  
  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    type: 'bitfield' | 'enum' | 'complexBitfield' | 'complexEnum'
    index?: number
    label: string
  }>({ open: false, type: 'bitfield', label: '' })
  
  // 热力图数据类型选择
  const [heatmapDataType, setHeatmapDataType] = useState<'voltage' | 'temperature'>('voltage')
  
  // 搜索和筛选
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<VariableType | 'all'>('all')
  
  // 折叠面板状态
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  
  const selectedDevice = mockDevices.find(d => d.id === selectedDeviceId)!
  const deviceData = devicesData.get(selectedDeviceId)!
  
  // 获取所有分类
  const categories = useMemo(() => {
    const cats = new Set(deviceData.variables.map(v => v.category))
    return Array.from(cats).sort()
  }, [deviceData.variables])
  
  // 过滤变量
  const filteredVariables = useMemo(() => {
    return deviceData.variables.filter(v => {
      // 搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!v.name.toLowerCase().includes(query) && 
            !v.displayName.toLowerCase().includes(query) &&
            !v.category.toLowerCase().includes(query)) {
          return false
        }
      }
      // 分类过滤
      if (selectedCategory !== 'all' && v.category !== selectedCategory) {
        return false
      }
      // 类型过滤
      if (selectedType !== 'all' && v.type !== selectedType) {
        return false
      }
      return true
    })
  }, [deviceData.variables, searchQuery, selectedCategory, selectedType])
  
  // 按分类分组
  const groupedVariables = useMemo(() => {
    const groups = new Map<string, Variable[]>()
    filteredVariables.forEach(v => {
      if (!groups.has(v.category)) {
        groups.set(v.category, [])
      }
      groups.get(v.category)!.push(v)
    })
    return groups
  }, [filteredVariables])
  
  // 切换分类折叠
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  // 每3秒更新一次模拟数据，并更新状态时间戳
  useEffect(() => {
    const interval = setInterval(() => {
      setDevicesData(prev => {
        const newMap = new Map(prev)
        // 更新变量数据（每3秒更新一次，保持变量数量不变）
        mockDevices.forEach(device => {
          const oldData = prev.get(device.id)
          const newData = generateMockData(device)
          
          // 如果是电池簇，重新生成电池单体和温度传感器
          if (device.type === '电池簇') {
            const cellCount = newData.batteryCells?.length || 240
            newData.batteryCells = generateBatteryCells(cellCount)
            newData.tempSensors = generateTempSensors(cellCount)
          }
          
          // 更新变量数据（每3秒更新一次，保持变量数量不变）
          const variableCount = oldData?.variables.length || getVariableCount(device.type)
          newData.variables = generateVariables(device, variableCount)
          
          newMap.set(device.id, newData)
        })
        return newMap
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])
  
  // 处理确认操作
  const handleConfirm = () => {
    // 这里可以添加实际的确认逻辑，比如发送到后端
    console.log('确认操作:', confirmDialog)
    setConfirmDialog({ ...confirmDialog, open: false })
    // 可以显示成功提示
  }

  // 从变量中提取数据（用于兼容旧视图）
  const extractedData = useMemo(() => {
    // 查找位域变量
    const bitfieldVar = deviceData.variables.find(v => v.type === 'bitfield' && v.bitfieldBits)
    const bitfieldValue = bitfieldVar ? (typeof bitfieldVar.value === 'number' ? bitfieldVar.value : 0) : 0
    const bitfieldBits = bitfieldVar?.bitfieldBits || []
    
    // 查找枚举变量
    const enumVar = deviceData.variables.find(v => v.type === 'enum')
    const enumValue = enumVar ? (typeof enumVar.value === 'number' ? enumVar.value : 0) : 0
    
    // 查找复杂位域变量
    const complexBitfieldVar = deviceData.variables.find(v => v.type === 'bitfield' && v.bitfieldBits && v.bitfieldBits.length === 16)
    const complexBitfieldValue = complexBitfieldVar ? (typeof complexBitfieldVar.value === 'number' ? complexBitfieldVar.value : 0) : 0
    const complexBitfieldBits = complexBitfieldVar?.bitfieldBits || []
    
    // 提取遥测量
    const measurements = {
      voltage: {
        phaseA: deviceData.variables.find(v => v.name.includes('VOLTAGE') && v.name.includes('A'))?.value?.toString() || '220.00',
        phaseB: deviceData.variables.find(v => v.name.includes('VOLTAGE') && v.name.includes('B'))?.value?.toString() || '220.00',
        phaseC: deviceData.variables.find(v => v.name.includes('VOLTAGE') && v.name.includes('C'))?.value?.toString() || '220.00',
      },
      current: {
        phaseA: deviceData.variables.find(v => v.name.includes('CURRENT') && v.name.includes('A'))?.value?.toString() || '10.00',
        phaseB: deviceData.variables.find(v => v.name.includes('CURRENT') && v.name.includes('B'))?.value?.toString() || '10.00',
        phaseC: deviceData.variables.find(v => v.name.includes('CURRENT') && v.name.includes('C'))?.value?.toString() || '10.00',
      },
      activePower: deviceData.variables.find(v => v.name.includes('ACTIVE_POWER'))?.value?.toString() || '5000.00',
      reactivePower: deviceData.variables.find(v => v.name.includes('REACTIVE_POWER'))?.value?.toString() || '1000.00',
      apparentPower: deviceData.variables.find(v => v.name.includes('APPARENT_POWER'))?.value?.toString() || '6000.00',
      temperature: deviceData.variables.find(v => v.name.includes('TEMPERATURE'))?.value?.toString() || '20.00',
      pressure: deviceData.variables.find(v => v.name.includes('PRESSURE'))?.value?.toString() || '0.5',
      frequency: deviceData.variables.find(v => v.name.includes('FREQUENCY'))?.value?.toString() || '50.00',
      powerFactor: deviceData.variables.find(v => v.name.includes('POWER_FACTOR'))?.value?.toString() || '0.95',
    }
    
    return {
      bitfieldValue,
      bitfieldBits,
      enumValue,
      complexBitfieldValue,
      complexBitfieldBits,
      measurements,
    }
  }, [deviceData.variables])
  
  // 解析位域：16位整数，bit0~bit15
  const bitfieldBits = useMemo(() => {
    if (extractedData.bitfieldBits.length >= 16) {
      return extractedData.bitfieldBits.slice(0, 16)
    }
    // 如果没有位域数据，从位域值解析
    const bits: boolean[] = []
    for (let i = 0; i < 16; i++) {
      bits.push((extractedData.bitfieldValue & (1 << i)) !== 0)
    }
    return bits
  }, [extractedData.bitfieldValue, extractedData.bitfieldBits])

  // 解析复杂位域
  const complexBitfield = useMemo(() => {
    if (extractedData.complexBitfieldBits.length >= 8) {
      // bit0~bit7：8个布尔
      const booleanBits = extractedData.complexBitfieldBits.slice(0, 8)
      // bit12~bit15：枚举（4位，0-15）
      const enumBits = (extractedData.complexBitfieldValue >> 12) & 0x0F
      return {
        booleanBits,
        enumBits,
      }
    }
    // 如果没有位域数据，从值解析
    const value = extractedData.complexBitfieldValue
    const booleanBits: boolean[] = []
    for (let i = 0; i < 8; i++) {
      booleanBits.push((value & (1 << i)) !== 0)
    }
    const enumBits = (value >> 12) & 0x0F
    return {
      booleanBits,
      enumBits,
    }
  }, [extractedData.complexBitfieldValue, extractedData.complexBitfieldBits])

  // 枚举值文本
  const getEnumText = (value: number) => {
    return t(`enum.states.${value}`, { defaultValue: `状态${value}` })
  }

  // 计算百分比（用于仪表盘显示）
  const getPercentage = (value: number, min: number, max: number) => {
    return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  }
  
  // 分组视图（按分类折叠）
  const renderGroupedView = () => {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{selectedDevice.displayName}</CardTitle>
            <CardDescription>
              {selectedDevice.name} · {selectedDevice.type} · 共 {deviceData.variables.length} 个变量
            </CardDescription>
          </CardHeader>
        </Card>
        
        <div className="space-y-2">
          {Array.from(groupedVariables.entries()).map(([category, vars]) => (
            <Collapsible
              key={category}
              open={expandedCategories.has(category)}
              onOpenChange={() => toggleCategory(category)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {expandedCategories.has(category) ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                        <CardTitle className="text-base">{category}</CardTitle>
                        <Badge variant="secondary">{vars.length} 个变量</Badge>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {vars.map((variable) => (
                        <div
                          key={variable.id}
                          className={cn(
                            'p-3 rounded-lg border-2 transition-all',
                            variable.status === 'alarm' && 'bg-red-500/10 border-red-500',
                            variable.status === 'warning' && 'bg-yellow-500/10 border-yellow-500',
                            variable.status === 'normal' && 'bg-muted border-border'
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium">{variable.displayName}</div>
                            <Badge variant="outline" className="text-xs">
                              {variable.type}
                            </Badge>
                          </div>
                          <div className="text-lg font-bold">
                            {typeof variable.value === 'boolean' 
                              ? (variable.value ? 'ON' : 'OFF')
                              : variable.value}
                            {variable.unit && <span className="text-sm ml-1">{variable.unit}</span>}
                          </div>
                          {variable.enumText && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {variable.enumText}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      </div>
    )
  }
  
  // 可搜索视图
  const renderSearchableView = () => {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{selectedDevice.displayName}</CardTitle>
            <CardDescription>
              {selectedDevice.name} · {selectedDevice.type} · 共 {deviceData.variables.length} 个变量
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索变量名称、显示名称或分类..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as VariableType | 'all')}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="measurement">遥测</SelectItem>
                  <SelectItem value="status">遥信</SelectItem>
                  <SelectItem value="bitfield">位域</SelectItem>
                  <SelectItem value="enum">枚举</SelectItem>
                  <SelectItem value="accum">累计量</SelectItem>
                  <SelectItem value="param">参数</SelectItem>
                  <SelectItem value="setpoint">设定值</SelectItem>
                  <SelectItem value="command">命令</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline">
                找到 {filteredVariables.length} 个变量
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <ScrollArea className="h-[600px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredVariables.map((variable) => (
              <Card key={variable.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">{variable.displayName}</div>
                    <Badge variant="outline" className="text-xs">
                      {variable.type}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {variable.name} · {variable.category}
                  </div>
                  <div className="text-lg font-bold">
                    {typeof variable.value === 'boolean' 
                      ? (variable.value ? 'ON' : 'OFF')
                      : variable.value}
                    {variable.unit && <span className="text-sm ml-1">{variable.unit}</span>}
                  </div>
                  {variable.enumText && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {variable.enumText}
                    </div>
                  )}
                  {variable.status && variable.status !== 'normal' && (
                    <Badge 
                      variant={variable.status === 'alarm' ? 'destructive' : 'default'}
                      className="mt-2"
                    >
                      {variable.status === 'alarm' ? '报警' : '警告'}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    )
  }
  
  // 树形视图
  const renderTreeView = () => {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{selectedDevice.displayName}</CardTitle>
            <CardDescription>
              {selectedDevice.name} · {selectedDevice.type} · 共 {deviceData.variables.length} 个变量
            </CardDescription>
          </CardHeader>
        </Card>
        
        <ScrollArea className="h-[600px]">
          <div className="space-y-2">
            {Array.from(groupedVariables.entries()).map(([category, vars]) => (
              <Collapsible
                key={category}
                open={expandedCategories.has(category)}
                onOpenChange={() => toggleCategory(category)}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {expandedCategories.has(category) ? (
                            <FolderOpen className="size-4" />
                          ) : (
                            <Folder className="size-4" />
                          )}
                          <CardTitle className="text-base">{category}</CardTitle>
                          <Badge variant="secondary">{vars.length}</Badge>
                        </div>
                        {expandedCategories.has(category) ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-2 pl-6">
                        {vars.map((variable) => (
                          <div
                            key={variable.id}
                            className={cn(
                              'p-3 rounded-lg border transition-all hover:bg-muted/50',
                              variable.status === 'alarm' && 'border-red-500 bg-red-500/5',
                              variable.status === 'warning' && 'border-yellow-500 bg-yellow-500/5',
                              variable.status === 'normal' && 'border-border'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="text-sm font-medium">{variable.displayName}</div>
                                  <Badge variant="outline" className="text-xs">
                                    {variable.type}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mb-1">
                                  {variable.name}
                                </div>
                                <div className="text-lg font-bold">
                                  {typeof variable.value === 'boolean' 
                                    ? (variable.value ? 'ON' : 'OFF')
                                    : variable.value}
                                  {variable.unit && <span className="text-sm ml-1">{variable.unit}</span>}
                                </div>
                              </div>
                              {variable.status && variable.status !== 'normal' && (
                                <Badge 
                                  variant={variable.status === 'alarm' ? 'destructive' : 'default'}
                                >
                                  {variable.status === 'alarm' ? '报警' : '警告'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </div>
    )
  }

  // 光字牌视图
  const renderLightPanelView = () => (
    <div className="space-y-6">
      {/* 设备信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{selectedDevice.displayName}</CardTitle>
              <CardDescription className="mt-1">
                {selectedDevice.name} · {selectedDevice.type}
              </CardDescription>
            </div>
            <Badge variant="outline">{selectedDevice.type}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* 1. 位域数据展示 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('bitfield.title')}</CardTitle>
          <CardDescription>{t('bitfield.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('bitfield.rawValue')}:</span>
            <Badge variant="outline" className="font-mono">
              {extractedData.bitfieldValue} (0x{extractedData.bitfieldValue.toString(16).toUpperCase().padStart(4, '0')})
            </Badge>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {bitfieldBits.map((bit, index) => {
              const timeText = format(new Date(), 'yyyy-MM-dd HH:mm:ss')
              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => {
                        setConfirmDialog({
                          open: true,
                          type: 'bitfield',
                          index,
                          label: `${t('bitfield.bitLabel', { bit: index })} (${bit ? t('bitfield.status.on') : t('bitfield.status.off')})`,
                        })
                      }}
                      className={cn(
                        'p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md',
                        bit
                          ? 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                      )}
                    >
                      <div className="text-xs font-medium mb-1">
                        {t('bitfield.bitLabel', { bit: index })}
                      </div>
                      <div className="text-sm font-bold">
                        {bit ? t('bitfield.status.on') : t('bitfield.status.off')}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>进入该状态时间: {timeText}</p>
                    <p className="text-xs mt-1">点击可确认</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. 枚举量展示 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('enum.title')}</CardTitle>
          <CardDescription>{t('enum.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('enum.rawValue')}:</span>
            <Badge variant="outline" className="font-mono">
              {extractedData.enumValue}
            </Badge>
          </div>
          
          <Separator />
          
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={() => {
                    setConfirmDialog({
                      open: true,
                      type: 'enum',
                      label: `运行模式: ${getEnumText(extractedData.enumValue)}`,
                    })
                  }}
                  className={cn(
                    'px-6 py-4 rounded-lg border-2 text-center min-w-[200px] cursor-pointer hover:shadow-md transition-all',
                    extractedData.enumValue === 0 && 'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-400',
                    extractedData.enumValue === 1 && 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-400',
                    extractedData.enumValue === 2 && 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-400'
                  )}
                >
                  <div className="text-sm font-medium mb-1">{t('enum.value')}</div>
                  <div className="text-2xl font-bold">{getEnumText(extractedData.enumValue)}</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>进入该状态时间: {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</p>
                <p className="text-xs mt-1">点击可确认</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="flex-1">
              <div className="text-sm text-muted-foreground mb-2">所有可能状态：</div>
              <div className="flex gap-2 flex-wrap">
                {[0, 1, 2].map((val) => (
                  <Badge
                    key={val}
                    variant={val === extractedData.enumValue ? 'default' : 'outline'}
                    className={cn(
                      val === extractedData.enumValue && 'ring-2 ring-offset-2'
                    )}
                  >
                    {val}: {getEnumText(val)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. 复杂位域解析 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('complexBitfield.title')}</CardTitle>
          <CardDescription>{t('complexBitfield.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('complexBitfield.rawValue')}:</span>
            <Badge variant="outline" className="font-mono">
              {extractedData.complexBitfieldValue} (0x{extractedData.complexBitfieldValue.toString(16).toUpperCase().padStart(4, '0')})
            </Badge>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-sm font-semibold mb-3">{t('complexBitfield.booleanBits')}</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {complexBitfield.booleanBits.map((bit, index) => {
                const timeText = format(new Date(), 'yyyy-MM-dd HH:mm:ss')
                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <div
                        onClick={() => {
                          setConfirmDialog({
                            open: true,
                            type: 'complexBitfield',
                            index,
                            label: `复杂位域 Bit ${index} (${bit ? 'ON' : 'OFF'})`,
                          })
                        }}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md',
                          bit
                            ? 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                        )}
                      >
                        <div className="text-xs font-medium mb-1">Bit {index}</div>
                        <div className="text-sm font-bold">
                          {bit ? 'ON' : 'OFF'}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>进入该状态时间: {timeText}</p>
                      <p className="text-xs mt-1">点击可确认</p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
              {t('complexBitfield.reservedBits')} (隐藏)
            </h3>
            <div className="text-xs text-muted-foreground">
              Bit 8-11 为预留位，不显示
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-sm font-semibold mb-3">{t('complexBitfield.enumBits')}</h3>
            <div className="flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => {
                      setConfirmDialog({
                        open: true,
                        type: 'complexEnum',
                        label: `复杂位域枚举: ${t(`complexBitfield.enumStates.${complexBitfield.enumBits}`, {
                          defaultValue: `模式${complexBitfield.enumBits}`
                        })}`,
                      })
                    }}
                    className={cn(
                      'px-6 py-4 rounded-lg border-2 text-center min-w-[200px] cursor-pointer hover:shadow-md transition-all',
                      'bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-400'
                    )}
                  >
                    <div className="text-sm font-medium mb-1">{t('complexBitfield.enumValue')}</div>
                    <div className="text-2xl font-bold">
                      {t(`complexBitfield.enumStates.${complexBitfield.enumBits}`, {
                        defaultValue: `模式${complexBitfield.enumBits}`
                      })}
                    </div>
                    <div className="text-xs mt-1 text-muted-foreground">
                      (Bit 12-15 = {complexBitfield.enumBits})
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>进入该状态时间: {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}</p>
                  <p className="text-xs mt-1">点击可确认</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. 遥测量展示 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('measurements.title')}</CardTitle>
          <CardDescription>{t('measurements.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 三相电压 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">{t('measurements.voltage')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['phaseA', 'phaseB', 'phaseC'] as const).map((phase) => (
                <Card key={phase}>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">{t(`measurements.${phase}`)}</div>
                    <div className="text-2xl font-bold">
                      {extractedData.measurements.voltage[phase]} <span className="text-lg">{t('measurements.unit.v')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <Separator />
          
          {/* 三相电流 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">{t('measurements.current')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['phaseA', 'phaseB', 'phaseC'] as const).map((phase) => (
                <Card key={phase}>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground mb-1">{t(`measurements.${phase}`)}</div>
                    <div className="text-2xl font-bold">
                      {extractedData.measurements.current[phase]} <span className="text-lg">{t('measurements.unit.a')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <Separator />
          
          {/* 功率 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">{t('measurements.power')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">{t('measurements.activePower')}</div>
                  <div className="text-2xl font-bold">
                    {extractedData.measurements.activePower} <span className="text-lg">{t('measurements.unit.w')}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">{t('measurements.reactivePower')}</div>
                  <div className="text-2xl font-bold">
                    {extractedData.measurements.reactivePower} <span className="text-lg">{t('measurements.unit.var')}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">{t('measurements.apparentPower')}</div>
                  <div className="text-2xl font-bold">
                    {extractedData.measurements.apparentPower} <span className="text-lg">{t('measurements.unit.va')}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* 其他遥测量 */}
          <div>
            <h3 className="text-sm font-semibold mb-3">其他遥测量</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">温度</div>
                  <div className="text-2xl font-bold">
                    {extractedData.measurements.temperature} <span className="text-lg">°C</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">压力</div>
                  <div className="text-2xl font-bold">
                    {extractedData.measurements.pressure} <span className="text-lg">bar</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">频率</div>
                  <div className="text-2xl font-bold">
                    {extractedData.measurements.frequency} <span className="text-lg">Hz</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">功率因数</div>
                  <div className="text-2xl font-bold">
                    {extractedData.measurements.powerFactor}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // 仪表盘视图
  const renderDashboardView = () => (
    <div className="space-y-6">
      {/* 设备信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{selectedDevice.displayName}</CardTitle>
              <CardDescription className="mt-1">
                {selectedDevice.name} · {selectedDevice.type}
              </CardDescription>
            </div>
            <Badge variant="outline">{selectedDevice.type}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* 关键指标仪表盘 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 电压仪表盘 */}
        {(['phaseA', 'phaseB', 'phaseC'] as const).map((phase) => {
          const value = parseFloat(extractedData.measurements.voltage[phase])
          const percentage = getPercentage(value, 200, 250)
          return (
            <Card key={phase}>
              <CardHeader>
                <CardTitle className="text-base">{t(`measurements.${phase}`)} {t('measurements.voltage')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {extractedData.measurements.voltage[phase]} <span className="text-lg">{t('measurements.unit.v')}</span>
                </div>
                <Progress value={percentage} className="h-3" />
                <div className="text-xs text-muted-foreground mt-2">
                  正常范围: 200-250V
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* 电流仪表盘 */}
        {(['phaseA', 'phaseB', 'phaseC'] as const).map((phase) => {
          const value = parseFloat(extractedData.measurements.current[phase])
          const percentage = getPercentage(value, 0, 100)
          return (
            <Card key={phase}>
              <CardHeader>
                <CardTitle className="text-base">{t(`measurements.${phase}`)} {t('measurements.current')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {extractedData.measurements.current[phase]} <span className="text-lg">{t('measurements.unit.a')}</span>
                </div>
                <Progress value={percentage} className="h-3" />
                <div className="text-xs text-muted-foreground mt-2">
                  正常范围: 0-100A
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* 功率仪表盘 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('measurements.activePower')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {extractedData.measurements.activePower} <span className="text-lg">{t('measurements.unit.w')}</span>
            </div>
            <Progress value={getPercentage(parseFloat(extractedData.measurements.activePower), 0, 20000)} className="h-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('measurements.reactivePower')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {extractedData.measurements.reactivePower} <span className="text-lg">{t('measurements.unit.var')}</span>
            </div>
            <Progress value={getPercentage(parseFloat(extractedData.measurements.reactivePower), 0, 10000)} className="h-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('measurements.apparentPower')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {extractedData.measurements.apparentPower} <span className="text-lg">{t('measurements.unit.va')}</span>
            </div>
            <Progress value={getPercentage(parseFloat(extractedData.measurements.apparentPower), 0, 25000)} className="h-3" />
          </CardContent>
        </Card>

        {/* 其他指标 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">温度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {extractedData.measurements.temperature} <span className="text-lg">°C</span>
            </div>
            <Progress value={getPercentage(parseFloat(extractedData.measurements.temperature), 0, 100)} className="h-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">压力</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {extractedData.measurements.pressure} <span className="text-lg">bar</span>
            </div>
            <Progress value={getPercentage(parseFloat(extractedData.measurements.pressure), 0, 15)} className="h-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">频率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {extractedData.measurements.frequency} <span className="text-lg">Hz</span>
            </div>
            <Progress value={getPercentage(parseFloat(extractedData.measurements.frequency), 45, 55)} className="h-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">功率因数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              {extractedData.measurements.powerFactor}
            </div>
            <Progress value={parseFloat(extractedData.measurements.powerFactor) * 100} className="h-3" />
          </CardContent>
        </Card>
      </div>

      {/* 状态指示 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">运行状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={cn(
              'px-6 py-4 rounded-lg border-2 text-center',
              extractedData.enumValue === 0 && 'bg-yellow-500/20 border-yellow-500 text-yellow-700 dark:text-yellow-400',
              extractedData.enumValue === 1 && 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-400',
              extractedData.enumValue === 2 && 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-400'
            )}>
              <div className="text-sm font-medium mb-1">运行模式</div>
              <div className="text-2xl font-bold">{getEnumText(extractedData.enumValue)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // 列表视图
  const renderListView = () => {
    const allMeasurements = [
      { label: `${t('measurements.phaseA')} ${t('measurements.voltage')}`, value: extractedData.measurements.voltage.phaseA, unit: t('measurements.unit.v') },
      { label: `${t('measurements.phaseB')} ${t('measurements.voltage')}`, value: extractedData.measurements.voltage.phaseB, unit: t('measurements.unit.v') },
      { label: `${t('measurements.phaseC')} ${t('measurements.voltage')}`, value: extractedData.measurements.voltage.phaseC, unit: t('measurements.unit.v') },
      { label: `${t('measurements.phaseA')} ${t('measurements.current')}`, value: extractedData.measurements.current.phaseA, unit: t('measurements.unit.a') },
      { label: `${t('measurements.phaseB')} ${t('measurements.current')}`, value: extractedData.measurements.current.phaseB, unit: t('measurements.unit.a') },
      { label: `${t('measurements.phaseC')} ${t('measurements.current')}`, value: extractedData.measurements.current.phaseC, unit: t('measurements.unit.a') },
      { label: t('measurements.activePower'), value: extractedData.measurements.activePower, unit: t('measurements.unit.w') },
      { label: t('measurements.reactivePower'), value: extractedData.measurements.reactivePower, unit: t('measurements.unit.var') },
      { label: t('measurements.apparentPower'), value: extractedData.measurements.apparentPower, unit: t('measurements.unit.va') },
      { label: '温度', value: extractedData.measurements.temperature, unit: '°C' },
      { label: '压力', value: extractedData.measurements.pressure, unit: 'bar' },
      { label: '频率', value: extractedData.measurements.frequency, unit: 'Hz' },
      { label: '功率因数', value: extractedData.measurements.powerFactor, unit: '' },
    ]

    return (
      <div className="space-y-6">
        {/* 设备信息 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedDevice.displayName}</CardTitle>
                <CardDescription className="mt-1">
                  {selectedDevice.name} · {selectedDevice.type}
                </CardDescription>
              </div>
              <Badge variant="outline">{selectedDevice.type}</Badge>
            </div>
          </CardHeader>
        </Card>

        {/* 遥测量列表 */}
        <Card>
          <CardHeader>
            <CardTitle>遥测量列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allMeasurements.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm font-medium">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{item.value}</span>
                    {item.unit && <span className="text-sm text-muted-foreground">{item.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 状态列表 */}
        <Card>
          <CardHeader>
            <CardTitle>状态信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium">运行模式</span>
                <Badge variant={extractedData.enumValue === 2 ? 'default' : 'secondary'}>
                  {getEnumText(extractedData.enumValue)}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm font-medium">位域状态字</span>
                <span className="text-sm font-mono">
                  {extractedData.bitfieldValue} (0x{extractedData.bitfieldValue.toString(16).toUpperCase().padStart(4, '0')})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 热力图视图（针对电池簇）
  const renderHeatmapView = () => {
    // 只有电池簇设备才显示热力图
    if (selectedDevice.type !== '电池簇' || !deviceData.batteryCells || !deviceData.tempSensors) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              当前设备不是电池簇，热力图视图仅适用于电池簇设备
            </div>
          </CardContent>
        </Card>
      )
    }
    
    const cells = deviceData.batteryCells
    const tempSensors = deviceData.tempSensors
    
    // 计算布局
    const cellCols = 20 // 每行20个电池单体
    const cellRows = Math.ceil(cells.length / cellCols)
    
    const tempCols = 10 // 每行10个温度传感器
    const tempRows = Math.ceil(tempSensors.length / tempCols)
    
    // 获取颜色
    const getCellColor = (voltage: number) => {
      if (voltage < 3.2) return 'rgba(239, 68, 68, 0.8)' // 红色
      if (voltage < 3.4) return 'rgba(234, 179, 8, 0.8)' // 黄色
      if (voltage <= 4.0) return 'rgba(34, 197, 94, 0.8)' // 绿色
      if (voltage <= 4.2) return 'rgba(234, 179, 8, 0.8)' // 黄色
      return 'rgba(239, 68, 68, 0.8)' // 红色
    }
    
    const getTempColor = (temp: number) => {
      if (temp < 30) return 'rgba(59, 130, 246, 0.8)' // 蓝色
      if (temp < 40) return 'rgba(34, 197, 94, 0.8)' // 绿色
      if (temp < 45) return 'rgba(234, 179, 8, 0.8)' // 黄色
      return 'rgba(239, 68, 68, 0.8)' // 红色
    }
    
    return (
      <div className="space-y-6">
        {/* 设备信息 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedDevice.displayName}</CardTitle>
                <CardDescription className="mt-1">
                  {selectedDevice.name} · {cells.length} 个电池单体 · {tempSensors.length} 个温度传感器
                </CardDescription>
              </div>
              <Badge variant="outline">电池簇</Badge>
            </div>
          </CardHeader>
        </Card>
        
        {/* 数据类型选择 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">显示类型:</span>
              <Tabs value={heatmapDataType} onValueChange={(v) => setHeatmapDataType(v as 'voltage' | 'temperature')}>
                <TabsList>
                  <TabsTrigger value="voltage">电池单体电压</TabsTrigger>
                  <TabsTrigger value="temperature">温度传感器</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>
        
        {/* 电池单体电压热力图 */}
        {heatmapDataType === 'voltage' && (
          <Card>
            <CardHeader>
              <CardTitle>电池单体电压热力图</CardTitle>
              <CardDescription>
                共 {cells.length} 个电池单体，排列为 {cellRows} 行 × {cellCols} 列
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] border rounded-lg p-4">
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cellCols}, minmax(0, 1fr))` }}>
                  {cells.map((cell) => (
                    <Tooltip key={cell.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'aspect-square rounded border-2 cursor-pointer transition-all hover:scale-110 hover:z-10 relative',
                            'border-gray-300 dark:border-gray-600',
                            cell.status === 'alarm' && 'ring-2 ring-red-500',
                            cell.status === 'warning' && 'ring-2 ring-yellow-500'
                          )}
                          style={{
                            backgroundColor: getCellColor(cell.voltage),
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
                            {cell.voltage.toFixed(2)}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-semibold">电池单体 #{cell.id}</p>
                          <p>电压: {cell.voltage.toFixed(3)} V</p>
                          <p>位置: 第 {cell.position.row + 1} 行，第 {cell.position.col + 1} 列</p>
                          <p className="text-xs">
                            状态: {cell.status === 'alarm' ? '报警' : cell.status === 'warning' ? '警告' : '正常'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            更新时间: {format(cell.lastUpdate, 'HH:mm:ss')}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </ScrollArea>
              
              {/* 图例 */}
              <div className="flex items-center gap-4 text-sm mt-4">
                <span>图例:</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.8)' }}></div>
                  <span>&lt; 3.2V 或 &gt; 4.2V (异常)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(234, 179, 8, 0.8)' }}></div>
                  <span>3.2-3.4V 或 4.0-4.2V (警告)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.8)' }}></div>
                  <span>3.4-4.0V (正常)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* 温度传感器热力图 */}
        {heatmapDataType === 'temperature' && (
          <Card>
            <CardHeader>
              <CardTitle>温度传感器热力图</CardTitle>
              <CardDescription>
                共 {tempSensors.length} 个温度传感器，排列为 {tempRows} 行 × {tempCols} 列
                <br />
                每个传感器监测约 3-4 个电池单体
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] border rounded-lg p-4">
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${tempCols}, minmax(0, 1fr))` }}>
                  {tempSensors.map((sensor) => (
                    <Tooltip key={sensor.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'aspect-square rounded border-2 cursor-pointer transition-all hover:scale-110 hover:z-10 relative',
                            'border-gray-300 dark:border-gray-600',
                            sensor.status === 'alarm' && 'ring-2 ring-red-500',
                            sensor.status === 'warning' && 'ring-2 ring-yellow-500'
                          )}
                          style={{
                            backgroundColor: getTempColor(sensor.temperature),
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
                            {sensor.temperature.toFixed(1)}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-semibold">温度传感器 #{sensor.id}</p>
                          <p>温度: {sensor.temperature.toFixed(1)} °C</p>
                          <p>位置: 第 {sensor.position.row + 1} 行，第 {sensor.position.col + 1} 列</p>
                          <p className="text-xs">
                            监测电池单体: #{sensor.cellIds[0]} - #{sensor.cellIds[sensor.cellIds.length - 1]}
                            <br />
                            (共 {sensor.cellIds.length} 个单体)
                          </p>
                          <p className="text-xs">
                            状态: {sensor.status === 'alarm' ? '报警' : sensor.status === 'warning' ? '警告' : '正常'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            更新时间: {format(sensor.lastUpdate, 'HH:mm:ss')}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </ScrollArea>
              
              {/* 图例 */}
              <div className="flex items-center gap-4 text-sm mt-4">
                <span>图例:</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.8)' }}></div>
                  <span>&lt; 30°C (低温)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.8)' }}></div>
                  <span>30-40°C (正常)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(234, 179, 8, 0.8)' }}></div>
                  <span>40-45°C (警告)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.8)' }}></div>
                  <span>&gt; 45°C (异常)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* 统计信息 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {heatmapDataType === 'voltage' && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">最小电压</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.min(...cells.map(c => c.voltage)).toFixed(3)} V
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">最大电压</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.max(...cells.map(c => c.voltage)).toFixed(3)} V
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">平均电压</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(cells.reduce((sum, c) => sum + c.voltage, 0) / cells.length).toFixed(3)} V
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">电压差</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(Math.max(...cells.map(c => c.voltage)) - Math.min(...cells.map(c => c.voltage))).toFixed(3)} V
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          {heatmapDataType === 'temperature' && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">最低温度</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.min(...tempSensors.map(s => s.temperature)).toFixed(1)} °C
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">最高温度</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.max(...tempSensors.map(s => s.temperature)).toFixed(1)} °C
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">平均温度</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(tempSensors.reduce((sum, s) => sum + s.temperature, 0) / tempSensors.length).toFixed(1)} °C
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">温差</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(Math.max(...tempSensors.map(s => s.temperature)) - Math.min(...tempSensors.map(s => s.temperature))).toFixed(1)} °C
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    )
  }
  
  // 卡片网格视图
  const renderGridView = () => (
    <div className="space-y-6">
      {/* 设备信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{selectedDevice.displayName}</CardTitle>
              <CardDescription className="mt-1">
                {selectedDevice.name} · {selectedDevice.type}
              </CardDescription>
            </div>
            <Badge variant="outline">{selectedDevice.type}</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* 卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* 电压卡片 */}
        {(['phaseA', 'phaseB', 'phaseC'] as const).map((phase) => (
          <Card key={phase} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t(`measurements.${phase}`)} {t('measurements.voltage')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {extractedData.measurements.voltage[phase]} <span className="text-sm">{t('measurements.unit.v')}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* 电流卡片 */}
        {(['phaseA', 'phaseB', 'phaseC'] as const).map((phase) => (
          <Card key={phase} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t(`measurements.${phase}`)} {t('measurements.current')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {extractedData.measurements.current[phase]} <span className="text-sm">{t('measurements.unit.a')}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* 功率卡片 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('measurements.activePower')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {extractedData.measurements.activePower} <span className="text-sm">{t('measurements.unit.w')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('measurements.reactivePower')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {extractedData.measurements.reactivePower} <span className="text-sm">{t('measurements.unit.var')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('measurements.apparentPower')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {extractedData.measurements.apparentPower} <span className="text-sm">{t('measurements.unit.va')}</span>
            </div>
          </CardContent>
        </Card>

        {/* 其他指标卡片 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">温度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {extractedData.measurements.temperature} <span className="text-sm">°C</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">压力</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {extractedData.measurements.pressure} <span className="text-sm">bar</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">频率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {extractedData.measurements.frequency} <span className="text-sm">Hz</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">功率因数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {extractedData.measurements.powerFactor}
            </div>
          </CardContent>
        </Card>

        {/* 状态卡片 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">运行模式</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={extractedData.enumValue === 2 ? 'default' : 'secondary'}
              className="text-lg px-3 py-1"
            >
              {getEnumText(extractedData.enumValue)}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            使用模拟数据展示光字牌效果，数据每3秒自动更新
          </p>
        </div>
      </div>

      {/* 设备选择和视图切换 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">选择设备:</span>
              <Select value={String(selectedDeviceId)} onValueChange={(v) => setSelectedDeviceId(Number(v))}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockDevices.map((device) => (
                    <SelectItem key={device.id} value={String(device.id)}>
                      {device.displayName} ({device.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm font-medium">视图模式:</span>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList>
                  <TabsTrigger value="light-panel" className="gap-2">
                    <Activity className="size-4" />
                    光字牌
                  </TabsTrigger>
                  <TabsTrigger value="dashboard" className="gap-2">
                    <Gauge className="size-4" />
                    仪表盘
                  </TabsTrigger>
                  <TabsTrigger value="list" className="gap-2">
                    <List className="size-4" />
                    列表
                  </TabsTrigger>
                  <TabsTrigger value="grid" className="gap-2">
                    <Grid className="size-4" />
                    网格
                  </TabsTrigger>
                  <TabsTrigger value="heatmap" className="gap-2">
                    <Thermometer className="size-4" />
                    热力图
                  </TabsTrigger>
                  <TabsTrigger value="grouped" className="gap-2">
                    <Folder className="size-4" />
                    分组
                  </TabsTrigger>
                  <TabsTrigger value="searchable" className="gap-2">
                    <Search className="size-4" />
                    搜索
                  </TabsTrigger>
                  <TabsTrigger value="tree" className="gap-2">
                    <FolderOpen className="size-4" />
                    树形
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      <ScrollArea className="h-[calc(100vh-16rem)]">
        <div className="pr-4">
          {viewMode === 'light-panel' && renderLightPanelView()}
          {viewMode === 'dashboard' && renderDashboardView()}
          {viewMode === 'list' && renderListView()}
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'heatmap' && renderHeatmapView()}
          {viewMode === 'grouped' && renderGroupedView()}
          {viewMode === 'searchable' && renderSearchableView()}
          {viewMode === 'tree' && renderTreeView()}
        </div>
      </ScrollArea>

      {/* 确认对话框 */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认遥信状态</AlertDialogTitle>
            <AlertDialogDescription>
              您要确认以下遥信状态吗？
              <div className="mt-2 p-2 bg-muted rounded-md">
                <div className="font-medium">{confirmDialog.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  设备: {selectedDevice.displayName} ({selectedDevice.name})
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>确认</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
