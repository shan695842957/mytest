/**
 * BMS数据工厂函数
 * 用于根据配置创建初始BMS数据结构
 * 使用动态字段数组格式
 */

import {
  BatteryStackData,
  BatteryClusterDataLevel2,
  BMSConfig,
  CellData,
  TemperaturePoint,
  BatteryPackData,
  BatteryClusterData,
} from '@/types/bms';

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
