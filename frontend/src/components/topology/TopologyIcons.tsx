/**
 * 拓扑编辑器组件图标
 */

import {
  Activity,
  Battery,
  Cpu,
  Table,
  Type,
  GitCommitVertical,
  ArrowDown,
  Box,
} from 'lucide-react'
import type { ComponentType } from '@/types/topology'

export const TopologyIcons: Record<ComponentType, React.ReactNode> = {
  grid: <Activity size={20} className="text-blue-600" />,
  bus10kv: <div className="h-1 w-6 bg-red-800 rounded" />,
  bus400v: <div className="h-0.5 w-6 bg-slate-800 rounded" />,
  transformer: <GitCommitVertical size={20} className="text-amber-600" />,
  switch: <Box size={20} className="text-gray-600" />,
  load: <ArrowDown size={20} className="text-slate-700" />,
  battery: <Battery size={20} className="text-green-600" />,
  pcs: <Cpu size={20} className="text-purple-600" />,
  datacard: <Table size={20} className="text-slate-500" />,
  label: <Type size={20} className="text-gray-700" />,
}

