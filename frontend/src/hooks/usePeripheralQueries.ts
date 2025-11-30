/**
 * 外设设备相关的 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  getPeripherals,
  getPeripheralsByType,
  getPeripheral,
  createPeripheral,
  updatePeripheral,
  deletePeripheral,
} from '@/api/peripherals'
import { queryKeys } from '@/config/query'
import type {
  PeripheralListParams,
  CreatePeripheralRequest,
  UpdatePeripheralRequest,
} from '@/types'

/**
 * 获取外设列表
 */
export function usePeripheralList(params?: PeripheralListParams) {
  return useQuery({
    queryKey: queryKeys.peripherals.list(params),
    queryFn: () => getPeripherals(params),
  })
}

/**
 * 根据类型获取外设列表（用于下拉框）
 */
export function usePeripheralsByType(
  peripheralType: string | null | undefined,
  enabledOnly: boolean = true
) {
  return useQuery({
    queryKey: queryKeys.peripherals.byType(peripheralType || '', enabledOnly),
    queryFn: () => getPeripheralsByType(peripheralType!, enabledOnly),
    enabled: !!peripheralType,
  })
}

/**
 * 获取外设详情
 */
export function usePeripheralDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.peripherals.detail(id),
    queryFn: () => getPeripheral(id),
    enabled: !!id,
  })
}

/**
 * 创建外设
 */
export function useCreatePeripheral() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: (data: CreatePeripheralRequest) => createPeripheral(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.peripherals.all() })
      toast.success(t('peripheral.success.created'))
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('peripheral.error.createFailed', { ns: 'config' }))
    },
  })
}

/**
 * 更新外设
 */
export function useUpdatePeripheral() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePeripheralRequest }) =>
      updatePeripheral(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.peripherals.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.peripherals.detail(variables.id) })
      toast.success(t('peripheral.success.updated'))
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('peripheral.error.updateFailed', { ns: 'config' }))
    },
  })
}

/**
 * 删除外设
 */
export function useDeletePeripheral() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('config')
  
  return useMutation({
    mutationFn: (id: number) => deletePeripheral(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.peripherals.all() })
      toast.success(t('peripheral.success.deleted'))
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('peripheral.error.deleteFailed', { ns: 'config' }))
    },
  })
}

