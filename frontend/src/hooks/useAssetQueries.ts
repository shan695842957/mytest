/**
 * 资产相关的 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  getAssetList,
  getAssetDetail,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetMappingList,
  getAssetMappingDetail,
  createAssetMapping,
  updateAssetMapping,
  deleteAssetMapping,
  syncAssetCommInstances,
} from '@/api/assets'
import { queryKeys } from '@/config/query'
import type {
  AssetListParams,
  CreateAssetRequest,
  UpdateAssetRequest,
  CreateAssetMappingRequest,
  UpdateAssetMappingRequest,
  SyncAssetCommInstancesRequest,
} from '@/types'

/**
 * 获取资产列表
 */
export function useAssetList(params?: AssetListParams) {
  return useQuery({
    queryKey: queryKeys.assets.list(params),
    queryFn: () => getAssetList(params),
  })
}

/**
 * 获取资产详情
 */
export function useAssetDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.assets.detail(id),
    queryFn: () => getAssetDetail(id),
    enabled: !!id,
  })
}

/**
 * 创建资产
 */
export function useCreateAsset() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: (data: CreateAssetRequest) => createAsset(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.lists() })
      toast.success(t('asset.success.created'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('asset.list.empty'))
    },
  })
}

/**
 * 更新资产
 */
export function useUpdateAsset() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAssetRequest }) =>
      updateAsset(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.detail(variables.id) })
      toast.success(t('asset.success.updated'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('asset.list.empty'))
    },
  })
}

/**
 * 删除资产
 */
export function useDeleteAsset() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: (id: number) => deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.lists() })
      toast.success(t('asset.success.deleted'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('asset.list.empty'))
    },
  })
}

/**
 * 获取资产映射列表
 */
export function useAssetMappingList(assetId: number) {
  return useQuery({
    queryKey: queryKeys.assets.mappings(assetId),
    queryFn: () => getAssetMappingList(assetId),
    enabled: !!assetId,
  })
}

/**
 * 获取资产映射详情
 */
export function useAssetMappingDetail(assetId: number, mappingId: number) {
  return useQuery({
    queryKey: queryKeys.assets.mappingDetail(assetId, mappingId),
    queryFn: () => getAssetMappingDetail(assetId, mappingId),
    enabled: !!assetId && !!mappingId,
  })
}

/**
 * 创建资产映射
 */
export function useCreateAssetMapping() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ assetId, data }: { assetId: number; data: CreateAssetMappingRequest }) =>
      createAssetMapping(assetId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.detail(variables.assetId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.mappings(variables.assetId) })
      toast.success(t('mapping.success.created'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('mapping.success.created'))
    },
  })
}

/**
 * 更新资产映射
 */
export function useUpdateAssetMapping() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ mappingId, data }: { mappingId: number; data: UpdateAssetMappingRequest }) =>
      updateAssetMapping(mappingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all() })
      toast.success(t('mapping.success.updated'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('mapping.success.updated'))
    },
  })
}

/**
 * 删除资产映射
 */
export function useDeleteAssetMapping() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: (mappingId: number) => deleteAssetMapping(mappingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.all() })
      toast.success(t('mapping.success.deleted'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('mapping.success.deleted'))
    },
  })
}

/**
 * 同步资产通信实例绑定
 */
export function useSyncAssetCommInstances() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ assetId, data }: { assetId: number; data: SyncAssetCommInstancesRequest }) =>
      syncAssetCommInstances(assetId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.detail(variables.assetId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.assets.mappings(variables.assetId) })
      toast.success(t('mapping.success.autoGenerated'))
    },
    onError: (error: any) => {
      toast.error(error.message || t('mapping.success.autoGenerated'))
    },
  })
}

