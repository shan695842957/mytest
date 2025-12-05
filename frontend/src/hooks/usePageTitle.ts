/**
 * 页面标题 Hook
 * 根据 i18n 语言自动更新浏览器标签页标题
 */

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function usePageTitle() {
  const { t, i18n } = useTranslation('common')

  useEffect(() => {
    // 监听语言变化，自动更新页面标题
    const updateTitle = () => {
      document.title = t('app.pageTitle')
    }

    // 初始化标题
    updateTitle()

    // 监听语言变化事件
    i18n.on('languageChanged', updateTitle)

    // 清理监听器
    return () => {
      i18n.off('languageChanged', updateTitle)
    }
  }, [t, i18n])
}

