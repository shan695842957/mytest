/**
 * 用户相关类型定义
 */

/**
 * 用户角色枚举（权限级别从高到低）
 */
export enum UserRole {
  DEVELOPER = 'developer', // 开发者（最高权限）级别3
  OPERATOR = 'operator',   // 运维者（中等权限）级别2
  USER = 'user',           // 用户（基础权限）级别1
}

/**
 * 角色权限级别映射
 */
export const ROLE_LEVELS: Record<UserRole, number> = {
  [UserRole.DEVELOPER]: 3,
  [UserRole.OPERATOR]: 2,
  [UserRole.USER]: 1,
}

/**
 * 用户信息
 */
export interface User {
  id: number
  username: string
  role: UserRole
  is_builtin: boolean
  is_active: boolean
  created_by: number | null
  created_at: string
  updated_at: string
}

/**
 * 登录凭证
 */
export interface LoginCredentials {
  username: string
  password: string
}

/**
 * 登录响应
 */
export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

/**
 * 创建用户请求
 */
export interface CreateUserRequest {
  username: string
  password: string
  role: UserRole
}

/**
 * 更新用户请求
 */
export interface UpdateUserRequest {
  username?: string
  role?: UserRole
  is_active?: boolean
}

/**
 * 修改密码请求
 */
export interface ChangePasswordRequest {
  old_password?: string // 修改自己的密码需要旧密码
  new_password: string
}

/**
 * 用户列表查询参数
 */
export interface UserListParams {
  skip?: number
  limit?: number
  role?: UserRole
  is_active?: boolean
  search?: string
}

