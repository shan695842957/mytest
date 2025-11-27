# Real-time Energy Flow Panel

该目录下提供了一个基于 **React 19 + TypeScript + Tailwind** 的 `EnergyFlowPanel` 组件，可用于储能系统 PCS 实时能量流的可视化。组件采用 SVG 与 CSS 动画勾勒电能流向，默认背景透明，可通过 props 传入主题 token。

## 快速使用

1. 将 `src/components/energy-flow` 复制/移动到你的项目中，并在入口样式中引入 `energy-flow.css`。
2. 在任意 React 组件中使用：

```tsx
import EnergyFlowPanel from '@/components/energy-flow/EnergyFlowPanel';

<EnergyFlowPanel
  direction="charge"
  gridSide={{ title: 'Grid', subtitle: 'AC 10kV', metrics: [...] }}
  pcs={{ title: 'PCS', efficiency: 98.2, metrics: [...] }}
  batterySide={{ title: 'Battery', subtitle: 'DC 1500V', metrics: [...] }}
/>;
```

详细示例可见 `src/examples/EnergyFlowDemo.tsx`。如需切换明暗风格或自定义颜色，可通过 `theme` prop 覆盖默认 token；若需要控制动画速度，可传入 `flowSpeedMs`。