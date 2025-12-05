/**
 * 主题状态管理
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeMode, ThemeColor } from '@/config/theme'
import { DEFAULT_THEME, DEFAULT_COLOR } from '@/config/theme'

interface ThemeState {
  mode: ThemeMode
  color: ThemeColor
  setMode: (mode: ThemeMode) => void
  setColor: (color: ThemeColor) => void
  toggleMode: () => void
}

/**
 * 应用主题到 DOM（从工具模块导入）
 */
import { applyTheme } from '@/utils/initTheme'

/**
 * 主题 Store
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: DEFAULT_THEME,
      color: DEFAULT_COLOR,
      
      setMode: (mode) => {
        set({ mode })
        applyTheme(mode, get().color)
      },
      
      setColor: (color) => {
        set({ color })
        applyTheme(get().mode, color)
      },
      
      toggleMode: () => {
        const newMode = get().mode === 'light' ? 'dark' : 'light'
        get().setMode(newMode)
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // 恢复主题时应用到 DOM
        if (state) {
          applyTheme(state.mode, state.color)
        }
      },
    }
  )
)

