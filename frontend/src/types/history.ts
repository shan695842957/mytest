/**
 * 历史数据查询相关类型定义
 */

// ============================================================================
// 设备树节点类型
// ============================================================================

export interface DataPointNode {
  id: string
  name: string
  semantic_type: 'MEASURE' | 'ACCUM' | 'PARAM'
  engineering_unit: string
  asset_id: number
  asset_name: string
  asset_display_name: string
  tag_name: string
  tag_display_name: string
}

export interface DeviceNode {
  id: string
  name: string
  asset_id: number
  children: DataPointNode[]
}

export interface StationNode {
  id: string
  name: string
  children: DeviceNode[]
}

export interface DeviceTreeResponse {
  stations: StationNode[]
}

// ============================================================================
// 历史数据查询类型
// ============================================================================

export interface HistoryDataPoint {
  asset_id: number
  tag_name: string
  semantic_type: 'MEASURE' | 'ACCUM' | 'PARAM'
}

export interface HistoryDataQueryRequest {
  data_points: HistoryDataPoint[]
  start_time: string // ISO 8601 datetime string
  end_time: string // ISO 8601 datetime string
  interval?: string | null
}

export interface HistoryDataValue {
  time: string // ISO 8601 datetime string
  value: number | null
  quality?: number | null
}

export interface HistoryDataSeries {
  asset_id: number
  asset_display_name: string
  tag_name: string
  tag_display_name: string
  semantic_type: 'MEASURE' | 'ACCUM' | 'PARAM'
  engineering_unit: string
  data: HistoryDataValue[]
}

export interface HistoryDataQueryResponse {
  series: HistoryDataSeries[]
}

// ============================================================================
// 导出数据类型
// ============================================================================

export interface ExportDataRequest {
  data_points: HistoryDataPoint[]
  start_time: string
  end_time: string
  interval?: string | null
  format: 'csv' | 'xlsx'
}

// ============================================================================
// 内部使用的扩展类型
// ============================================================================

export interface SelectedDataPoint extends DataPointNode {
  // 前端用于显示的完整路径
  fullPath: string
}

export interface TimeRange {
  start: Date
  end: Date
}

