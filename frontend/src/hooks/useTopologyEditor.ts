/**
 * 拓扑编辑器核心逻辑 Hook
 * 管理所有编辑器状态和交互逻辑
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import Konva from 'konva'
import { useHistory } from '@/utils/topology/history'
import type {
  EditorState,
  ComponentType,
  NodeData,
  ToolMode,
  Point,
  Connection,
} from '@/types/topology'
import { ToolMode as ToolModeEnum, COMPONENT_CONFIG } from '@/types/topology'
import { INITIAL_STATE, DEMO_STATE, GRID_SIZE } from '@/config/topology'
import { generateId, snapToGrid } from '@/utils/topology/geometry'

export function useTopologyEditor() {
  // --- State ---
  const {
    state,
    pushState,
    set: setState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<EditorState>(INITIAL_STATE)

  const [toolMode, setToolMode] = useState<ToolMode>(ToolModeEnum.SELECT)
  const [scale, setScale] = useState<number>(1)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState<boolean>(true)

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectionBox, setSelectionBox] = useState<{
    start: Point
    current: Point
    active: boolean
  } | null>(null)

  // Connection
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null)
  const [potentialConnectionTargetId, setPotentialConnectionTargetId] = useState<string | null>(
    null
  )

  // Shift+Drag Connection State
  const [isDrawingConnection, setIsDrawingConnection] = useState<boolean>(false)
  const [tempConnectionStart, setTempConnectionStart] = useState<Point | null>(null)
  const [tempConnectionCurrent, setTempConnectionCurrent] = useState<Point | null>(null)

  // Clipboard
  const [clipboard, setClipboard] = useState<{ nodes: NodeData[]; connections: Connection[] } | null>(
    null
  )

  // Refs
  const stageRef = useRef<Konva.Stage>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const dragItemRef = useRef<ComponentType | null>(null)
  const dragStartPositions = useRef<Record<string, Point>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Canvas Dimensions - 动态计算，考虑工具栏高度
  const [stageHeight, setStageHeight] = useState<number>(600)
  
  // 动态计算画布高度
  useEffect(() => {
    const updateHeight = () => {
      // 工具栏高度约 60px
      const toolbarHeight = 60
      const availableHeight = window.innerHeight - toolbarHeight
      setStageHeight(Math.max(400, availableHeight))
    }
    
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // --- Effects ---
  // Sync Transformer with selected nodes
  useEffect(() => {
    if (trRef.current && stageRef.current) {
      // Find all selected nodes in Konva stage
      // IMPORTANT: Only attach Transformer to Nodes, not Connections
      const nodes = Array.from(selectedIds)
        .filter((id) => state.nodes.find((n) => n.id === id)) // Only if it exists in nodes array
        .map((id) => stageRef.current?.findOne('#' + id))
        .filter((node): node is Konva.Node => !!node)

      trRef.current.nodes(nodes)
      trRef.current.getLayer()?.batchDraw()
    }
  }, [selectedIds, state.nodes])

  // --- Actions ---
  const loadDemo = useCallback(() => {
    if (window.confirm('Load Demo? This will clear current changes.')) {
      const demo = JSON.parse(JSON.stringify(DEMO_STATE))
      pushState(demo)
      setSelectedIds(new Set())
      setPosition({ x: 0, y: 0 })
      setScale(1)
    }
  }, [pushState])

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `topology-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [state])

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string)
          // Basic validation
          if (Array.isArray(json.nodes) && Array.isArray(json.connections)) {
            pushState(json)
            setSelectedIds(new Set())
          } else {
            alert('Invalid file format. Missing nodes or connections.')
          }
        } catch (err) {
          console.error(err)
          alert('Failed to parse JSON file.')
        }
      }
      reader.readAsText(file)
      e.target.value = ''
    },
    [pushState]
  )

  const handleDelete = useCallback(() => {
    if (selectedIds.size === 0) return

    if (trRef.current) {
      trRef.current.nodes([])
    }

    const newNodes = state.nodes.filter((n) => !selectedIds.has(n.id))
    // Remove connections if endpoints are deleted OR if the connection itself is selected
    const newConnections = state.connections.filter(
      (c) =>
        !selectedIds.has(c.fromId) &&
        !selectedIds.has(c.toId) &&
        !selectedIds.has(c.id)
    )

    pushState({ nodes: newNodes, connections: newConnections })
    setSelectedIds(new Set())
  }, [selectedIds, state, pushState])

  const handleCopy = useCallback(() => {
    if (selectedIds.size === 0) return
    const selectedNodes = state.nodes.filter((n) => selectedIds.has(n.id))
    const selectedConnections = state.connections.filter(
      (c) => selectedIds.has(c.fromId) && selectedIds.has(c.toId)
    )
    setClipboard({ nodes: selectedNodes, connections: selectedConnections })
  }, [selectedIds, state])

  const handlePaste = useCallback(() => {
    if (!clipboard) return

    const idMap = new Map<string, string>()
    clipboard.nodes.forEach((n) => idMap.set(n.id, generateId()))

    const offset = GRID_SIZE

    const newNodes = clipboard.nodes.map((n) => ({
      ...n,
      id: idMap.get(n.id)!,
      x: n.x + offset,
      y: n.y + offset,
    }))

    const newConnections = clipboard.connections.map((c) => ({
      id: generateId(),
      fromId: idMap.get(c.fromId)!,
      toId: idMap.get(c.toId)!,
      color: c.color,
      width: c.width,
      label: c.label,
    }))

    pushState({
      nodes: [...state.nodes, ...newNodes],
      connections: [...state.connections, ...newConnections],
    })

    setSelectedIds(new Set(newNodes.map((n) => n.id)))
  }, [clipboard, state, pushState])

  const alignNodes = useCallback(
    (axis: 'horizontal' | 'vertical') => {
      if (selectedIds.size < 2) return

      const selectedNodes = state.nodes.filter((n) => selectedIds.has(n.id))
      if (selectedNodes.length === 0) return

      let targetVal = 0
      if (axis === 'horizontal') {
        const sumX = selectedNodes.reduce((sum, n) => sum + n.x, 0)
        targetVal = snapToGrid(sumX / selectedNodes.length)
      } else {
        const sumY = selectedNodes.reduce((sum, n) => sum + n.y, 0)
        targetVal = snapToGrid(sumY / selectedNodes.length)
      }

      const newNodes = state.nodes.map((n) => {
        if (selectedIds.has(n.id)) {
          return axis === 'horizontal' ? { ...n, x: targetVal } : { ...n, y: targetVal }
        }
        return n
      })

      pushState({ ...state, nodes: newNodes })
    },
    [selectedIds, state, pushState]
  )

  const flipNodes = useCallback(
    (axis: 'horizontal' | 'vertical') => {
      if (selectedIds.size === 0) return

      const newNodes = state.nodes.map((n) => {
        if (selectedIds.has(n.id)) {
          if (axis === 'horizontal') {
            return { ...n, scaleX: (n.scaleX || 1) * -1 }
          } else {
            return { ...n, scaleY: (n.scaleY || 1) * -1 }
          }
        }
        return n
      })

      pushState({ ...state, nodes: newNodes })
    },
    [selectedIds, state, pushState]
  )

  // Handle live transformation events from Transformer
  const handleTransform = useCallback(() => {
    const tr = trRef.current
    if (!tr) return

    const nodes = tr.nodes()
    nodes.forEach((node) => {
      const group = node as Konva.Group
      const sx = group.scaleX()
      const sy = group.scaleY()
      const nodeId = group.id()
      const nodeData = state.nodes.find((n) => n.id === nodeId)

      // 1. Handle external sub-labels (e.g. "Transformer" text below the shape)
      const textNode = group.findOne('.label-text')
      if (textNode) {
        textNode.scaleX(sx !== 0 ? 1 / sx : 1)
        textNode.scaleY(sy !== 0 ? 1 / sy : 1)

        if (nodeData) {
          const config = COMPONENT_CONFIG[nodeData.type]
          const height = config.height
          const textY = (sy > 0 ? height / 2 : -height / 2) + (8 / sy)
          textNode.y(textY)
        }
      }

      // 2. Handle internal main labels for 'label' type components
      // This logic ensures the text stays undistorted while the bounding box expands
      const mainLabelNode = group.findOne('.node-label')
      if (mainLabelNode && nodeData) {
        // Inverse scale to keep text size constant
        mainLabelNode.scaleX(sx !== 0 ? 1 / sx : 1)
        mainLabelNode.scaleY(sy !== 0 ? 1 / sy : 1)

        // Update width and position to simulate "Area resizing"
        const config = COMPONENT_CONFIG[nodeData.type]
        const width = config.width

        // Dynamically widen the text wrapping area
        // Visual width = localWidth * scaleX
        // We want Visual Wrapping Width = ConfigWidth * 2 * ScaleX (roughly)
        // Local Wrapping Width = Visual Wrapping Width / ScaleX
        // Wait, simply: Konva Text width is in local space.
        // If we want text to wrap at visual edge, we need to increase local width.
        mainLabelNode.width(width * 2 * sx)
        mainLabelNode.x(-width * sx)
        mainLabelNode.y(-10 * (sy !== 0 ? 1 / sy : 1))
      }
    })
  }, [state.nodes])

  // Handle end of transformation (commit to state)
  const handleTransformEnd = useCallback(() => {
    if (!trRef.current) return

    const nodes = trRef.current.nodes()
    const newNodes = state.nodes.map((n) => {
      const activeNode = nodes.find((node) => node.id() === n.id)
      if (activeNode) {
        return {
          ...n,
          x: activeNode.x(),
          y: activeNode.y(),
          rotation: activeNode.rotation(),
          scaleX: activeNode.scaleX(),
          scaleY: activeNode.scaleY(),
        }
      }
      return n
    })

    pushState({ ...state, nodes: newNodes })
  }, [state, pushState])

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const isCtrlOrMeta = e.ctrlKey || e.metaKey

      if (isCtrlOrMeta) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault()
          if (e.shiftKey) {
            if (canRedo) redo()
          } else {
            if (canUndo) undo()
          }
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault()
          if (canRedo) redo()
        } else if (e.key.toLowerCase() === 'c') {
          e.preventDefault()
          handleCopy()
        } else if (e.key.toLowerCase() === 'v') {
          e.preventDefault()
          handlePaste()
        } else if (e.key.toLowerCase() === 's') {
          e.preventDefault()
          handleExport()
        } else if (e.key.toLowerCase() === 'o') {
          e.preventDefault()
          handleImportClick()
        } else if (e.key.toLowerCase() === 'a') {
          e.preventDefault()
          const allIds = new Set<string>()
          state.nodes.forEach((n) => allIds.add(n.id))
          state.connections.forEach((c) => allIds.add(c.id))
          setSelectedIds(allIds)
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        handleDelete()
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedIds.size > 0) {
          e.preventDefault()
          const step = e.shiftKey ? GRID_SIZE : 5
          let dx = 0
          let dy = 0

          if (e.key === 'ArrowUp') dy = -step
          if (e.key === 'ArrowDown') dy = step
          if (e.key === 'ArrowLeft') dx = -step
          if (e.key === 'ArrowRight') dx = step

          // Only move nodes, connections move automatically with endpoints
          const newNodes = state.nodes.map((n) => {
            if (selectedIds.has(n.id)) {
              return { ...n, x: n.x + dx, y: n.y + dy }
            }
            return n
          })

          pushState({ ...state, nodes: newNodes })
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        if (isDrawingConnection) {
          setIsDrawingConnection(false)
          setConnectSourceId(null)
          setPotentialConnectionTargetId(null)
          return
        }
        if (selectionBox?.active) {
          setSelectionBox(null)
          return
        }
        if (connectSourceId) {
          setConnectSourceId(null)
          return
        }
        if (selectedIds.size > 0) {
          setSelectedIds(new Set())
          return
        }
        if (toolMode !== ToolModeEnum.SELECT) {
          setToolMode(ToolModeEnum.SELECT)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    state,
    selectedIds,
    connectSourceId,
    toolMode,
    selectionBox,
    canUndo,
    canRedo,
    undo,
    redo,
    handleDelete,
    handleCopy,
    handlePaste,
    handleExport,
    handleImportClick,
    pushState,
    isDrawingConnection,
  ])

  // --- Drag & Drop from Sidebar ---
  const handleDragStart = useCallback((e: React.DragEvent, type: ComponentType) => {
    dragItemRef.current = type
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const stage = stageRef.current
      if (!stage || !dragItemRef.current) return

      stage.setPointersPositions(e)
      const pointerPosition = stage.getPointerPosition()

      if (!pointerPosition) return

      const stageX = (pointerPosition.x - position.x) / scale
      const stageY = (pointerPosition.y - position.y) / scale

      const newNode: NodeData = {
        id: generateId(),
        type: dragItemRef.current,
        x: snapToGrid(stageX),
        y: snapToGrid(stageY),
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        // Default rows for datacard
        dataRows:
          dragItemRef.current === 'datacard'
            ? [
                { label: 'Label 1', value: '0', unit: 'Unit' },
                { label: 'Label 2', value: '0', unit: 'Unit' },
              ]
            : undefined,
      }

      pushState({
        ...state,
        nodes: [...state.nodes, newNode],
      })

      dragItemRef.current = null
    },
    [position, scale, state, pushState]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  // --- Canvas Interactions ---
  const handleStageWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault()
      const scaleBy = 1.1
      const stage = e.target.getStage()
      if (!stage) return

      const oldScale = stage.scaleX()
      const pointer = stage.getPointerPosition()
      if (!pointer) return

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      }

      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
      const clampedScale = Math.min(Math.max(newScale, 0.2), 5)

      setPosition({
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      })
      setScale(clampedScale)
    },
    []
  )

  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        if (toolMode === ToolModeEnum.SELECT) {
          if (!e.evt.shiftKey) {
            setSelectedIds(new Set())
          }

          const stage = e.target.getStage()
          const pointer = stage?.getPointerPosition()
          if (pointer) {
            const transform = stage?.getAbsoluteTransform().copy()
            transform?.invert()
            const point = transform?.point(pointer)

            if (point) {
              setSelectionBox({
                start: point,
                current: point,
                active: true,
              })
            }
          }
        }
      }
    },
    [toolMode]
  )

  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage()
      const pointer = stage?.getPointerPosition()

      if (selectionBox?.active) {
        if (pointer && stage) {
          const transform = stage.getAbsoluteTransform().copy()
          transform.invert()
          const point = transform.point(pointer)
          setSelectionBox((prev) => (prev ? { ...prev, current: point } : null))
        }
      }

      if (isDrawingConnection && pointer && stage) {
        const transform = stage.getAbsoluteTransform().copy()
        transform.invert()
        const point = transform.point(pointer)
        setTempConnectionCurrent(point)

        // Robust Hit Detection for Connection Target
        // e.target is the specific Shape under the mouse
        const shape = e.target
        if (shape && shape !== stage) {
          // Find the parent Group which corresponds to the Node
          const group = shape.findAncestor('.node-group') // SEARCH BY NAME
          const groupId = group?.id()

          // Verify:
          // 1. It has an ID
          // 2. It is not the source node
          // 3. It is a valid node in our state (checks against random groups)
          if (groupId && groupId !== connectSourceId && state.nodes.some((n) => n.id === groupId)) {
            setPotentialConnectionTargetId(groupId)
          } else {
            setPotentialConnectionTargetId(null)
          }
        } else {
          setPotentialConnectionTargetId(null)
        }
      }
    },
    [selectionBox, isDrawingConnection, connectSourceId, state.nodes]
  )

  const handleStageMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Finish Selection Box
      if (selectionBox?.active) {
        const x1 = Math.min(selectionBox.start.x, selectionBox.current.x)
        const x2 = Math.max(selectionBox.start.x, selectionBox.current.x)
        const y1 = Math.min(selectionBox.start.y, selectionBox.current.y)
        const y2 = Math.max(selectionBox.start.y, selectionBox.current.y)

        const newSelected = new Set(e.evt.shiftKey ? selectedIds : [])

        state.nodes.forEach((node) => {
          const config = COMPONENT_CONFIG[node.type]
          const nx = node.x
          const ny = node.y

          const nw = config.width
          const nh = config.height

          const nodeLeft = nx - nw / 2
          const nodeRight = nx + nw / 2
          const nodeTop = ny - nh / 2
          const nodeBottom = ny + nh / 2

          if (!(nodeRight < x1 || nodeLeft > x2 || nodeBottom < y1 || nodeTop > y2)) {
            newSelected.add(node.id)
          }
        })

        setSelectedIds(newSelected)
        setSelectionBox(null)
      }

      // Finish Shift+Drag Connection
      if (isDrawingConnection) {
        // Logic updated: Use the robust tracked target instead of just e.target
        if (connectSourceId && potentialConnectionTargetId) {
          const exists = state.connections.some(
            (c) =>
              (c.fromId === connectSourceId && c.toId === potentialConnectionTargetId) ||
              (c.fromId === potentialConnectionTargetId && c.toId === connectSourceId)
          )

          if (!exists) {
            pushState({
              ...state,
              connections: [
                ...state.connections,
                { id: generateId(), fromId: connectSourceId, toId: potentialConnectionTargetId },
              ],
            })
          }
        }

        setIsDrawingConnection(false)
        setConnectSourceId(null)
        setPotentialConnectionTargetId(null)
        setTempConnectionStart(null)
        setTempConnectionCurrent(null)
      }
    },
    [selectionBox, selectedIds, state, isDrawingConnection, connectSourceId, potentialConnectionTargetId, pushState]
  )

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (selectionBox?.active) return
      if (isDrawingConnection) return // handled in mouseup
      if (e.target === e.target.getStage()) {
        if (!selectionBox) {
          setConnectSourceId(null)
        }
      }
    },
    [selectionBox, isDrawingConnection]
  )

  const handleConnectionClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>, id: string) => {
      e.cancelBubble = true
      if (toolMode === ToolModeEnum.SELECT) {
        if (e.evt.shiftKey) {
          const newSet = new Set(selectedIds)
          if (newSet.has(id)) newSet.delete(id)
          else newSet.add(id)
          setSelectedIds(newSet)
        } else {
          if (!selectedIds.has(id)) {
            setSelectedIds(new Set([id]))
          }
        }
      }
    },
    [toolMode, selectedIds]
  )

  const handleNodeDragStart = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
      // Check for Shift + Drag to Connect
      if (e.evt.shiftKey) {
        e.target.stopDrag() // Cancel the drag operation on the node

        const node = state.nodes.find((n) => n.id === id)
        if (node) {
          setConnectSourceId(id)
          setIsDrawingConnection(true)
          setTempConnectionStart({ x: node.x, y: node.y })
          // Initial current pos is same as start
          setTempConnectionCurrent({ x: node.x, y: node.y })
        }
        return
      }

      if (!selectedIds.has(id) && !e.evt.shiftKey) {
        setSelectedIds(new Set([id]))
      } else if (!selectedIds.has(id) && e.evt.shiftKey) {
        // Only select if not dragging connection (handled above)
        const newSet = new Set(selectedIds)
        newSet.add(id)
        setSelectedIds(newSet)
      }

      const positions: Record<string, Point> = {}
      state.nodes.forEach((n) => {
        positions[n.id] = { x: n.x, y: n.y }
      })
      dragStartPositions.current = positions
    },
    [state.nodes, selectedIds]
  )

  const handleNodeDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
      if (isDrawingConnection) return // Should not happen if stopDrag worked

      const startPos = dragStartPositions.current[id]
      if (!startPos) return

      const currentX = e.target.x()
      const currentY = e.target.y()

      const dx = currentX - startPos.x
      const dy = currentY - startPos.y

      const newNodes = state.nodes.map((n) => {
        if (n.id === id) {
          return { ...n, x: currentX, y: currentY }
        }
        if (selectedIds.has(id) && selectedIds.has(n.id)) {
          const origin = dragStartPositions.current[n.id]
          if (origin) {
            return { ...n, x: origin.x + dx, y: origin.y + dy }
          }
        }
        return n
      })

      setState({ ...state, nodes: newNodes })
    },
    [isDrawingConnection, state, selectedIds, setState]
  )

  const handleNodeDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
      if (isDrawingConnection) return

      const startPos = dragStartPositions.current[id]
      if (!startPos) return

      const finalX = snapToGrid(e.target.x())
      const finalY = snapToGrid(e.target.y())

      const dx = finalX - startPos.x
      const dy = finalY - startPos.y

      const newNodes = state.nodes.map((n) => {
        if (selectedIds.has(id) && selectedIds.has(n.id)) {
          const origin = dragStartPositions.current[n.id]
          if (origin) {
            return { ...n, x: snapToGrid(origin.x + dx), y: snapToGrid(origin.y + dy) }
          }
        } else if (n.id === id) {
          return { ...n, x: finalX, y: finalY }
        }
        return n
      })

      pushState({ ...state, nodes: newNodes })
      dragStartPositions.current = {}
    },
    [isDrawingConnection, state, selectedIds, pushState]
  )

  const handleNodeClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>, id: string) => {
      e.cancelBubble = true

      // If we just finished a connection drag, ignore the click event that might fire
      if (isDrawingConnection) return

      if (toolMode === ToolModeEnum.SELECT) {
        if (e.evt.shiftKey) {
          // Usually handled in dragstart, but for simple clicks:
          const newSet = new Set(selectedIds)
          if (newSet.has(id)) newSet.delete(id)
          else newSet.add(id)
          setSelectedIds(newSet)
        } else {
          if (!selectedIds.has(id)) {
            setSelectedIds(new Set([id]))
          }
        }
      } else if (toolMode === ToolModeEnum.CONNECT) {
        if (!connectSourceId) {
          setConnectSourceId(id)
        } else {
          if (connectSourceId !== id) {
            const exists = state.connections.some(
              (c) =>
                (c.fromId === connectSourceId && c.toId === id) ||
                (c.fromId === id && c.toId === connectSourceId)
            )

            if (!exists) {
              pushState({
                ...state,
                connections: [
                  ...state.connections,
                  { id: generateId(), fromId: connectSourceId, toId: id },
                ],
              })
            }
          }
          setConnectSourceId(null)
        }
      }
    },
    [isDrawingConnection, toolMode, selectedIds, connectSourceId, state, pushState]
  )

  return {
    // State
    state,
    pushState,
    toolMode,
    setToolMode,
    scale,
    setScale,
    position,
    setPosition,
    showGrid,
    setShowGrid,
    selectedIds,
    setSelectedIds,
    selectionBox,
    setSelectionBox,
    connectSourceId,
    setConnectSourceId,
    potentialConnectionTargetId,
    isDrawingConnection,
    tempConnectionStart,
    tempConnectionCurrent,
    clipboard,
    // Refs
    stageRef,
    trRef,
    fileInputRef,
    stageHeight,
    // History
    undo,
    redo,
    canUndo,
    canRedo,
    // Actions
    loadDemo,
    handleExport,
    handleImportClick,
    handleFileChange,
    handleDelete,
    handleCopy,
    handlePaste,
    alignNodes,
    flipNodes,
    handleTransform,
    handleTransformEnd,
    // Drag & Drop
    handleDragStart,
    handleDrop,
    handleDragOver,
    // Canvas Interactions
    handleStageWheel,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
    handleStageClick,
    handleConnectionClick,
    handleNodeDragStart,
    handleNodeDragMove,
    handleNodeDragEnd,
    handleNodeClick,
  }
}

