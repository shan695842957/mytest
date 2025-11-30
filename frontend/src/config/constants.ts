/**
 * 全局常量配置
 */

/**
 * 动态获取 API 基础地址
 * 如果浏览器访问的是 http://172.20.10.4:5173，自动将端口改为 18000
 * 优先级：环境变量 > 动态生成（基于当前页面地址）> 默认值
 */
function getApiBaseUrl(): string {
  // 优先使用环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  
  // 在浏览器环境中，根据当前页面地址动态生成
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location
    
    // 如果当前页面有端口号，将端口改为 18000
    if (port) {
      return `${protocol}//${hostname}:18000`
    }
    
    // 如果没有端口号（默认端口），使用当前协议和主机名，端口 18000
    return `${protocol}//${hostname}:18000`
  }
  
  // 非浏览器环境（SSR 等），使用默认值
  return 'http://localhost:18000'
}

// API 基础地址（动态绑定）
export const API_BASE_URL = getApiBaseUrl()

// API 路径前缀
export const API_PREFIX = '/api/v1'

// 认证相关
export const TOKEN_KEY = 'access_token'
export const TOKEN_TYPE = 'Bearer'

// 本地存储键
export const STORAGE_KEYS = {
  TOKEN: TOKEN_KEY,
  USER: 'user_info',
  LOCALE: 'i18nextLng',
} as const

// 请求超时时间（毫秒）
export const REQUEST_TIMEOUT = 30000

// 分页默认配置
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const

