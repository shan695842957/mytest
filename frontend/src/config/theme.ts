/**
 * 主题配置
 * 参考 shadcn/ui 官方 theming 方案
 * https://ui.shadcn.com/docs/theming
 * 
 * 注意：所有主题变量都在 CSS 中定义（index.css），不再需要 JavaScript 配置
 * 这里只保留类型定义和默认值
 */

export type ThemeMode = 'light' | 'dark'
export type ThemeColor = 'neutral' | 'blue' | 'green' | 'purple' | 'yellow'

/**
 * 主题配色方案说明
 * 
 * 所有主题变量都在 CSS 中定义（index.css），通过 data-theme 属性和 light/dark 类切换
 * 
 * 1. neutral - 中性经典：经典百搭，适用于所有场景
 * 2. blue - 蓝色专业：专业商务，信任可靠，企业级首选
 * 3. green - 绿色自然：自然清新，生机活力，环保主题
 * 4. purple - 紫色优雅：优雅高贵，艺术感强，创意设计
 * 5. yellow - 黄色温暖：温暖明亮，活力阳光，乐观积极
 */
export const THEME_COLORS = {
  // 保留这个对象用于类型检查，但实际不使用（主题在 CSS 中定义）
  // 这些主题配置仅供参考，实际主题变量都在 CSS 中定义
  // 这里保留是为了类型兼容性
} as const

/**
 * 默认主题
 */
export const DEFAULT_THEME: ThemeMode = 'light'
export const DEFAULT_COLOR: ThemeColor = 'neutral' // 默认使用中性经典主题

