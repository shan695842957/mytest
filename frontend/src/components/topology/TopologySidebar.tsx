/**
 * 拓扑编辑器侧边栏组件
 */

import { useTranslation } from 'react-i18next'
import type { ComponentType } from '@/types/topology'
import { COMPONENT_CONFIG } from '@/types/topology'
import { TopologyIcons } from './TopologyIcons'

interface TopologySidebarProps {
  handleDragStart: (e: React.DragEvent, type: ComponentType) => void
}

export function TopologySidebar({ handleDragStart }: TopologySidebarProps) {
  const { t } = useTranslation('topology')

  return (
    <aside className="w-64 border-r bg-background p-4 overflow-y-auto shadow-inner z-10 flex flex-col gap-6 select-none flex-shrink-0">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t('sidebar.components')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(COMPONENT_CONFIG) as ComponentType[]).map((type) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
              className="flex flex-col items-center justify-center gap-2 rounded border border-border bg-muted p-3 hover:border-primary hover:bg-primary/10 hover:shadow cursor-grab active:cursor-grabbing transition-all"
            >
              <div className="text-foreground">{TopologyIcons[type]}</div>
              <span className="text-xs font-medium text-foreground">
                {COMPONENT_CONFIG[type].label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-primary/10 p-3 rounded text-xs text-primary border border-primary/20">
        <p className="font-semibold mb-1">{t('sidebar.tips.title')}</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>{t('sidebar.tips.drag')}</li>
          <li>
            <b>{t('sidebar.tips.copyPaste')}</b>
          </li>
          <li>
            <b>{t('sidebar.tips.shiftDrag')}</b>
          </li>
          <li>
            <b>{t('sidebar.tips.exportImport')}</b>
          </li>
          <li>
            <b>{t('sidebar.tips.arrows')}</b>
          </li>
        </ul>
      </div>
    </aside>
  )
}

