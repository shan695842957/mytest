/**
 * BMS 三级架构展示页面
 * 电池堆 → 电池簇 → 电池包 → 单体
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Level3BMSVisualization } from '@/components/bms'
import { useLevel3BMS } from '@/hooks/useBMS'
import { createLevel3BMSData } from '@/utils/bmsDataFactory'
import type { Level3BMSConfig, DataField } from '@/types/bms'

// 生成模拟数据
const generateMockData = (config: Level3BMSConfig) => {
  const data = createLevel3BMSData(config)
  
  // 填充总高压箱数据
  data.mainHighVoltageBox.fields = [
    { name: '总电压', value: 720.5, unit: 'V' },
    { name: '总电流', value: 150.3, unit: 'A' },
    { name: '总功率', value: 108375.15, unit: 'W' },
    { name: 'SOC', value: 85.5, unit: '%' },
    { name: 'SOH', value: 92.3, unit: '%' },
  ]
  data.mainHighVoltageBox.breaker = { positiveClosed: true, negativeClosed: true }
  
  // 填充簇和包的数据
  data.clusters.forEach((cluster, clusterIdx) => {
    // 簇高压箱
    cluster.highVoltageBox.fields = [
      { name: '簇电压', value: 360.2 + clusterIdx * 0.5, unit: 'V' },
      { name: '簇电流', value: 75.1 + clusterIdx * 0.2, unit: 'A' },
      { name: '簇功率', value: (360.2 + clusterIdx * 0.5) * (75.1 + clusterIdx * 0.2), unit: 'W' },
      { name: 'SOC', value: 85.0 + clusterIdx * 0.5, unit: '%' },
      { name: 'SOH', value: 92.0 + clusterIdx * 0.3, unit: '%' },
    ]
    cluster.highVoltageBox.breaker = { positiveClosed: true, negativeClosed: true }
    
    // 包数据
    cluster.packs.forEach((pack, packIdx) => {
      const packVoltage = 120.0 + packIdx * 0.1
      pack.fields = [
        { name: '包电压', value: packVoltage, unit: 'V' },
        { name: '包电流', value: 25.0 + packIdx * 0.1, unit: 'A' },
        { name: '包功率', value: packVoltage * (25.0 + packIdx * 0.1), unit: 'W' },
      ]
      
      // 单体数据（已在工厂中生成，这里可以更新）
      pack.cells.forEach((cell, cellIdx) => {
        const voltage = 3.5 + (Math.random() - 0.5) * 0.3
        const isAbnormal = Math.random() > 0.9
        const abnormalVoltage = isAbnormal ? (Math.random() > 0.5 ? 2.5 : 4.5) : voltage
        
        const cellFields: DataField[] = [
          { name: '电压', value: abnormalVoltage, unit: 'V' },
        ]
        
        // 70%概率有温度
        if (Math.random() > 0.3) {
          cellFields.push({ name: '温度', value: 25 + Math.random() * 10, unit: '°C' })
        }
        
        // 50%概率有SOC
        if (Math.random() > 0.5) {
          cellFields.push({ name: 'SOC', value: 80 + Math.random() * 20, unit: '%' })
        }
        
        cell.fields = cellFields
        
        // 设置故障
        if (abnormalVoltage < 2.8 || abnormalVoltage > 4.3) {
          pack.fault = true
          pack.faultMessage = `单体${cellIdx + 1}电压异常: ${abnormalVoltage.toFixed(2)}V`
        }
      })
      
      // 温度测点
      pack.temperaturePoints.forEach((tp) => {
        tp.temperature = 25 + Math.random() * 10
      })
    })
  })
  
  return data
}

export default function BMSLevel3Page() {
  // 三级架构配置
  const [config] = useState<Level3BMSConfig>({
    clusterCount: 2,
    packCountPerCluster: 3,
    cellCountPerPack: 30,
    temperaturePointCountPerPack: 5,
    cellConfiguration: { series: 2, parallel: 15 }, // 2串15并
  })
  
  const [initialData] = useState(() => generateMockData(config))
  const level3BMS = useLevel3BMS(initialData)
  
  // 定时更新数据（模拟实时数据）
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = generateMockData(config)
      level3BMS.updateData(newData)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [config, level3BMS])
  
  // 暴露更新接口到 window（用于外部调用）
  useEffect(() => {
    ;(window as any).BMSLevel3API = {
      updateMainHighVoltageBoxFields: level3BMS.updateMainHighVoltageBoxFields,
      updateMainHighVoltageBoxBreaker: level3BMS.updateMainHighVoltageBoxBreaker,
      updateMainHighVoltageBoxFault: level3BMS.updateMainHighVoltageBoxFault,
      updateClusterHighVoltageBoxFields: level3BMS.updateClusterHighVoltageBoxFields,
      updateClusterHighVoltageBoxBreaker: level3BMS.updateClusterHighVoltageBoxBreaker,
      updatePackFields: level3BMS.updatePackFields,
      updatePackFault: level3BMS.updatePackFault,
      updateCellFields: level3BMS.updateCellFields,
      getData: () => level3BMS.data,
    }
    
    return () => {
      delete (window as any).BMSLevel3API
    }
  }, [level3BMS])
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>BMS 三级架构展示</CardTitle>
          <CardDescription>
            电池堆 → 电池簇 → 电池包 → 单体
            <br />
            外部调用接口：window.BMSLevel3API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Level3BMSVisualization data={level3BMS.data} config={config} />
        </CardContent>
      </Card>
    </div>
  )
}
