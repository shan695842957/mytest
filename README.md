# 储能系统PCS可视化组件

一个用于显示储能系统PCS（功率转换系统）实时状态的可视化React组件。

## 功能特性

- ✅ 显示网侧（交流侧）和直流侧的实时数据
- ✅ 动态能量流向示意（充电/放电模式）
- ✅ 支持明暗主题切换
- ✅ 透明背景，可适配网页背景
- ✅ 完整的TypeScript类型支持
- ✅ 轻量级SVG实现，适合4G网络环境
- ✅ 灵活的数据接口，支持自定义内容

## 技术栈

- React 19.1.1
- TypeScript 5.9.3
- Vite 7.1.7
- Tailwind CSS 4.1.16

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
npm run dev
```

### 构建

```bash
npm run build
```

## 使用说明

详细的使用文档请参考 [USAGE.md](./USAGE.md)

### 基本示例

```tsx
import PCSVisualization from './components/PCSVisualization'

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

## 项目结构

```
.
├── src/
│   ├── components/
│   │   ├── PCSVisualization.tsx  # 主组件
│   │   └── index.ts               # 导出文件
│   ├── App.tsx                    # 示例应用
│   ├── main.tsx                   # 入口文件
│   └── index.css                  # 样式文件
├── package.json
├── tsconfig.json
├── vite.config.ts
└── USAGE.md                       # 使用文档
```

## 组件说明

### PCS运行模式

- **charging（充电）**：能量从网侧（交流）流向直流侧
- **discharging（放电）**：能量从直流侧流向网侧（交流）
- **idle（空闲）**：无能量流动

### 数据接口

组件提供三个数据接口：
- `gridSideData`：网侧（交流侧）数据
- `dcSideData`：直流侧数据
- `pcsData`：PCS状态数据

所有接口都支持 `customContent` 属性，可以完全自定义显示内容。

## 注意事项

- 组件背景默认透明，会继承父容器背景
- 使用SVG实现，性能优化，适合4G网络
- 支持响应式设计，可设置百分比或固定尺寸
- 所有接口都有完整的TypeScript类型定义

## 许可证

MIT
