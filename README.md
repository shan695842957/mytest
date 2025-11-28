# BMS 储能系统可视化

基于 React 19 + TypeScript + Vite + Tailwind CSS 的电池管理系统（BMS）可视化展示系统。

## 功能特性

- ✅ 支持三级架构：电池堆 → 电池簇 → 电池包 → 电池单体
- ✅ 支持二级架构：电池簇 → 电池包 → 电池单体
- ✅ 清晰展示BMS业务逻辑（串并联关系、层级结构）
- ✅ 灵活的接口设计，支持不同供应商的数据结构差异
- ✅ 实时数据更新接口
- ✅ 避免整屏滚动，使用局部滚动容器
- ✅ 完整的TypeScript类型定义

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

## 使用说明

### 接口调用

系统将更新接口暴露到 `window.BMSAPI` 对象，可以通过以下方式调用：

#### 三级架构接口

```javascript
// 更新整个电池堆数据
window.BMSAPI.level3.updateData(newData);

// 更新总高压箱数据
window.BMSAPI.level3.updateMainHighVoltageBox({
  voltage: 720.5,
  current: 150.3,
  power: 108315.15,
  soc: 85.5,
  breaker: { closed: true }
});

// 更新指定簇的数据
window.BMSAPI.level3.updateCluster('Cluster1', {
  highVoltageBox: {
    voltage: 240.2,
    current: 50.1
  }
});

// 更新指定簇的高压箱数据
window.BMSAPI.level3.updateClusterHighVoltageBox('Cluster1', {
  voltage: 240.2,
  breaker: { closed: true }
});

// 更新指定包的数据
window.BMSAPI.level3.updatePack('Cluster1', 'C1-P1', {
  voltage: 60.05,
  current: 12.5,
  power: 750.6
});

// 更新指定单体的数据
window.BMSAPI.level3.updateCell('Cluster1', 'C1-P1', 'C1-P1-Cell1', {
  voltage: 3.7,
  temperature: 25.5
});

// 获取当前数据
const data = window.BMSAPI.level3.getData();
```

#### 二级架构接口

```javascript
// 更新整个电池簇数据
window.BMSAPI.level2.updateData(newData);

// 更新簇高压箱数据
window.BMSAPI.level2.updateHighVoltageBox({
  voltage: 360.3,
  current: 100.5,
  breaker: { positiveClosed: true, negativeClosed: true }
});

// 更新指定包的数据
window.BMSAPI.level2.updatePack('P1', {
  voltage: 60.05,
  current: 16.75
});

// 更新指定单体的数据
window.BMSAPI.level2.updateCell('P1', 'P1-Cell1', {
  voltage: 3.7
});

// 获取当前数据
const data = window.BMSAPI.level2.getData();
```

### 数据结构说明

系统支持不同供应商的数据结构差异：

1. **断路器状态**：
   - 某些供应商使用单个 `closed` 标志位
   - 某些供应商使用 `positiveClosed` 和 `negativeClosed` 分别控制

2. **单体数据**：
   - 某些供应商提供完整的单体数据（电压、温度、SOC、SOH）
   - 某些供应商只提供电压，温度使用包内温度测点

3. **温度测点**：
   - 温度测点数量与单体数不一定相同
   - 某些供应商在每个包内布置若干温度测点

## 项目结构

```
src/
├── components/
│   ├── bms/
│   │   ├── Level3BMS.tsx    # 三级架构组件
│   │   └── Level2BMS.tsx    # 二级架构组件
│   └── ui/                   # UI组件
├── hooks/
│   └── useBMS.ts            # BMS数据管理Hook
├── types/
│   └── bms.ts               # 类型定义
├── utils/
│   └── bmsFactory.ts        # 数据工厂函数
├── App.tsx                  # 主应用
└── main.tsx                 # 入口文件
```

## 许可证

MIT
