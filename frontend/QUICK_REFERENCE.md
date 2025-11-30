# 快速参考卡片

> **开发新功能前快速检查清单**

## 🚨 必须遵循

```
✅ 使用现有技术栈（React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui）
✅ 参考现有代码实现
✅ 保持目录结构一致
✅ 使用 type 导入类型
✅ 添加中英文翻译
✅ 遵循权限控制规范
```

## 📁 常用文件路径

| 功能 | 参考文件 |
|------|---------|
| 添加页面 | `src/pages/auth/LoginPage.tsx` |
| 调用 API | `src/api/auth.ts` |
| 权限控制 | `src/components/auth/AuthGuard.tsx` |
| 表单验证 | `src/pages/auth/LoginPage.tsx` |
| 路由配置 | `src/config/routes.tsx` |
| 菜单配置 | `src/config/menu.tsx` |
| 国际化 | `src/locales/zh-CN/*.json` |
| 类型定义 | `src/types/*.ts` |

## 🎯 常用代码片段

### 创建页面
```tsx
export default function XxxPage() {
  const { t } = useTranslation('namespace')
  return <div>{t('key')}</div>
}
```

### 调用 API
```tsx
import { useQuery } from '@tanstack/react-query'
import { getUsers } from '@/api/users'

const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: getUsers
})
```

### 权限控制
```tsx
// 组件级
<AuthGuard roles={[UserRole.DEVELOPER]}>
  <Button>删除</Button>
</AuthGuard>

// Hook 方式
const { isDeveloper } = useAuth()
{isDeveloper && <Button>删除</Button>}
```

### 表单
```tsx
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { name: '' }
})
```

## ❌ 常见错误

| 错误 | 正确 |
|------|------|
| `import moment` | 使用原生 Date |
| `useState` 管理表单 | 使用 `react-hook-form` |
| 硬编码文本 | 使用 `t('key')` |
| `any` 类型 | 使用具体类型 |
| 直接 `axios.get()` | 使用 `http.get()` |

## 📚 详细文档

- **[AI_DEVELOPMENT_RULES.md](./AI_DEVELOPMENT_RULES.md)** - 完整开发规范
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 架构设计
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - 已实现功能

