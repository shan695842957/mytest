/**
 * 主题 Hook
 */

import { useThemeStore } from '@/stores/themeStore'

export function useTheme() {
  const { mode, color, setMode, setColor, toggleMode } = useThemeStore()
  
  return {
    mode,
    color,
    setMode,
    setColor,
    toggleMode,
    isDark: mode === 'dark',
    isLight: mode === 'light',
  }
}

