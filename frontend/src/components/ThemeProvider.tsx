/**
 * 主题提供者组件
 * 监听主题变化并同步到 DOM
 */

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useThemeStore } from '@/stores/themeStore'
import { applyTheme } from '@/utils/initTheme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { mode, color } = useThemeStore()
  
  // 监听主题变化，实时应用
  useEffect(() => {
    applyTheme(mode, color)
  }, [mode, color])
  
  return <>{children}</>
}

