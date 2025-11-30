/**
 * 审计日志列表页面
 */

import { useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, FileText, CheckCircle2, XCircle, Clock, Calendar, Box, Settings, ChevronsUpDown, Eye } from 'lucide-react'
import { subDays, subHours, startOfMonth } from 'date-fns'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/common/DateRangePicker'
import { FilterPanel, FilterField } from '@/components/common/FilterPanel'
import type { DateRange } from 'react-day-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AuditLogDetailDialog } from '@/components/audit/AuditLogDetailDialog'
import { useAuditLogs } from '@/hooks/useAuditQueries'
import { formatDateTime } from '@/utils/format'
import type { AuditLogQueryParams, AuditLog } from '@/types'

type StatusFilter = 'all' | 'success' | 'failed'

interface FilterState {
  dateRange: DateRange | undefined
  module: string
  action: string
  status: StatusFilter
}

export default function AuditLogListPage() {
  const { t } = useTranslation('audit')
  
  // 筛选面板折叠状态
  const [filterPanelOpen, setFilterPanelOpen] = useState(true)
  
  // 详情对话框
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  
  // 查询参数（提交给后端的）
  const [params, setParams] = useState<AuditLogQueryParams>({
    skip: 0,
    limit: 20,
  })
  
  // 默认时间范围：过去6小时
  const defaultDateRange = useMemo(() => ({
    from: subHours(new Date(), 6),
    to: new Date(),
  }), [])

  // 筛选条件（前端临时保存，未提交）
  const [filters, setFilters] = useState<FilterState>({
    dateRange: defaultDateRange,
    module: 'all',
    action: 'all',
    status: 'all',
  })
  const [activePreset, setActivePreset] = useState('6h')

  const dateRangePresets = useMemo(
    () => [
      {
        key: '6h',
        label: t('audit.filter.presets.last6h'),
        range: () => ({
          from: subHours(new Date(), 6),
          to: new Date(),
        }),
      },
      {
        key: '24h',
        label: t('audit.filter.presets.last24h'),
        range: () => ({
          from: subHours(new Date(), 24),
          to: new Date(),
        }),
      },
      {
        key: '7d',
        label: t('audit.filter.presets.last7d'),
        range: () => ({
          from: subDays(new Date(), 7),
          to: new Date(),
        }),
      },
      {
        key: '30d',
        label: t('audit.filter.presets.last30d'),
        range: () => ({
          from: subDays(new Date(), 30),
          to: new Date(),
        }),
      },
      {
        key: 'month',
        label: t('audit.filter.presets.thisMonth'),
        range: () => ({
          from: startOfMonth(new Date()),
          to: new Date(),
        }),
      },
    ],
    [t],
  )

  const appliedFiltersCount = useMemo(() => {
    let count = 0
    if (filters.dateRange?.from || filters.dateRange?.to) count += 1
    if (filters.module !== 'all') count += 1
    if (filters.action !== 'all') count += 1
    if (filters.status !== 'all') count += 1
    return count
  }, [filters])

  const handlePresetSelect = (presetKey: string) => {
    const preset = dateRangePresets.find((item) => item.key === presetKey)
    if (!preset) return
    setFilters((prev) => ({
      ...prev,
      dateRange: preset.range(),
    }))
    setActivePreset(presetKey)
  }

  const handleDateChange = (range: DateRange | undefined) => {
    setFilters((prev) => ({ ...prev, dateRange: range }))
    setActivePreset('custom')
  }
  
  // 获取审计日志列表
  const { data, isLoading, refetch } = useAuditLogs(params)
  
  // 处理查询按钮点击 - 只有点击才真正请求后端
  const handleSearch = () => {
    setParams({
      skip: 0,
      limit: 20,
      start_time: filters.dateRange?.from ? filters.dateRange.from.toISOString() : undefined,
      end_time: filters.dateRange?.to ? filters.dateRange.to.toISOString() : undefined,
      module: filters.module === 'all' ? undefined : filters.module,
      action: filters.action === 'all' ? undefined : filters.action,
      success: filters.status === 'all' ? undefined : filters.status,
    })
  }

  // 组件加载时自动查询（使用默认的过去6小时）
  useEffect(() => {
    // 直接设置查询参数，使用默认的过去6小时
    setParams({
      skip: 0,
      limit: 20,
      start_time: defaultDateRange.from.toISOString(),
      end_time: defaultDateRange.to.toISOString(),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只在组件挂载时执行一次
  
  // 清空筛选条件（重置为默认的过去6小时）
  const handleReset = () => {
    setFilters({
      dateRange: defaultDateRange,
      module: 'all',
      action: 'all',
      status: 'all',
    })
    setActivePreset('6h')
    // 重置后自动查询
    setParams({
      skip: 0,
      limit: 20,
      start_time: defaultDateRange.from.toISOString(),
      end_time: defaultDateRange.to.toISOString(),
    })
  }
  
  // 获取操作结果的徽章
  const getStatusBadge = (log: AuditLog) => {
    if (log.success === 'success') {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="size-3" />
          {t('audit.success')}
        </Badge>
      )
    }
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="size-3" />
        {t('audit.failed')}
      </Badge>
    )
  }
  
  // 获取HTTP方法的徽章
  const getMethodBadge = (method: string) => {
    const variants: Record<string, any> = {
      POST: 'default',
      PUT: 'secondary',
      PATCH: 'secondary',
      DELETE: 'destructive',
    }
    return (
      <Badge variant={variants[method] || 'outline'} className="font-mono text-xs">
        {method}
      </Badge>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* 筛选面板 - 可折叠 */}
      <Collapsible open={filterPanelOpen} onOpenChange={setFilterPanelOpen}>
        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{t('audit.filter.title')}</CardTitle>
              <CardDescription>{t('audit.filter.description')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('audit.filter.refresh')}
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full gap-1 lg:w-auto">
                  {filterPanelOpen ? t('audit.filter.collapse') : t('audit.filter.expand')}
                  <ChevronsUpDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* 筛选字段区域 */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* 时间快捷选择 */}
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-4 lg:col-span-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{t('audit.filter.quickRange')}</p>
              <p className="text-xs text-muted-foreground">{t('audit.filter.quickRangeHint')}</p>
            </div>
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
              {activePreset === 'custom'
                ? t('audit.filter.customRange')
                : dateRangePresets.find((preset) => preset.key === activePreset)?.label}
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {dateRangePresets.map((preset) => (
              <Button
                key={preset.key}
                type="button"
                variant={activePreset === preset.key ? 'default' : 'secondary'}
                size="sm"
                onClick={() => handlePresetSelect(preset.key)}
                className="rounded-full"
              >
                {preset.label}
              </Button>
            ))}
            <Button
              type="button"
              variant={activePreset === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilters((prev) => ({ ...prev, dateRange: undefined }))
                setActivePreset('custom')
              }}
              className="rounded-full"
            >
              {t('audit.filter.customRange')}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {appliedFiltersCount > 0
              ? t('audit.filter.summary', { count: appliedFiltersCount })
              : t('audit.filter.summaryEmpty')}
          </p>
        </div>

        {/* 日期时间范围 */}
        <FilterField 
          label={t('audit.filter.dateRange')} 
          icon={<Calendar className="h-4 w-4" />}
          className="md:col-span-2 lg:col-span-2"
        >
          <DateRangePicker
            value={filters.dateRange}
            onChange={handleDateChange}
            placeholder={t('audit.filter.dateRangePlaceholder')}
          />
        </FilterField>
        
        {/* 模块筛选 */}
        <FilterField 
          label={t('audit.filter.module')} 
          icon={<Box className="h-4 w-4" />}
        >
          <Select 
            value={filters.module}
            onValueChange={(value) => setFilters(prev => ({ ...prev, module: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('audit.filter.selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('audit.filter.all')}</SelectItem>
              <SelectItem value="auth">{t('audit.module_type.auth')}</SelectItem>
              <SelectItem value="user">{t('audit.module_type.user')}</SelectItem>
              <SelectItem value="system">{t('audit.module_type.system')}</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>
        
        {/* 操作类型筛选 */}
        <FilterField 
          label={t('audit.filter.action')} 
          icon={<Settings className="h-4 w-4" />}
        >
          <Select 
            value={filters.action}
            onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('audit.filter.selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('audit.filter.all')}</SelectItem>
              <SelectItem value="create">{t('audit.action_type.create')}</SelectItem>
              <SelectItem value="update">{t('audit.action_type.update')}</SelectItem>
              <SelectItem value="delete">{t('audit.action_type.delete')}</SelectItem>
              <SelectItem value="login">{t('audit.action_type.login')}</SelectItem>
              <SelectItem value="change_password">{t('audit.action_type.change_password')}</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>
        
        {/* 状态筛选 */}
        <FilterField 
          label={t('audit.filter.status')} 
          icon={<CheckCircle2 className="h-4 w-4" />}
          className="lg:col-span-2"
        >
          <div className="rounded-xl border bg-background/80 p-3">
            <Tabs value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as StatusFilter }))}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">
                  {t('audit.filter.all')}
                </TabsTrigger>
                <TabsTrigger value="success" className="gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {t('audit.success')}
                </TabsTrigger>
                <TabsTrigger value="failed" className="gap-1">
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                  {t('audit.failed')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="mt-3 text-xs text-muted-foreground">{t('audit.filter.statusHint')}</p>
          </div>
        </FilterField>
              </div>
              
              {/* 按钮区域 */}
              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end sm:gap-4 border-t">
                <Button type="button" variant="outline" onClick={handleReset}>
                  {t('audit.filter.reset')}
                </Button>
                <Button type="button" onClick={handleSearch}>
                  {t('audit.filter.query')}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      
      {/* 审计日志表格 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">{t('audit.table.id')}</TableHead>
                  <TableHead>{t('audit.table.time')}</TableHead>
                  <TableHead>{t('audit.table.user')}</TableHead>
                  <TableHead>{t('audit.table.module')}</TableHead>
                  <TableHead>{t('audit.table.action')}</TableHead>
                  <TableHead>{t('audit.table.target')}</TableHead>
                  <TableHead>{t('audit.table.method')}</TableHead>
                  <TableHead>{t('audit.table.status')}</TableHead>
                  <TableHead className="text-right">{t('audit.table.duration')}</TableHead>
                  <TableHead className="text-right">{t('audit.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // 加载骨架屏
                  Array.from({ length: 10 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 10 }).map((_, colIndex) => (
                        <TableCell key={colIndex}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data?.data && Array.isArray(data.data) && data.data.length > 0 ? (
                  // 审计日志数据
                  data.data.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.id}</TableCell>
                      <TableCell className="text-sm">
                        {formatDateTime(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium">{log.username || '-'}</span>
                          {log.user_role && (
                            <Badge variant="outline" className="text-xs w-fit">
                              {t(`auth:role.${log.user_role}`)}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {log.module_display || t(`audit.module_type.${log.module}`, log.module)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {log.action_display || t(`audit.action_type.${log.action}`, log.action)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {log.target_type && log.target_id ? (
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-foreground">
                                {log.target_name || log.target_id}
                              </span>
                              <span className="text-xs">
                                {log.target_type_display || log.target_type}:{log.target_id}
                              </span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getMethodBadge(log.method)}</TableCell>
                      <TableCell>{getStatusBadge(log)}</TableCell>
                      <TableCell className="text-right">
                        {log.duration_ms !== null && log.duration_ms !== undefined ? (
                          <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                            <Clock className="size-3" />
                            <span className="font-mono">{log.duration_ms}ms</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log)
                            setDetailDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // 空状态
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="size-8 text-muted-foreground" />
                        <p className="text-muted-foreground">{t('audit.empty')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* 分页信息 */}
          {data?.pagination && data.pagination.total > 0 && (
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                {t('audit.pagination.total', { total: data.pagination.total })}，
                {t('audit.pagination.page', { current: data.pagination.page, total: data.pagination.total_pages })}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.pagination.page === 1}
                  onClick={() => setParams(prev => ({
                    ...prev,
                    skip: Math.max(0, (prev.skip || 0) - (prev.limit || 20)),
                  }))}
                >
                  {t('audit.pagination.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.pagination.page >= data.pagination.total_pages}
                  onClick={() => setParams(prev => ({
                    ...prev,
                    skip: (prev.skip || 0) + (prev.limit || 20),
                  }))}
                >
                  {t('audit.pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 审计日志详情对话框 */}
      <AuditLogDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        log={selectedLog}
      />
    </div>
  )
}
