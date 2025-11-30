/**
 * 协议类型相关的 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  getProtocolTypeList,
  getProtocolTypeDetail,
  createProtocolType,
  updateProtocolType,
  deleteProtocolType,
  getProtocolTypeParams,
  createProtocolTypeParam,
  updateProtocolTypeParam,
  deleteProtocolTypeParam,
  getProtocolTypeParamsDefinition,
} from '@/api/protocolTypes'
import { queryKeys } from '@/config/query'
import type {
  ProtocolTypeListParams,
  CreateProtocolTypeRequest,
  UpdateProtocolTypeRequest,
  CreateProtocolTypeParamRequest,
  UpdateProtocolTypeParamRequest,
} from '@/types'

/**
 * 获取协议类型列表
 */
export function useProtocolTypeList(params?: ProtocolTypeListParams) {
  return useQuery({
    queryKey: queryKeys.protocolTypes.list(params),
    queryFn: () => getProtocolTypeList(params),
  })
}

/**
 * 获取协议类型详情
 */
export function useProtocolTypeDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.protocolTypes.detail(id),
    queryFn: () => getProtocolTypeDetail(id),
    enabled: !!id,
  })
}

/**
 * 获取协议类型参数列表
 */
export function useProtocolTypeParams(protocolTypeId: number) {
  return useQuery({
    queryKey: queryKeys.protocolTypes.params(protocolTypeId),
    queryFn: () => getProtocolTypeParams(protocolTypeId),
    enabled: !!protocolTypeId,
  })
}

/**
 * 获取协议类型参数定义（用于前端表单生成）
 */
export function useProtocolTypeParamsDefinition(protocolTypeName: string | null) {
  return useQuery({
    queryKey: queryKeys.protocolTypes.paramsDefinition(protocolTypeName || ''),
    queryFn: () => getProtocolTypeParamsDefinition(protocolTypeName!),
    enabled: !!protocolTypeName,
  })
}

/**
 * 创建协议类型
 */
export function useCreateProtocolType() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: (data: CreateProtocolTypeRequest) => createProtocolType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.protocolTypes.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dicts.protocolTypes() })
      toast.success(t('protocolType.success.created'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('protocolType.error.created'))
    },
  })
}

/**
 * 更新协议类型
 */
export function useUpdateProtocolType() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProtocolTypeRequest }) =>
      updateProtocolType(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.protocolTypes.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.protocolTypes.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.dicts.protocolTypes() })
      toast.success(t('protocolType.success.updated'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('protocolType.error.updated'))
    },
  })
}

/**
 * 删除协议类型
 */
export function useDeleteProtocolType() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: (id: number) => deleteProtocolType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.protocolTypes.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dicts.protocolTypes() })
      toast.success(t('protocolType.success.deleted'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('protocolType.error.deleted'))
    },
  })
}

/**
 * 创建协议类型参数
 */
export function useCreateProtocolTypeParam() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ protocolTypeId, data }: { protocolTypeId: number; data: CreateProtocolTypeParamRequest }) =>
      createProtocolTypeParam(protocolTypeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.protocolTypes.params(variables.protocolTypeId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.protocolTypes.detail(variables.protocolTypeId) })
      toast.success(t('protocolType.success.paramCreated'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('protocolType.error.paramCreated'))
    },
  })
}

/**
 * 更新协议类型参数
 */
export function useUpdateProtocolTypeParam() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ paramId, protocolTypeId, data }: { 
      paramId: number
      protocolTypeId: number
      data: UpdateProtocolTypeParamRequest 
    }) => updateProtocolTypeParam(paramId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.protocolTypes.params(variables.protocolTypeId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.protocolTypes.detail(variables.protocolTypeId) })
      toast.success(t('protocolType.success.paramUpdated'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('protocolType.error.paramUpdated'))
    },
  })
}

/**
 * 删除协议类型参数
 */
export function useDeleteProtocolTypeParam() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ paramId, protocolTypeId }: { paramId: number; protocolTypeId: number }) =>
      deleteProtocolTypeParam(paramId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.protocolTypes.params(variables.protocolTypeId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.protocolTypes.detail(variables.protocolTypeId) })
      toast.success(t('protocolType.success.paramDeleted'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('protocolType.error.paramDeleted'))
    },
  })
}

