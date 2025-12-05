/**
 * 拓扑编辑器电气图形组件
 */

import { Group, Rect, Circle, Line, Text, Path } from 'react-konva'
import type { NodeData } from '@/types/topology'
import { COMPONENT_CONFIG } from '@/types/topology'

interface ElectricalShapeProps {
  node: NodeData
  isSelected: boolean
  isConnecting: boolean
  isPotentialTarget?: boolean
}

export function ElectricalShape({
  node,
  isSelected,
  isConnecting,
  isPotentialTarget,
}: ElectricalShapeProps) {
  const config = COMPONENT_CONFIG[node.type]
  const { width, height, color } = config

  // Use custom label if present, otherwise default to config label
  const labelText = node.label || config.label

  // Get current node scale (default to 1)
  const sx = node.scaleX || 1
  const sy = node.scaleY || 1

  // Inverse scale for text to keep it looking 1:1 visually (Unscaled)
  const textScaleX = sx !== 0 ? 1 / sx : 1
  const textScaleY = sy !== 0 ? 1 / sy : 1

  // Calculate text Y position to ensure it stays at a constant gap from the visual bottom.
  const textY = (sy > 0 ? height / 2 : -height / 2) + (8 / sy)

  // Selection halo style
  const renderSelection = () => {
    if (!isSelected) return null
    return (
      <Rect
        x={-width / 2 - 8}
        y={-height / 2 - 8}
        width={width + 16}
        height={height + 16}
        stroke="#3b82f6"
        strokeWidth={1}
        dash={[4, 4]}
        cornerRadius={4}
        listening={false}
        strokeScaleEnabled={false} // Keep dash width constant
      />
    )
  }

  const renderConnectionFeedback = () => {
    if (!isConnecting) return null
    return (
      <Circle
        radius={Math.max(width, height) / 1.5}
        stroke="#3b82f6"
        strokeWidth={2}
        opacity={0.3}
        fill="#eff6ff"
        listening={false}
        strokeScaleEnabled={false}
      />
    )
  }

  const renderTargetFeedback = () => {
    if (!isPotentialTarget) return null
    return (
      <Rect
        x={-width / 2 - 12}
        y={-height / 2 - 12}
        width={width + 24}
        height={height + 24}
        stroke="#22c55e" // Green-500
        strokeWidth={3}
        cornerRadius={6}
        listening={false}
        shadowColor="#22c55e"
        shadowBlur={15}
        strokeScaleEnabled={false}
      />
    )
  }

  const renderShape = () => {
    switch (node.type) {
      case 'grid':
        // Circle with Sine Wave (AC Source)
        return (
          <Group>
            <Circle radius={width / 2} stroke={color} strokeWidth={2} fill="#ffffff" />
            <Path
              data="M -10 0 Q -5 -10 0 0 T 10 0"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Group>
        )

      case 'bus10kv':
      case 'bus400v':
        return (
          <Group>
            <Rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              fill={color}
              cornerRadius={height / 2}
              shadowColor={color}
              shadowBlur={isSelected ? 10 : 0}
              shadowOpacity={0.4}
            />
          </Group>
        )

      case 'transformer':
        // Two intersecting circles
        return (
          <Group>
            <Circle
              y={-height / 4 + 2}
              radius={width / 2 - 2}
              stroke={color}
              strokeWidth={2}
              fill="#ffffff"
            />
            <Circle
              y={height / 4 - 2}
              radius={width / 2 - 2}
              stroke={color}
              strokeWidth={2}
              fill="#ffffff"
            />
          </Group>
        )

      case 'switch':
        // Circuit Breaker: Square with X
        return (
          <Group>
            <Rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              stroke={color}
              strokeWidth={2}
              fill="#ffffff"
              cornerRadius={2}
            />
            <Line
              points={[-width / 2 + 5, -height / 2 + 5, width / 2 - 5, height / 2 - 5]}
              stroke={color}
              strokeWidth={2}
            />
            <Line
              points={[width / 2 - 5, -height / 2 + 5, -width / 2 + 5, height / 2 - 5]}
              stroke={color}
              strokeWidth={2}
            />
          </Group>
        )

      case 'load':
        // Downward Arrow
        return (
          <Group>
            <Line points={[0, -height / 2, 0, height / 2]} stroke={color} strokeWidth={2} />
            <Line
              points={[-10, height / 2 - 10, 0, height / 2, 10, height / 2 - 10]}
              stroke={color}
              strokeWidth={2}
              lineCap="round"
              lineJoin="round"
            />
          </Group>
        )

      case 'battery':
        // Battery Symbol
        return (
          <Group>
            <Rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              stroke={color}
              strokeWidth={2}
              fill="#ffffff"
              cornerRadius={4}
            />
            {/* Battery Cells */}
            <Line points={[-10, -5, 10, -5]} stroke={color} strokeWidth={2} />
            <Line points={[-6, 0, 6, 0]} stroke={color} strokeWidth={1} />
            <Line points={[-10, 5, 10, 5]} stroke={color} strokeWidth={2} />
          </Group>
        )

      case 'pcs':
        // PCS / Inverter: Square with diagonal and AC/DC symbols
        return (
          <Group>
            <Rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              stroke={color}
              strokeWidth={2}
              fill="#ffffff"
              cornerRadius={2}
            />
            <Line
              points={[-width / 2, height / 2, width / 2, -height / 2]}
              stroke={color}
              strokeWidth={1.5}
            />
            <Text
              x={-width / 2 + 2}
              y={-height / 2 + 2}
              text="~"
              fontSize={20}
              fill={color}
              fontStyle="bold"
            />
            <Text
              x={width / 2 - 14}
              y={height / 2 - 14}
              text="="
              fontSize={20}
              fill={color}
              fontStyle="bold"
            />
          </Group>
        )

      case 'datacard':
        // DataCard is unique: it displays rows of data
        {
          const rows = node.dataRows || []
          const rowHeight = 16
          const headerHeight = 24

          return (
            <Group>
              {/* Background Card */}
              <Rect
                x={-width / 2}
                y={-height / 2}
                width={width}
                height={height}
                fill="#ffffff"
                stroke={color}
                strokeWidth={1}
                cornerRadius={4}
                shadowColor="rgba(0,0,0,0.1)"
                shadowBlur={4}
              />

              {/* Header Background */}
              <Rect
                x={-width / 2}
                y={-height / 2}
                width={width}
                height={headerHeight}
                fill="#f8fafc"
                cornerRadius={[4, 4, 0, 0]}
                stroke={color}
                strokeWidth={0.5}
              />

              {/* Header Text (Node Name) */}
              <Text
                x={-width / 2 + 8}
                y={-height / 2 + 6}
                text={labelText}
                width={width - 16}
                fontSize={12}
                fontStyle="bold"
                fill="#334155"
                scaleX={textScaleX}
                scaleY={textScaleY}
              />

              {/* Rows */}
              {rows.map((row, i) => {
                const rowY = -height / 2 + headerHeight + 8 + i * rowHeight
                if (rowY > height / 2 - 10) return null // Clip overflow

                return (
                  <Group key={i} y={rowY}>
                    {/* Label (Left) */}
                    <Text
                      x={-width / 2 + 8}
                      text={row.label}
                      fontSize={10}
                      fill="#64748b"
                      scaleX={textScaleX}
                      scaleY={textScaleY}
                    />
                    {/* Value + Unit (Right) */}
                    <Text
                      x={width / 2 - 8}
                      text={`${row.value} ${row.unit}`}
                      fontSize={10}
                      fontStyle="bold"
                      fill="#0f172a"
                      align="right"
                      width={width}
                      offsetX={width} // Right align hack
                      scaleX={textScaleX}
                      scaleY={textScaleY}
                    />
                  </Group>
                )
              })}
            </Group>
          )
        }

      case 'label':
        return (
          <Text
            name="node-label" // Identify for transformer handleTransform
            text={labelText}
            fontSize={node.fontSize || 14}
            fontStyle="bold"
            fill={node.fontColor || '#374151'}
            align="center"
            width={width * 2 * sx} // Widen the visual wrapping area based on scale
            x={-width * sx} // Center
            y={-10 * textScaleY} // Keep fixed visual height relative to center
            offsetX={0}
            scaleX={textScaleX} // Inverse scale to prevent text deformation
            scaleY={textScaleY}
          />
        )

      default:
        return <Rect width={width} height={height} fill="gray" />
    }
  }

  return (
    <Group>
      {renderShape()}
      {renderTargetFeedback()}
      {renderSelection()}
      {renderConnectionFeedback()}

      {/* Default Label (Outside) - Skip for DataCard and Label as they handle their own text */}
      {node.type !== 'datacard' && node.type !== 'label' && (
        <Text
          name="label-text" // Important: Used by Transformer onTransform to find this node
          text={labelText}
          x={0} // Center horizontally relative to group origin
          y={textY}
          offsetX={width} // Offset by half width to center (since width prop is width*2)
          width={width * 2}
          align="center"
          fontSize={11}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fill="#6b7280" // Gray 500
          listening={false}
          scaleX={textScaleX}
          scaleY={textScaleY}
        />
      )}
    </Group>
  )
}

