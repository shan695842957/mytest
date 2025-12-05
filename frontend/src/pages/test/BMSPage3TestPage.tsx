/**
 * BMS 展示页面（第三版）
 * 使用 bms-page-3 组件
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Level3BMS, Level2BMS } from '@/components/bms-page3/BMSVisualization'
import { useLevel3BMS, useLevel2BMS } from '@/hooks/useBMSPage3'
import { createLevel3BMSData, createLevel2BMSData } from '@/utils/bmsFactory'
import type { DataField } from '@/types/bms-page3'

// 生成模拟数据
const generateMockData = () => {
  // 三级架构配置
  const level3Config = {
    clusterCount: 2,
    packCountPerCluster: 3,
    cellCountPerPack: 30,
    temperaturePointCountPerPack: 5,
    cellConfiguration: { series: 2, parallel: 15 },
  }
  
  const level3Data = createLevel3BMSData(level3Config)
  
  // 填充总高压箱数据
  level3Data.mainHighVoltageBox.fields = [
    { name: '总电压', value: 720.5, unit: 'V' },
    { name: '总电流', value: 150.3, unit: 'A' },
    { name: 'SOC', value: 85.5, unit: '%' },
    { name: 'SOH', value: 92.3, unit: '%' },
  ]
  level3Data.mainHighVoltageBox.breaker = { closed: true }
  
  // 填充簇和包的数据
  level3Data.clusters.forEach((cluster, clusterIdx) => {
    // 簇高压箱
    cluster.highVoltageBox.fields = [
      { name: '簇电压', value: 360.2 + clusterIdx * 0.5, unit: 'V' },
      { name: '簇电流', value: 75.1 + clusterIdx * 0.2, unit: 'A' },
      { name: 'SOC', value: 85.0 + clusterIdx * 0.5, unit: '%' },
    ]
    cluster.highVoltageBox.breaker = { positiveClosed: true, negativeClosed: true }
    
    // 包数据
    cluster.packs.forEach((pack, packIdx) => {
      const packVoltage = 120.0 + packIdx * 0.1
      pack.fields = [
        { name: '包电压', value: packVoltage, unit: 'V' },
        { name: '包电流', value: 25.0 + packIdx * 0.1, unit: 'A' },
        { name: '功率', value: packVoltage * (25.0 + packIdx * 0.1), unit: 'W' },
      ]
      
      // 单体数据
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
  
  // 二级架构配置
  const level2Config = {
    packCount: 5,
    cellCountPerPack: 30,
    temperaturePointCountPerPack: 5,
    cellConfiguration: { series: 2, parallel: 15 },
  }
  
  const level2Data = createLevel2BMSData(level2Config)
  
  // 填充簇高压箱数据
  level2Data.highVoltageBox.fields = [
    { name: '簇电压', value: 600.5, unit: 'V' },
    { name: '簇电流', value: 125.3, unit: 'A' },
    { name: 'SOC', value: 88.5, unit: '%' },
    { name: 'SOH', value: 90.3, unit: '%' },
  ]
  level2Data.highVoltageBox.breaker = { positiveClosed: true, negativeClosed: true }
  
  // 填充包数据
  level2Data.packs.forEach((pack, packIdx) => {
    const packVoltage = 120.0 + packIdx * 0.1
    pack.fields = [
      { name: '包电压', value: packVoltage, unit: 'V' },
      { name: '包电流', value: 25.0 + packIdx * 0.1, unit: 'A' },
    ]
    
    // 单体数据
    pack.cells.forEach((cell, cellIdx) => {
      const voltage = 3.5 + (Math.random() - 0.5) * 0.3
      const isAbnormal = Math.random() > 0.9
      const abnormalVoltage = isAbnormal ? (Math.random() > 0.5 ? 2.5 : 4.5) : voltage
      
      const cellFields: DataField[] = [
        { name: '电压', value: abnormalVoltage, unit: 'V' },
      ]
      
      if (Math.random() > 0.3) {
        cellFields.push({ name: '温度', value: 25 + Math.random() * 10, unit: '°C' })
      }
      
      cell.fields = cellFields
      
      if (abnormalVoltage < 2.8 || abnormalVoltage > 4.3) {
        pack.fault = true
        pack.faultMessage = `单体${cellIdx + 1}电压异常: ${abnormalVoltage.toFixed(2)}V`
      }
    })
    
    pack.temperaturePoints.forEach((tp) => {
      tp.temperature = 25 + Math.random() * 10
    })
  })
  
  return { level3Data, level3Config, level2Data, level2Config }
}

export default function BMSPage3TestPage() {
  const { level3Data, level3Config, level2Data, level2Config } = generateMockData()
  
  const level3BMS = useLevel3BMS(level3Data)
  const level2BMS = useLevel2BMS(level2Data)
  
  // 定时更新数据
  useEffect(() => {
    const interval = setInterval(() => {
      const { level3Data: newLevel3Data, level2Data: newLevel2Data } = generateMockData()
      level3BMS.updateData(newLevel3Data)
      level2BMS.updateData(newLevel2Data)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [level3BMS, level2BMS])
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>BMS 展示（第三版）</CardTitle>
          <CardDescription>使用 bms-page-3 组件展示 BMS 数据</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="level3" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="level3">三级架构</TabsTrigger>
              <TabsTrigger value="level2">二级架构</TabsTrigger>
            </TabsList>
            <TabsContent value="level3" className="mt-4">
              <Level3BMS data={level3BMS.data} config={level3Config} />
            </TabsContent>
            <TabsContent value="level2" className="mt-4">
              <Level2BMS data={level2BMS.data} config={level2Config} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

