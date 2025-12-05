/**
 * 拓扑编辑器网格背景组件
 */

import { Shape } from 'react-konva'
import { GRID_SIZE } from '@/config/topology'

interface GridBackgroundProps {
  width: number
  height: number
  scale: number
  x: number
  y: number
}

export function GridBackground({ width, height, scale, x, y }: GridBackgroundProps) {
  return (
    <Shape
      sceneFunc={(context, shape) => {
        const step = GRID_SIZE
        // Keep line width constant (1px) regardless of zoom
        const lineWidth = 1 / scale

        context.beginPath()

        // Calculate visible bounds in stage coordinates
        const startX = Math.floor((-x / scale) / step) * step
        const endX = Math.floor((-x + width) / scale / step) * step
        const startY = Math.floor((-y / scale) / step) * step
        const endY = Math.floor((-y + height) / scale / step) * step

        // Vertical lines
        for (let i = startX; i <= endX; i += step) {
          context.moveTo(i, startY)
          context.lineTo(i, endY)
        }

        // Horizontal lines
        for (let j = startY; j <= endY; j += step) {
          context.moveTo(startX, j)
          context.lineTo(endX, j)
        }

        context.strokeStyle = '#e5e7eb' // Tailwind gray-200
        context.lineWidth = lineWidth
        context.stroke()
        context.closePath()

        // Required for hit detection (though we don't interact with grid)
        context.fillStrokeShape(shape)
      }}
      listening={false}
    />
  )
}

