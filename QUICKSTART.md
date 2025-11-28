# 快速开始指南

## 安装依赖

```bash
npm install
```

## 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动。

## 基本使用

### 1. 查看可视化界面

打开浏览器访问开发服务器地址，你将看到：
- **三级架构**标签页：展示电池堆 → 电池簇 → 电池包 → 电池单体的完整层级
- **二级架构**标签页：展示电池簇 → 电池包 → 电池单体的简化层级

### 2. 在浏览器控制台调用API

打开浏览器开发者工具（F12），在控制台中输入：

```javascript
// 更新总电压
window.BMSAPI.level3.updateMainHighVoltageBox({
  voltage: 750.0,
  current: 160.0,
  power: 120000,
});

// 更新某个单体的电压
window.BMSAPI.level3.updateCell('Cluster1', 'C1-P1', 'C1-P1-Cell1', {
  voltage: 3.8,
});

// 获取当前数据
const data = window.BMSAPI.level3.getData();
console.log(data);
```

### 3. 配置BMS结构

在 `src/App.tsx` 中修改配置：

```typescript
// 三级架构配置
const level3Config = {
  clusterCount: 3,              // 电池堆下的簇数
  packCountPerCluster: 4,        // 每个簇下的包数
  cellCountPerPack: 30,           // 每个包下的单体数
  temperaturePointCountPerPack: 5, // 每个包内的温度测点数
  cellConfiguration: {
    series: 2,    // 串联数
    parallel: 15, // 并联数
  },
};
```

### 4. 集成到你的项目

如果你需要在其他项目中调用这些接口，可以：

1. **直接使用 window.BMSAPI**（如果BMS可视化页面已加载）
2. **通过 iframe 通信**（如果BMS可视化在iframe中）
3. **通过 WebSocket/HTTP API**（需要额外实现）

## 项目结构说明

```
src/
├── components/
│   ├── bms/
│   │   ├── Level3BMS.tsx    # 三级架构可视化组件
│   │   └── Level2BMS.tsx    # 二级架构可视化组件
│   └── ui/                   # UI基础组件
├── hooks/
│   └── useBMS.ts            # BMS数据管理Hook
├── types/
│   └── bms.ts               # TypeScript类型定义
├── utils/
│   └── bmsFactory.ts        # 数据工厂函数
├── examples/
│   └── example-usage.ts     # 使用示例代码
└── App.tsx                  # 主应用入口
```

## 常见问题

### Q: 如何修改电池堆/簇/包的数量？

A: 在 `src/App.tsx` 中修改 `level3Config` 或 `level2Config` 对象。

### Q: 如何支持不同的供应商数据结构？

A: 系统已经支持不同供应商的数据结构差异：
- 断路器状态：支持单个 `closed` 标志位或 `positiveClosed`/`negativeClosed` 分别控制
- 单体数据：支持完整数据（电压、温度、SOC、SOH）或仅电压
- 温度测点：支持包内温度测点，数量可与单体数不同

### Q: 如何实时更新数据？

A: 使用 `window.BMSAPI` 提供的更新接口，可以：
- 定时调用更新函数
- 通过 WebSocket 接收数据后调用更新函数
- 通过 HTTP 轮询后调用更新函数

参考 `src/examples/example-usage.ts` 中的示例代码。

### Q: 如何自定义样式？

A: 组件使用 Tailwind CSS，你可以：
- 修改 `tailwind.config.js` 扩展主题
- 直接修改组件中的 className
- 在 `src/index.css` 中添加自定义样式

## 下一步

- 查看 [API_USAGE.md](./API_USAGE.md) 了解详细的API使用说明
- 查看 `src/examples/example-usage.ts` 查看更多使用示例
- 查看 `src/types/bms.ts` 了解完整的数据结构定义
