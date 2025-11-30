# LCCU-V Frontend 配置文档

## 技术栈

- **React 19.1.1** + **TypeScript 5.9.3**
- **Vite 7.1.7** - 构建工具
- **Tailwind CSS 4.1.16** - 原子化 CSS 框架（使用 Vite 插件）
- **shadcn/ui** - 高质量可复用组件库（New York 风格）
- **React Router 7.9.5** - 路由管理
- **Zustand 5.0.8** - 轻量级状态管理
- **TanStack Query 5.90.7** - 服务端状态管理
- **React Hook Form 7.66.0** + **Zod 4.1.12** - 表单验证
- **i18next** + **react-i18next** - 国际化
- **Axios 1.13.2** - HTTP 客户端

## 配置完成项

### ✅ 1. Tailwind CSS v4 配置

#### 安装依赖
```bash
npm install tailwindcss @tailwindcss/vite
```

#### Vite 配置 (`vite.config.ts`)
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

#### CSS 导入 (`src/index.css`)
```css
@import "tailwindcss";

/* CSS 变量配置... */
```

### ✅ 2. shadcn/ui 配置

#### 安装依赖
```bash
npm install lucide-react class-variance-authority clsx tailwind-merge
```

#### 配置文件 (`components.json`)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

#### 工具函数 (`src/lib/utils.ts`)
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### ✅ 3. 路径别名配置

#### TypeScript 配置 (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### 目录结构
```
src/
├── components/
│   └── ui/          # shadcn/ui 组件
├── lib/
│   └── utils.ts     # 工具函数
├── hooks/           # 自定义 Hooks
├── assets/          # 静态资源
├── App.tsx
├── main.tsx
└── index.css
```

## 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# ESLint 检查
npm run lint
```

## 添加 shadcn/ui 组件

```bash
# 添加单个组件
npx shadcn@latest add button

# 添加多个组件
npx shadcn@latest add button card dialog

# 查看所有可用组件
npx shadcn@latest add
```

## 已添加的组件

- ✅ Button - 按钮组件（5种变体：default、secondary、outline、destructive、ghost）

## 主题配置

支持亮色和暗色主题，通过 CSS 变量定义：
- 在 `src/index.css` 中配置颜色变量
- 使用 `class="dark"` 切换到暗色主题

## 下一步开发建议

1. **配置路由结构** - 使用 React Router 创建页面路由
2. **配置 API 客户端** - 使用 Axios + TanStack Query 对接后端
3. **配置国际化** - 设置 i18next 中英文翻译
4. **配置状态管理** - 使用 Zustand 管理全局状态
5. **创建布局组件** - Header、Sidebar、Footer 等
6. **实现认证流程** - 登录、注册、Token 管理

## 与后端对接

后端已实现：
- ✅ JWT 认证系统
- ✅ 统一响应格式 (ApiResponse)
- ✅ 操作审计系统
- ✅ 国际化支持 (中英文)
- ✅ 用户管理 CRUD

前端需要实现：
- [ ] Axios 拦截器（Token、错误处理）
- [ ] TanStack Query 配置
- [ ] 登录页面
- [ ] 用户管理页面
- [ ] 国际化切换

## 配置完成时间

**2025-11-06** - 完成 Tailwind CSS v4 和 shadcn/ui 配置

## 版本信息

- Node.js: v18+
- npm: v9+
- 包管理器: npm

