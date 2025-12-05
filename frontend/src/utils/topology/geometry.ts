/**
 * 拓扑编辑器几何工具函数
 */

import type { NodeData, ComponentType } from '@/types/topology'
import { COMPONENT_CONFIG } from '@/types/topology'
import { GRID_SIZE } from '@/config/topology'

export const generateId = () => Math.random().toString(36).substr(2, 9)

export const snapToGrid = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE

export const getOrthogonalPath = (n1: NodeData, n2: NodeData) => {
  const c1 = COMPONENT_CONFIG[n1.type]
  const c2 = COMPONENT_CONFIG[n2.type]

  // Helper to check if node is a busbar
  const isBus = (type: ComponentType) => type.startsWith('bus')

  // Determine vertical order (Source/Target for routing purposes)
  // We prefer to route from Top -> Bottom
  const isN1Upper = n1.y < n2.y
  const upper = isN1Upper ? n1 : n2
  const lower = isN1Upper ? n2 : n1
  const cUpper = isN1Upper ? c1 : c2
  const cLower = isN1Upper ? c2 : c1

  const upperIsBus = isBus(upper.type)
  const lowerIsBus = isBus(lower.type)

  // Scenario 1: Upper is Bus, Lower is Component
  // Result: Vertical line from Bus Bottom to Component Top
  // Anchor on Bus: Aligned with Component X
  if (upperIsBus && !lowerIsBus) {
    const startX = lower.x // Align to component
    const startY = upper.y + cUpper.height / 2 // Bus Bottom
    const endX = lower.x
    const endY = lower.y - cLower.height / 2 // Component Top

    return [startX, startY, endX, endY]
  }

  // Scenario 2: Upper is Component, Lower is Bus
  // Result: Vertical line from Component Bottom to Bus Top
  // Anchor on Bus: Aligned with Component X
  if (!upperIsBus && lowerIsBus) {
    const startX = upper.x
    const startY = upper.y + cUpper.height / 2 // Component Bottom
    const endX = upper.x // Align to component
    const endY = lower.y - cLower.height / 2 // Bus Top

    return [startX, startY, endX, endY]
  }

  // Scenario 3: Standard Component to Component (or Bus to Bus)
  // Result: 3-segment Z-shape (Vertical -> Horizontal -> Vertical)
  const startX = upper.x
  const startY = upper.y + cUpper.height / 2 // Upper Bottom
  const endX = lower.x
  const endY = lower.y - cLower.height / 2 // Lower Top

  // If aligned horizontally (close enough), just draw straight vertical line
  if (Math.abs(startX - endX) < 1) {
    return [startX, startY, endX, endY]
  }

  // Calculate mid-Y for the horizontal segment
  const midY = (startY + endY) / 2

  return [
    startX, startY, // Start
    startX, midY, // Down to mid
    endX, midY, // Across to target X
    endX, endY, // Down to target
  ]
}

