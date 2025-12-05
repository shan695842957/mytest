/**
 * API 响应类型定义
 */

/**
 * 标准错误码（与后端 ErrorCode 对应）
 */
export enum ErrorCode {
  // 通用错误 (1-999)
  SUCCESS = 0,
  UNKNOWN_ERROR = 1,
  VALIDATION_ERROR = 2,
  RESOURCE_NOT_FOUND = 3,
  OPERATION_FAILED = 4,
  
  // 认证错误 (1000-1099)
  UNAUTHORIZED = 1000,
  INVALID_CREDENTIALS = 1001,
  TOKEN_EXPIRED = 1002,
  TOKEN_INVALID = 1003,
  USER_INACTIVE = 1004,
  USER_NOT_FOUND = 1005,
  USERNAME_EXISTS = 1006,
  WEAK_PASSWORD = 1007,
  
  // 权限错误 (1100-1199)
  FORBIDDEN = 1100,
  NO_PERMISSION_CREATE = 1101,
  NO_PERMISSION_VIEW = 1102,
  NO_PERMISSION_UPDATE = 1103,
  NO_PERMISSION_DELETE = 1104,
  NO_PERMISSION_CHANGE_PASSWORD = 1105,
  CANNOT_DELETE_BUILTIN = 1106,
  CANNOT_DELETE_SELF = 1107,
  CANNOT_UPDATE_SELF = 1108,
}

/**
 * 分页信息
 */
export interface PaginationInfo {
  total: number
  page: number
  page_size: number
  total_pages: number
}

/**
 * 响应元数据
 */
export interface ResponseMetadata {
  timestamp: string
  request_id: string
  locale: string
}

/**
 * 统一 API 响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean
  code: ErrorCode
  message: string
  data: T | null
  pagination?: PaginationInfo
  metadata?: ResponseMetadata
}

/**
 * 分页响应数据
 * 后端返回 ApiResponse<List<T>>，其中 data 是数组，pagination 是分页信息
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationInfo
}

/**
 * API 错误
 */
export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

