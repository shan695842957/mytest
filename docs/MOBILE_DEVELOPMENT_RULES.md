# 移动端开发规范 - LCCU-V Frontend

> **核心原则：移动端优先（Mobile First），遵循 Android Material Design 规范**
> 
> **适用场景**：所有需要移动端适配的页面和组件

---

## 📋 目录

1. [核心原则](#核心原则)
2. [布局系统](#布局系统)
3. [组件使用规范](#组件使用规范)
4. [响应式断点](#响应式断点)
5. [Safe Area 适配](#safe-area-适配)
6. [开发检查清单](#开发检查清单)
7. [常见场景实现](#常见场景实现)

---

## 🎯 核心原则

### 1. 移动端优先（Mobile First）

```tsx
// ❌ 错误：桌面端优先
<div className="grid grid-cols-4 md:grid-cols-1">
  {/* 桌面端 4 列，移动端 1 列 */}
</div>

// ✅ 正确：移动端优先
<div className="grid grid-cols-1 md:grid-cols-4">
  {/* 移动端 1 列，桌面端 4 列 */}
</div>
```

**要点**：
- 默认样式针对移动端设计
- 使用 `md:` 前缀添加桌面端样式
- 移动端使用 `< 768px`，桌面端使用 `≥ 768px`

### 2. 触摸优化

```tsx
// ✅ 正确：最小触摸目标 44×44px
<Button className="min-h-[44px] min-w-[44px]">
  操作
</Button>

// ✅ 正确：列表项最小高度 64px
<MaterialListItem 
  title="列表项"
  min-h-[64px]  // MaterialListItem 已内置
/>
```

**要点**：
- 所有可交互元素至少 **44×44px**（Material Design 标准）
- 列表项最小高度 **64px**（便于浏览和点击）
- 按钮间距至少 **8px**（避免误触）

### 3. Material Design 规范

- **Bottom Navigation**：主要导航固定在底部（最多 5 项）
- **Top App Bar**：固定顶部，显示标题和操作
- **Navigation Drawer**：完整菜单抽屉，从左侧滑出
- **Cards**：内容分组使用卡片式布局
- **Lists**：垂直列表，使用大卡片式列表项

---

## 🏗️ 布局系统

### 移动端布局（< 768px）

```
┌─────────────────────┐
│   MobileTopBar      │ ← 固定顶部（56px + Safe Area）
├─────────────────────┤
│                     │
│   Main Content      │ ← 自动适配上下导航栏
│                     │
│                     │
├─────────────────────┤
│ MobileBottomNav     │ ← 固定底部（56px + Safe Area）
└─────────────────────┘
```

**组件使用**：
- `MobileTopBar` - 顶部应用栏（自动显示，无需手动添加）
- `MobileBottomNav` - 底部导航栏（自动显示，无需手动添加）
- `MainLayout` - 主布局容器（自动适配移动端/桌面端）

### 桌面端布局（≥ 768px）

```
┌─────────────────────────────────────┐
│  Sidebar  │  Top Bar (Breadcrumb)   │
│           ├──────────────────────────┤
│           │                          │
│           │     Main Content         │
│           │                          │
└───────────┴──────────────────────────┘
```

**自动切换**：
- `MainLayout` 自动根据屏幕宽度切换布局
- 无需手动判断设备类型
- 使用 CSS `md:` 断点实现

---

## 🧩 组件使用规范

### 1. MaterialListItem（列表项）

**使用场景**：移动端列表页面

**参考实现**：`frontend/src/pages/users/UserListPage.tsx`

```tsx
import { MaterialListItem } from '@/components/common/MaterialListItem'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

// ✅ 正确用法
<MaterialListItem
  icon={
    <Avatar className="size-10">
      <AvatarFallback>AB</AvatarFallback>
    </Avatar>
  }
  title="用户名"
  description={
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">角色</Badge>
        <Badge variant="default">状态</Badge>
      </div>
      <span className="text-xs text-muted-foreground">
        创建时间：2025-01-01
      </span>
    </div>
  }
  actions={
    <DropdownMenu>
      {/* 操作按钮 */}
    </DropdownMenu>
  }
  onClick={() => {/* 点击事件 */}}
  showArrow={false}  // 默认 false
/>
```

**要点**：
- ✅ 移动端必须使用 `MaterialListItem`，不要使用 `<div>` 手动实现
- ✅ `description` 支持 `string | ReactNode`，可以用 Badge、图标等
- ✅ `actions` 使用 `DropdownMenu` 整合多个操作按钮
- ✅ 列表项自动处理触摸反馈和选中状态

### 2. MaterialCard（卡片）

**使用场景**：移动端卡片式内容展示

**参考实现**：`frontend/src/components/common/MaterialCard.tsx`

```tsx
import { MaterialCard } from '@/components/common/MaterialCard'

// ✅ 正确用法
<MaterialCard
  title="卡片标题"
  description="卡片描述"
  content={
    <div>卡片内容</div>
  }
  footer={
    <Button>操作</Button>
  }
  clickable={true}  // 可点击模式
  onClick={() => {/* 点击事件 */}}
/>
```

**要点**：
- ✅ 移动端内容分组使用 `MaterialCard`
- ✅ `clickable` 模式自动添加触摸反馈（缩放效果）
- ✅ 兼容现有 `Card` 组件 API

### 3. MobileForm（移动端表单）

**使用场景**：移动端表单页面

**参考实现**：`frontend/src/components/common/MobileForm.tsx`

```tsx
import { MobileForm, MobileFormField } from '@/components/common/MobileForm'

// ✅ 正确用法
<MobileForm
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  submitLabel="保存"
  cancelLabel="取消"
>
  <MobileFormField label="用户名" required>
    <Input placeholder="请输入用户名" />
  </MobileFormField>
  
  <MobileFormField label="密码" required>
    <Input type="password" placeholder="请输入密码" />
  </MobileFormField>
</MobileForm>
```

**要点**：
- ✅ 移动端表单使用 `MobileForm`，不要使用普通 `<form>`
- ✅ 输入框自动适配最小 44px 高度
- ✅ 底部操作栏自动固定在底部，适配 Safe Area
- ✅ 桌面端自动恢复常规样式

### 4. 响应式切换（表格 ↔ 列表）

**使用场景**：列表页面移动端卡片、桌面端表格

**参考实现**：`frontend/src/pages/users/UserListPage.tsx`

```tsx
// ✅ 正确：桌面端表格
<div className="hidden md:block">
  <Table>
    {/* 桌面端表格内容 */}
  </Table>
</div>

// ✅ 正确：移动端卡片列表
<div className="md:hidden">
  <div className="space-y-2">
    {data.map((item) => (
      <MaterialListItem
        key={item.id}
        title={item.name}
        description={item.description}
        // ...
      />
    ))}
  </div>
</div>
```

**要点**：
- ✅ 使用 `hidden md:block` 显示桌面端表格
- ✅ 使用 `md:hidden` 显示移动端列表
- ✅ 数据源统一，只切换展示方式
- ✅ 移动端使用 `MaterialListItem`，不要用 Table

---

## 📱 响应式断点

### Tailwind CSS 断点

```css
sm: 640px   /* 小屏幕 */
md: 768px   /* 中等屏幕（桌面端起点）⭐ */
lg: 1024px  /* 大屏幕 */
xl: 1280px  /* 超大屏幕 */
```

### 使用策略

**移动端优先写法**：
```tsx
// 默认移动端样式
<div className="flex-col space-y-4">
  {/* 移动端：纵向排列，间距 16px */}
  
  {/* 桌面端样式用 md: 前缀覆盖 */}
  <div className="md:flex-row md:space-y-0 md:space-x-4">
    {/* 桌面端：横向排列，间距 16px */}
  </div>
</div>
```

**常用模式**：
```tsx
// 显示/隐藏切换
<div className="md:hidden">移动端内容</div>
<div className="hidden md:block">桌面端内容</div>

// 布局切换
<div className="flex flex-col md:flex-row">
  {/* 移动端纵向，桌面端横向 */}
</div>

// 网格布局
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  {/* 移动端 1 列，平板 2 列，桌面 4 列 */}
</div>

// 尺寸调整
<div className="text-base md:text-lg">
  {/* 移动端基础字号，桌面端大字号 */}
</div>
```

---

## 📐 Safe Area 适配

### 什么是 Safe Area？

Safe Area 是屏幕的安全区域，不包括：
- 刘海屏（Notch）
- 系统状态栏
- 底部指示器（Home Indicator）

### 使用方式

**1. Top App Bar 和 Bottom Navigation**

这些组件已自动适配 Safe Area，无需手动处理。

**2. 页面内容区域**

```tsx
// ✅ 正确：使用自动适配类
<main className="mobile-main-content">
  {/* 自动适配顶部 Top App Bar 和底部 Bottom Navigation */}
</main>

// ✅ 正确：仅适配底部导航栏
<div className="mobile-content-area">
  {/* 仅适配底部 Bottom Navigation */}
</div>
```

**3. 固定底部元素**

```tsx
// ✅ 正确：表单底部操作栏
<div className="sticky bottom-0 safe-area-bottom">
  <Button>保存</Button>
</div>
```

**CSS 工具类**：
- `.safe-area-top` - 顶部安全区域占位
- `.safe-area-bottom` - 底部安全区域占位
- `.safe-area-left` - 左侧安全区域占位
- `.safe-area-right` - 右侧安全区域占位
- `.mobile-main-content` - 主内容区（自动适配上下导航栏）
- `.mobile-content-area` - 内容区（仅适配底部导航栏）

---

## ✅ 开发检查清单

在开发移动端页面时，必须检查以下项：

### 布局

- [ ] 使用移动端优先的响应式写法（默认移动端，`md:` 桌面端）
- [ ] 内容适配 Safe Area（使用 `.mobile-main-content` 或 `.mobile-content-area`）
- [ ] 主要操作位于底部（拇指区域）
- [ ] 最小触摸目标 44×44px
- [ ] 列表项最小高度 64px

### 组件

- [ ] 列表页面移动端使用 `MaterialListItem`（不要用 Table）
- [ ] 桌面端保持 Table 视图（`hidden md:block`）
- [ ] 表单页面移动端使用 `MobileForm`
- [ ] 卡片内容使用 `MaterialCard`
- [ ] 多个操作按钮使用 `DropdownMenu` 整合（移动端）

### 交互

- [ ] 点击反馈明显（active 状态）
- [ ] 加载状态清晰（Skeleton 组件）
- [ ] 错误提示友好（Toast 通知）
- [ ] 表单验证及时（实时反馈）

### 性能

- [ ] 首屏加载快速
- [ ] 滚动流畅（60fps）
- [ ] 图片懒加载
- [ ] 代码分割优化

### 可访问性

- [ ] 文字大小可读（最小 14px）
- [ ] 颜色对比度达标（WCAG AA）
- [ ] 支持键盘导航
- [ ] 屏幕阅读器友好（语义化 HTML）

---

## 📝 常见场景实现

### 场景 1：列表页面（Table ↔ MaterialListItem）

**参考**：`frontend/src/pages/users/UserListPage.tsx`

```tsx
// 1. 桌面端表格（隐藏移动端）
<div className="hidden md:block">
  <Table>
    <TableHeader>...</TableHeader>
    <TableBody>
      {data.map((item) => (
        <TableRow key={item.id}>
          <TableCell>{item.name}</TableCell>
          {/* ... */}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>

// 2. 移动端卡片列表（隐藏桌面端）
<div className="md:hidden">
  {data.map((item) => (
    <MaterialListItem
      key={item.id}
      icon={<Avatar>...</Avatar>}
      title={item.name}
      description={
        <div>
          <Badge>{item.role}</Badge>
          <span>{item.created_at}</span>
        </div>
      }
      actions={
        <DropdownMenu>
          <DropdownMenuItem>编辑</DropdownMenuItem>
          <DropdownMenuItem>删除</DropdownMenuItem>
        </DropdownMenu>
      }
    />
  ))}
</div>
```

### 场景 2：表单页面

**参考**：`frontend/src/components/common/MobileForm.tsx`

```tsx
import { MobileForm, MobileFormField } from '@/components/common/MobileForm'

<MobileForm
  onSubmit={handleSubmit}
  onCancel={() => navigate(-1)}
  submitLabel="保存"
  cancelLabel="取消"
>
  <MobileFormField label="用户名" required>
    <Input 
      placeholder="请输入用户名"
      className="min-h-[44px]"  // 确保 44px 高度
    />
  </MobileFormField>
  
  <MobileFormField label="密码" required>
    <Input 
      type="password"
      placeholder="请输入密码"
      className="min-h-[44px]"
    />
  </MobileFormField>
</MobileForm>
```

### 场景 3：Tabs 组件（移动端横向滚动）

**参考**：`frontend/src/pages/tools/rathole/index.tsx`

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  {/* 移动端：横向滚动容器，桌面端：网格布局 */}
  <div className="w-full overflow-x-auto md:overflow-x-visible scrollbar-hide">
    <TabsList className="inline-flex w-fit md:grid md:w-full md:grid-cols-4">
      <TabsTrigger value="tab1" className="flex-shrink-0 whitespace-nowrap px-3 md:px-2">
        Tab 1
      </TabsTrigger>
      {/* ... */}
    </TabsList>
  </div>
  
  <TabsContent value="tab1">
    {/* 内容 */}
  </TabsContent>
</Tabs>
```

**要点**：
- 移动端使用 `overflow-x-auto` 实现横向滚动
- `scrollbar-hide` 隐藏滚动条但保持滚动功能
- `flex-shrink-0` 防止 Tab 被压缩
- `whitespace-nowrap` 防止文字换行

### 场景 4：按钮布局（移动端纵向，桌面端横向）

```tsx
// ✅ 正确
<div className="flex flex-col md:flex-row gap-2">
  <Button className="w-full md:w-auto">
    取消
  </Button>
  <Button className="w-full md:w-auto">
    保存
  </Button>
</div>
```

### 场景 5：卡片网格布局

```tsx
// ✅ 正确：移动端单列，桌面端多列
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {items.map((item) => (
    <MaterialCard key={item.id} title={item.title}>
      {/* 内容 */}
    </MaterialCard>
  ))}
</div>
```

---

## 🚫 常见错误

### 错误 1：桌面端优先写法

```tsx
// ❌ 错误
<div className="grid grid-cols-4 md:grid-cols-1">
  {/* 默认桌面端 4 列，移动端 1 列 */}
</div>

// ✅ 正确
<div className="grid grid-cols-1 md:grid-cols-4">
  {/* 默认移动端 1 列，桌面端 4 列 */}
</div>
```

### 错误 2：移动端使用 Table

```tsx
// ❌ 错误：移动端用 Table
<Table>
  {/* 移动端 Table 拥挤，难以操作 */}
</Table>

// ✅ 正确：移动端用 MaterialListItem
<div className="md:hidden">
  {data.map((item) => (
    <MaterialListItem key={item.id} {...item} />
  ))}
</div>

<div className="hidden md:block">
  <Table>{/* 桌面端 Table */}</Table>
</div>
```

### 错误 3：触摸目标太小

```tsx
// ❌ 错误：按钮太小
<Button className="h-8 w-8">
  <Icon className="size-4" />
</Button>

// ✅ 正确：最小 44×44px
<Button className="min-h-[44px] min-w-[44px]">
  <Icon className="size-5" />
</Button>
```

### 错误 4：忽略 Safe Area

```tsx
// ❌ 错误：固定底部但未适配 Safe Area
<div className="fixed bottom-0">
  <Button>保存</Button>
</div>

// ✅ 正确：使用 safe-area-bottom
<div className="fixed bottom-0 safe-area-bottom">
  <Button>保存</Button>
</div>
```

### 错误 5：手动实现列表项

```tsx
// ❌ 错误：手动实现列表项
<div className="flex items-center p-4 border-b">
  <div>标题</div>
  <div>描述</div>
  <Button>操作</Button>
</div>

// ✅ 正确：使用 MaterialListItem
<MaterialListItem
  title="标题"
  description="描述"
  actions={<Button>操作</Button>}
/>
```

---

## 📚 参考资源

### 项目文件

- `frontend/src/components/common/MaterialListItem.tsx` - 列表项组件
- `frontend/src/components/common/MaterialCard.tsx` - 卡片组件
- `frontend/src/components/common/MobileForm.tsx` - 表单组件
- `frontend/src/components/layout/MobileTopBar.tsx` - 顶部应用栏
- `frontend/src/components/layout/MobileBottomNav.tsx` - 底部导航栏
- `frontend/src/pages/users/UserListPage.tsx` - 列表页面示例
- `frontend/src/pages/tools/rathole/index.tsx` - Tabs 横向滚动示例

### 外部资源

1. **Android Material Design**
   - [Layout Basics](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-basics)
   - [Navigation Patterns](https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns)
   - [canonical-layouts](https://developer.android.com/design/ui/mobile/guides/layout-and-content/canonical-layouts)

2. **Material Design Components**
   - [Bottom Navigation](https://m3.material.io/components/navigation-bar/overview)
   - [Top App Bar](https://m3.material.io/components/top-app-bar/overview)
   - [Navigation Drawer](https://m3.material.io/components/navigation-drawer/overview)

---

## 🎯 总结

### 核心规则（必须记住）

1. **✅ 移动端优先** - 默认移动端样式，`md:` 前缀桌面端样式
2. **✅ 触摸优化** - 最小触摸目标 44×44px，列表项 64px
3. **✅ 使用专用组件** - `MaterialListItem`、`MaterialCard`、`MobileForm`
4. **✅ Safe Area 适配** - 使用 `.mobile-main-content` 或 `.safe-area-*` 工具类
5. **✅ 响应式切换** - 移动端卡片列表，桌面端表格视图
6. **✅ 操作整合** - 移动端多个按钮使用 `DropdownMenu`

### 开发流程

```
1. 分析页面类型（列表/表单/配置）
   ↓
2. 移动端使用专用组件（MaterialListItem/MobileForm）
   ↓
3. 桌面端保持原有布局（Table/常规表单）
   ↓
4. 使用 hidden md:block / md:hidden 切换显示
   ↓
5. 检查触摸目标、Safe Area、响应式
   ↓
6. 完成 ✅
```


