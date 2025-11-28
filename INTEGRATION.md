# BMS 储能系统可视化 - 集成说明

## 核心文件列表

本项目只包含必要的核心代码文件，可直接集成到你的项目中：

```
src/
├── types/
│   └── bms.ts                      # 类型定义（必须）
├── components/
│   ├── bms/
│   │   └── BMSVisualization.tsx    # 可视化组件（必须）
│   └── ui/                          # UI基础组件（必须）
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       └── tabs.tsx
├── hooks/
│   └── useBMS.ts                   # 数据管理Hook（必须）
├── utils/
│   └── bmsFactory.ts               # 数据工厂函数（必须）
└── lib/
    └── utils.ts                    # 工具函数（必须）
```

## 快速集成

### 1. 复制文件

将上述文件复制到你的项目中。

### 2. 安装依赖

确保你的项目已安装以下依赖：

```json
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "lucide-react": "^0.468.0",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5"
  }
}
```

### 3. 配置 Tailwind CSS

确保你的项目已配置 Tailwind CSS，并在 `tailwind.config.js` 中包含：

```js
content: [
  "./src/**/*.{js,ts,jsx,tsx}",
]
```

### 4. 使用组件

```tsx
import { Level3BMS } from '@/components/bms/BMSVisualization';
import { useLevel3BMS } from '@/hooks/useBMS';
import { createLevel3BMSData } from '@/utils/bmsFactory';

function MyComponent() {
  const config = {
    clusterCount: 3,
    packCountPerCluster: 4,
    cellCountPerPack: 30,
    temperaturePointCountPerPack: 5,
  };
  
  const initialData = createLevel3BMSData(config);
  const bms = useLevel3BMS(initialData);
  
  // 暴露接口到 window（可选）
  useEffect(() => {
    window.BMSAPI = {
      level3: {
        updateMainHighVoltageBoxFields: bms.updateMainHighVoltageBoxFields,
        // ... 其他接口
      },
    };
  }, [bms]);
  
  return <Level3BMS data={bms.data} config={config} />;
}
```

## 详细说明

所有详细的使用说明都已写在代码注释中，请查看：

- `src/types/bms.ts` - 类型定义和使用说明
- `src/hooks/useBMS.ts` - Hook使用说明和API接口
- `src/components/bms/BMSVisualization.tsx` - 组件使用说明
- `src/utils/bmsFactory.ts` - 工厂函数使用说明

## 核心特性

- ✅ 动态字段数组，支持多语言字段名
- ✅ 支持三级架构和二级架构
- ✅ 清晰的串并联关系展示
- ✅ 避免整屏滚动
- ✅ 完整的TypeScript类型定义
