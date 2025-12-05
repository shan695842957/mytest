/**
 * 拓扑编辑器工具栏组件
 */

import { useTranslation } from 'react-i18next'
import {
  Undo2,
  Redo2,
  MousePointer2,
  Hand,
  Cable,
  Copy,
  ClipboardPaste,
  Grid3X3,
  PlaySquare,
  Download,
  Upload,
  AlignCenter,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Trash2,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ToolMode } from '@/types/topology'
import { ToolMode as ToolModeEnum } from '@/types/topology'

interface TopologyToolbarProps {
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  toolMode: ToolMode
  setToolMode: (mode: ToolMode) => void
  handleCopy: () => void
  handlePaste: () => void
  handleExport: () => void
  handleImportClick: () => void
  loadDemo: () => void
  handleDelete: () => void
  scale: number
  setScale: React.Dispatch<React.SetStateAction<number>>
  showGrid: boolean
  setShowGrid: (show: boolean) => void
  alignNodes: (axis: 'horizontal' | 'vertical') => void
  flipNodes: (axis: 'horizontal' | 'vertical') => void
  selectionCount: number
  hasClipboard: boolean
}

export function TopologyToolbar({
  undo,
  redo,
  canUndo,
  canRedo,
  toolMode,
  setToolMode,
  handleCopy,
  handlePaste,
  handleExport,
  handleImportClick,
  loadDemo,
  handleDelete,
  scale,
  setScale,
  showGrid,
  setShowGrid,
  alignNodes,
  flipNodes,
  selectionCount,
  hasClipboard,
}: TopologyToolbarProps) {
  const { t } = useTranslation('topology')

  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-2 shadow-sm z-10 select-none">
      <div className="flex items-center gap-2">
        <Zap className="text-primary" />
        <h1 className="text-lg font-bold">{t('toolbar.title')}</h1>
      </div>

      <div className="flex items-center gap-4 rounded-lg bg-muted p-1">
        {/* History */}
        <div className="flex items-center border-r border-border pr-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={undo}
                disabled={!canUndo}
                title={t('toolbar.undo')}
              >
                <Undo2 size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('toolbar.undo')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={redo}
                disabled={!canRedo}
                title={t('toolbar.redo')}
              >
                <Redo2 size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('toolbar.redo')}</TooltipContent>
          </Tooltip>
        </div>

        {/* Tools */}
        <div className="flex items-center border-r border-border pr-2 gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={toolMode === ToolModeEnum.SELECT ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setToolMode(ToolModeEnum.SELECT)}
              >
                <MousePointer2 size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('toolbar.select')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={toolMode === ToolModeEnum.PAN ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setToolMode(ToolModeEnum.PAN)}
              >
                <Hand size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('toolbar.pan')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={toolMode === ToolModeEnum.CONNECT ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setToolMode(ToolModeEnum.CONNECT)}
              >
                <Cable size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('toolbar.connect')}</TooltipContent>
          </Tooltip>
        </div>

        {/* Copy / Paste */}
        <div className="flex items-center border-r border-border pr-2 gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCopy}
                disabled={selectionCount === 0}
                title={t('toolbar.copy')}
              >
                <Copy size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('toolbar.copy')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handlePaste}
                disabled={!hasClipboard}
                title={t('toolbar.paste')}
              >
                <ClipboardPaste size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('toolbar.paste')}</TooltipContent>
          </Tooltip>
        </div>

        {/* Grid, Demo, File */}
        <div className="flex items-center border-r border-border pr-2 gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showGrid ? 'default' : 'ghost'}
                size="icon-sm"
                onClick={() => setShowGrid(!showGrid)}
                title={t('toolbar.toggleGrid')}
              >
                <Grid3X3 size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('toolbar.toggleGrid')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={loadDemo} title={t('toolbar.loadDemo')}>
                <PlaySquare size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('toolbar.loadDemo')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleExport}
                title={t('toolbar.export')}
              >
                <Download size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('toolbar.export')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleImportClick}
                title={t('toolbar.import')}
              >
                <Upload size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('toolbar.import')}</TooltipContent>
          </Tooltip>
        </div>

        {/* Alignment & Flip */}
        {selectionCount > 0 && (
          <div className="flex items-center border-r border-border pr-2 gap-1">
            {/* Only show alignment/flip for nodes, simple check if we have multiple items */}
            {selectionCount > 1 && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => alignNodes('horizontal')}
                      title={t('toolbar.alignHorizontal')}
                    >
                      <AlignCenter size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('toolbar.alignHorizontal')}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => alignNodes('vertical')}
                      title={t('toolbar.alignVertical')}
                    >
                      <AlignCenter size={18} className="rotate-90" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('toolbar.alignVertical')}</TooltipContent>
                </Tooltip>
                <div className="w-px h-6 bg-border mx-1" />
              </>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => flipNodes('horizontal')}
                  title={t('toolbar.flipHorizontal')}
                >
                  <FlipHorizontal size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('toolbar.flipHorizontal')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => flipNodes('vertical')}
                  title={t('toolbar.flipVertical')}
                >
                  <FlipVertical size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('toolbar.flipVertical')}</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setScale((s) => Math.min(s * 1.2, 5))}
              >
                <ZoomIn size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('toolbar.zoomIn')}</TooltipContent>
          </Tooltip>
          <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setScale((s) => Math.max(s / 1.2, 0.2))}
              >
                <ZoomOut size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('toolbar.zoomOut')}</TooltipContent>
          </Tooltip>
        </div>

        {selectionCount > 0 && (
          <div className="ml-2 border-l border-border pl-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleDelete}
                  className="text-destructive hover:bg-destructive/10"
                  title={t('toolbar.delete')}
                >
                  <Trash2 size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('toolbar.delete')}</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
      <div className="w-24" />
    </header>
  )
}

