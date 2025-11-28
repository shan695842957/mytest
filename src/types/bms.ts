/**
 * BMS 储能系统可视化 - 类型定义
 * 
 * ============================================
 * 使用说明
 * ============================================
 * 
 * 本文件定义了BMS可视化系统的所有数据类型。
 * 
 * 核心概念：动态字段数组
 * - 所有显示字段都通过 DataField[] 数组传递
 * - 字段名支持任何语言（中文、英文等）
 * - 字段数量和类型完全由外部决定
 * 
 * 示例：
 * ```typescript
 * const fields: DataField[] = [
 *   { name: '总电压', value: 720.5, unit: 'V' },
 *   { name: 'Grid Voltage', value: 720.5, unit: 'V' },
 *   { name: 'SOC', value: 85.5, unit: '%' },
 * ];
 * ```
 * 
 * 支持的架构：
 * - 三级架构：电池堆 → 电池簇 → 电池包 → 电池单体
 * - 二级架构：电池簇 → 电池包 → 电池单体
 * 
 * 数据更新接口：
 * 系统通过 window.BMSAPI 暴露更新接口，详见 hooks/useBMS.ts
 */

/**
 * 动态字段项
 * 用于支持不同供应商和不同语言的字段名
 * 
 * @example
 * ```typescript
 * { name: '电压', value: 720.5, unit: 'V' }
 * { name: 'Grid Voltage', value: 720.5, unit: 'V' }
 * { name: '状态', value: '正常', unit: '' }
 * { name: '启用', value: true, unit: '' }
 * ```
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
 * 
 * @example
 * ```typescript
 * // 方式1：单个标志位
 * { closed: true }
 * 
 * // 方式2：正负极分别控制
 * { positiveClosed: true, negativeClosed: true }
 * ```
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
 * 
 * @example
 * ```typescript
 * // 某些供应商提供完整数据
 * {
 *   id: 'C1-P1-Cell1',
 *   fields: [
 *     { name: '电压', value: 3.7, unit: 'V' },
 *     { name: '温度', value: 25.5, unit: '°C' },
 *     { name: 'SOC', value: 85.0, unit: '%' },
 *   ]
 * }
 * 
 * // 某些供应商只提供电压
 * {
 *   id: 'C1-P1-Cell1',
 *   fields: [
 *     { name: 'Voltage', value: 3.7, unit: 'V' },
 *   ]
 * }
 * ```
 */
export interface CellData {
  /** 单体编号 */
  id: string;
  /** 动态字段数组（如电压、温度、SOC、SOH等，字段名和单位可自定义） */
  fields: DataField[];
}

/**
 * 温度测点数据
 * 电池包内的温度测点，与单体数不一定相同
 * 
 * @example
 * ```typescript
 * {
 *   id: 'T1',
 *   temperature: 25.5,
 *   unit: '°C'
 * }
 * ```
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
 * 
 * @example
 * ```typescript
 * {
 *   id: 'C1-P1',
 *   cells: [...],
 *   temperaturePoints: [...],
 *   fields: [
 *     { name: '包电压', value: 60.05, unit: 'V' },
 *     { name: '包电流', value: 12.5, unit: 'A' },
 *   ],
 *   fault: false,
 * }
 * ```
 */
export interface BatteryPackData {
  /** 电池包编号 */
  id: string;
  /** 包内单体数据 */
  cells: CellData[];
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
export interface BatteryClusterData {
  /** 电池簇编号 */
  id: string;
  /** 簇下的电池包（包与包之间是串联的） */
  packs: BatteryPackData[];
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
 * 电池堆下有若干电池簇，簇与簇之间是并联的
 */
export interface BatteryStackData {
  /** 电池堆编号 */
  id: string;
  /** 堆下的电池簇 */
  clusters: BatteryClusterData[];
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
 * 二级架构对外呈现就是一个簇，包含高压箱
 * 簇下有电池包，包与包之间是串联的
 */
export interface BatteryClusterDataLevel2 {
  /** 电池簇编号 */
  id: string;
  /** 簇下的电池包 */
  packs: BatteryPackData[];
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
 * 用于配置电池堆/簇的结构
 * 
 * @example
 * ```typescript
 * const config = {
 *   level3: {
 *     clusterCount: 3,
 *     packCountPerCluster: 4,
 *     cellCountPerPack: 30,
 *     temperaturePointCountPerPack: 5,
 *     cellConfiguration: { series: 2, parallel: 15 },
 *   }
 * };
 * ```
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
