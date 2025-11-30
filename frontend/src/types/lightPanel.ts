/**
 * 光字牌相关类型定义
 */

/**
 * 资产树节点
 */
export interface AssetTreeNode {
  id: number
  name: string
  display_name: string
  device_type_id: number
  device_type_name?: string
  device_type_display_name?: string
  location: string
  enabled: boolean
  children?: AssetTreeNode[]
}

/**
 * 光字牌字段值
 */
export interface LightPanelTagValue {
  tag_name: string
  display_name: string
  data_type: 'BOOL' | 'INT' | 'FLOAT' | 'ENUM' | 'BITFIELD16'
  semantic_type: 'MEASURE' | 'STATUS' | 'ACCUM' | 'PARAM' | 'SETPOINT' | 'COMMAND' | 'PARAM_SET'
  group_name: string
  engineering_unit: string
  severity: number
  value: boolean | number | string | null
  enum_json: Record<string, string>
  bits?: number[]
  raw_value?: number
  instance_name?: string
  point_name?: string
}

/**
 * 光字牌分组（卡片内的分组，如运行状态、工艺报警）
 */
export interface LightPanelGroup {
  group_name: string
  tags: LightPanelTagValue[]
}

/**
 * 光字牌点卡片（同一寄存器的所有子点在一个卡片中）
 */
export interface LightPanelPointCard {
  point_name: string
  point_display_name: string
  instance_name?: string
  instance_display_name?: string
  raw_value?: number
  groups: LightPanelGroup[]
  ungrouped_tags: LightPanelTagValue[]
}

/**
 * 光字牌状态响应
 */
export interface LightPanelStatusResponse {
  asset_id: number
  asset_name: string
  asset_display_name: string
  device_type_name?: string
  point_cards: LightPanelPointCard[]
}

