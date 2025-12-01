/**
 * BMS 二级架构展示页面
 * 电池簇 → 电池包 → 单体
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Level2BMSVisualization, Level2Topology } from '@/components/bms'
import { useLevel2BMS } from '@/hooks/useBMS'
import { createLevel2BMSData } from '@/utils/bmsDataFactory'
import type { Level2BMSConfig, DataField } from '@/types/bms'

// 生成模拟数据
const generateMockData = (config: Level2BMSConfig) => {
  const data = createLevel2BMSData(config)
  
  // 填充簇高压箱数据
  data.highVoltageBox.fields = [
    { name: '簇电压', value: 600.5, unit: 'V' },
    { name: '簇电流', value: 125.3, unit: 'A' },
    { name: '簇功率', value: 75242.65, unit: 'W' },
    { name: 'SOC', value: 88.5, unit: '%' },
    { name: 'SOH', value: 90.3, unit: '%' },
  ]
  data.highVoltageBox.breaker = { positiveClosed: true, negativeClosed: true }
  
  // 填充包数据
  data.packs.forEach((pack, packIdx) => {
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
  
  return data
}

export default function BMSLevel2Page() {
  // 二级架构配置
  const [config] = useState<Level2BMSConfig>({
    packCount: 5,
    cellCountPerPack: 30,
    temperaturePointCountPerPack: 5,
    cellConfiguration: { series: 2, parallel: 15 },
  })
  
  const [initialData] = useState(() => generateMockData(config))
  const level2BMS = useLevel2BMS(initialData)
  
  // 定时更新数据（模拟实时数据）
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = generateMockData(config)
      level2BMS.updateData(newData)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [config, level2BMS])
  
  // 暴露更新接口到 window（用于外部调用）
  useEffect(() => {
    ;(window as any).BMSLevel2API = {
      updateHighVoltageBoxFields: level2BMS.updateHighVoltageBoxFields,
      updateHighVoltageBoxBreaker: level2BMS.updateHighVoltageBoxBreaker,
      updateHighVoltageBoxFault: level2BMS.updateHighVoltageBoxFault,
      updatePackFields: level2BMS.updatePackFields,
      updatePackFault: level2BMS.updatePackFault,
      updateCellFields: level2BMS.updateCellFields,
      getData: () => level2BMS.data,
    }
    
    return () => {
      delete (window as any).BMSLevel2API
    }
  }, [level2BMS])
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>BMS 二级架构展示</CardTitle>
          <CardDescription>
            电池簇 → 电池包 → 单体
            <br />
            外部调用接口：window.BMSLevel2API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="topology" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="topology">拓扑图</TabsTrigger>
              <TabsTrigger value="details">详细数据</TabsTrigger>
            </TabsList>
            <TabsContent value="topology" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">二级架构拓扑图</CardTitle>
                  <CardDescription>
                    展示电池簇 → 电池包（串联）→ 单体（串并联）的层级关系
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Level2Topology data={level2BMS.data} config={config} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="details" className="mt-4">
              <Level2BMSVisualization data={level2BMS.data} config={config} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
