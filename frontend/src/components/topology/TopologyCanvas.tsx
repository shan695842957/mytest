/**
 * 拓扑编辑器画布组件
 * 负责渲染 Konva Stage 和所有图形元素
 */

import { useState, useEffect, useRef } from 'react'
import { Stage, Layer, Line, Group, Rect, Transformer, Text } from 'react-konva'
import Konva from 'konva'
import { useTranslation } from 'react-i18next'
import { ElectricalShape } from './ElectricalShapes'
import { GridBackground } from './GridBackground'
import { getOrthogonalPath } from '@/utils/topology/geometry'
import type { EditorState, ToolMode } from '@/types/topology'
import { ToolMode as ToolModeEnum } from '@/types/topology'

interface TopologyCanvasProps {
  stageRef: React.RefObject<Konva.Stage>
  trRef: React.RefObject<Konva.Transformer>
  state: EditorState
  toolMode: ToolMode
  scale: number
  position: { x: number; y: number }
  showGrid: boolean
  stageHeight: number
  selectedIds: Set<string>
  selectionBox: { start: { x: number; y: number }; current: { x: number; y: number }; active: boolean } | null
  connectSourceId: string | null
  potentialConnectionTargetId: string | null
  isDrawingConnection: boolean
  tempConnectionStart: { x: number; y: number } | null
  tempConnectionCurrent: { x: number; y: number } | null
  onWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void
  onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onConnectionClick: (e: Konva.KonvaEventObject<MouseEvent>, id: string) => void
  onNodeDragStart: (e: Konva.KonvaEventObject<DragEvent>, id: string) => void
  onNodeDragMove: (e: Konva.KonvaEventObject<DragEvent>, id: string) => void
  onNodeDragEnd: (e: Konva.KonvaEventObject<DragEvent>, id: string) => void
  onNodeClick: (e: Konva.KonvaEventObject<MouseEvent>, id: string) => void
  onTransform: () => void
  onTransformEnd: () => void
}

export function TopologyCanvas({
  stageRef,
  trRef,
  state,
  toolMode,
  scale,
  position,
  showGrid,
  stageHeight,
  selectedIds,
  selectionBox,
  connectSourceId,
  potentialConnectionTargetId,
  isDrawingConnection,
  tempConnectionStart,
  tempConnectionCurrent,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onClick,
  onConnectionClick,
  onNodeDragStart,
  onNodeDragMove,
  onNodeDragEnd,
  onNodeClick,
  onTransform,
  onTransformEnd,
}: TopologyCanvasProps) {
  const { t } = useTranslation('topology')
  const containerRef = useRef<HTMLDivElement>(null)
  const [stageWidth, setStageWidth] = useState<number>(800)

  // 动态计算画布宽度，响应容器尺寸变化
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // 使用 getBoundingClientRect 获取精确的容器宽度
        const rect = containerRef.current.getBoundingClientRect()
        const containerWidth = rect.width
        // 确保宽度至少为 400px，但不超过容器宽度
        const calculatedWidth = Math.max(400, Math.floor(containerWidth))
        setStageWidth(calculatedWidth)
      }
    }

    // 延迟执行，确保 DOM 已完全渲染
    const timeoutId = setTimeout(updateWidth, 0)
    
    // 使用 ResizeObserver 监听容器尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      // 使用 requestAnimationFrame 确保在下一帧更新
      requestAnimationFrame(updateWidth)
    })
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    // 也监听窗口大小变化（作为备用）
    window.addEventListener('resize', updateWidth)
    
    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateWidth)
    }
  }, [selectedIds.size]) // 当属性面板显示/隐藏时，重新计算宽度

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden">
      <Stage
        width={stageWidth}
        height={stageHeight}
        ref={stageRef}
      scaleX={scale}
      scaleY={scale}
      x={position.x}
      y={position.y}
      draggable={toolMode === ToolModeEnum.PAN}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onClick={onClick}
      style={{ cursor: toolMode === ToolModeEnum.PAN ? 'grab' : 'default' }}
    >
      <Layer>
        {/* Grid Background */}
        {showGrid && (
          <GridBackground
            width={stageWidth}
            height={stageHeight}
            scale={scale}
            x={position.x}
            y={position.y}
          />
        )}

        {/* Connections */}
        {state.connections.map((conn) => {
          const node1 = state.nodes.find((n) => n.id === conn.fromId)
          const node2 = state.nodes.find((n) => n.id === conn.toId)

          if (!node1 || !node2) return null

          const points = getOrthogonalPath(node1, node2)
          const isSelected = selectedIds.has(conn.id)

          return (
            <Group key={conn.id}>
              {/* Render text label if exists */}
              {conn.label && (
                <Text
                  x={(points[0] + points[points.length - 2]) / 2}
                  y={(points[1] + points[points.length - 1]) / 2 - 15}
                  text={conn.label}
                  fontSize={10}
                  fill="#374151"
                  align="center"
                  width={100}
                  offsetX={50}
                  listening={false}
                />
              )}
              <Line
                id={conn.id}
                points={points}
                stroke={isSelected ? '#3b82f6' : conn.color || '#64748b'}
                strokeWidth={conn.width || 2}
                lineCap="round"
                lineJoin="round"
                hitStrokeWidth={20} // Make it easy to click
                onClick={(e) => onConnectionClick(e, conn.id)}
                onMouseEnter={() => {
                  if (toolMode === ToolModeEnum.SELECT) document.body.style.cursor = 'pointer'
                }}
                onMouseLeave={() => {
                  document.body.style.cursor = 'default'
                }}
              />
            </Group>
          )
        })}

        {/* Temporary Connection Line (Shift+Drag) */}
        {isDrawingConnection && tempConnectionStart && tempConnectionCurrent && (
          <Line
            points={[
              tempConnectionStart.x,
              tempConnectionStart.y,
              tempConnectionCurrent.x,
              tempConnectionCurrent.y,
            ]}
            stroke="#3b82f6"
            strokeWidth={2}
            dash={[5, 5]}
            listening={false}
          />
        )}

        {/* Nodes */}
        {state.nodes.map((node) => (
          <Group
            key={node.id}
            id={node.id}
            name="node-group"
            x={node.x}
            y={node.y}
            rotation={node.rotation || 0}
            scaleX={node.scaleX || 1}
            scaleY={node.scaleY || 1}
            draggable={toolMode === ToolModeEnum.SELECT}
            onDragStart={(e) => onNodeDragStart(e, node.id)}
            onDragMove={(e) => onNodeDragMove(e, node.id)}
            onDragEnd={(e) => onNodeDragEnd(e, node.id)}
            onClick={(e) => onNodeClick(e, node.id)}
            onMouseEnter={() => {
              document.body.style.cursor =
                toolMode === ToolModeEnum.CONNECT
                  ? 'crosshair'
                  : toolMode === ToolModeEnum.SELECT
                    ? 'move'
                    : 'default'
            }}
            onMouseLeave={() => {
              document.body.style.cursor = 'default'
            }}
          >
            <ElectricalShape
              node={node}
              isSelected={selectedIds.has(node.id)}
              isConnecting={
                connectSourceId === node.id || (isDrawingConnection && connectSourceId === node.id)
              }
              isPotentialTarget={potentialConnectionTargetId === node.id}
            />
          </Group>
        ))}

        {/* Transformer for Selection */}
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox
            }
            return newBox
          }}
          onTransform={onTransform}
          onTransformEnd={onTransformEnd}
        />

        {/* Selection Box */}
        {selectionBox?.active ? (
          <Rect
            x={Math.min(selectionBox.start.x, selectionBox.current.x)}
            y={Math.min(selectionBox.start.y, selectionBox.current.y)}
            width={Math.abs(selectionBox.current.x - selectionBox.start.x)}
            height={Math.abs(selectionBox.current.y - selectionBox.start.y)}
            fill="rgba(59, 130, 246, 0.2)"
            stroke="#3b82f6"
            strokeWidth={1}
            dash={[4, 4]}
            listening={false}
          />
        ) : null}
      </Layer>
    </Stage>
    </div>
  )
}

