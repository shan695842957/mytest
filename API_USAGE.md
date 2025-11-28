# BMS API 使用说明

本文档详细说明如何通过 JavaScript 接口调用 BMS 可视化系统的数据更新功能。

## 接口访问

所有接口都暴露在 `window.BMSAPI` 对象上，可以直接在浏览器控制台或外部脚本中调用。

## 三级架构接口

### 1. 更新整个电池堆数据

```javascript
// 完全替换整个电池堆数据
const newData = {
  id: 'Stack1',
  clusters: [...], // 完整的簇数据数组
  mainHighVoltageBox: {
    voltage: 720.5,
    current: 150.3,
    power: 108315.15,
    soc: 85.5,
    soh: 95.2,
    breaker: {
      closed: true, // 或使用 positiveClosed/negativeClosed
    },
    loadBalancing: {
      enabled: true,
      status: '正常运行',
    },
    protection: {
      shortCircuit: false,
      overload: false,
    },
  },
};

window.BMSAPI.level3.updateData(newData);
```

### 2. 更新总高压箱数据

```javascript
// 更新总高压箱的部分数据
window.BMSAPI.level3.updateMainHighVoltageBox({
  voltage: 720.5,
  current: 150.3,
  power: 108315.15,
  soc: 85.5,
  soh: 95.2,
  breaker: {
    closed: true, // 单个合闸标志位
    // 或
    // positiveClosed: true,
    // negativeClosed: true,
  },
  loadBalancing: {
    enabled: true,
    status: '正常运行',
  },
  protection: {
    shortCircuit: false,
    overload: false,
  },
  fault: false,
  faultMessage: '',
});
```

### 3. 更新指定簇的数据

```javascript
// 更新簇 Cluster1 的数据
window.BMSAPI.level3.updateCluster('Cluster1', {
  // 可以更新簇的任何属性
  highVoltageBox: {
    voltage: 240.2,
    current: 50.1,
    power: 12040.2,
    soc: 85.0,
    breaker: {
      closed: true,
    },
  },
});
```

### 4. 更新指定簇的高压箱数据

```javascript
// 更新簇 Cluster1 的高压箱数据
window.BMSAPI.level3.updateClusterHighVoltageBox('Cluster1', {
  voltage: 240.2,
  current: 50.1,
  power: 12040.2,
  soc: 85.0,
  soh: 95.0,
  breaker: {
    closed: true,
  },
  fault: false,
  faultMessage: '',
});
```

### 5. 更新指定包的数据

```javascript
// 更新簇 Cluster1 下包 C1-P1 的数据
window.BMSAPI.level3.updatePack('Cluster1', 'C1-P1', {
  voltage: 60.05,
  current: 12.5,
  power: 750.6,
  soc: 85.0,
  soh: 95.0,
  fault: false,
  faultMessage: '',
  // 注意：不能直接更新 cells 和 temperaturePoints，需要使用 updateCell
});
```

### 6. 更新指定单体的数据

```javascript
// 更新簇 Cluster1、包 C1-P1 下单体 C1-P1-Cell1 的数据
window.BMSAPI.level3.updateCell('Cluster1', 'C1-P1', 'C1-P1-Cell1', {
  voltage: 3.7,
  temperature: 25.5, // 某些供应商可能没有
  soc: 85.0, // 某些供应商可能没有
  soh: 95.0, // 某些供应商可能没有
});
```

### 7. 获取当前数据

```javascript
// 获取当前三级架构的完整数据
const currentData = window.BMSAPI.level3.getData();
console.log(currentData);
```

## 二级架构接口

### 1. 更新整个电池簇数据

```javascript
// 完全替换整个电池簇数据
const newData = {
  id: 'Cluster1',
  packs: [...], // 完整的包数据数组
  highVoltageBox: {
    voltage: 360.3,
    current: 100.5,
    power: 36210.15,
    soc: 82.5,
    soh: 94.8,
    breaker: {
      positiveClosed: true,
      negativeClosed: true,
    },
  },
};

window.BMSAPI.level2.updateData(newData);
```

### 2. 更新簇高压箱数据

```javascript
// 更新簇高压箱的数据
window.BMSAPI.level2.updateHighVoltageBox({
  voltage: 360.3,
  current: 100.5,
  power: 36210.15,
  soc: 82.5,
  soh: 94.8,
  breaker: {
    positiveClosed: true,
    negativeClosed: true,
    // 或使用单个标志位
    // closed: true,
  },
  fault: false,
  faultMessage: '',
});
```

### 3. 更新指定包的数据

```javascript
// 更新包 P1 的数据
window.BMSAPI.level2.updatePack('P1', {
  voltage: 60.05,
  current: 16.75,
  power: 1005.8,
  soc: 82.0,
  soh: 94.0,
  fault: false,
  faultMessage: '',
});
```

### 4. 更新指定单体的数据

```javascript
// 更新包 P1 下单体 P1-Cell1 的数据
window.BMSAPI.level2.updateCell('P1', 'P1-Cell1', {
  voltage: 3.7,
  temperature: 25.5, // 某些供应商可能没有
  soc: 85.0, // 某些供应商可能没有
  soh: 95.0, // 某些供应商可能没有
});
```

### 5. 获取当前数据

```javascript
// 获取当前二级架构的完整数据
const currentData = window.BMSAPI.level2.getData();
console.log(currentData);
```

## 实时数据更新示例

### 示例1：定时更新电压数据

```javascript
// 每5秒更新一次总电压
setInterval(() => {
  const newVoltage = 720.5 + (Math.random() - 0.5) * 10;
  window.BMSAPI.level3.updateMainHighVoltageBox({
    voltage: newVoltage,
  });
}, 5000);
```

### 示例2：批量更新所有单体的电压

```javascript
// 更新所有簇、所有包、所有单体的电压
const data = window.BMSAPI.level3.getData();
data.clusters.forEach((cluster, cIdx) => {
  cluster.packs.forEach((pack, pIdx) => {
    pack.cells.forEach((cell, cellIdx) => {
      const newVoltage = 3.7 + (Math.random() - 0.5) * 0.1;
      window.BMSAPI.level3.updateCell(
        cluster.id,
        pack.id,
        cell.id,
        { voltage: newVoltage }
      );
    });
  });
});
```

### 示例3：模拟故障状态

```javascript
// 模拟某个包出现故障
window.BMSAPI.level3.updatePack('Cluster1', 'C1-P1', {
  fault: true,
  faultMessage: '过压保护触发',
});

// 模拟某个簇的高压箱故障
window.BMSAPI.level3.updateClusterHighVoltageBox('Cluster1', {
  fault: true,
  faultMessage: '通信异常',
});

// 恢复正常
window.BMSAPI.level3.updatePack('Cluster1', 'C1-P1', {
  fault: false,
  faultMessage: '',
});
```

### 示例4：更新断路器状态

```javascript
// 方式1：使用单个合闸标志位（某些供应商）
window.BMSAPI.level3.updateMainHighVoltageBox({
  breaker: {
    closed: true, // 合闸
  },
});

// 方式2：使用正负极分别控制（某些供应商）
window.BMSAPI.level2.updateHighVoltageBox({
  breaker: {
    positiveClosed: true, // 正极合闸
    negativeClosed: true, // 负极合闸
  },
});
```

## 注意事项

1. **数据格式**：确保传入的数据格式符合类型定义，参考 `src/types/bms.ts`
2. **ID匹配**：更新数据时，确保使用的ID（簇ID、包ID、单体ID）与实际数据中的ID匹配
3. **部分更新**：所有更新函数都支持部分更新，只需传入需要更新的字段即可
4. **类型安全**：建议在 TypeScript 项目中使用，可以获得完整的类型提示
5. **性能考虑**：频繁更新大量数据时，建议批量更新而不是逐个更新

## 数据结构参考

详细的数据结构定义请参考 `src/types/bms.ts` 文件，主要包括：

- `BatteryStackData` - 三级架构电池堆数据
- `BatteryClusterData` - 三级架构电池簇数据
- `BatteryClusterDataLevel2` - 二级架构电池簇数据
- `BatteryPackData` - 电池包数据
- `CellData` - 电池单体数据
- `BreakerStatus` - 断路器状态
- `TemperaturePoint` - 温度测点数据
