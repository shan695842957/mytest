/**
 * 端口转发管理页面
 */

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  RefreshCw,
  Play,
  Square,
  RotateCw,
  Edit,
  Trash2,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'

import type {
  PortForwardingRule,
  PortForwardingRuleCreate,
  PortForwardingRuleUpdate,
  Protocol,
  ForwardingStatus,
} from '@/types'
import {
  getPortForwardingRules,
  createPortForwardingRule,
  updatePortForwardingRule,
  deletePortForwardingRule,
  startPortForwarding,
  stopPortForwarding,
  restartPortForwarding,
  checkPortForwardingStatus,
  batchStartPortForwarding,
  batchStopPortForwarding,
  batchDeletePortForwardingRules,
} from '@/api/portForwarding'
import { queryKeys } from '@/config/query'

// 表单验证 Schema
const ruleSchema = z.object({
  name: z.string().min(1, '请输入规则名称').max(100, '规则名称最长 100 个字符'),
  source_host: z.string().default('0.0.0.0'),
  source_port: z.number().min(1, '端口范围 1-65535').max(65535, '端口范围 1-65535'),
  target_host: z.string().min(1, '请输入目标主机'),
  target_port: z.number().min(1, '端口范围 1-65535').max(65535, '端口范围 1-65535'),
  protocol: z.enum(['tcp', 'udp']),
  is_enabled: z.boolean().default(true),
})

type RuleFormValues = z.infer<typeof ruleSchema>

export default function PortForwardingPage() {
  const { t } = useTranslation(['tools', 'common'])
  const queryClient = useQueryClient()

  // 状态管理
  const [keyword, setKeyword] = useState('')
  const [protocolFilter, setProtocolFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<PortForwardingRule | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingRuleId, setDeletingRuleId] = useState<number | null>(null)
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false)

  // 查询规则列表
  const { data, isLoading, refetch } = useQuery({
    queryKey: queryKeys.portForwarding.list(keyword, protocolFilter, statusFilter),
    queryFn: () =>
      getPortForwardingRules({
        keyword: keyword || undefined,
        protocol: protocolFilter as Protocol | undefined,
        status: statusFilter as ForwardingStatus | undefined,
      }),
  })

  // 创建规则
  const createForm = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: '',
      source_host: '0.0.0.0',
      source_port: 0,
      target_host: '',
      target_port: 0,
      protocol: 'tcp',
      is_enabled: true,
    },
  })

  const createMutation = useMutation({
    mutationFn: createPortForwardingRule,
    onSuccess: () => {
      toast.success(t('portForwarding.createSuccess'))
      setCreateDialogOpen(false)
      createForm.reset()
      queryClient.invalidateQueries({ queryKey: queryKeys.portForwarding.all() })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('portForwarding.createFailed'))
    },
  })

  // 更新规则
  const editForm = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PortForwardingRuleUpdate }) =>
      updatePortForwardingRule(id, data),
    onSuccess: () => {
      toast.success(t('portForwarding.updateSuccess'))
      setEditDialogOpen(false)
      setEditingRule(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.portForwarding.all() })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('portForwarding.updateFailed'))
    },
  })

  // 删除规则
  const deleteMutation = useMutation({
    mutationFn: deletePortForwardingRule,
    onSuccess: () => {
      toast.success(t('portForwarding.deleteSuccess'))
      setDeleteDialogOpen(false)
      setDeletingRuleId(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.portForwarding.all() })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('portForwarding.deleteFailed'))
    },
  })

  // 启动
  const startMutation = useMutation({
    mutationFn: startPortForwarding,
    onSuccess: () => {
      toast.success(t('portForwarding.startSuccess'))
      queryClient.invalidateQueries({ queryKey: queryKeys.portForwarding.all() })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('portForwarding.startFailed'))
    },
  })

  // 停止
  const stopMutation = useMutation({
    mutationFn: stopPortForwarding,
    onSuccess: () => {
      toast.success(t('portForwarding.stopSuccess'))
      queryClient.invalidateQueries({ queryKey: queryKeys.portForwarding.all() })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('portForwarding.stopFailed'))
    },
  })

  // 重启
  const restartMutation = useMutation({
    mutationFn: restartPortForwarding,
    onSuccess: () => {
      toast.success(t('portForwarding.restartSuccess'))
      queryClient.invalidateQueries({ queryKey: queryKeys.portForwarding.all() })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('portForwarding.restartFailed'))
    },
  })

  // 批量启动
  const batchStartMutation = useMutation({
    mutationFn: batchStartPortForwarding,
    onSuccess: (result) => {
      toast.success(`成功启动 ${result.data.success_count} 个规则`)
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey: queryKeys.portForwarding.all() })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || '批量启动失败')
    },
  })

  // 批量停止
  const batchStopMutation = useMutation({
    mutationFn: batchStopPortForwarding,
    onSuccess: (result) => {
      toast.success(`成功停止 ${result.data.success_count} 个规则`)
      setSelectedIds([])
      queryClient.invalidateQueries({ queryKey: queryKeys.portForwarding.all() })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || '批量停止失败')
    },
  })

  // 批量删除
  const batchDeleteMutation = useMutation({
    mutationFn: batchDeletePortForwardingRules,
    onSuccess: (result) => {
      toast.success(`成功删除 ${result.data.success_count} 个规则`)
      setSelectedIds([])
      setBatchDeleteDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.portForwarding.all() })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || '批量删除失败')
    },
  })

  // 处理编辑
  const handleEdit = (rule: PortForwardingRule) => {
    setEditingRule(rule)
    editForm.reset({
      name: rule.name,
      source_host: rule.source_host,
      source_port: rule.source_port,
      target_host: rule.target_host,
      target_port: rule.target_port,
      protocol: rule.protocol,
      is_enabled: rule.is_enabled,
    })
    setEditDialogOpen(true)
  }

  // 处理删除
  const handleDelete = (id: number) => {
    setDeletingRuleId(id)
    setDeleteDialogOpen(true)
  }
  
  // 确认删除
  const confirmDelete = () => {
    if (deletingRuleId) {
      deleteMutation.mutate(deletingRuleId)
    }
  }
  
  // 确认批量删除
  const confirmBatchDelete = () => {
    batchDeleteMutation.mutate(selectedIds)
  }

  // 筛选后的数据
  const rules = useMemo(() => data?.data || [], [data])
  const total = useMemo(() => data?.pagination?.total || 0, [data])

  // 统计
  const stats = useMemo(() => {
    return {
      total: rules.length,
      running: rules.filter((r) => r.status === 'running').length,
      stopped: rules.filter((r) => r.status === 'stopped').length,
      error: rules.filter((r) => r.status === 'error').length,
    }
  }, [rules])

  // 状态 Badge 颜色
  const getStatusBadge = (status: ForwardingStatus) => {
    switch (status) {
      case 'running':
        return <Badge variant="default" className="bg-green-500">{t('portForwarding.running')}</Badge>
      case 'stopped':
        return <Badge variant="secondary">{t('portForwarding.stopped')}</Badge>
      case 'error':
        return <Badge variant="destructive">{t('portForwarding.error')}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(rules.map((r) => r.id))
    } else {
      setSelectedIds([])
    }
  }

  // 切换选中
  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id))
    }
  }

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('portForwarding.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('portForwarding.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('portForwarding.create')}
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">{t('portForwarding.total')}</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">{t('portForwarding.running')}</div>
          <div className="text-2xl font-bold text-green-500">{stats.running}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">{t('portForwarding.stopped')}</div>
          <div className="text-2xl font-bold text-gray-500">{stats.stopped}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">{t('portForwarding.error')}</div>
          <div className="text-2xl font-bold text-red-500">{stats.error}</div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="flex items-center gap-2">
        {/* 批量操作 */}
        {selectedIds.length > 0 && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {t('portForwarding.batchActions')} ({selectedIds.length})
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => batchStartMutation.mutate(selectedIds)}>
                  <Play className="mr-2 h-4 w-4" />
                  {t('portForwarding.batchStart')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => batchStopMutation.mutate(selectedIds)}>
                  <Square className="mr-2 h-4 w-4" />
                  {t('portForwarding.batchStop')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setBatchDeleteDialogOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('portForwarding.batchDelete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {/* 搜索 */}
        <Input
          placeholder={t('portForwarding.search')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-64"
        />

        {/* 协议筛选 */}
        <Select 
          value={protocolFilter || 'all'} 
          onValueChange={(value) => setProtocolFilter(value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder={t('portForwarding.protocol')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('portForwarding.allProtocols')}</SelectItem>
            <SelectItem value="tcp">TCP</SelectItem>
            <SelectItem value="udp">UDP</SelectItem>
          </SelectContent>
        </Select>

        {/* 状态筛选 */}
        <Select 
          value={statusFilter || 'all'} 
          onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder={t('portForwarding.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('portForwarding.allStatuses')}</SelectItem>
            <SelectItem value="running">{t('portForwarding.running')}</SelectItem>
            <SelectItem value="stopped">{t('portForwarding.stopped')}</SelectItem>
            <SelectItem value="error">{t('portForwarding.error')}</SelectItem>
          </SelectContent>
        </Select>

        {/* 刷新按钮 */}
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* 表格 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === rules.length && rules.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>{t('portForwarding.name')}</TableHead>
              <TableHead>{t('portForwarding.sourceAddress')}</TableHead>
              <TableHead>{t('portForwarding.targetAddress')}</TableHead>
              <TableHead>{t('portForwarding.protocol')}</TableHead>
              <TableHead>{t('portForwarding.status')}</TableHead>
              <TableHead>{t('portForwarding.isEnabled')}</TableHead>
              <TableHead className="text-right">{t('portForwarding.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  {t('portForwarding.noData')}
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(rule.id)}
                      onCheckedChange={(checked) => handleSelectOne(rule.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>
                    {rule.source_host}:{rule.source_port}
                  </TableCell>
                  <TableCell>
                    {rule.target_host}:{rule.target_port}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{rule.protocol.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(rule.status)}</TableCell>
                  <TableCell>
                    <Badge variant={rule.is_enabled ? 'default' : 'secondary'}>
                      {rule.is_enabled ? t('portForwarding.enabled') : t('portForwarding.disabled')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* 启动/停止/重启 */}
                      {rule.status === 'stopped' || rule.status === 'error' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startMutation.mutate(rule.id)}
                          disabled={startMutation.isPending}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => stopMutation.mutate(rule.id)}
                            disabled={stopMutation.isPending}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => restartMutation.mutate(rule.id)}
                            disabled={restartMutation.isPending}
                          >
                            <RotateCw className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {/* 编辑 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(rule)}
                        disabled={rule.status === 'running'}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      {/* 删除 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 创建对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('portForwarding.create')}</DialogTitle>
            <DialogDescription>{t('portForwarding.createDescription')}</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}
              className="space-y-4"
            >
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('portForwarding.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="MySQL 数据库转发" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="source_host"
                render={({ field: hostField }) => (
                  <FormItem>
                    <FormLabel>{t('portForwarding.sourceAddress')}</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input {...hostField} placeholder="0.0.0.0" className="flex-1" />
                      </FormControl>
                      <span className="text-muted-foreground">:</span>
                      <FormField
                        control={createForm.control}
                        name="source_port"
                        render={({ field: portField }) => (
                          <FormControl>
                            <Input
                              {...portField}
                              type="number"
                              placeholder="3306"
                              className="w-32"
                              onChange={(e) => portField.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                        )}
                      />
                    </div>
                    <FormDescription>{t('portForwarding.sourceHostDescription')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="target_host"
                render={({ field: hostField }) => (
                  <FormItem>
                    <FormLabel>{t('portForwarding.targetAddress')}</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input {...hostField} placeholder="192.168.1.10" className="flex-1" />
                      </FormControl>
                      <span className="text-muted-foreground">:</span>
                      <FormField
                        control={createForm.control}
                        name="target_port"
                        render={({ field: portField }) => (
                          <FormControl>
                            <Input
                              {...portField}
                              type="number"
                              placeholder="3306"
                              className="w-32"
                              onChange={(e) => portField.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                        )}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="protocol"
                render={({ field}) => (
                  <FormItem>
                    <FormLabel>{t('portForwarding.protocol')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="tcp">TCP</SelectItem>
                        <SelectItem value="udp">UDP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="is_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t('portForwarding.autoStart')}</FormLabel>
                      <FormDescription>{t('portForwarding.autoStartDescription')}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  {t('common:action.cancel')}
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {t('common:action.create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('portForwarding.edit')}</DialogTitle>
            <DialogDescription>{t('portForwarding.editDescription')}</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit((values) => {
                if (editingRule) {
                  updateMutation.mutate({ id: editingRule.id, data: values })
                }
              })}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('portForwarding.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="source_host"
                render={({ field: hostField }) => (
                  <FormItem>
                    <FormLabel>{t('portForwarding.sourceAddress')}</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input {...hostField} className="flex-1" />
                      </FormControl>
                      <span className="text-muted-foreground">:</span>
                      <FormField
                        control={editForm.control}
                        name="source_port"
                        render={({ field: portField }) => (
                          <FormControl>
                            <Input
                              {...portField}
                              type="number"
                              className="w-32"
                              onChange={(e) => portField.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                        )}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="target_host"
                render={({ field: hostField }) => (
                  <FormItem>
                    <FormLabel>{t('portForwarding.targetAddress')}</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input {...hostField} className="flex-1" />
                      </FormControl>
                      <span className="text-muted-foreground">:</span>
                      <FormField
                        control={editForm.control}
                        name="target_port"
                        render={({ field: portField }) => (
                          <FormControl>
                            <Input
                              {...portField}
                              type="number"
                              className="w-32"
                              onChange={(e) => portField.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                        )}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="protocol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('portForwarding.protocol')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="tcp">TCP</SelectItem>
                        <SelectItem value="udp">UDP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="is_enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t('portForwarding.enabled')}</FormLabel>
                      <FormDescription>{t('portForwarding.enabledDescription')}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false)
                    setEditingRule(null)
                  }}
                >
                  {t('common:action.cancel')}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {t('common:action.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('portForwarding.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('portForwarding.confirmDeleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingRuleId(null)}>
              {t('common:action.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common:action.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量删除确认对话框 */}
      <AlertDialog open={batchDeleteDialogOpen} onOpenChange={setBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('portForwarding.confirmBatchDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('portForwarding.confirmBatchDeleteDescription', { count: selectedIds.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:action.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBatchDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common:action.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

