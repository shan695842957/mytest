# 主题系统文档

## 🎨 主题配置

LCCU-V Frontend 使用 **shadcn/ui 官方主题方案**，基于 **OKLCH 颜色空间** 和 **CSS 变量**实现动态主题切换。

参考文档：https://ui.shadcn.com/docs/theming

## 📐 主题架构

### 1. 主题配色方案

项目支持 **3 种配色方案** × **2 种模式** = 6 种主题：

| 配色方案 | 说明 | 适用场景 |
|---------|------|---------|
| **tech-black** ⭐ | 科技黑（默认） | 干净通透、现代专业、高级感 |
| **neutral** | 中性灰 | 经典商务、稳重大气 |
| **slate** | 蓝灰色 | 科技感、冷静专业 |

### 2. 模式切换

- **Light** - 浅色模式（默认）
- **Dark** - 深色模式

## 🎯 科技蓝主题（默认）⭐

### 设计理念
- **活泼科技感**：蓝色主色调，视觉有活力
- **高对比度**：按钮清晰可见，易于识别
- **现代专业**：符合现代 Web 应用审美

### 浅色模式
```css
--primary: oklch(0.3686 0.1582 264.05)  /* 鲜明蓝色 #2563eb */
--background: oklch(0.99 0 0)            /* 纯白背景 */
--foreground: oklch(0.145 0.006 285.885) /* 深色文字 */
--ring: oklch(0.3686 0.1582 264.05)      /* 蓝色聚焦环 */
```

### 深色模式
```css
--primary: oklch(0.5176 0.1582 264.05)   /* 亮蓝色 #3b82f6 */
--background: oklch(0.12 0.006 285.885)  /* 深蓝黑背景 */
--foreground: oklch(0.9824 0.0064 285.885) /* 近白文字 */
--ring: oklch(0.5176 0.1582 264.05)      /* 蓝色聚焦环 */
```

## 🔧 使用方法

### 1. 主题切换

```tsx
import { useTheme } from '@/hooks/useTheme'

function Component() {
  const { mode, toggleMode, setColor } = useTheme()
  
  // 切换亮色/暗色
  <Button onClick={toggleMode}>
    {mode === 'dark' ? <Sun /> : <Moon />}
  </Button>
  
  // 切换配色方案
  <Button onClick={() => setColor('tech-blue')}>科技蓝</Button>
  <Button onClick={() => setColor('slate')}>蓝灰色</Button>
}
```

### 2. 在组件中使用主题颜色

```tsx
// ✅ 使用 Tailwind 工具类（推荐）
<div className="bg-background text-foreground">
  <div className="bg-card border">
    <Button>按钮</Button>
  </div>
</div>

// ✅ 使用 CSS 变量
<div style={{ backgroundColor: 'var(--background)' }}>
  内容
</div>
```

## 📊 完整 CSS 变量列表

### 基础颜色
- `--background` - 页面背景色
- `--foreground` - 文字颜色

### 组件颜色
- `--card` / `--card-foreground` - 卡片
- `--popover` / `--popover-foreground` - 弹出框
- `--primary` / `--primary-foreground` - 主要按钮
- `--secondary` / `--secondary-foreground` - 次要按钮
- `--muted` / `--muted-foreground` - 柔和/禁用
- `--accent` / `--accent-foreground` - 强调色

### 功能颜色
- `--destructive` / `--destructive-foreground` - 危险操作
- `--border` - 边框
- `--input` - 输入框边框
- `--ring` - 聚焦环

### 其他
- `--radius` - 圆角大小（0.5rem）

## 🎨 设计规范

### 颜色使用建议

| 场景 | 使用变量 | 说明 |
|------|---------|------|
| 页面背景 | `bg-background` | 主背景色 |
| 卡片背景 | `bg-card` | 内容卡片 |
| 主要按钮 | `bg-primary` | CTA 按钮 |
| 次要按钮 | `bg-secondary` | 普通按钮 |
| 删除按钮 | `bg-destructive` | 危险操作 |
| 文字颜色 | `text-foreground` | 正文 |
| 次要文字 | `text-muted-foreground` | 说明文字 |
| 边框 | `border` | 分割线、卡片边框 |

### 间距规范

```css
--radius: 0.5rem  /* 默认圆角 */
```

## 🌈 扩展新主题

### 添加新配色方案

1. 在 `src/config/theme.ts` 添加配色：

```typescript
export const THEME_COLORS = {
  'new-theme': {
    light: {
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.145 0 0)',
      primary: 'oklch(0.xxx 0.xxx xxx)',  // 自定义主色
      // ... 其他17个变量
    },
    dark: { /* 深色模式配置 */ },
  },
}

// 2. 更新类型
export type ThemeColor = 'tech-blue' | 'slate' | 'new-theme'
```

2. 在 `src/index.css` 的 `@theme` 块已自动生效，无需修改

## 🔄 主题持久化

主题配置会自动保存到 `localStorage`：

```typescript
// 存储键
'theme-storage' = {
  mode: 'light' | 'dark',
  color: 'tech-black' | 'neutral' | 'slate'
}
```

## 📱 响应式主题

主题系统完全支持响应式设计：
- ✅ 移动端适配
- ✅ 平板适配
- ✅ 桌面端优化

## 🚀 性能优化

### 1. CSS 变量切换
- 使用 CSS 变量实现主题切换
- 无需重新渲染组件
- 切换速度 < 50ms

### 2. 平滑过渡
```css
transition-duration: 200ms  /* 200毫秒平滑过渡 */
```

### 3. 本地缓存
- 主题配置持久化到 localStorage
- 下次访问自动恢复

## 🎯 登录页面设计

### 大厂级别审美

参考 **Google、Apple、Microsoft** 的登录页设计：

#### 布局结构
```
┌────────────────┬────────────────┐
│                │   🌙 🌐        │
│  左侧品牌展示   │                │
│  - Logo       │   登录表单      │
│  - 标题       │   - 用户名      │
│  - 特性介绍    │   - 密码       │
│  - 装饰背景    │   - 登录按钮    │
│                │                │
│  版权信息      │   提示信息      │
└────────────────┴────────────────┘
```

#### 设计特点
- ✅ **左右分栏**（桌面端）
- ✅ **品牌展示区**：Logo + 渐变背景 + 网格装饰
- ✅ **特性卡片**：展示核心功能
- ✅ **圆角图标**：柔和、现代
- ✅ **毛玻璃效果**：`backdrop-blur-sm`
- ✅ **动画效果**：Hover 动画 + 过渡
- ✅ **响应式**：移动端单栏布局

#### 右上角工具栏
- 🌙 **主题切换**：浅色 ⇄ 深色
- 🌐 **语言切换**：中文 ⇄ English

## 📝 最佳实践

### ✅ 推荐做法

1. **始终使用 CSS 变量**
   ```tsx
   <div className="bg-background text-foreground" />
   ```

2. **使用 Tailwind 工具类**
   ```tsx
   <div className="bg-card border rounded-lg" />
   ```

3. **添加平滑过渡**
   - 已在全局 CSS 中配置
   - 所有颜色变化自动平滑过渡

### ❌ 避免的做法

1. **不要硬编码颜色**
   ```tsx
   // ❌ 错误
   <div style={{ backgroundColor: '#000' }} />
   
   // ✅ 正确
   <div className="bg-primary" />
   ```

2. **不要使用 hex/rgb 颜色**
   ```tsx
   // ❌ 错误
   className="bg-[#000]"
   
   // ✅ 正确
   className="bg-primary"
   ```

## 🎁 额外功能

### 平滑过渡动画
```css
transition-property: background-color, border-color, color, fill, stroke
transition-duration: 200ms
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)
```

### 系统字体栈
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```

## 🔮 未来扩展

- [ ] 自定义主题编辑器
- [ ] 更多预设主题
- [ ] 自动跟随系统主题
- [ ] 主题预览功能

---

**主题系统版本**: v1.0.0  
**最后更新**: 2025-11-06

