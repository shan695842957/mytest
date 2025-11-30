/**
 * 通信实例相关的 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  getCommInstanceList,
  getCommInstanceDetail,
  createCommInstance,
  updateCommInstance,
  deleteCommInstance,
} from '@/api/commInstances'
import { queryKeys } from '@/config/query'
import type {
  CommInstanceListParams,
  CreateCommInstanceRequest,
  UpdateCommInstanceRequest,
} from '@/types'

/**
 * 获取通信实例列表
 */
export function useCommInstanceList(params?: CommInstanceListParams) {
  return useQuery({
    queryKey: queryKeys.commInstances.list(params),
    queryFn: () => getCommInstanceList(params),
  })
}

/**
 * 获取通信实例详情
 */
export function useCommInstanceDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.commInstances.detail(id),
    queryFn: () => getCommInstanceDetail(id),
    enabled: !!id,
  })
}

/**
 * 创建通信实例
 */
export function useCreateCommInstance() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: (data: CreateCommInstanceRequest) => createCommInstance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commInstances.lists() })
      toast.success(t('commInstance.success.created'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('commInstance.list.empty'))
    },
  })
}

/**
 * 更新通信实例
 */
export function useUpdateCommInstance() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCommInstanceRequest }) =>
      updateCommInstance(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commInstances.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.commInstances.detail(variables.id) })
      toast.success(t('commInstance.success.updated'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('commInstance.list.empty'))
    },
  })
}

/**
 * 删除通信实例
 */
export function useDeleteCommInstance() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: (id: number) => deleteCommInstance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commInstances.lists() })
      toast.success(t('commInstance.success.deleted'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('commInstance.list.empty'))
    },
  })
}

