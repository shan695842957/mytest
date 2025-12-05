/**
 * 全局常量配置
 * 所有可配置项都通过环境变量管理
 */

// API 配置
// 如果设置了环境变量，使用环境变量的值
// 否则根据环境自动判断：
//   - 开发环境（localhost 或 127.0.0.1）：默认使用 http://localhost:18000
//   - 生产环境：使用相对路径（自动使用当前域名）
const getDefaultApiBaseUrl = (): string => {
  // 如果设置了环境变量，直接使用
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }

  // 开发环境：检测是否是 localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:18000'
    }
  }

  // 生产环境：使用相对路径（空字符串）
  return ''
}

export const API_BASE_URL = getDefaultApiBaseUrl()
export const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1'

// 请求配置
export const REQUEST_TIMEOUT = parseInt(import.meta.env.VITE_REQUEST_TIMEOUT || '30000', 10)

// 认证相关（应用内部常量，通常不需要修改）
export const TOKEN_KEY = 'access_token'
export const TOKEN_TYPE = 'Bearer'

// 本地存储键（应用内部常量）
export const STORAGE_KEYS = {
  TOKEN: TOKEN_KEY,
  USER: 'user_info',
  LOCALE: 'i18nextLng',
} as const

// 分页默认配置（UI配置，可通过环境变量覆盖）
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: parseInt(import.meta.env.VITE_PAGINATION_DEFAULT_SIZE || '10', 10),
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const

