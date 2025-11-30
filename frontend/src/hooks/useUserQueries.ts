/**
 * 用户管理相关的 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  getUserList,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
} from '@/api/auth'
import { queryKeys } from '@/config/query'
import type { UserListParams, CreateUserRequest, UpdateUserRequest, ChangePasswordRequest } from '@/types'

/**
 * 获取用户列表
 */
export function useUserList(params?: UserListParams) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => getUserList(params),
  })
}

/**
 * 获取用户详情
 */
export function useUserDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => getUserDetail(id),
    enabled: !!id,
  })
}

/**
 * 创建用户
 */
export function useCreateUser() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('common')
  
  return useMutation({
    mutationFn: (data: CreateUserRequest) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
      toast.success(t('message.create_success'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('message.failed'))
    },
  })
}

/**
 * 更新用户
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('common')
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) =>
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
      toast.success(t('message.update_success'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('message.failed'))
    },
  })
}

/**
 * 删除用户
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('common')
  
  return useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() })
      toast.success(t('message.delete_success'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('message.failed'))
    },
  })
}

/**
 * 修改密码
 */
export function useChangePassword() {
  const { t } = useTranslation('auth')
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChangePasswordRequest }) =>
      changePassword(id, data),
    onSuccess: () => {
      toast.success(t('user.password_changed'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('common:message.failed'))
    },
  })
}

