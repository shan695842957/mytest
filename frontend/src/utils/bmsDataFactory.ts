/**
 * BMS 数据工厂
 * 生成模拟的 BMS 数据
 */

import type {
  Level3BMSData,
  Level3BMSConfig,
  Level2BMSData,
  Level2BMSConfig,
  DataField,
  BatteryCell,
  TemperaturePoint,
  BatteryPack,
  HighVoltageBox,
  BatteryCluster,
} from '@/types/bms'

/**
 * 创建三级架构 BMS 数据
 */
export function createLevel3BMSData(config: Level3BMSConfig): Level3BMSData {
  const { clusterCount, packCountPerCluster, cellCountPerPack, temperaturePointCountPerPack } = config
  
  // 创建总高压箱
  const mainHighVoltageBox: HighVoltageBox = {
    fields: [],
    breaker: { positiveClosed: true, negativeClosed: true },
    fault: false,
  }
  
  // 创建电池簇
  const clusters: BatteryCluster[] = []
  
  for (let clusterIdx = 0; clusterIdx < clusterCount; clusterIdx++) {
    // 创建簇高压箱
    const clusterHighVoltageBox: HighVoltageBox = {
      fields: [],
      breaker: { positiveClosed: true, negativeClosed: true },
      fault: false,
    }
    
    // 创建电池包
    const packs: BatteryPack[] = []
    
    for (let packIdx = 0; packIdx < packCountPerCluster; packIdx++) {
      // 创建电池单体
      const cells: BatteryCell[] = []
      for (let cellIdx = 0; cellIdx < cellCountPerPack; cellIdx++) {
        const voltage = 3.5 + (Math.random() - 0.5) * 0.3
        const isAbnormal = Math.random() > 0.9
        
        const cellFields: DataField[] = [
          { name: '电压', value: isAbnormal ? (Math.random() > 0.5 ? 2.5 : 4.5) : voltage, unit: 'V' },
        ]
        
        // 70%概率有温度
        if (Math.random() > 0.3) {
          cellFields.push({ name: '温度', value: 25 + Math.random() * 10, unit: '°C' })
        }
        
        // 50%概率有SOC
        if (Math.random() > 0.5) {
          cellFields.push({ name: 'SOC', value: 80 + Math.random() * 20, unit: '%' })
        }
        
        cells.push({
          id: cellIdx + 1,
          fields: cellFields,
        })
      }
      
      // 创建温度测点
      const temperaturePoints: TemperaturePoint[] = []
      for (let tempIdx = 0; tempIdx < temperaturePointCountPerPack; tempIdx++) {
        temperaturePoints.push({
          id: tempIdx + 1,
          temperature: 25 + Math.random() * 10,
        })
      }
      
      // 检查是否有异常单体
      const hasFault = cells.some(cell => {
        const voltageField = cell.fields.find(f => f.name === '电压')
        return voltageField && (voltageField.value < 2.8 || voltageField.value > 4.3)
      })
      
      packs.push({
        id: packIdx + 1,
        name: `电池包${packIdx + 1}`,
        fields: [],
        cells,
        temperaturePoints,
        fault: hasFault,
        faultMessage: hasFault ? '存在电压异常单体' : undefined,
      })
    }
    
    clusters.push({
      id: clusterIdx + 1,
      name: `电池簇${clusterIdx + 1}`,
      highVoltageBox: clusterHighVoltageBox,
      packs,
    })
  }
  
  return {
    mainHighVoltageBox,
    clusters,
  }
}

/**
 * 创建二级架构 BMS 数据
 */
export function createLevel2BMSData(config: Level2BMSConfig): Level2BMSData {
  const { packCount, cellCountPerPack, temperaturePointCountPerPack } = config
  
  // 创建簇高压箱
  const highVoltageBox: HighVoltageBox = {
    fields: [],
    breaker: { positiveClosed: true, negativeClosed: true },
    fault: false,
  }
  
  // 创建电池包
  const packs: BatteryPack[] = []
  
  for (let packIdx = 0; packIdx < packCount; packIdx++) {
    // 创建电池单体
    const cells: BatteryCell[] = []
    for (let cellIdx = 0; cellIdx < cellCountPerPack; cellIdx++) {
      const voltage = 3.5 + (Math.random() - 0.5) * 0.3
      const isAbnormal = Math.random() > 0.9
      
      const cellFields: DataField[] = [
        { name: '电压', value: isAbnormal ? (Math.random() > 0.5 ? 2.5 : 4.5) : voltage, unit: 'V' },
      ]
      
      // 70%概率有温度
      if (Math.random() > 0.3) {
        cellFields.push({ name: '温度', value: 25 + Math.random() * 10, unit: '°C' })
      }
      
      // 50%概率有SOC
      if (Math.random() > 0.5) {
        cellFields.push({ name: 'SOC', value: 80 + Math.random() * 20, unit: '%' })
      }
      
      cells.push({
        id: cellIdx + 1,
        fields: cellFields,
      })
    }
    
    // 创建温度测点
    const temperaturePoints: TemperaturePoint[] = []
    for (let tempIdx = 0; tempIdx < temperaturePointCountPerPack; tempIdx++) {
      temperaturePoints.push({
        id: tempIdx + 1,
        temperature: 25 + Math.random() * 10,
      })
    }
    
    // 检查是否有异常单体
    const hasFault = cells.some(cell => {
      const voltageField = cell.fields.find(f => f.name === '电压')
      return voltageField && (voltageField.value < 2.8 || voltageField.value > 4.3)
    })
    
    packs.push({
      id: packIdx + 1,
      name: `电池包${packIdx + 1}`,
      fields: [],
      cells,
      temperaturePoints,
      fault: hasFault,
      faultMessage: hasFault ? '存在电压异常单体' : undefined,
    })
  }
  
  return {
    highVoltageBox,
    packs,
  }
}
