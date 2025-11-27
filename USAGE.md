# PCS可视化组件使用文档

## 概述

PCS可视化组件用于显示储能系统PCS（功率转换系统）的实时状态，包括：
- 网侧（交流侧）和直流侧的实时数据展示
- PCS运行状态显示
- 动态能量流向示意（充电/放电）
- 支持明暗主题切换
- 透明背景，可适配网页背景

## 安装依赖

确保项目已安装以下依赖：
- React 19.1.1
- TypeScript 5.9.3
- Tailwind CSS 4.1.16

## 快速开始

### 1. 导入组件

```tsx
import PCSVisualization, {
  type PCSMode,
  type ThemeMode,
  type GridSideData,
  type DCSideData,
  type PCSData,
} from './components/PCSVisualization'
```

### 2. 基本使用

```tsx
<PCSVisualization
  mode="charging"
  theme="light"
  gridSideData={{
    voltage: 380,
    current: 50,
    power: 19,
    frequency: 50,
  }}
  dcSideData={{
    voltage: 600,
    current: 32,
    power: 19.2,
  }}
  pcsData={{
    efficiency: 95.5,
    temperature: 45,
    status: '充电中',
  }}
/>
```

## API 接口

### PCSVisualizationProps

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| mode | `PCSMode` | 是 | - | PCS运行模式：'charging' \| 'discharging' \| 'idle' |
| theme | `ThemeMode` | 否 | 'light' | 主题模式：'light' \| 'dark' |
| gridSideData | `GridSideData` | 否 | - | 网侧（交流侧）数据 |
| dcSideData | `DCSideData` | 否 | - | 直流侧数据 |
| pcsData | `PCSData` | 否 | - | PCS数据 |
| width | `number \| string` | 否 | 800 | 组件宽度 |
| height | `number \| string` | 否 | 400 | 组件高度 |
| className | `string` | 否 | '' | 自定义类名 |
| animationDuration | `number` | 否 | 2000 | 动画持续时间（毫秒） |

### GridSideData（网侧数据接口）

| 属性 | 类型 | 说明 |
|------|------|------|
| voltage | `number \| string` | 电压值（单位：V） |
| current | `number \| string` | 电流值（单位：A） |
| power | `number \| string` | 功率值（单位：kW） |
| frequency | `number \| string` | 频率值（单位：Hz） |
| label | `string` | 自定义标签 |
| customContent | `React.ReactNode` | 自定义显示内容（优先级最高） |

### DCSideData（直流侧数据接口）

| 属性 | 类型 | 说明 |
|------|------|------|
| voltage | `number \| string` | 电压值（单位：V） |
| current | `number \| string` | 电流值（单位：A） |
| power | `number \| string` | 功率值（单位：kW） |
| label | `string` | 自定义标签 |
| customContent | `React.ReactNode` | 自定义显示内容（优先级最高） |

### PCSData（PCS数据接口）

| 属性 | 类型 | 说明 |
|------|------|------|
| efficiency | `number \| string` | 效率值（单位：%） |
| temperature | `number \| string` | 温度值（单位：℃） |
| status | `string` | 状态文本 |
| label | `string` | 自定义标签 |
| customContent | `React.ReactNode` | 自定义显示内容（优先级最高） |

## 使用示例

### 示例1：基本使用

```tsx
<PCSVisualization
  mode="charging"
  gridSideData={{
    voltage: 380,
    current: 50,
    power: 19,
  }}
  dcSideData={{
    voltage: 600,
    current: 32,
  }}
/>
```

### 示例2：自定义内容

```tsx
<PCSVisualization
  mode="discharging"
  gridSideData={{
    customContent: (
      <div>
        <div>自定义网侧数据</div>
        <div>电压: 380V</div>
        <div>功率: 19kW</div>
      </div>
    ),
  }}
  dcSideData={{
    customContent: (
      <div>
        <div>自定义直流侧数据</div>
        <div>电压: 600V</div>
      </div>
    ),
  }}
/>
```

### 示例3：动态切换模式和主题

```tsx
const [mode, setMode] = useState<PCSMode>('charging')
const [theme, setTheme] = useState<ThemeMode>('light')

<PCSVisualization
  mode={mode}
  theme={theme}
  gridSideData={gridSideData}
  dcSideData={dcSideData}
  pcsData={pcsData}
/>
```

### 示例4：响应式尺寸

```tsx
<PCSVisualization
  mode="charging"
  width="100%"
  height="400px"
  gridSideData={gridSideData}
  dcSideData={dcSideData}
/>
```

## 集成到现有项目

### 步骤1：复制组件文件

将 `src/components/PCSVisualization.tsx` 复制到你的项目中。

### 步骤2：确保样式支持

确保项目已配置 Tailwind CSS，或者手动添加必要的样式。

### 步骤3：在页面中使用

```tsx
import PCSVisualization from '@/components/PCSVisualization'

function YourComponent() {
  return (
    <div>
      <PCSVisualization
        mode="charging"
        theme="light"
        gridSideData={yourGridData}
        dcSideData={yourDCData}
        pcsData={yourPCSData}
      />
    </div>
  )
}
```

## 注意事项

1. **背景透明**：组件背景默认透明，会继承父容器的背景色
2. **主题适配**：通过 `theme` 属性切换明暗主题，组件会自动适配颜色
3. **动画性能**：使用SVG动画，性能优化，适合4G网络环境
4. **自定义内容**：如果提供了 `customContent`，将忽略其他数据字段
5. **响应式**：支持百分比和固定像素值，可根据容器自适应

## 技术说明

- 使用 SVG 绘制图形，轻量级，适合4G网络
- 使用 CSS 动画和 SVG 动画实现能量流向效果
- 支持 TypeScript 类型检查
- 完全响应式设计
