/**
 * 设备数据点选择对话框
 * 点击设备时弹出，显示该设备的所有数据点，支持搜索和筛选
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X, CheckCircle2, Circle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { DeviceNode, DataPointNode, SelectedDataPoint } from '@/types/history'
import { cn } from '@/lib/utils'

interface DeviceDataPointsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device: DeviceNode | null
  stationName: string
  selectedPoints: SelectedDataPoint[]
  onSelectionChange: (points: SelectedDataPoint[]) => void
}

type SemanticType = 'MEASURE' | 'ACCUM' | 'PARAM' | 'ALL'

export function DeviceDataPointsDialog({
  open,
  onOpenChange,
  device,
  stationName,
  selectedPoints,
  onSelectionChange,
}: DeviceDataPointsDialogProps) {
  const { t } = useTranslation('history')
  
  const [searchKeyword, setSearchKeyword] = useState('')
  const [semanticFilter, setSemanticFilter] = useState<SemanticType>('ALL')
  
  // 过滤后的数据点
  const filteredPoints = useMemo(() => {
    if (!device || !device.children) return []
    
    let filtered = device.children
    
    // 按语义类型筛选
    if (semanticFilter !== 'ALL') {
      filtered = filtered.filter(point => point.semantic_type === semanticFilter)
    }
    
    // 按关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase()
      filtered = filtered.filter(point => {
        return (
          point.name.toLowerCase().includes(keyword) ||
          point.tag_display_name.toLowerCase().includes(keyword) ||
          point.tag_name.toLowerCase().includes(keyword)
        )
      })
    }
    
    return filtered
  }, [device, searchKeyword, semanticFilter])
  
  // 检查数据点是否已选中
  const isPointSelected = (pointId: string) => {
    return selectedPoints.some(p => p.id === pointId)
  }
  
  // 处理数据点选择
  const handlePointToggle = (point: DataPointNode) => {
    const fullPath = `${stationName} / ${device?.name} / ${point.name}`
    const selectedPoint: SelectedDataPoint = {
      ...point,
      fullPath,
    }
    
    const isSelected = isPointSelected(point.id)
    
    if (isSelected) {
      onSelectionChange(selectedPoints.filter(p => p.id !== point.id))
    } else {
      if (selectedPoints.length >= 20) {
        toast.error(t('error.too_many_points'))
        return
      }
      onSelectionChange([...selectedPoints, selectedPoint])
    }
  }
  
  // 获取语义类型颜色
  const getSemanticTypeColor = (semanticType: string) => {
    switch (semanticType) {
      case 'MEASURE':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      case 'ACCUM':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
      case 'PARAM':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800'
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800'
    }
  }
  
  // 关闭对话框时清空搜索
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchKeyword('')
      setSemanticFilter('ALL')
    }
    onOpenChange(newOpen)
  }
  
  if (!device) return null
  
  const selectedCount = filteredPoints.filter(p => isPointSelected(p.id)).length
  const canSelectMore = selectedPoints.length < 20
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-2xl md:max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">
            {t('dialog.selectDataPoints')} - {device.name}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t('dialog.description', { 
              total: device.children.length,
              selected: selectedCount,
              max: 20
            })}
          </DialogDescription>
        </DialogHeader>
        
        {/* 搜索和筛选栏 */}
        <div className="space-y-2">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('dialog.search.placeholder')}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="h-9 pl-9 pr-9"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          
          {/* 语义类型筛选按钮 */}
          <div className="flex flex-wrap gap-1.5">
            {(['ALL', 'MEASURE', 'ACCUM', 'PARAM'] as SemanticType[]).map(type => (
              <Button
                key={type}
                variant={semanticFilter === type ? 'default' : 'outline'}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setSemanticFilter(type)}
              >
                {type === 'ALL' ? t('tree.filter.all') : type}
              </Button>
            ))}
          </div>
          
          {/* 结果统计 */}
          <div className="text-xs text-muted-foreground">
            {t('dialog.search.results', { 
              count: filteredPoints.length,
              total: device.children.length
            })}
          </div>
        </div>
        
        {/* 数据点列表 */}
        <ScrollArea className="flex-1 border rounded-md">
          {filteredPoints.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">{t('dialog.search.noResults')}</p>
            </div>
          ) : (
            <div className="p-2 space-y-1 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-2">
              {filteredPoints.map(point => {
                const isSelected = isPointSelected(point.id)
                const isDisabled = !isSelected && !canSelectMore
                
                return (
                  <div
                    key={point.id}
                    className={cn(
                      "flex items-center gap-3 py-2 px-3 rounded-md hover:bg-accent/50 transition-colors cursor-pointer group border border-transparent",
                      isSelected && "bg-primary/10 border border-primary/20",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => !isDisabled && handlePointToggle(point)}
                  >
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{point.name}</div>
                      {point.tag_display_name !== point.name && (
                        <div className="text-xs text-muted-foreground truncate">
                          {point.tag_display_name}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-xs border px-2 py-0 shrink-0", getSemanticTypeColor(point.semantic_type))}
                    >
                      {point.semantic_type}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
        
        {/* 底部操作栏 */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            {t('dialog.selectedCount', { 
              count: selectedCount,
              max: 20
            })}
          </div>
          <Button
            onClick={() => handleOpenChange(false)}
            size="sm"
            className="h-8 px-4"
          >
            {t('dialog.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

