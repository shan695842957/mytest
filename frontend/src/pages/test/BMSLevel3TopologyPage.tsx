/**
 * 三级架构 BMS 展示页面（使用BmsTopology组件）
 * 堆 -> 簇 -> 包 -> 单体
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  BmsThreeLevelTopology, 
  type BatteryStackNode, 
  type BatteryPackNode,
  type BatteryCellNode,
  type NodeStatus 
} from '@/components/bms'

// 生成模拟数据
const generateThreeLevelData = (): BatteryStackNode[] => {
  const stacks: BatteryStackNode[] = []
  
  // 生成2个堆
  for (let stackId = 1; stackId <= 2; stackId++) {
    const clusters: BatteryStackNode['clusters'] = []
    let stackTotalVoltage = 0
    let stackTotalCurrent = 0
    let hasFault = false
    let hasWarning = false
    
    // 每个堆有3个簇
    for (let clusterId = 1; clusterId <= 3; clusterId++) {
      const packs: BatteryPackNode[] = []
      let clusterTotalVoltage = 0
      let clusterMinVoltage = Infinity
      let clusterMaxVoltage = -Infinity
      let clusterHasFault = false
      let clusterHasWarning = false
      
      // 每个簇有5个包
      for (let packId = 1; packId <= 5; packId++) {
        const cells: BatteryCellNode[] = []
        const tempSensors: { label?: string; value?: number | string; unit?: string }[] = []
        
        let packTotalVoltage = 0
        let packMinVoltage = Infinity
        let packMaxVoltage = -Infinity
        let packHasFault = false
        let packHasWarning = false
        
        // 每个包有55个单体
        const hasCellTemperature = Math.random() > 0.3 // 70%概率有单体温度
        const hasCellSOC = Math.random() > 0.5 // 50%概率有单体SOC
        const hasCellSOH = Math.random() > 0.7 // 30%概率有单体SOH
        
        for (let cellId = 1; cellId <= 55; cellId++) {
          const voltage = 3.5 + (Math.random() - 0.5) * 0.5
          const isAbnormal = Math.random() > 0.92
          const abnormalVoltage = isAbnormal ? (Math.random() > 0.5 ? 2.5 : 4.5) : voltage
          
          let status: NodeStatus = 'normal'
          if (abnormalVoltage < 2.8 || abnormalVoltage > 4.3) {
            status = 'fault'
            packHasFault = true
            clusterHasFault = true
            hasFault = true
          } else if (abnormalVoltage < 3.0 || abnormalVoltage > 4.1) {
            status = 'warning'
            packHasWarning = true
            clusterHasWarning = true
            hasWarning = true
          }
          
          const cellMetrics: { label?: string; value?: number | string; unit?: string }[] = [
            { label: '电压', value: abnormalVoltage, unit: 'V' },
          ]
          
          if (hasCellTemperature) {
            const temp = 25 + Math.random() * 10
            cellMetrics.push({ label: '温度', value: temp.toFixed(1), unit: '°C' })
          }
          
          if (hasCellSOC) {
            const soc = 80 + Math.random() * 20
            cellMetrics.push({ label: 'SOC', value: soc.toFixed(1), unit: '%' })
          }
          
          if (hasCellSOH) {
            const soh = 90 + Math.random() * 10
            cellMetrics.push({ label: 'SOH', value: soh.toFixed(1), unit: '%' })
          }
          
          // 假设55个单体是单串，如果有并联则按 parallelIndex 分组
          const parallelIndex = 0 // 单串情况，所有单体在同一列
          cells.push({
            id: `stack-${stackId}-cluster-${clusterId}-pack-${packId}-cell-${cellId}`,
            name: `C${cellId}`,
            status,
            voltage: abnormalVoltage,
            voltageRange: { min: 3.0, max: 4.2 },
            metrics: cellMetrics,
            seriesIndex: cellId - 1,
            parallelIndex,
          })
          
          packTotalVoltage += abnormalVoltage
          packMinVoltage = Math.min(packMinVoltage, abnormalVoltage)
          packMaxVoltage = Math.max(packMaxVoltage, abnormalVoltage)
        }
        
        // 每个包有18个温度测点
        for (let tempId = 1; tempId <= 18; tempId++) {
          const temp = 25 + Math.random() * 10
          tempSensors.push({
            label: `T${tempId}`,
            value: temp.toFixed(1),
            unit: '°C',
          })
        }
        
        const packStatus: NodeStatus = packHasFault ? 'fault' : packHasWarning ? 'warning' : 'normal'
        
        // 包的故障事件（如果有故障）
        const packFaultEvents = packHasFault
          ? [
              { label: '电压异常', status: 'fault' as NodeStatus, value: '单体电压超出范围' },
            ]
          : undefined
        
        packs.push({
          id: `stack-${stackId}-cluster-${clusterId}-pack-${packId}`,
          name: `${stackId}号堆-${clusterId}号簇-${packId}号包`,
          subtitle: `Pack ${packId}`,
          status: packStatus,
          topology: {
            series: 55,
            parallel: 1, // 单串
            hint: '55串',
          },
          temperatureSensors: tempSensors,
          cells,
          metrics: [
            { label: '总电压', value: packTotalVoltage.toFixed(1), unit: 'V' },
            { label: '平均电压', value: (packTotalVoltage / 55).toFixed(3), unit: 'V' },
            { label: '最小电压', value: packMinVoltage.toFixed(2), unit: 'V' },
            { label: '最大电压', value: packMaxVoltage.toFixed(2), unit: 'V' },
          ],
          detailMetrics: [
            { label: '总电压', value: packTotalVoltage.toFixed(1), unit: 'V' },
            { label: '平均电压', value: (packTotalVoltage / 55).toFixed(3), unit: 'V' },
          ],
          faultEvents: packFaultEvents,
        })
        
        clusterTotalVoltage += packTotalVoltage
        clusterMinVoltage = Math.min(clusterMinVoltage, packMinVoltage)
        clusterMaxVoltage = Math.max(clusterMaxVoltage, packMaxVoltage)
      }
      
      const clusterStatus: NodeStatus = clusterHasFault ? 'fault' : clusterHasWarning ? 'warning' : 'normal'
      const clusterSOC = 80 + Math.random() * 20
      const clusterSOH = 90 + Math.random() * 10
      
      // 簇高压箱接触器
      const hasSeparateContactors = Math.random() > 0.5
      const clusterIndicators = hasSeparateContactors
        ? [
            { label: '正极接触器', status: (Math.random() > 0.05 ? 'normal' : 'fault') as NodeStatus, value: '合闸' },
            { label: '负极接触器', status: (Math.random() > 0.05 ? 'normal' : 'fault') as NodeStatus, value: '合闸' },
          ]
        : [
            { label: '接触器', status: (Math.random() > 0.05 ? 'normal' : 'fault') as NodeStatus, value: '合闸' },
          ]
      
      // 簇的故障事件
      const clusterFaultEvents = clusterHasFault
        ? [
            { label: '系统故障', status: 'fault' as NodeStatus, value: '检测到异常' },
          ]
        : undefined
      
      clusters.push({
        id: `stack-${stackId}-cluster-${clusterId}`,
        name: `${stackId}号堆-${clusterId}号簇`,
        subtitle: `Cluster ${clusterId}`,
        status: clusterStatus,
        topology: {
          parallel: 5,
          hint: '5并',
        },
        hvBox: {
          title: '簇高压箱',
          summary: 'HV Box',
          indicators: clusterIndicators,
          metrics: [
            { label: '总电压', value: clusterTotalVoltage.toFixed(1), unit: 'V' },
            { label: 'SOC', value: clusterSOC.toFixed(1), unit: '%' },
            { label: 'SOH', value: clusterSOH.toFixed(1), unit: '%' },
          ],
        },
        packs,
        metrics: [
          { label: '总电压', value: clusterTotalVoltage.toFixed(1), unit: 'V' },
          { label: 'SOC', value: clusterSOC.toFixed(1), unit: '%' },
          { label: 'SOH', value: clusterSOH.toFixed(1), unit: '%' },
          { label: '最小电压', value: clusterMinVoltage.toFixed(2), unit: 'V' },
          { label: '最大电压', value: clusterMaxVoltage.toFixed(2), unit: 'V' },
        ],
        detailMetrics: [
          { label: '总电压', value: clusterTotalVoltage.toFixed(1), unit: 'V' },
          { label: 'SOC', value: clusterSOC.toFixed(1), unit: '%' },
          { label: 'SOH', value: clusterSOH.toFixed(1), unit: '%' },
        ],
        faultEvents: clusterFaultEvents,
      })
      
      stackTotalVoltage += clusterTotalVoltage
    }
    
    stackTotalCurrent = 200 + Math.random() * 100
    const stackStatus: NodeStatus = hasFault ? 'fault' : hasWarning ? 'warning' : 'normal'
    const stackSOC = 80 + Math.random() * 20
    const stackSOH = 90 + Math.random() * 10
    
    // 堆高压箱接触器
    const hasSeparateContactors = Math.random() > 0.5
    const stackIndicators = hasSeparateContactors
      ? [
          { label: '正极接触器', status: (Math.random() > 0.02 ? 'normal' : 'fault') as NodeStatus, value: '合闸' },
          { label: '负极接触器', status: (Math.random() > 0.02 ? 'normal' : 'fault') as NodeStatus, value: '合闸' },
        ]
      : [
          { label: '接触器', status: (Math.random() > 0.02 ? 'normal' : 'fault') as NodeStatus, value: '合闸' },
        ]
    
    stacks.push({
      id: `stack-${stackId}`,
      name: `${stackId}号电池堆`,
      subtitle: `Stack ${stackId}`,
      status: stackStatus,
      topology: {
        parallel: 3,
        hint: '3并',
      },
      hvBox: {
        title: '堆高压箱',
        summary: 'Stack HV Box',
        indicators: stackIndicators,
        metrics: [
          { label: '总电压', value: stackTotalVoltage.toFixed(1), unit: 'V' },
          { label: '总电流', value: stackTotalCurrent.toFixed(1), unit: 'A' },
          { label: 'SOC', value: stackSOC.toFixed(1), unit: '%' },
          { label: 'SOH', value: stackSOH.toFixed(1), unit: '%' },
        ],
      },
      clusters,
      metrics: [
        { label: '总电压', value: stackTotalVoltage.toFixed(1), unit: 'V' },
        { label: '总电流', value: stackTotalCurrent.toFixed(1), unit: 'A' },
        { label: 'SOC', value: stackSOC.toFixed(1), unit: '%' },
        { label: 'SOH', value: stackSOH.toFixed(1), unit: '%' },
      ],
    })
  }
  
  return stacks
}

export default function BMSLevel3TopologyPage() {
  const [stacks, setStacks] = useState<BatteryStackNode[]>(() => generateThreeLevelData())
  
  // 定时更新数据
  useEffect(() => {
    const interval = setInterval(() => {
      setStacks(generateThreeLevelData())
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>三级架构 BMS 展示（新组件）</CardTitle>
          <CardDescription>使用 BmsTopology 组件展示堆 → 簇 → 包 → 单体架构</CardDescription>
        </CardHeader>
        <CardContent>
          <BmsThreeLevelTopology
            title="三级 BMS 拓扑"
            stacks={stacks}
            variant="light"
            defaultExpandedIds={['stack-1']}
          />
        </CardContent>
      </Card>
    </div>
  )
}

