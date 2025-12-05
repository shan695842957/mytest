/**
 * SOE 事件查询页面 - 完整功能
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, RefreshCw, Filter, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useSOEEventList } from '@/hooks/useSOEQueries'
import { useEventTypes, useSeverityLevels } from '@/hooks/useDictQueries'
import type { SOEEventQueryParams } from '@/types'
import { formatDateTime } from '@/utils/format'

export default function SOEPage() {
  const { t } = useTranslation('soe')
  
  // 查询参数
  const [params, setParams] = useState<SOEEventQueryParams>({
    skip: 0,
    limit: 100,
  })
  
  // 获取数据
  const { data, isLoading, refetch } = useSOEEventList(params)
  const { data: eventTypes } = useEventTypes()
  const { data: severityLevels } = useSeverityLevels()
  
  // 处理搜索
  const handleSearch = (search: string) => {
    setParams(prev => ({ ...prev, search, skip: 0 }))
  }
  
  // 快速时间选择
  const handleQuickTime = (hours: number) => {
    const toTime = new Date()
    const fromTime = new Date(toTime.getTime() - hours * 60 * 60 * 1000)
    setParams(prev => ({
      ...prev,
      from_time: fromTime.toISOString(),
      to_time: toTime.toISOString(),
      skip: 0,
    }))
  }
  
  // 分页 - 后端返回 ApiResponse<List<SOEEvent>>，data 是数组，pagination 是分页信息
  const pagination = data?.pagination
  const items = (data?.data as SOEEvent[] | null | undefined) || []
  
  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">查询和查看 SOE 事件</p>
      </div>
      
      {/* 筛选区域 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('filter.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 快速时间选择 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickTime(1)}
            >
              {t('filter.quickOptions.last1h')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickTime(24)}
            >
              {t('filter.quickOptions.last24h')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickTime(24 * 7)}
            >
              {t('filter.quickOptions.last7d')}
            </Button>
          </div>
          
          {/* 关键字搜索 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t('filter.keyword')}
              className="pl-10"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          
          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button onClick={() => refetch()}>
              <RefreshCw className="mr-2 size-4" />
              {t('filter.apply')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setParams({ skip: 0, limit: 100 })}
            >
              {t('filter.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* SOE 事件表格 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.columns.createdAt')}</TableHead>
                  <TableHead>{t('table.columns.assetName')}</TableHead>
                  <TableHead>{t('table.columns.tagDisplayName')}</TableHead>
                  <TableHead>{t('table.columns.eventType')}</TableHead>
                  <TableHead>{t('table.columns.severity')}</TableHead>
                  <TableHead>{t('table.columns.value')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : items.length > 0 ? (
                  items.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>{formatDateTime(event.created_at)}</TableCell>
                      <TableCell>
                        {(event as any).asset_display_name || event.asset_name || '-'}
                      </TableCell>
                      <TableCell>
                        {(event as any).tag_display_name || event.asset_tag_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {t(`table.eventTypes.${event.event_type}`) || event.event_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            event.severity >= 3
                              ? 'destructive'
                              : event.severity >= 2
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {t(`table.severity.${event.severity}`) || event.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {event.value_num !== undefined && event.value_num !== null
                          ? event.value_num
                          : event.value_text}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <p className="text-muted-foreground">{t('table.empty')}</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* 分页信息 */}
          {pagination && pagination.total > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                共 {pagination.total} 条记录，第 {pagination.page}/{pagination.total_pages} 页
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setParams(prev => ({
                    ...prev,
                    skip: Math.max(0, (prev.skip || 0) - (prev.limit || 100)),
                  }))}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => setParams(prev => ({
                    ...prev,
                    skip: (prev.skip || 0) + (prev.limit || 100),
                  }))}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
