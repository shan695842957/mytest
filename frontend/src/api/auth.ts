/**
 * 认证相关 API
 */

import { http } from '@/utils/request'
import type {
  LoginCredentials,
  LoginResponse,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  UserListParams,
  PaginatedData,
} from '@/types'

/**
 * 登录
 */
export const login = async (credentials: LoginCredentials) => {
  const response = await http.post<LoginResponse>('/auth/login', credentials)
  return response.data
}

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async () => {
  const response = await http.get<User>('/auth/users/me')
  return response.data
}

/**
 * 获取用户列表
 */
export const getUserList = async (params?: UserListParams) => {
  const response = await http.get<PaginatedData<User>>('/auth/users', { params })
  return response.data
}

/**
 * 获取用户详情
 */
export const getUserDetail = async (id: number) => {
  const response = await http.get<User>(`/auth/users/${id}`)
  return response.data
}

/**
 * 创建用户
 */
export const createUser = async (data: CreateUserRequest) => {
  const response = await http.post<User>('/auth/users', data)
  return response.data
}

/**
 * 更新用户
 */
export const updateUser = async (id: number, data: UpdateUserRequest) => {
  const response = await http.patch<User>(`/auth/users/${id}`, data)
  return response.data
}

/**
 * 删除用户
 */
export const deleteUser = async (id: number) => {
  const response = await http.delete(`/auth/users/${id}`)
  return response.data
}

/**
 * 修改密码
 */
export const changePassword = async (id: number, data: ChangePasswordRequest) => {
  const response = await http.post(`/auth/users/${id}/change-password`, data)
  return response.data
}

