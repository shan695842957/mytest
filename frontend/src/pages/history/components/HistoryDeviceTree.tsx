/**
 * 历史数据查询 - 设备树选择组件
 * 支持搜索、筛选和扁平化显示，优化大量数据点的查找
 */

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { 
  ChevronRight, ChevronDown, FolderOpen, Folder, Package, Activity, 
  Loader2, Search, X, Filter, ChevronsDown, ChevronsUp 
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getDeviceTree } from '@/api/history'
import type { StationNode, DeviceNode, DataPointNode, SelectedDataPoint } from '@/types/history'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { DeviceDataPointsDialog } from './DeviceDataPointsDialog'

interface HistoryDeviceTreeProps {
  selectedPoints: SelectedDataPoint[]
  onSelectionChange: (points: SelectedDataPoint[]) => void
}

type SemanticType = 'MEASURE' | 'ACCUM' | 'PARAM' | 'ALL'

interface FlatDataPoint extends DataPointNode {
  stationName: string
  deviceName: string
  fullPath: string
}

export function HistoryDeviceTree({ selectedPoints, onSelectionChange }: HistoryDeviceTreeProps) {
  const { t } = useTranslation('history')
  
  // 搜索关键词
  const [searchKeyword, setSearchKeyword] = useState('')
  
  // 语义类型筛选
  const [semanticFilter, setSemanticFilter] = useState<SemanticType>('ALL')
  
  // 展开状态（只展开电站，设备不再展开）
  const [expandedStations, setExpandedStations] = useState<Set<string>>(new Set())
  
  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<{ device: DeviceNode; stationName: string } | null>(null)
  
  // 是否全部展开（默认折叠，避免一次性加载太多数据）
  const [allExpanded, setAllExpanded] = useState(false)
  
  // 获取设备树
  const { data, isLoading, error } = useQuery({
    queryKey: ['history-device-tree'],
    queryFn: () => getDeviceTree(),
  })
  
  // 扁平化所有数据点（用于搜索）
  const flatDataPoints = useMemo(() => {
    if (!data || !data.stations) return []
    
    const points: FlatDataPoint[] = []
    
    data.stations.forEach(station => {
      station.children.forEach(device => {
        device.children.forEach(point => {
          points.push({
            ...point,
            stationName: station.name,
            deviceName: device.name,
            fullPath: `${station.name} / ${device.name} / ${point.name}`,
          })
        })
      })
    })
    
    return points
  }, [data])
  
  // 过滤后的扁平化数据点
  const filteredFlatPoints = useMemo(() => {
    let filtered = flatDataPoints
    
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
          point.tag_name.toLowerCase().includes(keyword) ||
          point.stationName.toLowerCase().includes(keyword) ||
          point.deviceName.toLowerCase().includes(keyword) ||
          point.fullPath.toLowerCase().includes(keyword)
        )
      })
    }
    
    return filtered
  }, [flatDataPoints, searchKeyword, semanticFilter])
  
  // 是否显示搜索结果（有搜索关键词时）
  const showSearchResults = searchKeyword.trim().length > 0
  
  // 自动展开/折叠所有节点
  useEffect(() => {
    if (data && data.stations && !showSearchResults) {
      if (allExpanded) {
        const stationIds = new Set(data.stations.map(s => s.id))
        setExpandedStations(stationIds)
      } else {
        setExpandedStations(new Set())
      }
    }
  }, [data, allExpanded, showSearchResults])
  
  // 切换全部展开/折叠
  const toggleAllExpanded = () => {
    setAllExpanded(!allExpanded)
  }
  
  // 切换电站展开
  const toggleStation = (stationId: string) => {
    setExpandedStations(prev => {
      const next = new Set(prev)
      if (next.has(stationId)) {
        next.delete(stationId)
      } else {
        next.add(stationId)
      }
      return next
    })
  }
  
  // 打开设备数据点选择对话框
  const handleDeviceClick = (device: DeviceNode, stationName: string) => {
    setSelectedDevice({ device, stationName })
    setDialogOpen(true)
  }
  
  // 处理数据点选择
  const handlePointToggle = (point: FlatDataPoint | DataPointNode, stationName?: string, deviceName?: string) => {
    const fullPath = stationName && deviceName
      ? `${stationName} / ${deviceName} / ${point.name}`
      : (point as FlatDataPoint).fullPath
    
    const selectedPoint: SelectedDataPoint = {
      ...point,
      fullPath,
    }
    
    const isSelected = selectedPoints.some(p => p.id === point.id)
    
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
  
  // 检查数据点是否已选中
  const isPointSelected = (pointId: string) => {
    return selectedPoints.some(p => p.id === pointId)
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
  
  if (isLoading) {
    return (
      <div className="space-y-2 py-2">
        <Skeleton className="h-8 w-full" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-8 w-full" />
            <div className="ml-6 space-y-1">
              <Skeleton className="h-7 w-full" />
              <Skeleton className="h-7 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        <p className="text-xs">{t('tree.error')}</p>
      </div>
    )
  }
  
  if (!data || !data.stations || data.stations.length === 0) {
    return (
      <div className="p-6 text-center">
        <Activity className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-xs text-muted-foreground">{t('tree.empty')}</p>
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* 搜索和筛选栏 */}
      <div className="p-2 space-y-2 border-b">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t('tree.search.placeholder')}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="h-8 pl-8 pr-8 text-xs"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
        
        {/* 语义类型筛选按钮 */}
        <div className="flex flex-wrap gap-1">
          {(['ALL', 'MEASURE', 'ACCUM', 'PARAM'] as SemanticType[]).map(type => (
            <Button
              key={type}
              variant={semanticFilter === type ? 'default' : 'outline'}
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={() => setSemanticFilter(type)}
            >
              {type === 'ALL' ? t('tree.filter.all') : type}
            </Button>
          ))}
        </div>
        
        {/* 展开/折叠全部按钮 */}
        {!showSearchResults && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-full text-[10px]"
            onClick={toggleAllExpanded}
          >
            {allExpanded ? (
              <>
                <ChevronsUp className="h-3 w-3 mr-1" />
                {t('tree.collapseAll')}
              </>
            ) : (
              <>
                <ChevronsDown className="h-3 w-3 mr-1" />
                {t('tree.expandAll')}
              </>
            )}
          </Button>
        )}
        
        {/* 结果统计 */}
        {showSearchResults && (
          <div className="text-xs text-muted-foreground text-center">
            {t('tree.search.results', { count: filteredFlatPoints.length })}
          </div>
        )}
      </div>
      
      {/* 内容区域 */}
      <ScrollArea className="flex-1">
        <div className="space-y-0.5 py-1">
          {showSearchResults ? (
            /* 搜索结果 - 扁平化列表 */
            filteredFlatPoints.length === 0 ? (
              <div className="p-6 text-center">
                <Search className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">{t('tree.search.noResults')}</p>
              </div>
            ) : (
              filteredFlatPoints.map(point => (
                <div
                  key={point.id}
                  className={cn(
                    "flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer group",
                    isPointSelected(point.id) && "bg-primary/10 border border-primary/20"
                  )}
                  onClick={() => handlePointToggle(point)}
                >
                  <Checkbox
                    checked={isPointSelected(point.id)}
                    onCheckedChange={() => handlePointToggle(point)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-3.5 w-3.5"
                  />
                  <Activity className={cn(
                    "h-3 w-3 flex-shrink-0",
                    isPointSelected(point.id) ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{point.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{point.fullPath}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] border px-1.5 py-0 shrink-0", getSemanticTypeColor(point.semantic_type))}
                  >
                    {point.semantic_type}
                  </Badge>
                </div>
              ))
            )
          ) : (
            /* 树形结构 */
            data.stations.map(station => (
              <div key={station.id} className="space-y-0.5">
                {/* 电站节点 */}
                <div
                  className={cn(
                    "flex items-center gap-1.5 py-1.5 px-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer group",
                    expandedStations.has(station.id) && "bg-accent/30"
                  )}
                  onClick={() => toggleStation(station.id)}
                >
                  <button
                    className="p-0.5 hover:bg-accent rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleStation(station.id)
                    }}
                  >
                    {expandedStations.has(station.id) ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                  {expandedStations.has(station.id) ? (
                    <FolderOpen className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs font-medium flex-1 text-left truncate">{station.name}</span>
                  <Badge variant="secondary" className="text-[10px] px-1 h-4">
                    {station.children.length}
                  </Badge>
                </div>
                
                {/* 设备列表 */}
                {expandedStations.has(station.id) && (
                  <div className="ml-6 space-y-0.5">
                    {station.children
                      .filter(device => {
                        // 按语义类型筛选设备（只显示包含匹配数据点的设备）
                        if (semanticFilter === 'ALL') return true
                        return device.children.some(point => point.semantic_type === semanticFilter)
                      })
                      .map(device => {
                        const filteredPoints = semanticFilter === 'ALL'
                          ? device.children
                          : device.children.filter(point => point.semantic_type === semanticFilter)
                        
                        if (filteredPoints.length === 0) return null
                        
                        // 计算已选中的数据点数量
                        const selectedCount = filteredPoints.filter(p => isPointSelected(p.id)).length
                        
                        return (
                          <div key={device.id}>
                            {/* 设备节点 - 点击打开对话框 */}
                            <div
                              className={cn(
                                "flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer group",
                                selectedCount > 0 && "bg-primary/5 border border-primary/10"
                              )}
                              onClick={() => handleDeviceClick(device, station.name)}
                            >
                              <Package className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs flex-1 text-left truncate">{device.name}</span>
                              <Badge variant="outline" className="text-[10px] px-1 h-4">
                                {filteredPoints.length}
                              </Badge>
                              {selectedCount > 0 && (
                                <Badge variant="default" className="text-[10px] px-1 h-4">
                                  {selectedCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      {/* 设备数据点选择对话框 */}
      {selectedDevice && (
        <DeviceDataPointsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          device={selectedDevice.device}
          stationName={selectedDevice.stationName}
          selectedPoints={selectedPoints}
          onSelectionChange={onSelectionChange}
        />
      )}
    </div>
  )
}
