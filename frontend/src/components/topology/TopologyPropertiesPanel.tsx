/**
 * 拓扑编辑器属性面板组件
 */

import { useTranslation } from 'react-i18next'
import { Settings2, Workflow, Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { EditorState, DataRow } from '@/types/topology'
import { COMPONENT_CONFIG } from '@/types/topology'

interface TopologyPropertiesPanelProps {
  selectedIds: Set<string>
  state: EditorState
  pushState: (newState: EditorState) => void
}

export function TopologyPropertiesPanel({
  selectedIds,
  state,
  pushState,
}: TopologyPropertiesPanelProps) {
  const { t } = useTranslation('topology')

  if (selectedIds.size !== 1) return null
  const selectedId = Array.from(selectedIds)[0]

  const updateSelectedEntity = (key: string, value: unknown) => {
    // Check if it's a node
    const isNode = state.nodes.some((n) => n.id === selectedId)

    if (isNode) {
      const newNodes = state.nodes.map((n) =>
        n.id === selectedId ? { ...n, [key]: value } : n
      )
      pushState({ ...state, nodes: newNodes })
    } else {
      // Must be a connection
      const newConnections = state.connections.map((c) =>
        c.id === selectedId ? { ...c, [key]: value } : c
      )
      pushState({ ...state, connections: newConnections })
    }
  }

  const handleAddDataRow = (nodeId: string) => {
    const newNodes = state.nodes.map((n) => {
      if (n.id === nodeId) {
        return {
          ...n,
          dataRows: [...(n.dataRows || []), { label: 'New Param', value: '0', unit: '-' }],
        }
      }
      return n
    })
    pushState({ ...state, nodes: newNodes })
  }

  const handleRemoveDataRow = (nodeId: string, index: number) => {
    const newNodes = state.nodes.map((n) => {
      if (n.id === nodeId) {
        const rows = [...(n.dataRows || [])]
        rows.splice(index, 1)
        return { ...n, dataRows: rows }
      }
      return n
    })
    pushState({ ...state, nodes: newNodes })
  }

  const handleUpdateDataRow = (
    nodeId: string,
    index: number,
    field: keyof DataRow,
    value: string
  ) => {
    const newNodes = state.nodes.map((n) => {
      if (n.id === nodeId) {
        const rows = [...(n.dataRows || [])]
        if (rows[index]) {
          rows[index] = { ...rows[index], [field]: value }
        }
        return { ...n, dataRows: rows }
      }
      return n
    })
    pushState({ ...state, nodes: newNodes })
  }

  // Check if Node
  const node = state.nodes.find((n) => n.id === selectedId)
  if (node) {
    const config = COMPONENT_CONFIG[node.type]
    return (
      <div className="w-64 flex-shrink-0 bg-background border-l p-4 flex flex-col gap-4 overflow-y-auto z-10 h-full">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b">
          <Settings2 size={20} className="text-muted-foreground" />
          <h3 className="font-semibold text-foreground">{t('properties.nodeTitle')}</h3>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs font-medium text-muted-foreground">
            {t('properties.nameLabel')}
          </Label>
          <Input
            type="text"
            className="text-sm"
            value={node.label || config.label}
            onChange={(e) => updateSelectedEntity('label', e.target.value)}
          />
        </div>

        {/* Label Specific Editor */}
        {node.type === 'label' && (
          <div className="border rounded bg-muted p-2 flex flex-col gap-2">
            <span className="text-xs font-bold text-foreground">{t('properties.labelStyles')}</span>
            <div className="flex flex-col gap-1">
              <Label className="text-xs font-medium text-muted-foreground">
                {t('properties.fontSize')}
              </Label>
              <Input
                type="number"
                min="8"
                max="72"
                className="text-sm"
                value={node.fontSize || 14}
                onChange={(e) => updateSelectedEntity('fontSize', Number(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs font-medium text-muted-foreground">
                {t('properties.color')}
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="color"
                  className="h-8 w-12 p-0 border rounded cursor-pointer"
                  value={node.fontColor || '#374151'}
                  onChange={(e) => updateSelectedEntity('fontColor', e.target.value)}
                />
                <span className="text-xs text-muted-foreground">
                  {node.fontColor || '#374151'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Data Card Specific Editor */}
        {node.type === 'datacard' && (
          <div className="border rounded bg-muted p-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">{t('properties.dataRows')}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleAddDataRow(node.id)}
                className="h-6 w-6"
              >
                <Plus size={14} />
              </Button>
            </div>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {(node.dataRows || []).map((row, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-1 border-b border-border pb-2 last:border-0"
                >
                  <div className="flex items-center gap-1">
                    <Input
                      className="w-full text-xs"
                      value={row.label}
                      onChange={(e) => handleUpdateDataRow(node.id, idx, 'label', e.target.value)}
                      placeholder={t('properties.labelPlaceholder')}
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveDataRow(node.id, idx)}
                      className="h-6 w-6 text-destructive hover:bg-destructive/10"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      className="flex-1 text-xs font-mono"
                      value={row.value}
                      onChange={(e) => handleUpdateDataRow(node.id, idx, 'value', e.target.value)}
                      placeholder={t('properties.valuePlaceholder')}
                    />
                    <Input
                      className="w-10 text-xs"
                      value={row.unit}
                      onChange={(e) => handleUpdateDataRow(node.id, idx, 'unit', e.target.value)}
                      placeholder={t('properties.unitPlaceholder')}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-medium text-muted-foreground">
              {t('properties.xPosition')}
            </Label>
            <Input
              type="number"
              className="text-sm"
              value={Math.round(node.x)}
              onChange={(e) => updateSelectedEntity('x', Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-medium text-muted-foreground">
              {t('properties.yPosition')}
            </Label>
            <Input
              type="number"
              className="text-sm"
              value={Math.round(node.y)}
              onChange={(e) => updateSelectedEntity('y', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs font-medium text-muted-foreground">
            {t('properties.rotation')}
          </Label>
          <Input
            type="number"
            className="text-sm"
            value={Math.round(node.rotation || 0)}
            onChange={(e) => updateSelectedEntity('rotation', Number(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-medium text-muted-foreground">
              {t('properties.scaleX')}
            </Label>
            <Input
              type="number"
              step="0.1"
              className="text-sm"
              value={(node.scaleX || 1).toFixed(2)}
              onChange={(e) => updateSelectedEntity('scaleX', Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-medium text-muted-foreground">
              {t('properties.scaleY')}
            </Label>
            <Input
              type="number"
              step="0.1"
              className="text-sm"
              value={(node.scaleY || 1).toFixed(2)}
              onChange={(e) => updateSelectedEntity('scaleY', Number(e.target.value))}
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <span className="text-xs text-muted-foreground">
            {t('properties.type')}: {config.label}
          </span>
        </div>
      </div>
    )
  }

  // Check if Connection
  const conn = state.connections.find((c) => c.id === selectedId)
  if (conn) {
    return (
      <div className="w-64 flex-shrink-0 bg-background border-l p-4 flex flex-col gap-4 overflow-y-auto z-10 h-full">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b">
          <Workflow size={20} className="text-muted-foreground" />
          <h3 className="font-semibold text-foreground">{t('properties.connectionTitle')}</h3>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs font-medium text-muted-foreground">
            {t('properties.connectionLabel')}
          </Label>
          <Input
            type="text"
            className="text-sm"
            value={conn.label || ''}
            placeholder={t('properties.connectionLabelPlaceholder')}
            onChange={(e) => updateSelectedEntity('label', e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs font-medium text-muted-foreground">
            {t('properties.color')}
          </Label>
          <div className="flex gap-2">
            <Input
              type="color"
              className="h-8 w-16 p-0 border rounded cursor-pointer"
              value={conn.color || '#64748b'}
              onChange={(e) => updateSelectedEntity('color', e.target.value)}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateSelectedEntity('color', undefined)}
              className="text-xs"
            >
              {t('properties.reset')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs font-medium text-muted-foreground">
            {t('properties.strokeWidth')}
          </Label>
          <Input
            type="number"
            min="1"
            max="10"
            className="text-sm"
            value={conn.width || 2}
            onChange={(e) => updateSelectedEntity('width', Number(e.target.value))}
          />
        </div>
      </div>
    )
  }

  return null
}

