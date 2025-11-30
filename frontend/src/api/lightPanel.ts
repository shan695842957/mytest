/**
 * 光字牌 API
 */

import { http } from '@/utils/request'
import type { ApiResponse } from '@/types'
import type {
  AssetTreeNode,
  LightPanelStatusResponse,
} from '@/types/lightPanel'

/**
 * 获取资产树
 */
export const getAssetTree = async (enabled?: boolean) => {
  const params: Record<string, any> = {}
  if (enabled !== undefined) {
    params.enabled = enabled
  }
  const response = await http.get<ApiResponse<AssetTreeNode[]>>(
    '/light-panel/assets/tree',
    { params }
  )
  return response.data
}

/**
 * 获取光字牌状态
 */
export const getLightPanelStatus = async (assetId: number) => {
  const response = await http.get<ApiResponse<LightPanelStatusResponse>>(
    `/light-panel/assets/${assetId}/status`
  )
  return response.data
}

