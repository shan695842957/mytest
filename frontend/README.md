# LCCU-V Frontend

LCCU-V 项目前端应用，基于现代化 React 技术栈构建。

---

## ⚠️ AI 开发者必读

**开发任何新功能前，请务必先阅读：**

1. 📋 **[AI_DEVELOPMENT_RULES.md](./AI_DEVELOPMENT_RULES.md)** - **必读！开发规范和现有机制**
2. 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md) - 架构设计说明
3. 📊 [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - 已实现功能

**核心原则：优先使用现有机制，除非绝对必要否则不引入新技术！**

---

## 技术栈

- **React 19** + **TypeScript** - 核心框架
- **Vite 7** - 极速构建工具
- **Tailwind CSS v4** - 原子化 CSS（Vite 插件方式）
- **shadcn/ui** - 高质量可复用组件库（New York 风格）
- **React Router 7** - 路由管理
- **Zustand** - 轻量级状态管理
- **TanStack Query** - 服务端状态管理
- **React Hook Form + Zod** - 表单验证
- **i18next** - 国际化
- **Axios** - HTTP 客户端

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用。

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
frontend/
├── public/              # 静态资源
├── src/
│   ├── components/      # React 组件
│   │   └── ui/         # shadcn/ui 组件
│   ├── lib/            # 工具函数
│   ├── hooks/          # 自定义 Hooks
│   ├── assets/         # 静态资源
│   ├── App.tsx         # 根组件
│   ├── main.tsx        # 入口文件
│   └── index.css       # 全局样式
├── components.json     # shadcn/ui 配置
├── vite.config.ts      # Vite 配置
├── tsconfig.json       # TypeScript 配置
└── package.json        # 依赖管理
```

## 添加 UI 组件

使用 shadcn/ui CLI 添加组件：

```bash
# 添加单个组件
npx shadcn@latest add button

# 添加多个组件
npx shadcn@latest add button card dialog form

# 查看所有可用组件
npx shadcn@latest add
```

## 配置说明

### 路径别名

项目配置了 `@/` 别名指向 `src/` 目录：

```typescript
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
```

### 主题支持

- ✅ 亮色主题（默认）
- ✅ 暗色主题（添加 `class="dark"` 到 `<html>` 标签）
- ✅ CSS 变量自定义主题颜色

### 代码风格

- ESLint - 代码检查
- TypeScript Strict Mode - 类型安全
- Prettier（推荐） - 代码格式化

## 开发规范

### 组件命名

- React 组件使用 PascalCase：`UserProfile.tsx`
- 普通文件使用 camelCase：`userUtils.ts`

### 样式编写

优先使用 Tailwind CSS 工具类：

```tsx
<div className="flex items-center gap-4 p-6 bg-card rounded-lg">
  <Button className="w-full">提交</Button>
</div>
```

### 类型定义

使用 TypeScript 明确定义类型：

```typescript
interface User {
  id: number
  username: string
  role: 'developer' | 'operator' | 'user'
}
```

## 与后端对接

后端地址：`http://localhost:8000`

### API 接口

- `POST /api/auth/login` - 用户登录
- `GET /api/auth/users/me` - 获取当前用户
- `GET /api/auth/users` - 用户列表
- `POST /api/auth/users` - 创建用户
- 更多接口见后端文档...

### 响应格式

```typescript
interface ApiResponse<T> {
  success: boolean
  code: number
  message: string
  data: T | null
  pagination?: PaginationInfo
  metadata?: ResponseMetadata
}
```

## 开发路线图

- [x] ✅ Tailwind CSS v4 配置
- [x] ✅ shadcn/ui 集成（11个组件）
- [x] ✅ 路径别名配置
- [x] ✅ 路由配置（React Router 7）
- [x] ✅ API 客户端（Axios + TanStack Query）
- [x] ✅ 国际化配置（i18next 中英文）
- [x] ✅ 状态管理（Zustand）
- [x] ✅ 权限控制系统（4层）
- [x] ✅ 主题系统（3配色 × 2模式）
- [x] ✅ 登录页面（大厂级设计）
- [x] ✅ 布局组件（Sidebar + Header）
- [ ] 🔄 用户管理页面（CRUD）
- [ ] 🔄 审计日志页面
- [ ] 🔄 个人中心页面

## 文档

### 项目文档
- **[AI_DEVELOPMENT_RULES.md](./AI_DEVELOPMENT_RULES.md)** - AI 开发规范（必读）
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 架构设计说明
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - 功能实施总结
- **[THEME.md](./THEME.md)** - 主题系统文档
- **[THEME_AND_LOGIN_SUMMARY.md](./THEME_AND_LOGIN_SUMMARY.md)** - 主题与登录页总结
- **[SETUP.md](./SETUP.md)** - 详细配置说明
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - 快速参考

### 官方文档
- [Vite 文档](https://vite.dev/)
- [React 文档](https://react.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [shadcn/ui 文档](https://ui.shadcn.com/)

## 许可证

私有项目

## 更新日志

### v0.2.0 (2025-11-06)

- ✅ 完整架构搭建（3500+ 行代码）
- ✅ 主题系统（3 配色 × 2 模式）
- ✅ 大厂级登录页面（Google/Apple 风格）
- ✅ 完整的 RBAC 权限控制（4 层）
- ✅ 国际化系统（中英文）
- ✅ 路由与状态管理
- ✅ API 客户端层
- ✅ 布局组件

### v0.1.0 (2025-11-06)

- ✅ 初始化项目
- ✅ 配置 Tailwind CSS v4（Vite 插件方式）
- ✅ 集成 shadcn/ui（New York 风格）
- ✅ 配置路径别名 (@/)
- ✅ 添加 11 个 shadcn/ui 组件
