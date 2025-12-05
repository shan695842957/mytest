/**
 * 主题初始化工具
 * 根据 shadcn/ui 最佳实践：https://ui.shadcn.com/docs/theming
 * 
 * 使用 CSS 类名和 data-theme 属性切换主题，而不是动态设置 CSS 变量
 * 所有主题变量都在 CSS 中定义，性能更好，更符合最佳实践
 */

import { DEFAULT_COLOR, DEFAULT_THEME } from '@/config/theme'
import type { ThemeMode, ThemeColor } from '@/config/theme'

/**
 * 从 localStorage 获取主题配置
 */
function getStoredTheme(): { mode: ThemeMode; color: ThemeColor } {
  try {
    const stored = localStorage.getItem('theme-storage')
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        mode: parsed.state?.mode || DEFAULT_THEME,
        color: parsed.state?.color || DEFAULT_COLOR,
      }
    }
  } catch (error) {
    console.warn('读取主题配置失败', error)
  }
  
  return {
    mode: DEFAULT_THEME,
    color: DEFAULT_COLOR,
  }
}

/**
 * 应用主题到 DOM
 * 
 * 根据 shadcn/ui 最佳实践，使用以下方式：
 * 1. 使用 data-theme 属性指定配色方案
 * 2. 使用 light/dark 类指定明暗模式
 * 
 * 所有主题变量都在 CSS 中定义（index.css），不使用 JavaScript 动态设置
 */
export function applyTheme(mode: ThemeMode, color: ThemeColor) {
  const root = document.documentElement
  
  try {
    // 1. 移除所有可能的主题类
    root.classList.remove('light', 'dark')
    
    // 2. 应用明暗模式类
    root.classList.add(mode)
    
    // 3. 移除所有可能的主题配色方案
    const themeColors: ThemeColor[] = ['neutral', 'blue', 'green', 'purple', 'yellow']
    themeColors.forEach((c) => {
      root.removeAttribute(`data-theme`)
    })
    
    // 4. 应用配色方案（如果不是默认的 neutral，需要设置 data-theme）
    // neutral 是默认主题，不需要 data-theme 属性
    if (color !== 'neutral') {
      root.setAttribute('data-theme', color)
    }
  } catch (error) {
    console.error('❌ 应用主题失败', error)
  }
}

/**
 * 初始化主题（立即执行）
 */
export function initTheme() {
  const { mode, color } = getStoredTheme()
  applyTheme(mode, color)
}

// 🚨 立即执行主题初始化（在任何组件渲染之前）
initTheme()

