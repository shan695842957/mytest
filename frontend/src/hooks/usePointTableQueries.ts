/**
 * 点表相关的 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  getPointTableTemplateList,
  getPointTableTemplateDetail,
  createPointTableTemplate,
  updatePointTableTemplate,
  clonePointTableTemplate,
  deletePointTableTemplate,
  getPointTablePointList,
  createPointTablePoint,
  updatePointTablePoint,
  deletePointTablePoint,
  clonePointTablePoint,
} from '@/api/pointTables'
import { queryKeys } from '@/config/query'
import type {
  PointTableTemplateListParams,
  CreatePointTableTemplateRequest,
  UpdatePointTableTemplateRequest,
  ClonePointTableTemplateRequest,
  CreatePointTablePointRequest,
  UpdatePointTablePointRequest,
  ClonePointTablePointRequest,
} from '@/types'

/**
 * 获取点表模板列表
 */
export function usePointTableTemplateList(params?: PointTableTemplateListParams) {
  return useQuery({
    queryKey: queryKeys.pointTables.list(params),
    queryFn: () => getPointTableTemplateList(params),
  })
}

/**
 * 获取点表模板详情
 */
export function usePointTableTemplateDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.pointTables.detail(id),
    queryFn: () => getPointTableTemplateDetail(id),
    enabled: !!id,
  })
}

/**
 * 创建点表模板
 */
export function useCreatePointTableTemplate() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: (data: CreatePointTableTemplateRequest) => createPointTableTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pointTables.lists() })
      toast.success(t('pointTable.success.created'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('pointTable.list.empty'))
    },
  })
}

/**
 * 更新点表模板
 */
export function useUpdatePointTableTemplate() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePointTableTemplateRequest }) =>
      updatePointTableTemplate(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pointTables.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.pointTables.detail(variables.id) })
      toast.success(t('pointTable.success.updated'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('pointTable.list.empty'))
    },
  })
}

/**
 * 删除点表模板
 */
export function useDeletePointTableTemplate() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: (id: number) => deletePointTableTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pointTables.lists() })
      toast.success(t('pointTable.success.deleted'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('pointTable.list.empty'))
    },
  })
}

/**
 * 复制点表模板
 */
export function useClonePointTableTemplate() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClonePointTableTemplateRequest }) =>
      clonePointTableTemplate(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pointTables.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.pointTables.detail(variables.id) })
      toast.success(t('pointTable.success.cloned'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('pointTable.list.empty'))
    },
  })
}

/**
 * 获取点表点列表
 */
export function usePointTablePointList(templateId: number, filters?: { pointName?: string; address?: string }) {
  return useQuery({
    queryKey: queryKeys.pointTables.points(templateId, filters),
    queryFn: () => getPointTablePointList(templateId, filters?.pointName, filters?.address),
    enabled: !!templateId,
  })
}

/**
 * 创建点表点
 */
export function useCreatePointTablePoint() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: number; data: CreatePointTablePointRequest }) =>
      createPointTablePoint(templateId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pointTables.detail(variables.templateId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.pointTables.points(variables.templateId) })
      toast.success(t('pointTable.success.created'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('pointTable.list.empty'))
    },
  })
}

/**
 * 更新点表点
 */
export function useUpdatePointTablePoint() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ pointId, data }: { pointId: number; data: UpdatePointTablePointRequest }) =>
      updatePointTablePoint(pointId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pointTables.all() })
      toast.success(t('pointTable.success.updated'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('pointTable.list.empty'))
    },
  })
}

/**
 * 删除点表点
 */
export function useDeletePointTablePoint() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: (pointId: number) => deletePointTablePoint(pointId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pointTables.all() })
      toast.success(t('pointTable.success.deleted'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('pointTable.list.empty'))
    },
  })
}

/**
 * 复制点表点
 */
export function useClonePointTablePoint() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ pointId, data }: { pointId: number; data: ClonePointTablePointRequest }) =>
      clonePointTablePoint(pointId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pointTables.all() })
      toast.success(t('pointTable.pointClone.success'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('pointTable.list.empty'))
    },
  })
}

