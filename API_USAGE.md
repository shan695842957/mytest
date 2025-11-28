# BMS API 使用说明

本文档详细说明如何通过 JavaScript 接口调用 BMS 可视化系统的数据更新功能。

## 重要说明

**本系统使用动态字段数组格式**，支持：
- 不同供应商的数据结构差异
- 不同语言的字段名（中文、英文等）
- 自定义字段单位

所有显示字段都通过 `{ name: string, value: number | string | boolean, unit?: string }` 格式的数组传递。

## 接口访问

所有接口都暴露在 `window.BMSAPI` 对象上，可以直接在浏览器控制台或外部脚本中调用。

## 三级架构接口

### 1. 更新总高压箱的字段数组

```javascript
// 使用中文字段名
window.BMSAPI.level3.updateMainHighVoltageBoxFields([
  { name: '总电压', value: 720.5, unit: 'V' },
  { name: '总电流', value: 150.3, unit: 'A' },
  { name: '总功率', value: 108315.15, unit: 'W' },
  { name: 'SOC', value: 85.5, unit: '%' },
  { name: 'SOH', value: 95.2, unit: '%' },
]);

// 或使用英文字段名
window.BMSAPI.level3.updateMainHighVoltageBoxFields([
  { name: 'Grid Voltage', value: 720.5, unit: 'V' },
  { name: 'Current', value: 150.3, unit: 'A' },
  { name: 'Power', value: 108315.15, unit: 'W' },
  { name: 'SOC', value: 85.5, unit: '%' },
]);
```

### 2. 更新总高压箱的断路器状态

```javascript
// 方式1：使用单个合闸标志位（某些供应商）
window.BMSAPI.level3.updateMainHighVoltageBoxBreaker({
  closed: true, // 合闸
});

// 方式2：使用正负极分别控制（某些供应商）
window.BMSAPI.level3.updateMainHighVoltageBoxBreaker({
  positiveClosed: true, // 正极合闸
  negativeClosed: true, // 负极合闸
});
```

### 3. 更新总高压箱的故障状态

```javascript
// 设置故障
window.BMSAPI.level3.updateMainHighVoltageBoxFault(true, '过压保护触发');

// 清除故障
window.BMSAPI.level3.updateMainHighVoltageBoxFault(false);
```

### 4. 更新簇高压箱的字段数组

```javascript
window.BMSAPI.level3.updateClusterHighVoltageBoxFields('Cluster1', [
  { name: '簇电压', value: 240.2, unit: 'V' },
  { name: '簇电流', value: 50.1, unit: 'A' },
  { name: '簇功率', value: 12040.2, unit: 'W' },
  { name: 'SOC', value: 85.0, unit: '%' },
]);
```

### 5. 更新簇高压箱的断路器状态

```javascript
window.BMSAPI.level3.updateClusterHighVoltageBoxBreaker('Cluster1', {
  closed: true,
});
```

### 6. 更新簇高压箱的故障状态

```javascript
window.BMSAPI.level3.updateClusterHighVoltageBoxFault('Cluster1', true, '通信异常');
```

### 7. 更新包的字段数组

```javascript
window.BMSAPI.level3.updatePackFields('Cluster1', 'C1-P1', [
  { name: '包电压', value: 60.05, unit: 'V' },
  { name: '包电流', value: 12.5, unit: 'A' },
  { name: '包功率', value: 750.6, unit: 'W' },
  { name: 'SOC', value: 85.0, unit: '%' },
]);
```

### 8. 更新包的故障状态

```javascript
window.BMSAPI.level3.updatePackFault('Cluster1', 'C1-P1', true, '过压保护触发');
```

### 9. 更新单体的字段数组

```javascript
// 某些供应商提供完整数据
window.BMSAPI.level3.updateCellFields('Cluster1', 'C1-P1', 'C1-P1-Cell1', [
  { name: '电压', value: 3.7, unit: 'V' },
  { name: '温度', value: 25.5, unit: '°C' },
  { name: 'SOC', value: 85.0, unit: '%' },
  { name: 'SOH', value: 95.0, unit: '%' },
]);

// 某些供应商只提供电压
window.BMSAPI.level3.updateCellFields('Cluster1', 'C1-P1', 'C1-P1-Cell1', [
  { name: 'Voltage', value: 3.7, unit: 'V' },
]);
```

### 10. 更新整个数据

```javascript
const newData = {
  id: 'Stack1',
  clusters: [...],
  mainHighVoltageBox: {
    fields: [
      { name: '总电压', value: 720.5, unit: 'V' },
      { name: '总电流', value: 150.3, unit: 'A' },
    ],
    breaker: { closed: true },
  },
};

window.BMSAPI.level3.updateData(newData);
```

### 11. 获取当前数据

```javascript
const currentData = window.BMSAPI.level3.getData();
console.log(currentData);
```

## 二级架构接口

### 1. 更新簇高压箱的字段数组

```javascript
window.BMSAPI.level2.updateHighVoltageBoxFields([
  { name: 'Grid Voltage', value: 360.3, unit: 'V' },
  { name: 'Current', value: 100.5, unit: 'A' },
  { name: 'Power', value: 36210.15, unit: 'W' },
  { name: 'SOC', value: 82.5, unit: '%' },
]);
```

### 2. 更新簇高压箱的断路器状态

```javascript
window.BMSAPI.level2.updateHighVoltageBoxBreaker({
  positiveClosed: true,
  negativeClosed: true,
});
```

### 3. 更新簇高压箱的故障状态

```javascript
window.BMSAPI.level2.updateHighVoltageBoxFault(true, '通信异常');
```

### 4. 更新包的字段数组

```javascript
window.BMSAPI.level2.updatePackFields('P1', [
  { name: 'Pack Voltage', value: 60.05, unit: 'V' },
  { name: 'Pack Current', value: 16.75, unit: 'A' },
  { name: 'Pack Power', value: 1005.8, unit: 'W' },
]);
```

### 5. 更新包的故障状态

```javascript
window.BMSAPI.level2.updatePackFault('P1', true, '过压保护触发');
```

### 6. 更新单体的字段数组

```javascript
window.BMSAPI.level2.updateCellFields('P1', 'P1-Cell1', [
  { name: 'Voltage', value: 3.7, unit: 'V' },
]);
```

### 7. 更新整个数据

```javascript
const newData = {
  id: 'Cluster1',
  packs: [...],
  highVoltageBox: {
    fields: [
      { name: 'Grid Voltage', value: 360.3, unit: 'V' },
    ],
    breaker: { closed: true },
  },
};

window.BMSAPI.level2.updateData(newData);
```

### 8. 获取当前数据

```javascript
const currentData = window.BMSAPI.level2.getData();
```

## 实时数据更新示例

### 示例1：定时更新字段数组

```javascript
// 每5秒更新一次总电压
setInterval(() => {
  const newVoltage = 720.5 + (Math.random() - 0.5) * 10;
  window.BMSAPI.level3.updateMainHighVoltageBoxFields([
    { name: '总电压', value: newVoltage, unit: 'V' },
    { name: '总电流', value: 150.3, unit: 'A' },
    { name: '总功率', value: 108315.15, unit: 'W' },
  ]);
}, 5000);
```

### 示例2：批量更新所有单体的字段数组

```javascript
const data = window.BMSAPI.level3.getData();
data.clusters.forEach((cluster) => {
  cluster.packs.forEach((pack) => {
    pack.cells.forEach((cell) => {
      const newVoltage = 3.7 + (Math.random() - 0.5) * 0.1;
      window.BMSAPI.level3.updateCellFields(
        cluster.id,
        pack.id,
        cell.id,
        [{ name: '电压', value: newVoltage, unit: 'V' }]
      );
    });
  });
});
```

### 示例3：模拟故障状态

```javascript
// 设置包故障
window.BMSAPI.level3.updatePackFault('Cluster1', 'C1-P1', true, '过压保护触发，电压超过安全范围');

// 设置簇高压箱故障
window.BMSAPI.level3.updateClusterHighVoltageBoxFault('Cluster1', true, '通信异常，无法获取数据');

// 恢复正常
window.BMSAPI.level3.updatePackFault('Cluster1', 'C1-P1', false);
window.BMSAPI.level3.updateClusterHighVoltageBoxFault('Cluster1', false);
```

## 字段数组格式说明

每个字段项包含：
- `name`: 字段名（可以是任何语言，如"电压"、"Voltage"、"Grid Voltage"等）
- `value`: 字段值（数字、字符串或布尔值）
- `unit`: 单位（可选，如"V"、"A"、"W"、"%"、"°C"等）

示例：
```javascript
[
  { name: '电压', value: 720.5, unit: 'V' },
  { name: 'Voltage', value: 720.5, unit: 'V' },
  { name: 'Grid Voltage', value: 720.5, unit: 'V' },
  { name: '状态', value: '正常', unit: '' },
  { name: '启用', value: true, unit: '' },
]
```

## 注意事项

1. **字段名支持多语言**：字段名可以是中文、英文或任何其他语言
2. **字段数量灵活**：不同供应商提供的字段数量和类型可能不同
3. **单位可选**：如果不需要显示单位，可以不提供 `unit` 字段
4. **ID匹配**：更新数据时，确保使用的ID（簇ID、包ID、单体ID）与实际数据中的ID匹配
5. **部分更新**：所有更新函数都支持部分更新，只需传入需要更新的字段即可

## 数据结构参考

详细的数据结构定义请参考 `src/types/bms.ts` 文件，主要包括：

- `DataField` - 动态字段项类型
- `BatteryStackData` - 三级架构电池堆数据
- `BatteryClusterData` - 三级架构电池簇数据
- `BatteryClusterDataLevel2` - 二级架构电池簇数据
- `BatteryPackData` - 电池包数据
- `CellData` - 电池单体数据
- `BreakerStatus` - 断路器状态
