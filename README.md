# BMS 储能系统可视化

基于 React 19 + TypeScript + Vite + Tailwind CSS 的电池管理系统（BMS）可视化展示系统。

## 核心特性

- ✅ **动态字段数组**：所有显示字段都通过数组形式传递，支持不同供应商和不同语言的字段名
- ✅ **支持三级架构**：电池堆 → 电池簇 → 电池包 → 电池单体
- ✅ **支持二级架构**：电池簇 → 电池包 → 电池单体
- ✅ **清晰展示业务逻辑**：串并联关系、层级结构一目了然
- ✅ **灵活的接口设计**：支持不同供应商的数据结构差异
- ✅ **实时数据更新接口**：通过 `window.BMSAPI` 暴露所有更新接口
- ✅ **避免整屏滚动**：使用局部滚动容器，只在单个 div 内滚动
- ✅ **完整的TypeScript类型定义**

## 技术栈

- React 19.1.1
- TypeScript 5.9.3
- Vite 7.1.7
- Tailwind CSS 4.1.16
- shadcn/ui（基于 Radix UI）

## 安装

```bash
npm install
```

## 开发

```bash
npm run dev
```

## 构建

```bash
npm run build
```

## 核心概念：动态字段数组

本系统使用**动态字段数组**格式来支持不同供应商和不同语言的字段名。每个字段项包含：

```typescript
{
  name: string;        // 字段名（可以是任何语言，如"电压"、"Voltage"、"Grid Voltage"等）
  value: number | string | boolean;  // 字段值
  unit?: string;      // 单位（可选，如"V"、"A"、"W"、"%"等）
}
```

### 示例

```javascript
// 中文字段名
[
  { name: '总电压', value: 720.5, unit: 'V' },
  { name: '总电流', value: 150.3, unit: 'A' },
  { name: 'SOC', value: 85.5, unit: '%' },
]

// 英文字段名
[
  { name: 'Grid Voltage', value: 720.5, unit: 'V' },
  { name: 'Current', value: 150.3, unit: 'A' },
  { name: 'SOC', value: 85.5, unit: '%' },
]
```

## 接口调用

系统将更新接口暴露到 `window.BMSAPI` 对象，可以通过以下方式调用：

### 三级架构接口

```javascript
// 更新总高压箱的字段数组
window.BMSAPI.level3.updateMainHighVoltageBoxFields([
  { name: '总电压', value: 720.5, unit: 'V' },
  { name: '总电流', value: 150.3, unit: 'A' },
]);

// 更新总高压箱的断路器状态
window.BMSAPI.level3.updateMainHighVoltageBoxBreaker({
  closed: true, // 或使用 positiveClosed/negativeClosed
});

// 更新指定包的字段数组
window.BMSAPI.level3.updatePackFields('Cluster1', 'C1-P1', [
  { name: '包电压', value: 60.05, unit: 'V' },
  { name: '包电流', value: 12.5, unit: 'A' },
]);

// 更新指定单体的字段数组
window.BMSAPI.level3.updateCellFields('Cluster1', 'C1-P1', 'C1-P1-Cell1', [
  { name: '电压', value: 3.7, unit: 'V' },
  { name: '温度', value: 25.5, unit: '°C' },
]);
```

### 二级架构接口

```javascript
// 更新簇高压箱的字段数组
window.BMSAPI.level2.updateHighVoltageBoxFields([
  { name: 'Grid Voltage', value: 360.3, unit: 'V' },
  { name: 'Current', value: 100.5, unit: 'A' },
]);

// 更新指定包的字段数组
window.BMSAPI.level2.updatePackFields('P1', [
  { name: 'Pack Voltage', value: 60.05, unit: 'V' },
]);

// 更新指定单体的字段数组
window.BMSAPI.level2.updateCellFields('P1', 'P1-Cell1', [
  { name: 'Voltage', value: 3.7, unit: 'V' },
]);
```

详细接口说明请参考 [API_USAGE.md](./API_USAGE.md)

## 项目结构

```
src/
├── components/
│   ├── bms/
│   │   └── BMSVisualization.tsx    # 三级和二级架构可视化组件（合并）
│   └── ui/                          # UI基础组件
├── hooks/
│   └── useBMS.ts                   # BMS数据管理Hook
├── types/
│   └── bms.ts                      # TypeScript类型定义
├── utils/
│   └── bmsFactory.ts               # 数据工厂函数
├── App.tsx                         # 主应用入口
└── main.tsx                        # 入口文件
```

## 支持的数据结构差异

系统已经支持不同供应商的数据结构差异：

1. **断路器状态**：
   - 某些供应商使用单个 `closed` 标志位
   - 某些供应商使用 `positiveClosed`/`negativeClosed` 分别控制

2. **字段名和单位**：
   - 通过动态字段数组，支持任何语言的字段名
   - 字段数量和类型完全由外部决定

3. **单体数据**：
   - 某些供应商提供完整数据（电压、温度、SOC、SOH）
   - 某些供应商只提供电压，温度使用包内温度测点

4. **温度测点**：
   - 支持包内温度测点，数量可与单体数不同

## 集成到你的项目

本系统设计为易于集成：

1. **最小化文件数量**：核心组件已合并到单个文件
2. **通过 window.BMSAPI 调用**：无需修改源码即可使用
3. **动态字段数组**：完全由外部控制显示内容

### 集成步骤

1. 将 `src/components/bms/`、`src/hooks/`、`src/types/`、`src/utils/` 复制到你的项目
2. 在你的项目中引入组件：
   ```tsx
   import { Level3BMS, Level2BMS } from '@/components/bms/BMSVisualization';
   ```
3. 通过 `window.BMSAPI` 调用接口更新数据

## 常见问题

### Q: 如何修改电池堆/簇/包的数量？

A: 在创建数据时通过配置对象设置，或直接调用 `updateData` 传入完整数据。

### Q: 如何支持不同的供应商数据结构？

A: 通过动态字段数组，你可以传入任何字段名和值。系统会自动渲染。

### Q: 如何实时更新数据？

A: 使用 `window.BMSAPI` 提供的更新接口，可以：
- 定时调用更新函数
- 通过 WebSocket 接收数据后调用更新函数
- 通过 HTTP 轮询后调用更新函数

### Q: 字段名可以是任何语言吗？

A: 是的，字段名支持任何语言，如中文、英文、日文等。

## 许可证

MIT
