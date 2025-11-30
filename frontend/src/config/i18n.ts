/**
 * i18n 国际化配置
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 导入翻译资源
import zhCN_common from '@/locales/zh-CN/common.json'
import zhCN_auth from '@/locales/zh-CN/auth.json'
import zhCN_menu from '@/locales/zh-CN/menu.json'
import zhCN_audit from '@/locales/zh-CN/audit.json'
import zhCN_settings from '@/locales/zh-CN/settings.json'
import zhCN_user from '@/locales/zh-CN/user.json'
import zhCN_gateway from '@/locales/zh-CN/gateway.json'
import zhCN_software from '@/locales/zh-CN/software.json'
import zhCN_tools from '@/locales/zh-CN/tools.json'
import zhCN_config from '@/locales/zh-CN/config.json'
import zhCN_soe from '@/locales/zh-CN/soe.json'
import zhCN_lightPanel from '@/locales/zh-CN/lightPanel.json'
import zhCN_testPanel from '@/locales/zh-CN/testPanel.json'
import enUS_common from '@/locales/en-US/common.json'
import enUS_auth from '@/locales/en-US/auth.json'
import enUS_menu from '@/locales/en-US/menu.json'
import enUS_audit from '@/locales/en-US/audit.json'
import enUS_settings from '@/locales/en-US/settings.json'
import enUS_user from '@/locales/en-US/user.json'
import enUS_gateway from '@/locales/en-US/gateway.json'
import enUS_software from '@/locales/en-US/software.json'
import enUS_tools from '@/locales/en-US/tools.json'
import enUS_config from '@/locales/en-US/config.json'
import enUS_soe from '@/locales/en-US/soe.json'
import enUS_lightPanel from '@/locales/en-US/lightPanel.json'
import enUS_testPanel from '@/locales/en-US/testPanel.json'

// 支持的语言
export const SUPPORTED_LOCALES = {
  'zh-CN': '简体中文',
  'en-US': 'English',
} as const

export type LocaleKey = keyof typeof SUPPORTED_LOCALES

// 默认语言
export const DEFAULT_LOCALE: LocaleKey = 'zh-CN'

// 翻译资源
const resources = {
  'zh-CN': {
    common: zhCN_common,
    auth: zhCN_auth,
    menu: zhCN_menu,
    audit: zhCN_audit,
    settings: zhCN_settings,
    user: zhCN_user,
    gateway: zhCN_gateway,
    software: zhCN_software,
    tools: zhCN_tools,
    config: zhCN_config,
    soe: zhCN_soe,
    lightPanel: zhCN_lightPanel,
    testPanel: zhCN_testPanel,
  },
  'en-US': {
    common: enUS_common,
    auth: enUS_auth,
    menu: enUS_menu,
    audit: enUS_audit,
    settings: enUS_settings,
    user: enUS_user,
    gateway: enUS_gateway,
    software: enUS_software,
    tools: enUS_tools,
    config: enUS_config,
    soe: enUS_soe,
    lightPanel: enUS_lightPanel,
    testPanel: enUS_testPanel,
  },
}

// 初始化 i18next
i18n
  .use(LanguageDetector) // 自动检测语言
  .use(initReactI18next) // React 集成
  .init({
    resources,
    fallbackLng: DEFAULT_LOCALE,
    defaultNS: 'common',
    ns: ['common', 'auth', 'menu', 'audit', 'settings', 'user', 'gateway', 'software', 'tools', 'config', 'soe', 'lightPanel', 'testPanel'],
    
    interpolation: {
      escapeValue: false, // React 已经处理了 XSS
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    
    // 调试模式（生产环境关闭）
    debug: import.meta.env.DEV,
  })

export default i18n

