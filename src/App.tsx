/**
 * BMS可视化主应用
 * 支持三级架构和二级架构切换
 * 使用动态字段数组格式，支持不同供应商和不同语言的字段名
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Level3BMS, Level2BMS } from '@/components/bms/BMSVisualization';
import { useLevel3BMS } from '@/hooks/useBMS';
import { useLevel2BMS } from '@/hooks/useBMS';
import { createLevel3BMSData, createLevel2BMSData } from '@/utils/bmsFactory';
import { BatteryStackData, BatteryClusterDataLevel2, DataField } from '@/types/bms';

/**
 * 示例：三级架构配置
 */
const level3Config = {
  clusterCount: 3,
  packCountPerCluster: 4,
  cellCountPerPack: 30,
  temperaturePointCountPerPack: 5,
  cellConfiguration: {
    series: 2,
    parallel: 15,
  },
};

/**
 * 示例：二级架构配置
 */
const level2Config = {
  packCount: 6,
  cellCountPerPack: 30,
  temperaturePointCountPerPack: 5,
  cellConfiguration: {
    series: 2,
    parallel: 15,
  },
};

function App() {
  // 初始化三级架构数据
  const [level3InitialData] = useState<BatteryStackData>(() => {
    const data = createLevel3BMSData(level3Config);
    
    // 设置总高压箱的字段数组（示例：中文字段名）
    data.mainHighVoltageBox.fields = [
      { name: '总电压', value: 720.5, unit: 'V' },
      { name: '总电流', value: 150.3, unit: 'A' },
      { name: '总功率', value: 108315.15, unit: 'W' },
      { name: 'SOC', value: 85.5, unit: '%' },
      { name: 'SOH', value: 95.2, unit: '%' },
    ];
    data.mainHighVoltageBox.breaker = { closed: true };
    
    // 设置簇高压箱和包的字段数组
    data.clusters.forEach((cluster, idx) => {
      cluster.highVoltageBox.fields = [
        { name: '簇电压', value: 240.2 + idx * 0.1, unit: 'V' },
        { name: '簇电流', value: 50.1 + idx * 0.05, unit: 'A' },
        { name: '簇功率', value: 12040.2 + idx * 10, unit: 'W' },
        { name: 'SOC', value: 85.0 + idx * 0.5, unit: '%' },
        { name: 'SOH', value: 95.0, unit: '%' },
      ];
      cluster.highVoltageBox.breaker = { closed: true };
      
      cluster.packs.forEach((pack, pIdx) => {
        pack.fields = [
          { name: '包电压', value: 60.05 + pIdx * 0.01, unit: 'V' },
          { name: '包电流', value: 12.5 + pIdx * 0.1, unit: 'A' },
          { name: '包功率', value: 750.6 + pIdx * 1, unit: 'W' },
          { name: 'SOC', value: 85.0 + pIdx * 0.2, unit: '%' },
        ];
        
        // 设置单体的字段数组（某些供应商只提供电压）
        pack.cells.forEach((cell, cIdx) => {
          cell.fields = [
            { name: '电压', value: 3.7 + (Math.random() - 0.5) * 0.1, unit: 'V' },
            // 某些供应商可能还提供温度和SOC
            ...(cIdx % 5 === 0 ? [
              { name: '温度', value: 25 + Math.random() * 5, unit: '°C' },
              { name: 'SOC', value: 85.0, unit: '%' },
            ] : []),
          ];
        });
        
        pack.temperaturePoints.forEach((tp) => {
          tp.temperature = 25 + Math.random() * 5;
        });
      });
    });
    
    return data;
  });

  // 初始化二级架构数据
  const [level2InitialData] = useState<BatteryClusterDataLevel2>(() => {
    const data = createLevel2BMSData(level2Config);
    
    // 设置簇高压箱的字段数组（示例：英文字段名）
    data.highVoltageBox.fields = [
      { name: 'Grid Voltage', value: 360.3, unit: 'V' },
      { name: 'Current', value: 100.5, unit: 'A' },
      { name: 'Power', value: 36210.15, unit: 'W' },
      { name: 'SOC', value: 82.5, unit: '%' },
      { name: 'SOH', value: 94.8, unit: '%' },
    ];
    data.highVoltageBox.breaker = {
      positiveClosed: true,
      negativeClosed: true,
    };
    
    data.packs.forEach((pack, pIdx) => {
      pack.fields = [
        { name: 'Pack Voltage', value: 60.05 + pIdx * 0.01, unit: 'V' },
        { name: 'Pack Current', value: 16.75 + pIdx * 0.1, unit: 'A' },
        { name: 'Pack Power', value: 1005.8 + pIdx * 1, unit: 'W' },
        { name: 'SOC', value: 82.0 + pIdx * 0.3, unit: '%' },
      ];
      
      pack.cells.forEach((cell) => {
        cell.fields = [
          { name: 'Voltage', value: 3.7 + (Math.random() - 0.5) * 0.1, unit: 'V' },
        ];
      });
      
      pack.temperaturePoints.forEach((tp) => {
        tp.temperature = 25 + Math.random() * 5;
      });
    });
    
    return data;
  });

  const level3BMS = useLevel3BMS(level3InitialData);
  const level2BMS = useLevel2BMS(level2InitialData);

  // 将更新函数暴露到window对象，方便外部调用
  React.useEffect(() => {
    (window as any).BMSAPI = {
      // 三级架构接口
      level3: {
        // 更新整个数据
        updateData: level3BMS.updateData,
        // 更新总高压箱字段数组
        updateMainHighVoltageBoxFields: level3BMS.updateMainHighVoltageBoxFields,
        // 更新总高压箱断路器
        updateMainHighVoltageBoxBreaker: level3BMS.updateMainHighVoltageBoxBreaker,
        // 更新总高压箱故障
        updateMainHighVoltageBoxFault: level3BMS.updateMainHighVoltageBoxFault,
        // 更新簇高压箱字段数组
        updateClusterHighVoltageBoxFields: level3BMS.updateClusterHighVoltageBoxFields,
        // 更新簇高压箱断路器
        updateClusterHighVoltageBoxBreaker: level3BMS.updateClusterHighVoltageBoxBreaker,
        // 更新簇高压箱故障
        updateClusterHighVoltageBoxFault: level3BMS.updateClusterHighVoltageBoxFault,
        // 更新包的字段数组
        updatePackFields: level3BMS.updatePackFields,
        // 更新包的故障
        updatePackFault: level3BMS.updatePackFault,
        // 更新单体的字段数组
        updateCellFields: level3BMS.updateCellFields,
        // 获取当前数据
        getData: () => level3BMS.data,
      },
      // 二级架构接口
      level2: {
        // 更新整个数据
        updateData: level2BMS.updateData,
        // 更新簇高压箱字段数组
        updateHighVoltageBoxFields: level2BMS.updateHighVoltageBoxFields,
        // 更新簇高压箱断路器
        updateHighVoltageBoxBreaker: level2BMS.updateHighVoltageBoxBreaker,
        // 更新簇高压箱故障
        updateHighVoltageBoxFault: level2BMS.updateHighVoltageBoxFault,
        // 更新包的字段数组
        updatePackFields: level2BMS.updatePackFields,
        // 更新包的故障
        updatePackFault: level2BMS.updatePackFault,
        // 更新单体的字段数组
        updateCellFields: level2BMS.updateCellFields,
        // 获取当前数据
        getData: () => level2BMS.data,
      },
    };
  }, [level3BMS, level2BMS]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-gray-900">BMS 储能系统可视化</h1>
          <p className="text-sm text-gray-600 mt-1">
            支持三级架构（电池堆→簇→包→单体）和二级架构（簇→包→单体）
            <br />
            支持动态字段数组，可自定义字段名（支持多语言）和单位
          </p>
        </div>
      </div>

      <Tabs defaultValue="level3" className="w-full">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-6">
            <TabsList>
              <TabsTrigger value="level3">三级架构</TabsTrigger>
              <TabsTrigger value="level2">二级架构</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="level3" className="mt-0">
          <Level3BMS data={level3BMS.data} config={level3Config} />
        </TabsContent>

        <TabsContent value="level2" className="mt-0">
          <Level2BMS data={level2BMS.data} config={level2Config} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
