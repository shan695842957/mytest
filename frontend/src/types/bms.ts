/**
 * BMS 类型定义
 * 支持动态字段，适配不同厂家的数据格式
 */

/**
 * 数据字段（动态字段）
 */
export interface DataField {
  name: string // 字段名称，如 "电压"、"电流"、"SOC" 等
  value: number // 字段值
  unit: string // 单位，如 "V"、"A"、"%"、"°C" 等
}

/**
 * 断路器状态
 * 支持两种模式：
 * 1. 统一模式：只有一个合闸标志
 * 2. 分离模式：正负极分别控制
 */
export interface BreakerStatus {
  // 统一模式
  closed?: boolean
  
  // 分离模式
  positiveClosed?: boolean
  negativeClosed?: boolean
}

/**
 * 电池单体
 */
export interface BatteryCell {
  id: number // 单体编号
  fields: DataField[] // 动态字段（电压、温度、SOC等，根据厂家不同而不同）
}

/**
 * 温度测点
 */
export interface TemperaturePoint {
  id: number // 测点编号
  temperature: number // 温度值 (°C)
}

/**
 * 电池包
 */
export interface BatteryPack {
  id: number // 包编号
  name: string // 包名称，如 "电池包1"
  fields: DataField[] // 动态字段（包电压、包电流、包功率等）
  cells: BatteryCell[] // 电池单体列表
  temperaturePoints: TemperaturePoint[] // 温度测点列表
  fault?: boolean // 故障状态
  faultMessage?: string // 故障信息
}

/**
 * 高压箱（簇高压箱或总高压箱）
 */
export interface HighVoltageBox {
  fields: DataField[] // 动态字段（电压、电流、功率、SOC、SOH等）
  breaker: BreakerStatus // 断路器状态
  fault?: boolean // 故障状态
  faultMessage?: string // 故障信息
}

/**
 * 电池簇（三级架构）
 */
export interface BatteryCluster {
  id: number // 簇编号
  name: string // 簇名称，如 "电池簇1"
  highVoltageBox: HighVoltageBox // 簇高压箱
  packs: BatteryPack[] // 电池包列表
}

/**
 * 三级架构 BMS 数据
 */
export interface Level3BMSData {
  // 总高压箱
  mainHighVoltageBox: HighVoltageBox
  
  // 电池簇列表
  clusters: BatteryCluster[]
}

/**
 * 三级架构 BMS 配置
 */
export interface Level3BMSConfig {
  clusterCount: number // 簇数量
  packCountPerCluster: number // 每簇的包数量
  cellCountPerPack: number // 每包的单体数量
  temperaturePointCountPerPack: number // 每包的温度测点数量
  cellConfiguration: {
    series: number // 串联数（如 2串）
    parallel: number // 并联数（如 15并）
  }
}

/**
 * 二级架构 BMS 数据
 */
export interface Level2BMSData {
  // 簇高压箱
  highVoltageBox: HighVoltageBox
  
  // 电池包列表
  packs: BatteryPack[]
}

/**
 * 二级架构 BMS 配置
 */
export interface Level2BMSConfig {
  packCount: number // 包数量
  cellCountPerPack: number // 每包的单体数量
  temperaturePointCountPerPack: number // 每包的温度测点数量
  cellConfiguration: {
    series: number // 串联数
    parallel: number // 并联数
  }
}
