/**
 * 设备类型相关的 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  getDeviceTypeList,
  getDeviceTypeDetail,
  createDeviceType,
  updateDeviceType,
  cloneDeviceType,
  deleteDeviceType,
  getDeviceTypeTagList,
  createDeviceTypeTag,
  updateDeviceTypeTag,
  cloneDeviceTypeTag,
  deleteDeviceTypeTag,
} from '@/api/deviceTypes'
import { queryKeys } from '@/config/query'
import type {
  DeviceTypeListParams,
  CreateDeviceTypeRequest,
  UpdateDeviceTypeRequest,
  CloneDeviceTypeRequest,
  CreateDeviceTypeTagRequest,
  UpdateDeviceTypeTagRequest,
  CloneDeviceTypeTagRequest,
} from '@/types'

/**
 * 获取设备类型列表
 */
export function useDeviceTypeList(params?: DeviceTypeListParams) {
  return useQuery({
    queryKey: queryKeys.deviceTypes.list(params),
    queryFn: () => getDeviceTypeList(params),
  })
}

/**
 * 获取设备类型详情
 */
export function useDeviceTypeDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.deviceTypes.detail(id),
    queryFn: () => getDeviceTypeDetail(id),
    enabled: !!id,
  })
}

/**
 * 创建设备类型
 */
export function useCreateDeviceType() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: (data: CreateDeviceTypeRequest) => createDeviceType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deviceTypes.lists() })
      toast.success(t('deviceType.success.created'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('deviceType.error.notFound'))
    },
  })
}

/**
 * 更新设备类型
 */
export function useUpdateDeviceType() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDeviceTypeRequest }) =>
      updateDeviceType(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deviceTypes.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.deviceTypes.detail(variables.id) })
      toast.success(t('deviceType.success.updated'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('deviceType.error.notFound'))
    },
  })
}

/**
 * 删除设备类型
 */
export function useDeleteDeviceType() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: (id: number) => deleteDeviceType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deviceTypes.lists() })
      toast.success(t('deviceType.success.deleted'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('deviceType.error.notFound'))
    },
  })
}

/**
 * 获取业务字段列表
 */
export function useDeviceTypeTagList(deviceTypeId: number, semanticType?: string) {
  return useQuery({
    queryKey: queryKeys.deviceTypes.tags(deviceTypeId, semanticType),
    queryFn: () => getDeviceTypeTagList(deviceTypeId, semanticType),
    enabled: !!deviceTypeId,
  })
}

/**
 * 创建业务字段
 */
export function useCreateDeviceTypeTag() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ deviceTypeId, data }: { deviceTypeId: number; data: CreateDeviceTypeTagRequest }) =>
      createDeviceTypeTag(deviceTypeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deviceTypes.detail(variables.deviceTypeId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.deviceTypes.tags(variables.deviceTypeId) })
      toast.success(t('deviceType.tagSuccess.created'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('deviceType.error.notFound'))
    },
  })
}

/**
 * 更新业务字段
 */
export function useUpdateDeviceTypeTag() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ tagId, data }: { tagId: number; data: UpdateDeviceTypeTagRequest }) =>
      updateDeviceTypeTag(tagId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deviceTypes.all() })
      toast.success(t('deviceType.tagSuccess.updated'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('deviceType.error.notFound'))
    },
  })
}

/**
 * 删除业务字段
 */
export function useDeleteDeviceTypeTag() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: (tagId: number) => deleteDeviceTypeTag(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deviceTypes.all() })
      toast.success(t('deviceType.tagSuccess.deleted'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('deviceType.error.notFound'))
    },
  })
}

/**
 * 复制设备类型
 */
export function useCloneDeviceType() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CloneDeviceTypeRequest }) =>
      cloneDeviceType(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deviceTypes.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.deviceTypes.detail(variables.id) })
      toast.success(t('deviceType.success.cloned'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('deviceType.error.notFound'))
    },
  })
}

/**
 * 复制业务字段
 */
export function useCloneDeviceTypeTag() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ tagId, data }: { tagId: number; data: CloneDeviceTypeTagRequest }) =>
      cloneDeviceTypeTag(tagId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.deviceTypes.all() })
      toast.success(t('deviceType.tagClone.success'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('deviceType.error.notFound'))
    },
  })
}

