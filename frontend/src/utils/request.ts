/**
 * Axios 请求封装
 * 包含拦截器、错误处理、Token 管理
 */

import axios, { AxiosError } from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { API_BASE_URL, API_PREFIX, REQUEST_TIMEOUT, STORAGE_KEYS, TOKEN_TYPE } from '@/config/constants'
import type { ApiResponse } from '@/types'
import { ApiError, ErrorCode } from '@/types'
import i18n from '@/config/i18n'

/**
 * 创建 Axios 实例
 */
const request: AxiosInstance = axios.create({
  baseURL: API_BASE_URL + API_PREFIX,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * 请求拦截器
 */
request.interceptors.request.use(
  (config) => {
    // 添加 Token
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token && config.headers) {
      config.headers.Authorization = `${TOKEN_TYPE} ${token}`
    }
    
    // 添加语言头
    const locale = i18n.language || 'zh-CN'
    if (config.headers) {
      config.headers['Accept-Language'] = locale
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器
 */
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response
    
    // 如果是统一响应格式
    if (data && typeof data === 'object' && 'success' in data) {
      // 业务成功
      if (data.success) {
        return response
      }
      
      // 业务失败
      throw new ApiError(
        data.code || ErrorCode.UNKNOWN_ERROR,
        data.message || i18n.t('message.failed', { ns: 'common' }),
        response.status,
        data
      )
    }
    
    // 非统一格式，直接返回
    return response
  },
  (error: AxiosError<ApiResponse>) => {
    // 网络错误
    if (!error.response) {
      const apiError = new ApiError(
        ErrorCode.UNKNOWN_ERROR,
        i18n.t('message.network_error', { ns: 'common' }),
        0,
        error
      )
      return Promise.reject(apiError)
    }
    
    const { status, data } = error.response
    
    // Token 过期或无效
    if (status === 401) {
      // 清除本地存储
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
      
      // 跳转到登录页（避免循环，只在非登录页时跳转）
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      
      throw new ApiError(
        ErrorCode.UNAUTHORIZED,
        data?.message || i18n.t('auth.error.unauthorized', { ns: 'auth' }),
        status,
        data
      )
    }
    
    // 权限不足
    if (status === 403) {
      throw new ApiError(
        ErrorCode.FORBIDDEN,
        data?.message || i18n.t('auth.error.forbidden', { ns: 'auth' }),
        status,
        data
      )
    }
    
    // 其他错误
    throw new ApiError(
      data?.code || ErrorCode.UNKNOWN_ERROR,
      data?.message || i18n.t('message.unknown_error', { ns: 'common' }),
      status,
      data
    )
  }
)

/**
 * 通用请求方法
 */
export const http = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => 
    request.get<ApiResponse<T>>(url, config),
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    request.post<ApiResponse<T>>(url, data, config),
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    request.put<ApiResponse<T>>(url, data, config),
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    request.patch<ApiResponse<T>>(url, data, config),
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => 
    request.delete<ApiResponse<T>>(url, config),
}

export default request

