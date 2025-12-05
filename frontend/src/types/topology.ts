/**
 * 拓扑建模类型定义
 */

export type ComponentType =
  | 'grid'
  | 'bus10kv'
  | 'bus400v'
  | 'transformer'
  | 'switch'
  | 'load'
  | 'battery'
  | 'pcs'
  | 'datacard'
  | 'label'

export interface Point {
  x: number
  y: number
}

export interface DataRow {
  label: string
  value: string
  unit: string
}

export interface NodeData {
  id: string
  type: ComponentType
  x: number
  y: number
  label?: string
  rotation?: number
  scaleX?: number
  scaleY?: number
  // Specific to Data Cards
  dataRows?: DataRow[]
  // Specific to Labels
  fontSize?: number
  fontColor?: string
}

export interface Connection {
  id: string
  fromId: string
  toId: string
  // Visual properties
  color?: string
  width?: number
  label?: string
}

export interface EditorState {
  nodes: NodeData[]
  connections: Connection[]
}

export enum ToolMode {
  SELECT = 'SELECT',
  CONNECT = 'CONNECT',
  PAN = 'PAN',
}

export interface SelectionRect {
  x: number
  y: number
  width: number
  height: number
}

export const COMPONENT_CONFIG: Record<
  ComponentType,
  { label: string; width: number; height: number; color: string }
> = {
  grid: { label: 'Utility Grid', width: 50, height: 50, color: '#2563eb' }, // Blue
  bus10kv: { label: '10kV Bus', width: 240, height: 8, color: '#991b1b' }, // IEEE MV/HV often Red/Brown, Thicker
  bus400v: { label: '400V Bus', width: 240, height: 4, color: '#1e293b' }, // IEEE LV often Black/Blue, Thinner
  transformer: { label: 'Transformer', width: 50, height: 80, color: '#d97706' }, // Amber
  switch: { label: 'Breaker', width: 40, height: 40, color: '#4b5563' }, // Gray
  load: { label: 'Load', width: 40, height: 40, color: '#1f2937' }, // Dark Gray
  battery: { label: 'ESS Battery', width: 50, height: 50, color: '#10b981' }, // Emerald
  pcs: { label: 'PCS / Inverter', width: 50, height: 50, color: '#7c3aed' }, // Violet
  datacard: { label: 'Data Card', width: 140, height: 100, color: '#64748b' }, // Slate
  label: { label: 'Text Label', width: 100, height: 30, color: '#374151' }, // Generic Text
}

