/**
 * 拓扑建模页面
 * 电力系统拓扑图编辑器
 */

import { useTranslation } from 'react-i18next'
import { useTopologyEditor } from '@/hooks/useTopologyEditor'
import { TopologyToolbar } from '@/components/topology/TopologyToolbar'
import { TopologySidebar } from '@/components/topology/TopologySidebar'
import { TopologyPropertiesPanel } from '@/components/topology/TopologyPropertiesPanel'
import { TopologyCanvas } from '@/components/topology/TopologyCanvas'
import { ToolMode as ToolModeEnum } from '@/types/topology'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function TopologyPage() {
  const { t } = useTranslation('topology')

  const editor = useTopologyEditor()

  return (
    <div className="absolute inset-4 flex flex-col font-sans bg-background">
      {/* Hidden File Input for Import */}
      <input
        type="file"
        ref={editor.fileInputRef}
        onChange={editor.handleFileChange}
        accept=".json"
        className="hidden"
      />

      <TopologyToolbar
        undo={editor.undo}
        redo={editor.redo}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        toolMode={editor.toolMode}
        setToolMode={editor.setToolMode}
        handleCopy={editor.handleCopy}
        handlePaste={editor.handlePaste}
        handleExport={editor.handleExport}
        handleImportClick={editor.handleImportClick}
        loadDemo={editor.loadDemo}
        handleDelete={editor.handleDelete}
        scale={editor.scale}
        setScale={editor.setScale}
        showGrid={editor.showGrid}
        setShowGrid={editor.setShowGrid}
        alignNodes={editor.alignNodes}
        flipNodes={editor.flipNodes}
        selectionCount={editor.selectedIds.size}
        hasClipboard={!!editor.clipboard}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <TopologySidebar handleDragStart={editor.handleDragStart} />

        {/* Canvas Area */}
        <main
          className="flex-1 bg-muted relative cursor-crosshair overflow-hidden min-w-0"
          onDrop={editor.handleDrop}
          onDragOver={editor.handleDragOver}
        >
          <TopologyCanvas
            stageRef={editor.stageRef}
            trRef={editor.trRef}
            state={editor.state}
            toolMode={editor.toolMode}
            scale={editor.scale}
            position={editor.position}
            showGrid={editor.showGrid}
            stageHeight={editor.stageHeight}
            selectedIds={editor.selectedIds}
            selectionBox={editor.selectionBox}
            connectSourceId={editor.connectSourceId}
            potentialConnectionTargetId={editor.potentialConnectionTargetId}
            isDrawingConnection={editor.isDrawingConnection}
            tempConnectionStart={editor.tempConnectionStart}
            tempConnectionCurrent={editor.tempConnectionCurrent}
            onWheel={editor.handleStageWheel}
            onMouseDown={editor.handleStageMouseDown}
            onMouseMove={editor.handleStageMouseMove}
            onMouseUp={editor.handleStageMouseUp}
            onClick={editor.handleStageClick}
            onConnectionClick={editor.handleConnectionClick}
            onNodeDragStart={editor.handleNodeDragStart}
            onNodeDragMove={editor.handleNodeDragMove}
            onNodeDragEnd={editor.handleNodeDragEnd}
            onNodeClick={editor.handleNodeClick}
            onTransform={editor.handleTransform}
            onTransformEnd={editor.handleTransformEnd}
          />

          {/* Overlay Feedback */}
          {editor.toolMode === ToolModeEnum.CONNECT && (
            <div className="absolute top-4 left-4 pointer-events-none z-20">
              <Alert
                className={`${
                  editor.connectSourceId
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-blue-100 text-blue-700 border-blue-200'
                }`}
              >
                <AlertDescription className="text-xs font-semibold">
                  {editor.connectSourceId
                    ? t('canvas.connectTarget')
                    : t('canvas.connectSource')}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </main>

        <TopologyPropertiesPanel
          selectedIds={editor.selectedIds}
          state={editor.state}
          pushState={editor.pushState}
        />
      </div>
    </div>
  )
}

