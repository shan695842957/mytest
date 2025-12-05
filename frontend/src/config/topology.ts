/**
 * 拓扑建模常量配置
 */

import type { EditorState } from '@/types/topology'

export const GRID_SIZE = 20

export const INITIAL_STATE: EditorState = {
  nodes: [],
  connections: [],
}

export const DEMO_STATE: EditorState = {
  nodes: [
    { id: 'grid-1', type: 'grid', x: 400, y: 60, scaleX: 1, scaleY: 1, rotation: 0 },
    { id: 'bus10kv-1', type: 'bus10kv', x: 400, y: 140, scaleX: 1, scaleY: 1, rotation: 0 },
    { id: 'trans-1', type: 'transformer', x: 400, y: 220, scaleX: 1, scaleY: 1, rotation: 0 },
    { id: 'bus400v-1', type: 'bus400v', x: 400, y: 300, scaleX: 1, scaleY: 1, rotation: 0 },
    { id: 'load-1', type: 'load', x: 250, y: 400, scaleX: 1, scaleY: 1, rotation: 0 },
    { id: 'pcs-1', type: 'pcs', x: 550, y: 400, scaleX: 1, scaleY: 1, rotation: 0 },
    { id: 'batt-1', type: 'battery', x: 550, y: 500, scaleX: 1, scaleY: 1, rotation: 0 },
    {
      id: 'card-1',
      type: 'datacard',
      x: 700,
      y: 300,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      label: 'System Status',
      dataRows: [
        { label: 'Voltage', value: '400', unit: 'V' },
        { label: 'Current', value: '120', unit: 'A' },
        { label: 'Power', value: '48', unit: 'kW' },
      ],
    },
  ],
  connections: [
    { id: 'c1', fromId: 'grid-1', toId: 'bus10kv-1' },
    { id: 'c2', fromId: 'bus10kv-1', toId: 'trans-1' },
    { id: 'c3', fromId: 'trans-1', toId: 'bus400v-1' },
    { id: 'c4', fromId: 'bus400v-1', toId: 'load-1' },
    { id: 'c5', fromId: 'bus400v-1', toId: 'pcs-1' },
    { id: 'c6', fromId: 'pcs-1', toId: 'batt-1' },
  ],
}

