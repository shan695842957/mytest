/**
 * 历史数据查询页面 - 移动端版本
 * 完全独立的移动端页面，遵循 Material Design 规范
 * 参考：移动端开发规范 @.cursor/rules/mobile.mdc
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Menu, X, Play, Loader2, BarChart3, LineChart as LineChartIcon, 
  Table2, Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MaterialCard } from '@/components/common/MaterialCard'
import { HistoryDeviceTree } from './components/HistoryDeviceTree'
import { HistoryChart } from './components/HistoryChart'
import { HistoryTable } from './components/HistoryTable'
import { TimeRangePicker } from './components/TimeRangePicker'
import { queryHistoryData } from '@/api/history'
import type { SelectedDataPoint, TimeRange, HistoryDataQueryResponse, HistoryDataPoint } from '@/types/history'
import { toast } from 'sonner'

export default function HistoryDataPageMobile() {
  const { t } = useTranslation('history')
  
  // 设备树抽屉状态
  const [treeSheetOpen, setTreeSheetOpen] = useState(false)
  
  // 已选数据点
  const [selectedPoints, setSelectedPoints] = useState<SelectedDataPoint[]>([])
  
  // 时间范围（默认最近24小时）
  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
    const end = new Date()
    const start = new Date()
    start.setHours(start.getHours() - 24)
    return { start, end }
  })
  
  // 查询结果
  const [queryResult, setQueryResult] = useState<HistoryDataQueryResponse | null>(null)
  
  // 当前Tab（趋势曲线/详细数据）
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart')
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(false)
  
  // 执行查询
  const handleAnalyze = async () => {
    if (selectedPoints.length === 0) {
      toast.error(t('error.no_points_selected'))
      return
    }
    
    // 验证时间范围
    if (timeRange.end <= timeRange.start) {
      toast.error(t('error.invalid_time_range'))
      return
    }
    
    // 清空旧结果
    setQueryResult(null)
    setIsLoading(true)
    
    try {
      // 转换为API需要的格式
      const dataPoints: HistoryDataPoint[] = selectedPoints.map(point => ({
        asset_id: point.asset_id,
        tag_name: point.tag_name,
        semantic_type: point.semantic_type,
      }))
      
      const result = await queryHistoryData({
        data_points: dataPoints,
        start_time: timeRange.start.toISOString(),
        end_time: timeRange.end.toISOString(),
        interval: null,
      })
      
      setQueryResult(result)
      toast.success(t('query.success'))
    } catch (error: any) {
      console.error('Query failed:', error)
      const errorMsg = error?.response?.data?.detail || error?.response?.data?.message || error?.message || t('query.error')
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden -m-4 md:-m-6">
      {/* 顶部操作栏 - 固定，适配 Safe Area */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b flex-shrink-0">
        <div className="px-4 py-3 space-y-3">
          {/* 标题和菜单按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-semibold">{t('sidebar.title')}</h1>
            </div>
            <Sheet open={treeSheetOpen} onOpenChange={setTreeSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:w-[400px] p-0 flex flex-col">
                <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
                  <SheetTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    {t('sidebar.title')}
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-hidden">
                  <HistoryDeviceTree
                    selectedPoints={selectedPoints}
                    onSelectionChange={(points) => {
                      setSelectedPoints(points)
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* 已选数据点 - 紧凑显示 */}
          {selectedPoints.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {t('selected.title')} ({selectedPoints.length}/20)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setSelectedPoints([])}
                >
                  {t('mobile.clearAll')}
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {selectedPoints.map(point => (
                  <Badge
                    key={point.id}
                    variant="secondary"
                    className="flex items-center gap-1 h-7 px-2 text-xs font-normal"
                  >
                    <span className="max-w-[200px] truncate">{point.fullPath}</span>
                    <button
                      onClick={() => setSelectedPoints(prev => prev.filter(p => p.id !== point.id))}
                      className="ml-0.5 hover:bg-destructive/20 rounded-full p-0.5 transition-colors -mr-0.5"
                      title={t('selected.remove')}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* 时间范围选择 */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground block">
              {t('timeRange.label')}
            </label>
            <TimeRangePicker
              value={timeRange}
              onChange={setTimeRange}
              disabled={isLoading}
            />
          </div>
          
          {/* 开始分析按钮 - 最小触摸目标 44px */}
          <Button
            onClick={handleAnalyze}
            disabled={selectedPoints.length === 0 || isLoading}
            className="w-full min-h-[44px]"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>{t('analyze.loading')}</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                <span>{t('analyze.button')}</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* 主内容区 - 可滚动 */}
      <div className="flex-1 overflow-hidden">
        {selectedPoints.length === 0 ? (
          /* 空状态 - 提示选择数据点 */
          <div className="h-full flex items-center justify-center p-6">
            <MaterialCard
              className="w-full max-w-sm"
              title={
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary" />
                  <span>{t('mobile.empty.title')}</span>
                </div>
              }
              description={t('mobile.empty.description')}
            >
              <Button
                onClick={() => setTreeSheetOpen(true)}
                className="w-full h-11"
                size="lg"
              >
                <Menu className="h-4 w-4 mr-2" />
                {t('mobile.selectDataPoints')}
              </Button>
            </MaterialCard>
          </div>
        ) : queryResult ? (
          /* 有查询结果 - 显示图表和表格 */
          <div className="h-full flex flex-col p-3 gap-3">
            <Tabs 
              value={activeTab} 
              onValueChange={(v) => setActiveTab(v as 'chart' | 'table')} 
              className="h-full flex flex-col"
            >
              {/* Tabs 头部 - 横向滚动 */}
              <div className="w-full overflow-x-auto scrollbar-hide">
                <TabsList className="inline-flex w-fit md:grid md:w-full md:grid-cols-2">
                  <TabsTrigger 
                    value="chart" 
                    className="flex-shrink-0 whitespace-nowrap px-4 min-w-[120px] h-10 gap-2 text-sm"
                  >
                    <LineChartIcon className="h-4 w-4" />
                    {t('result.tab.chart')}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="table" 
                    className="flex-shrink-0 whitespace-nowrap px-4 min-w-[120px] h-10 gap-2 text-sm"
                  >
                    <Table2 className="h-4 w-4" />
                    {t('result.tab.table')}
                  </TabsTrigger>
                </TabsList>
              </div>
              
              {/* 图表内容 */}
              <TabsContent value="chart" className="flex-1 overflow-hidden mt-0 m-0 p-0">
                <div className="h-full rounded-2xl border border-border bg-card shadow-sm p-2">
                  <HistoryChart
                    data={queryResult}
                    isLoading={isLoading}
                  />
                </div>
              </TabsContent>
              
              {/* 表格内容 */}
              <TabsContent value="table" className="flex-1 overflow-auto mt-0 m-0 p-0">
                <HistoryTable
                  data={queryResult}
                  isLoading={isLoading}
                  selectedPoints={selectedPoints.map(p => ({
                    asset_id: p.asset_id,
                    tag_name: p.tag_name,
                    semantic_type: p.semantic_type,
                  }))}
                  timeRange={timeRange}
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          /* 已选择但未查询 - 提示开始分析 */
          <div className="h-full flex items-center justify-center p-6">
            <MaterialCard
              className="w-full max-w-sm"
              title={
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>{t('mobile.ready.title')}</span>
                </div>
              }
              description={t('mobile.ready.description')}
            >
              <Button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full h-11"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>{t('analyze.loading')}</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    <span>{t('analyze.button')}</span>
                  </>
                )}
              </Button>
            </MaterialCard>
          </div>
        )}
      </div>
    </div>
  )
}

