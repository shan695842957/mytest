/**
 * 历史数据查询页面
 * 
 * 布局策略：
 * - 使用 CSS Grid 实现稳定的三栏布局
 * - 左侧：设备树选择面板（固定宽度）
 * - 右侧：控制面板（自适应高度）+ 结果展示（占据剩余空间）
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HistoryDeviceTree } from './components/HistoryDeviceTree'
import { HistorySelectedPoints } from './components/HistorySelectedPoints'
import { HistoryChart } from './components/HistoryChart'
import { HistoryTable } from './components/HistoryTable'
import { queryHistoryData } from '@/api/history'
import type { SelectedDataPoint, TimeRange, HistoryDataQueryResponse, HistoryDataPoint } from '@/types/history'
import { toast } from 'sonner'
import { BarChart3, LineChart as LineChartIcon, Table2 } from 'lucide-react'
import HistoryDataPageMobile from './HistoryDataPageMobile'

export default function HistoryDataPage() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  if (isMobile) {
    return <HistoryDataPageMobile />
  }
  return <HistoryDataPageDesktop />
}

function HistoryDataPageDesktop() {
  const { t } = useTranslation('history')
  const { t: tMenu } = useTranslation('menu')
  
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
    } catch (error: unknown) {
      console.error('Query failed:', error)
      const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string }
      const errorMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || t('query.error')
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-4">
      {/* 页面标题 */}
      <div className="flex-shrink-0 mb-4 px-4 pt-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {tMenu('history_data')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('sidebar.description')}
        </p>
      </div>
      
      {/* 主内容区域：左侧设备树 + 右侧控制面板和结果 */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)] flex-1 min-h-0 overflow-hidden gap-4 px-4 pb-4">
        
        {/* 左侧区域：设备树选择面板 */}
        <div className="overflow-hidden min-h-0">
          <Card className="h-full flex flex-col overflow-hidden shadow-sm border-border/50">
            <div className="h-10 border-b flex items-center px-3 bg-muted/40 flex-shrink-0">
              <BarChart3 className="h-4 w-4 text-primary mr-2" />
              <h2 className="text-sm font-semibold">{t('sidebar.title')}</h2>
            </div>
            <CardContent className="flex-1 overflow-hidden p-0 relative">
              <div className="absolute inset-0">
                <HistoryDeviceTree
                  selectedPoints={selectedPoints}
                  onSelectionChange={setSelectedPoints}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 右侧区域：控制面板 + 结果展示 */}
        <div className="grid grid-rows-[auto_1fr] min-h-0 overflow-hidden gap-4">
          
          {/* 右上：控制面板 (高度自适应内容) */}
          <div className="flex-shrink-0">
            <Card className="flex flex-col shadow-sm border-border/50 overflow-hidden">
              <CardContent className="p-3 lg:p-4">
                <HistorySelectedPoints
                  selectedPoints={selectedPoints}
                  timeRange={timeRange}
                  onRemovePoint={(pointId) => {
                    setSelectedPoints(prev => prev.filter(p => p.id !== pointId))
                  }}
                  onTimeRangeChange={setTimeRange}
                  onAnalyze={handleAnalyze}
                  isLoading={isLoading}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* 右下：结果展示 (占据剩余高度) */}
          <div className="min-h-0 overflow-hidden">
            <Card className="h-full flex flex-col shadow-sm border-border/50 overflow-hidden">
              <CardContent className="flex-1 flex flex-col overflow-hidden p-0 min-h-0">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chart' | 'table')} className="h-full flex flex-col">
                  {/* Tabs Header */}
                  <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
                    <div>
                      <h3 className="text-sm font-semibold leading-none">{t('result.title')}</h3>
                      <p className="text-[11px] text-muted-foreground mt-1">{t('result.description')}</p>
                    </div>
                    <TabsList className="h-8">
                      <TabsTrigger value="chart" className="gap-1.5 px-3 text-xs h-7">
                        <LineChartIcon className="h-3 w-3" />
                        {t('result.tab.chart')}
                      </TabsTrigger>
                      <TabsTrigger value="table" className="gap-1.5 px-3 text-xs h-7">
                        <Table2 className="h-3 w-3" />
                        {t('result.tab.table')}
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  {/* Tabs Content - Chart */}
                  <TabsContent value="chart" className="flex-1 overflow-hidden mt-0 m-0 p-0 relative">
                    <HistoryChart
                      data={queryResult}
                      isLoading={isLoading}
                    />
                  </TabsContent>
                  
                  {/* Tabs Content - Table */}
                  <TabsContent value="table" className="flex-1 overflow-hidden mt-0 m-0 p-0 relative">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
