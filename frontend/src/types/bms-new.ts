/**
 * BMS 储能系统可视化 - 新版本类型定义
 * 
 * 设计原则：
 * 1. 支持动态字段（不同厂家字段不同）
 * 2. 支持串并联配置
 * 3. 支持实时数据更新
 * 4. 清晰的业务逻辑展示
 */

/**
 * 动态字段项
 * 支持不同供应商和不同语言的字段名
 */
export interface DataField {
  /** 字段名（可以是任何语言，如"电压"、"Voltage"、"Grid Voltage"等） */
  name: string;
  /** 字段值（数字、字符串或布尔值） */
  value: number | string | boolean;
  /** 单位（可选，如"V"、"A"、"W"、"%"、"°C"等） */
  unit?: string;
}

/**
 * 断路器状态
 * 某些供应商使用单个合闸标志位，某些使用正负极分别控制
 */
export interface BreakerStatus {
  /** 合闸标志位（某些供应商使用） */
  closed?: boolean;
  /** 正极接触器是否合闸（某些供应商使用） */
  positiveClosed?: boolean;
  /** 负极接触器是否合闸（某些供应商使用） */
  negativeClosed?: boolean;
}

/**
 * 电池单体数据
 */
export interface BatteryCell {
  /** 单体编号 */
  id: string;
  /** 动态字段数组（如电压、温度、SOC、SOH等） */
  fields: DataField[];
}

/**
 * 温度测点数据
 */
export interface TemperaturePoint {
  /** 测点编号 */
  id: string;
  /** 温度值 */
  temperature: number;
  /** 温度单位（默认°C） */
  unit?: string;
}

/**
 * 电池包数据
 */
export interface BatteryPack {
  /** 电池包编号 */
  id: string;
  /** 包内单体数据 */
  cells: BatteryCell[];
  /** 温度测点数据 */
  temperaturePoints: TemperaturePoint[];
  /** 包的动态字段数组（如电压、电流、功率、SOC、SOH等） */
  fields: DataField[];
  /** 故障状态 */
  fault?: boolean;
  /** 故障信息 */
  faultMessage?: string;
}

/**
 * 电池簇数据（三级架构）
 * 簇与簇之间是并联的
 */
export interface BatteryCluster {
  /** 电池簇编号 */
  id: string;
  /** 簇下的电池包（包与包之间是串联的） */
  packs: BatteryPack[];
  /** 簇高压箱数据 */
  highVoltageBox: {
    /** 簇高压箱的动态字段数组 */
    fields: DataField[];
    /** 簇正负极断路器状态 */
    breaker: BreakerStatus;
    /** 故障状态 */
    fault?: boolean;
    /** 故障信息 */
    faultMessage?: string;
  };
}

/**
 * 电池堆数据（三级架构）
 */
export interface BatteryStack {
  /** 电池堆编号 */
  id: string;
  /** 堆下的电池簇 */
  clusters: BatteryCluster[];
  /** 总高压箱数据 */
  mainHighVoltageBox: {
    /** 总高压箱的动态字段数组 */
    fields: DataField[];
    /** 正负极断路器状态 */
    breaker: BreakerStatus;
    /** 故障状态 */
    fault?: boolean;
    /** 故障信息 */
    faultMessage?: string;
  };
}

/**
 * 电池簇数据（二级架构）
 * 二级架构对外呈现就是一个簇
 */
export interface BatteryClusterLevel2 {
  /** 电池簇编号 */
  id: string;
  /** 簇下的电池包 */
  packs: BatteryPack[];
  /** 簇高压箱数据 */
  highVoltageBox: {
    /** 簇高压箱的动态字段数组 */
    fields: DataField[];
    /** 簇正负极断路器状态 */
    breaker: BreakerStatus;
    /** 故障状态 */
    fault?: boolean;
    /** 故障信息 */
    faultMessage?: string;
  };
}

/**
 * BMS配置
 */
export interface BMSConfig {
  /** 三级架构配置 */
  level3?: {
    /** 电池堆下的簇数 */
    clusterCount: number;
    /** 每个簇下的包数 */
    packCountPerCluster: number;
    /** 每个包下的单体数 */
    cellCountPerPack: number;
    /** 每个包内的温度测点数 */
    temperaturePointCountPerPack: number;
    /** 单体的串并联配置，如 { series: 2, parallel: 15 } 表示 2串15并 */
    cellConfiguration?: {
      series: number; // 串联数
      parallel: number; // 并联数
    };
  };
  /** 二级架构配置 */
  level2?: {
    /** 簇下的包数 */
    packCount: number;
    /** 每个包下的单体数 */
    cellCountPerPack: number;
    /** 每个包内的温度测点数 */
    temperaturePointCountPerPack: number;
    /** 单体的串并联配置 */
    cellConfiguration?: {
      series: number;
      parallel: number;
    };
  };
}
