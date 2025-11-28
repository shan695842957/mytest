/**
 * BMS API 使用示例
 * 这些示例展示了如何通过接口更新BMS数据
 */

// ========== 三级架构示例 ==========

/**
 * 示例1：更新总高压箱的电压和电流
 */
export function updateMainVoltageAndCurrent() {
  if (typeof window !== 'undefined' && (window as any).BMSAPI) {
    (window as any).BMSAPI.level3.updateMainHighVoltageBox({
      voltage: 720.5,
      current: 150.3,
      power: 108315.15,
    });
  }
}

/**
 * 示例2：更新总高压箱的断路器状态（单个标志位）
 */
export function updateMainBreakerSingle() {
  if (typeof window !== 'undefined' && (window as any).BMSAPI) {
    (window as any).BMSAPI.level3.updateMainHighVoltageBox({
      breaker: {
        closed: true, // 合闸
      },
    });
  }
}

/**
 * 示例3：更新总高压箱的断路器状态（正负极分别控制）
 */
export function updateMainBreakerSeparate() {
  if (typeof window !== 'undefined' && (window as any).BMSAPI) {
    (window as any).BMSAPI.level3.updateMainHighVoltageBox({
      breaker: {
        positiveClosed: true, // 正极合闸
        negativeClosed: true, // 负极合闸
      },
    });
  }
}

/**
 * 示例4：更新指定簇的高压箱数据
 */
export function updateClusterHVBox() {
  if (typeof window !== 'undefined' && (window as any).BMSAPI) {
    (window as any).BMSAPI.level3.updateClusterHighVoltageBox('Cluster1', {
      voltage: 240.2,
      current: 50.1,
      power: 12040.2,
      soc: 85.0,
      breaker: {
        closed: true,
      },
    });
  }
}

/**
 * 示例5：更新指定包的数据
 */
export function updatePack() {
  if (typeof window !== 'undefined' && (window as any).BMSAPI) {
    (window as any).BMSAPI.level3.updatePack('Cluster1', 'C1-P1', {
      voltage: 60.05,
      current: 12.5,
      power: 750.6,
      soc: 85.0,
      fault: false,
    });
  }
}

/**
 * 示例6：更新指定单体的数据（完整数据）
 */
export function updateCellFull() {
  if (typeof window !== 'undefined' && (window as any).BMSAPI) {
    (window as any).BMSAPI.level3.updateCell('Cluster1', 'C1-P1', 'C1-P1-Cell1', {
      voltage: 3.7,
      temperature: 25.5,
      soc: 85.0,
      soh: 95.0,
    });
  }
}

/**
 * 示例7：更新指定单体的数据（仅电压，某些供应商）
 */
export function updateCellVoltageOnly() {
  if (typeof window !== 'undefined' && (window as any).BMSAPI) {
    (window as any).BMSAPI.level3.updateCell('Cluster1', 'C1-P1', 'C1-P1-Cell1', {
      voltage: 3.7, // 只有电压数据
    });
  }
}

/**
 * 示例8：模拟故障状态
 */
export function simulateFault() {
  if (typeof window !== 'undefined' && (window as any).BMSAPI) {
    // 设置包故障
    (window as any).BMSAPI.level3.updatePack('Cluster1', 'C1-P1', {
      fault: true,
      faultMessage: '过压保护触发，电压超过安全范围',
    });
    
    // 设置簇高压箱故障
    (window as any).BMSAPI.level3.updateClusterHighVoltageBox('Cluster1', {
      fault: true,
      faultMessage: '通信异常，无法获取数据',
    });
  }
}

/**
 * 示例9：清除故障状态
 */
export function clearFault() {
  if (typeof window !== 'undefined' && (window as any).BMSAPI) {
    (window as any).BMSAPI.level3.updatePack('Cluster1', 'C1-P1', {
      fault: false,
      faultMessage: '',
    });
    
    (window as any).BMSAPI.level3.updateClusterHighVoltageBox('Cluster1', {
      fault: false,
      faultMessage: '',
    });
  }
}

// ========== 二级架构示例 ==========

/**
 * 示例10：更新二级架构簇高压箱数据
 */
export function updateLevel2HVBox() {
  if (typeof window !== 'undefined' && (window as any).BMSAPI) {
    (window as any).BMSAPI.level2.updateHighVoltageBox({
      voltage: 360.3,
      current: 100.5,
      power: 36210.15,
      soc: 82.5,
      breaker: {
        positiveClosed: true,
        negativeClosed: true,
      },
    });
  }
}

/**
 * 示例11：更新二级架构包数据
 */
export function updateLevel2Pack() {
  if (typeof window !== 'undefined' && (window as any).BMSAPI) {
    (window as any).BMSAPI.level2.updatePack('P1', {
      voltage: 60.05,
      current: 16.75,
      power: 1005.8,
      soc: 82.0,
    });
  }
}

/**
 * 示例12：更新二级架构单体数据
 */
export function updateLevel2Cell() {
  if (typeof window !== 'undefined' && (window as any).BMSAPI) {
    (window as any).BMSAPI.level2.updateCell('P1', 'P1-Cell1', {
      voltage: 3.7,
    });
  }
}

// ========== 实时数据更新示例 ==========

/**
 * 示例13：定时更新总电压（模拟实时数据）
 */
export function startRealTimeVoltageUpdate() {
  if (typeof window !== 'undefined' && (window as any).BMSAPI) {
    const interval = setInterval(() => {
      const baseVoltage = 720.5;
      const variation = (Math.random() - 0.5) * 10; // ±5V 变化
      const newVoltage = baseVoltage + variation;
      
      (window as any).BMSAPI.level3.updateMainHighVoltageBox({
        voltage: newVoltage,
      });
    }, 1000); // 每秒更新一次
    
    // 返回清除函数
    return () => clearInterval(interval);
  }
}

/**
 * 示例14：批量更新所有单体的电压
 */
export function batchUpdateAllCells() {
  if (typeof window !== 'undefined' && (window as any).BMSAPI) {
    const data = (window as any).BMSAPI.level3.getData();
    
    data.clusters.forEach((cluster: any) => {
      cluster.packs.forEach((pack: any) => {
        pack.cells.forEach((cell: any) => {
          const newVoltage = 3.7 + (Math.random() - 0.5) * 0.1;
          (window as any).BMSAPI.level3.updateCell(
            cluster.id,
            pack.id,
            cell.id,
            { voltage: newVoltage }
          );
        });
      });
    });
  }
}

/**
 * 示例15：获取当前数据并打印
 */
export function printCurrentData() {
  if (typeof window !== 'undefined' && (window as any).BMSAPI) {
    const level3Data = (window as any).BMSAPI.level3.getData();
    const level2Data = (window as any).BMSAPI.level2.getData();
    
    console.log('三级架构数据:', level3Data);
    console.log('二级架构数据:', level2Data);
  }
}
