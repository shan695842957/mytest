/**
 * BMS 数据类型定义
 * 支持不同供应商的数据结构差异
 */

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
 * 不同供应商提供的单体数据可能不同
 */
export interface CellData {
  /** 单体编号 */
  id: string;
  /** 电压 (V) - 通常都有 */
  voltage?: number;
  /** 温度 (°C) - 某些供应商没有，使用包内温度测点 */
  temperature?: number;
  /** SOC (%) - 某些供应商提供 */
  soc?: number;
  /** SOH (%) - 某些供应商提供 */
  soh?: number;
}

/**
 * 温度测点数据
 * 电池包内的温度测点，与单体数不一定相同
 */
export interface TemperaturePoint {
  /** 测点编号 */
  id: string;
  /** 温度值 (°C) */
  temperature: number;
}

/**
 * 电池包数据
 */
export interface BatteryPackData {
  /** 电池包编号 */
  id: string;
  /** 包内单体数据 */
  cells: CellData[];
  /** 温度测点数据 */
  temperaturePoints: TemperaturePoint[];
  /** 包电压 (V) */
  voltage?: number;
  /** 包电流 (A) */
  current?: number;
  /** 包功率 (W) */
  power?: number;
  /** 包SOC (%) */
  soc?: number;
  /** 包SOH (%) */
  soh?: number;
  /** 故障状态 */
  fault?: boolean;
  /** 故障信息 */
  faultMessage?: string;
}

/**
 * 电池簇数据（三级架构）
 */
export interface BatteryClusterData {
  /** 电池簇编号 */
  id: string;
  /** 簇下的电池包 */
  packs: BatteryPackData[];
  /** 簇高压箱数据 */
  highVoltageBox: {
    /** 故障检测 */
    fault?: boolean;
    /** 故障信息 */
    faultMessage?: string;
    /** 簇电压 (V) */
    voltage?: number;
    /** 簇电流 (A) */
    current?: number;
    /** 簇功率 (W) */
    power?: number;
    /** 簇SOC (%) */
    soc?: number;
    /** 簇SOH (%) */
    soh?: number;
    /** 簇正负极断路器状态 */
    breaker: BreakerStatus;
  };
}

/**
 * 电池堆数据（三级架构）
 */
export interface BatteryStackData {
  /** 电池堆编号 */
  id: string;
  /** 堆下的电池簇 */
  clusters: BatteryClusterData[];
  /** 总高压箱数据 */
  mainHighVoltageBox: {
    /** 正负极断路器状态 */
    breaker: BreakerStatus;
    /** 总电压 (V) */
    voltage?: number;
    /** 总电流 (A) */
    current?: number;
    /** 总功率 (W) */
    power?: number;
    /** 故障状态 */
    fault?: boolean;
    /** 故障信息 */
    faultMessage?: string;
    /** 总SOC (%) */
    soc?: number;
    /** 总SOH (%) */
    soh?: number;
    /** 负载均衡状态 */
    loadBalancing?: {
      enabled: boolean;
      status?: string;
    };
    /** 短路/过载保护状态 */
    protection?: {
      shortCircuit?: boolean;
      overload?: boolean;
    };
  };
}

/**
 * 电池簇数据（二级架构）
 * 二级架构对外呈现就是一个簇，包含高压箱
 */
export interface BatteryClusterDataLevel2 {
  /** 电池簇编号 */
  id: string;
  /** 簇下的电池包 */
  packs: BatteryPackData[];
  /** 簇高压箱数据 */
  highVoltageBox: {
    /** 故障检测 */
    fault?: boolean;
    /** 故障信息 */
    faultMessage?: string;
    /** 簇电压 (V) */
    voltage?: number;
    /** 簇电流 (A) */
    current?: number;
    /** 簇功率 (W) */
    power?: number;
    /** 簇SOC (%) */
    soc?: number;
    /** 簇SOH (%) */
    soh?: number;
    /** 簇正负极断路器状态 */
    breaker: BreakerStatus;
  };
}

/**
 * BMS配置
 * 用于配置电池堆/簇的结构
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
    /** 单体的串并联配置，如 "2串15并" 表示 2串15并 */
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
