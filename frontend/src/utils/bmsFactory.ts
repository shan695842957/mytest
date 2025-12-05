/**
 * BMS数据工厂函数
 * 
 * ============================================
 * 使用说明
 * ============================================
 * 
 * 本文件提供了根据配置创建初始BMS数据结构的工厂函数。
 * 
 * 使用方式：
 * ```tsx
 * import { createLevel3BMSData, createLevel2BMSData } from '@/utils/bmsFactory';
 * 
 * // 三级架构
 * const config = {
 *   clusterCount: 3,
 *   packCountPerCluster: 4,
 *   cellCountPerPack: 30,
 *   temperaturePointCountPerPack: 5,
 *   cellConfiguration: { series: 2, parallel: 15 },
 * };
 * const initialData = createLevel3BMSData(config);
 * 
 * // 二级架构
 * const config2 = {
 *   packCount: 6,
 *   cellCountPerPack: 30,
 *   temperaturePointCountPerPack: 5,
 * };
 * const initialData2 = createLevel2BMSData(config2);
 * ```
 * 
 * 注意事项：
 * - 创建的数据结构中，所有字段数组（fields）初始为空
 * - 需要通过 useBMS Hook 的更新函数填充数据
 * - ID格式：三级架构为 "C{簇号}-P{包号}-Cell{单体号}"，二级架构为 "P{包号}-Cell{单体号}"
 */

import {
  BatteryStackData,
  BatteryClusterDataLevel2,
  BMSConfig,
  CellData,
  TemperaturePoint,
  BatteryPackData,
  BatteryClusterData,
} from '@/types/bms-page3';

/**
 * 创建三级架构BMS初始数据
 */
export function createLevel3BMSData(config: BMSConfig['level3']): BatteryStackData {
  if (!config) {
    throw new Error('三级架构配置不能为空');
  }

  const { clusterCount, packCountPerCluster, cellCountPerPack, temperaturePointCountPerPack } = config;

  // 创建电池簇
  const clusters: BatteryClusterData[] = [];
  for (let i = 1; i <= clusterCount; i++) {
    // 创建电池包
    const packs: BatteryPackData[] = [];
    for (let j = 1; j <= packCountPerCluster; j++) {
      // 创建电池单体（初始为空字段数组，由外部填充）
      const cells: CellData[] = [];
      for (let k = 1; k <= cellCountPerPack; k++) {
        cells.push({
          id: `C${i}-P${j}-Cell${k}`,
          fields: [], // 初始为空，由外部通过API填充
        });
      }

      // 创建温度测点
      const temperaturePoints: TemperaturePoint[] = [];
      for (let t = 1; t <= temperaturePointCountPerPack; t++) {
        temperaturePoints.push({
          id: `T${t}`,
          temperature: 25, // 默认温度
          unit: '°C',
        });
      }

      packs.push({
        id: `C${i}-P${j}`,
        cells,
        temperaturePoints,
        fields: [], // 初始为空，由外部通过API填充
      });
    }

    clusters.push({
      id: `Cluster${i}`,
      packs,
      highVoltageBox: {
        fields: [], // 初始为空，由外部通过API填充
        breaker: {
          closed: false,
        },
      },
    });
  }

  return {
    id: 'Stack1',
    clusters,
    mainHighVoltageBox: {
      fields: [], // 初始为空，由外部通过API填充
      breaker: {
        closed: false,
      },
    },
  };
}

/**
 * 创建二级架构BMS初始数据
 */
export function createLevel2BMSData(config: BMSConfig['level2']): BatteryClusterDataLevel2 {
  if (!config) {
    throw new Error('二级架构配置不能为空');
  }

  const { packCount, cellCountPerPack, temperaturePointCountPerPack } = config;

  // 创建电池包
  const packs: BatteryPackData[] = [];
  for (let j = 1; j <= packCount; j++) {
    // 创建电池单体（初始为空字段数组，由外部填充）
    const cells: CellData[] = [];
    for (let k = 1; k <= cellCountPerPack; k++) {
      cells.push({
        id: `P${j}-Cell${k}`,
        fields: [], // 初始为空，由外部通过API填充
      });
    }

    // 创建温度测点
    const temperaturePoints: TemperaturePoint[] = [];
    for (let t = 1; t <= temperaturePointCountPerPack; t++) {
      temperaturePoints.push({
        id: `T${t}`,
        temperature: 25, // 默认温度
        unit: '°C',
      });
    }

    packs.push({
      id: `P${j}`,
      cells,
      temperaturePoints,
      fields: [], // 初始为空，由外部通过API填充
    });
  }

  return {
    id: 'Cluster1',
    packs,
    highVoltageBox: {
      fields: [], // 初始为空，由外部通过API填充
      breaker: {
        closed: false,
      },
    },
  };
}
