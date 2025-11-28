/**
 * BMS可视化主应用
 * 支持三级架构和二级架构切换
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Level3BMS } from '@/components/bms/Level3BMS';
import { Level2BMS } from '@/components/bms/Level2BMS';
import { useLevel3BMS } from '@/hooks/useBMS';
import { useLevel2BMS } from '@/hooks/useBMS';
import { createLevel3BMSData, createLevel2BMSData } from '@/utils/bmsFactory';
import { BatteryStackData, BatteryClusterDataLevel2 } from '@/types/bms';

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
    // 设置一些示例数据
    data.mainHighVoltageBox = {
      voltage: 720.5,
      current: 150.3,
      power: 108315.15,
      soc: 85.5,
      soh: 95.2,
      breaker: {
        closed: true,
      },
      loadBalancing: {
        enabled: true,
        status: '正常运行',
      },
      protection: {
        shortCircuit: false,
        overload: false,
      },
    };
    
    data.clusters.forEach((cluster, idx) => {
      cluster.highVoltageBox = {
        voltage: 240.2 + idx * 0.1,
        current: 50.1 + idx * 0.05,
        power: 12040.2 + idx * 10,
        soc: 85.0 + idx * 0.5,
        soh: 95.0,
        breaker: {
          closed: true,
        },
      };
      
      cluster.packs.forEach((pack, pIdx) => {
        pack.voltage = 60.05 + pIdx * 0.01;
        pack.current = 12.5 + pIdx * 0.1;
        pack.power = 750.6 + pIdx * 1;
        pack.soc = 85.0 + pIdx * 0.2;
        
        pack.cells.forEach((cell, cIdx) => {
          cell.voltage = 3.7 + (Math.random() - 0.5) * 0.1;
          if (cIdx % 5 === 0) {
            cell.temperature = 25 + Math.random() * 5;
          }
        });
        
        pack.temperaturePoints.forEach((tp, tIdx) => {
          tp.temperature = 25 + Math.random() * 5;
        });
      });
    });
    
    return data;
  });

  // 初始化二级架构数据
  const [level2InitialData] = useState<BatteryClusterDataLevel2>(() => {
    const data = createLevel2BMSData(level2Config);
    // 设置一些示例数据
    data.highVoltageBox = {
      voltage: 360.3,
      current: 100.5,
      power: 36210.15,
      soc: 82.5,
      soh: 94.8,
      breaker: {
        positiveClosed: true,
        negativeClosed: true,
      },
    };
    
    data.packs.forEach((pack, pIdx) => {
      pack.voltage = 60.05 + pIdx * 0.01;
      pack.current = 16.75 + pIdx * 0.1;
      pack.power = 1005.8 + pIdx * 1;
      pack.soc = 82.0 + pIdx * 0.3;
      
      pack.cells.forEach((cell, cIdx) => {
        cell.voltage = 3.7 + (Math.random() - 0.5) * 0.1;
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
        updateData: level3BMS.updateData,
        updateMainHighVoltageBox: level3BMS.updateMainHighVoltageBox,
        updateCluster: level3BMS.updateCluster,
        updateClusterHighVoltageBox: level3BMS.updateClusterHighVoltageBox,
        updatePack: level3BMS.updatePack,
        updateCell: level3BMS.updateCell,
        getData: () => level3BMS.data,
      },
      // 二级架构接口
      level2: {
        updateData: level2BMS.updateData,
        updateHighVoltageBox: level2BMS.updateHighVoltageBox,
        updatePack: level2BMS.updatePack,
        updateCell: level2BMS.updateCell,
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
