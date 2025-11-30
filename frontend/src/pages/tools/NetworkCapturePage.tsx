/**
 * 网络抓包页面
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Network, Download, StopCircle, Trash2, Plus, RefreshCw, AlertTriangle, Server, Users, Wifi, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

import {
  createCapture,
  getCaptureList,
  stopCapture,
  deleteCapture,
  downloadCapture,
  getNetworkInterfaces,
} from '@/api/capture'
import type { CreateCaptureRequest, CaptureTaskStatus } from '@/types/capture'
import { formatDateTime } from '@/utils/format'

/**
 * 创建任务表单Schema
 */
const createCaptureSchema = z.object({
  name: z.string().min(1, '请输入任务名称').max(100),
  interface: z.string().min(1, '请选择网络接口'),
  filter_expression: z.string().optional(),
  duration: z.coerce.number().min(10).max(3600),
  packet_count: z.coerce.number().min(1).max(1000000).optional(),
})

type CreateCaptureForm = z.infer<typeof createCaptureSchema>

/**
 * 网络抓包页面组件
 */
export default function NetworkCapturePage() {
  const { t } = useTranslation('tools')
  const { t: tCommon } = useTranslation('common')
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [filterMode, setFilterMode] = useState<'simple' | 'advanced'>('simple')
  
  // 简单模式 - 场景配置
  const [captureScenario, setCaptureScenario] = useState<'server' | 'client' | 'multi-device' | 'custom'>('server')
  const [simpleFilter, setSimpleFilter] = useState({
    // 协议
    protocol: 'tcp' as 'tcp' | 'udp' | 'both' | 'all',
    // 端口配置
    portType: 'single' as 'single' | 'multiple' | 'range',
    port: '',          // 单个端口
    ports: '',         // 多个端口（逗号分隔）
    portStart: '',     // 端口范围开始
    portEnd: '',       // 端口范围结束
    portDirection: 'any' as 'any' | 'src' | 'dst',
    // IP配置
    ipType: 'single' as 'single' | 'multiple' | 'subnet',
    host: '',          // 单个IP
    hosts: '',         // 多个IP（逗号分隔）
    subnet: '',        // 网段（例如：192.168.1.0/24）
    ipDirection: 'any' as 'any' | 'src' | 'dst',
  })
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<{ id: number; name: string } | null>(null)

  // 表单
  const form = useForm<CreateCaptureForm>({
    resolver: zodResolver(createCaptureSchema),
    defaultValues: {
      name: '',
      interface: '',
      filter_expression: '',
      duration: 60,
    },
  })

  // 根据简单模式构建过滤表达式
  const buildFilterExpression = () => {
    if (filterMode === 'advanced') {
      return form.getValues('filter_expression')
    }

    const parts: string[] = []
    
    // 1. 协议过滤
    if (simpleFilter.protocol !== 'all') {
      if (simpleFilter.protocol === 'both') {
        parts.push('(tcp or udp)')
      } else {
      parts.push(simpleFilter.protocol)
    }
    }
    
    // 2. 端口过滤
    let portExpr = ''
    if (simpleFilter.portType === 'single' && simpleFilter.port) {
      const direction = simpleFilter.portDirection === 'any' ? '' : `${simpleFilter.portDirection} `
      portExpr = `${direction}port ${simpleFilter.port}`
    } else if (simpleFilter.portType === 'multiple' && simpleFilter.ports) {
      const ports = simpleFilter.ports.split(',').map(p => p.trim()).filter(p => p)
      if (ports.length > 0) {
        const direction = simpleFilter.portDirection === 'any' ? '' : `${simpleFilter.portDirection} `
        portExpr = ports.map(p => `${direction}port ${p}`).join(' or ')
        if (ports.length > 1) {
          portExpr = `(${portExpr})`
        }
      }
    } else if (simpleFilter.portType === 'range' && simpleFilter.portStart && simpleFilter.portEnd) {
      const direction = simpleFilter.portDirection === 'any' ? '' : `${simpleFilter.portDirection} `
      portExpr = `${direction}portrange ${simpleFilter.portStart}-${simpleFilter.portEnd}`
    }
    if (portExpr) {
      parts.push(portExpr)
    }
    
    // 3. IP地址过滤
    let ipExpr = ''
    if (simpleFilter.ipType === 'single' && simpleFilter.host) {
      const direction = simpleFilter.ipDirection === 'any' ? '' : `${simpleFilter.ipDirection} `
      ipExpr = `${direction}host ${simpleFilter.host}`
    } else if (simpleFilter.ipType === 'multiple' && simpleFilter.hosts) {
      const hosts = simpleFilter.hosts.split(',').map(h => h.trim()).filter(h => h)
      if (hosts.length > 0) {
        const direction = simpleFilter.ipDirection === 'any' ? '' : `${simpleFilter.ipDirection} `
        ipExpr = hosts.map(h => `${direction}host ${h}`).join(' or ')
        if (hosts.length > 1) {
          ipExpr = `(${ipExpr})`
        }
      }
    } else if (simpleFilter.ipType === 'subnet' && simpleFilter.subnet) {
      const direction = simpleFilter.ipDirection === 'any' ? '' : `${simpleFilter.ipDirection} `
      ipExpr = `${direction}net ${simpleFilter.subnet}`
    }
    if (ipExpr) {
      parts.push(ipExpr)
    }
    
    return parts.join(' and ')
  }

  // 查询任务列表
  const {
    data: listData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['capture-tasks'],
    queryFn: getCaptureList,
    refetchInterval: autoRefreshEnabled ? 3000 : false, // 有运行中的任务时自动刷新
  })

  // 查询网络接口
  const { data: interfacesData } = useQuery({
    queryKey: ['network-interfaces'],
    queryFn: getNetworkInterfaces,
  })

  // 检查是否有运行中的任务
  useEffect(() => {
    const hasRunningTasks = (listData?.data?.running_count || 0) > 0
    setAutoRefreshEnabled(hasRunningTasks)
  }, [listData])

  // 创建任务Mutation
  const createMutation = useMutation({
    mutationFn: createCapture,
    onSuccess: (response) => {
      if (response.success && response.code === 0) {
        toast.success(response.message)
        setDialogOpen(false)
        form.reset()
        queryClient.invalidateQueries({ queryKey: ['capture-tasks'] })
      } else {
        toast.error(response.message || t('capture.error.createFailed'))
      }
    },
    onError: (error: any) => {
      toast.error(error.message || t('capture.error.createFailed'))
    },
  })

  // 停止任务Mutation
  const stopMutation = useMutation({
    mutationFn: stopCapture,
    onSuccess: (response, taskId) => {
      if (response.success && response.code === 0) {
        toast.success(response.message)
        queryClient.invalidateQueries({ queryKey: ['capture-tasks'] })
      } else {
        toast.error(response.message || t('capture.error.stopFailed'))
      }
    },
    onError: (error: any) => {
      toast.error(error.message || t('capture.error.stopFailed'))
    },
  })

  // 删除任务Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCapture,
    onSuccess: (response) => {
      if (response.success && response.code === 0) {
        toast.success(response.message)
        queryClient.invalidateQueries({ queryKey: ['capture-tasks'] })
      } else {
        toast.error(response.message || t('capture.error.deleteFailed'))
      }
    },
    onError: (error: any) => {
      toast.error(error.message || t('capture.error.deleteFailed'))
    },
  })

  // 提交表单
  const onSubmit = (data: CreateCaptureForm) => {
    const filterExpression = buildFilterExpression()
    
    const request: CreateCaptureRequest = {
      name: data.name,
      interface: data.interface,
      duration: data.duration,
      filter_expression: filterExpression || undefined,
      packet_count: data.packet_count || undefined,
    }
    createMutation.mutate(request)
  }

  // 处理删除确认
  const handleDeleteConfirm = () => {
    if (taskToDelete) {
      deleteMutation.mutate(taskToDelete.id)
      setDeleteDialogOpen(false)
      setTaskToDelete(null)
    }
  }

  // 状态Badge样式
  const getStatusBadge = (status: CaptureTaskStatus) => {
    const variants = {
      pending: 'secondary',
      running: 'default',
      completed: 'default',
      stopped: 'secondary',
      failed: 'destructive',
    } as const

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {t(`capture.status.${status}`)}
      </Badge>
    )
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  // 格式化时长
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  const tasks = listData?.data?.items || []
  const runningCount = listData?.data?.running_count || 0
  const interfaces = interfacesData?.data || []

  return (
    <div className="p-6 space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Network className="h-8 w-8" />
            {t('capture.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('capture.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {tCommon('common.refresh')}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('capture.createTask')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('capture.createTask')}</DialogTitle>
                <DialogDescription>
                  {t('capture.createDescription')}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('capture.form.name')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('capture.form.namePlaceholder')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interface"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('capture.form.interface')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('capture.form.interfacePlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {interfaces.map((iface) => (
                              <SelectItem key={iface.name} value={iface.name}>
                                {iface.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t('capture.form.interfaceDesc')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 过滤规则配置器 */}
                  <div className="space-y-4 border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <FormLabel>{t('capture.form.filter')}</FormLabel>
                      <Select
                        value={filterMode}
                        onValueChange={(value: 'simple' | 'advanced') => setFilterMode(value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">{t('capture.form.simpleMode')}</SelectItem>
                          <SelectItem value="advanced">{t('capture.form.advancedMode')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {filterMode === 'simple' ? (
                      <div className="space-y-4">
                        {/* 场景选择 */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t('capture.scenario.label')}</label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              type="button"
                              variant={captureScenario === 'server' ? 'default' : 'outline'}
                              className="justify-start"
                              onClick={() => setCaptureScenario('server')}
                          >
                              <Server className="h-4 w-4 mr-2" />
                              {t('capture.scenario.server')}
                            </Button>
                            <Button
                              type="button"
                              variant={captureScenario === 'client' ? 'default' : 'outline'}
                              className="justify-start"
                              onClick={() => setCaptureScenario('client')}
                            >
                              <Wifi className="h-4 w-4 mr-2" />
                              {t('capture.scenario.client')}
                            </Button>
                            <Button
                              type="button"
                              variant={captureScenario === 'multi-device' ? 'default' : 'outline'}
                              className="justify-start"
                              onClick={() => setCaptureScenario('multi-device')}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              {t('capture.scenario.multiDevice')}
                            </Button>
                            <Button
                              type="button"
                              variant={captureScenario === 'custom' ? 'default' : 'outline'}
                              className="justify-start"
                              onClick={() => setCaptureScenario('custom')}
                            >
                              <Network className="h-4 w-4 mr-2" />
                              {t('capture.scenario.custom')}
                            </Button>
                          </div>
                        </div>

                        {/* 协议选择 */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t('capture.filter.protocol')}</label>
                          <Select
                            value={simpleFilter.protocol}
                            onValueChange={(value: any) => setSimpleFilter({ ...simpleFilter, protocol: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">{t('capture.filter.allProtocols')}</SelectItem>
                              <SelectItem value="tcp">TCP</SelectItem>
                              <SelectItem value="udp">UDP</SelectItem>
                              <SelectItem value="both">TCP + UDP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* 端口配置 */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t('capture.filter.port')}</label>
                          <div className="flex gap-2">
                            <Select
                              value={simpleFilter.portType}
                              onValueChange={(value: any) => setSimpleFilter({ ...simpleFilter, portType: value })}
                            >
                              <SelectTrigger className="flex-1 min-w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="single">{t('capture.portType.single')}</SelectItem>
                                <SelectItem value="multiple">{t('capture.portType.multiple')}</SelectItem>
                                <SelectItem value="range">{t('capture.portType.range')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={simpleFilter.portDirection}
                              onValueChange={(value: any) => setSimpleFilter({ ...simpleFilter, portDirection: value })}
                            >
                              <SelectTrigger className="flex-1 min-w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="any">{t('capture.direction.any')}</SelectItem>
                                <SelectItem value="src">{t('capture.direction.src')}</SelectItem>
                                <SelectItem value="dst">{t('capture.direction.dst')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {simpleFilter.portType === 'single' && (
                          <Input
                            type="number"
                              placeholder={t('capture.portPlaceholder.single')}
                            value={simpleFilter.port}
                            onChange={(e) => setSimpleFilter({ ...simpleFilter, port: e.target.value })}
                          />
                          )}
                          {simpleFilter.portType === 'multiple' && (
                            <Input
                              placeholder={t('capture.portPlaceholder.multiple')}
                              value={simpleFilter.ports}
                              onChange={(e) => setSimpleFilter({ ...simpleFilter, ports: e.target.value })}
                            />
                          )}
                          {simpleFilter.portType === 'range' && (
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder={t('capture.portPlaceholder.rangeStart')}
                                value={simpleFilter.portStart}
                                onChange={(e) => setSimpleFilter({ ...simpleFilter, portStart: e.target.value })}
                              />
                              <span className="flex items-center">-</span>
                              <Input
                                type="number"
                                placeholder={t('capture.portPlaceholder.rangeEnd')}
                                value={simpleFilter.portEnd}
                                onChange={(e) => setSimpleFilter({ ...simpleFilter, portEnd: e.target.value })}
                              />
                            </div>
                          )}
                        </div>

                        {/* IP地址配置 */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t('capture.filter.host')}</label>
                          <div className="flex gap-2">
                            <Select
                              value={simpleFilter.ipType}
                              onValueChange={(value: any) => setSimpleFilter({ ...simpleFilter, ipType: value })}
                            >
                              <SelectTrigger className="flex-1 min-w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="single">{t('capture.ipType.single')}</SelectItem>
                                <SelectItem value="multiple">{t('capture.ipType.multiple')}</SelectItem>
                                <SelectItem value="subnet">{t('capture.ipType.subnet')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={simpleFilter.ipDirection}
                              onValueChange={(value: any) => setSimpleFilter({ ...simpleFilter, ipDirection: value })}
                            >
                              <SelectTrigger className="flex-1 min-w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="any">{t('capture.direction.any')}</SelectItem>
                                <SelectItem value="src">{t('capture.direction.src')}</SelectItem>
                                <SelectItem value="dst">{t('capture.direction.dst')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {simpleFilter.ipType === 'single' && (
                          <Input
                              placeholder={t('capture.ipPlaceholder.single')}
                            value={simpleFilter.host}
                            onChange={(e) => setSimpleFilter({ ...simpleFilter, host: e.target.value })}
                          />
                          )}
                          {simpleFilter.ipType === 'multiple' && (
                            <Input
                              placeholder={t('capture.ipPlaceholder.multiple')}
                              value={simpleFilter.hosts}
                              onChange={(e) => setSimpleFilter({ ...simpleFilter, hosts: e.target.value })}
                            />
                          )}
                          {simpleFilter.ipType === 'subnet' && (
                            <Input
                              placeholder={t('capture.ipPlaceholder.subnet')}
                              value={simpleFilter.subnet}
                              onChange={(e) => setSimpleFilter({ ...simpleFilter, subnet: e.target.value })}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <FormField
                        control={form.control}
                        name="filter_expression"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder={t('capture.form.filterPlaceholder')}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {t('capture.form.filterDesc')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* 预览生成的规则 */}
                    {filterMode === 'simple' && buildFilterExpression() && (
                      <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                        <span className="font-medium">{t('capture.filter.preview')}: </span>
                        <code className="text-xs">{buildFilterExpression()}</code>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('capture.form.duration')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={10}
                              max={3600}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>10-3600s</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="packet_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('capture.form.packetCount')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              placeholder={t('capture.form.unlimited')}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>{t('capture.form.optional')}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      {tCommon('common.cancel')}
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? tCommon('action.creating') : tCommon('common.create')}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 数据保留策略提示 */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="ml-2">
          {t('capture.retentionNotice')}
        </AlertDescription>
      </Alert>

      {/* 统计卡片 */}
      {runningCount > 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-lg">
              {t('capture.runningTasks', { count: runningCount })}
            </CardTitle>
            <CardDescription>
              {t('capture.autoRefreshing')}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* 任务列表 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('capture.taskList')}</CardTitle>
          <CardDescription>
            {t('capture.totalTasks', { total: listData?.data?.total || 0 })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {tCommon('table.loading')}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('capture.noTasks')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('capture.table.name')}</TableHead>
                  <TableHead>{t('capture.table.interface')}</TableHead>
                  <TableHead>{t('capture.table.filter')}</TableHead>
                  <TableHead>{t('capture.table.status')}</TableHead>
                  <TableHead>{t('capture.table.progress')}</TableHead>
                  <TableHead>{t('capture.table.fileSize')}</TableHead>
                  <TableHead>{t('capture.table.duration')}</TableHead>
                  <TableHead>{t('capture.table.createdAt')}</TableHead>
                  <TableHead className="text-right">{t('capture.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.name}</TableCell>
                    <TableCell>{task.interface}</TableCell>
                    <TableCell>
                      {task.filter_expression || (
                        <span className="text-muted-foreground">{t('capture.noFilter')}</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>
                      {task.progress !== null ? (
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={task.progress} className="h-2" />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {task.progress}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.file_size > 0 ? formatFileSize(task.file_size) : '-'}
                    </TableCell>
                    <TableCell>
                      {task.actual_duration > 0
                        ? formatDuration(task.actual_duration)
                        : t('capture.notStarted')}
                    </TableCell>
                    <TableCell>{formatDateTime(task.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {task.can_download && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                await downloadCapture(task.id, `${task.name}.pcap`)
                                toast.success(t('capture.downloadSuccess') || '下载成功')
                              } catch (error) {
                                toast.error(t('capture.error.downloadFailed') || '下载失败')
                              }
                            }}
                            title={t('capture.download')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {task.can_stop && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => stopMutation.mutate(task.id)}
                            disabled={stopMutation.isPending}
                            title={t('capture.stop')}
                          >
                            <StopCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {task.can_delete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTaskToDelete({ id: task.id, name: task.name })
                              setDeleteDialogOpen(true)
                            }}
                            disabled={deleteMutation.isPending}
                            title={t('capture.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('capture.deleteTask')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{t('capture.confirmDelete', { name: taskToDelete?.name || '' })}</p>
              <p className="text-sm text-muted-foreground">
                {t('capture.deleteWarning')}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

