/**
 * BMS管理页面 - BMS实例列表
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, RefreshCw, Edit, Trash2, Settings, Battery } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AuthGuard } from '@/components/auth'
import { UserRole } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDateTime } from '@/utils/format'
import {
  getBMSInstanceList,
  deleteBMSInstance,
  getBMSArchitectures,
  type BMSInstance,
  type BMSInstanceListParams,
} from '@/api/bms'
import { toast } from 'sonner'
import { BMSInstanceFormDialog } from '@/components/config/BMSInstanceFormDialog'
import { DeleteBMSInstanceDialog } from '@/components/config/DeleteBMSInstanceDialog'

export default function BMSPage() {
  const { t } = useTranslation('config')
  const navigate = useNavigate()
  const { hasAnyRole } = useAuth()
  const queryClient = useQueryClient()
  
  // 查询参数
  const [params, setParams] = useState<BMSInstanceListParams>({
    skip: 0,
    limit: 20,
  })
  
  // 对话框状态
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedInstance, setSelectedInstance] = useState<BMSInstance | null>(null)
  
  // 获取数据
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bms-instances', params],
    queryFn: () => getBMSInstanceList(params),
  })
  
  const { data: architecturesData } = useQuery({
    queryKey: ['bms-architectures'],
    queryFn: () => getBMSArchitectures(),
  })
  
  // 删除Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBMSInstance(id),
    onSuccess: () => {
      toast.success(t('bms.instance.deleted_success'))
      queryClient.invalidateQueries({ queryKey: ['bms-instances'] })
      setDeleteDialogOpen(false)
      setSelectedInstance(null)
    },
    onError: (error: any) => {
      toast.error(t('bms.instance.delete_failed'), {
        description: error?.response?.data?.detail || error.message,
      })
    },
  })
  
  // 处理操作
  const handleSearch = (search: string) => {
    setParams(prev => ({ ...prev, search, skip: 0 }))
  }
  
  const handleEdit = (instance: BMSInstance) => {
    setSelectedInstance(instance)
    setFormDialogOpen(true)
  }
  
  const handleDelete = (instance: BMSInstance) => {
    setSelectedInstance(instance)
    setDeleteDialogOpen(true)
  }
  
  const handleConfig = (instance: BMSInstance) => {
    navigate(`/config/bms/${instance.id}`)
  }
  
  const handleCreate = () => {
    setSelectedInstance(null)
    setFormDialogOpen(true)
  }
  
  // 分页
  const pagination = data?.pagination
  const items = (data?.data as BMSInstance[] | null | undefined) || []
  const architectures = (architecturesData?.data as any[] | null | undefined) || []
  
  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Battery className="h-5 w-5" />
          {t('bms.instance.list.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('bms.instance.list.description')}
        </p>
      </div>

      {/* BMS实例表格 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{t('bms.instance.list.title')}</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('bms.instance.list.search_placeholder')}
                className="pl-9 w-[200px]"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Select
              value={params.architecture_id?.toString() || 'all'}
              onValueChange={(value) =>
                setParams(prev => ({
                  ...prev,
                  architecture_id: value === 'all' ? undefined : parseInt(value),
                  skip: 0,
                }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('bms.instance.list.filter_architecture')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('bms.instance.list.all_architectures')}</SelectItem>
                {architectures.map((arch) => (
                  <SelectItem key={arch.id} value={arch.id.toString()}>
                    {arch.display_name_zh}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={params.enabled === undefined ? 'all' : params.enabled ? 'enabled' : 'disabled'}
              onValueChange={(value) =>
                setParams(prev => ({
                  ...prev,
                  enabled: value === 'all' ? undefined : value === 'enabled',
                  skip: 0,
                }))
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t('bms.instance.list.filter_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('bms.instance.list.all_status')}</SelectItem>
                <SelectItem value="enabled">{t('bms.instance.list.enabled')}</SelectItem>
                <SelectItem value="disabled">{t('bms.instance.list.disabled')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                {t('bms.instance.list.create')}
              </Button>
            </AuthGuard>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('bms.instance.list.empty')}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('bms.instance.list.table.instance_name')}</TableHead>
                    <TableHead>{t('bms.instance.list.table.asset')}</TableHead>
                    <TableHead>{t('bms.instance.list.table.architecture')}</TableHead>
                    <TableHead>{t('bms.instance.list.table.status')}</TableHead>
                    <TableHead>{t('bms.instance.list.table.created_at')}</TableHead>
                    <TableHead className="text-right">{t('bms.instance.list.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((instance) => (
                    <TableRow key={instance.id}>
                      <TableCell className="font-medium">
                        {instance.display_name_zh}
                      </TableCell>
                      <TableCell>
                        {instance.asset_display_name || instance.asset_name || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {architectures.find(a => a.id === instance.architecture_id)?.display_name_zh || instance.architecture_name || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={instance.enabled ? 'default' : 'secondary'}>
                          {instance.enabled ? t('bms.instance.list.enabled') : t('bms.instance.list.disabled')}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(instance.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleConfig(instance)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('bms.instance.list.actions.config')}</TooltipContent>
                          </Tooltip>
                          <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(instance)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('bms.instance.list.actions.edit')}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(instance)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('bms.instance.list.actions.delete')}</TooltipContent>
                            </Tooltip>
                          </AuthGuard>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* 分页 */}
              {pagination && pagination.total > pagination.limit && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    {t('common.pagination.showing', {
                      from: pagination.skip + 1,
                      to: Math.min(pagination.skip + pagination.limit, pagination.total),
                      total: pagination.total,
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.skip === 0}
                      onClick={() => setParams(prev => ({ ...prev, skip: Math.max(0, prev.skip! - prev.limit!) }))}
                    >
                      {t('common.pagination.previous')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.skip + pagination.limit >= pagination.total}
                      onClick={() => setParams(prev => ({ ...prev, skip: prev.skip! + prev.limit! }))}
                    >
                      {t('common.pagination.next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 表单对话框 */}
      <BMSInstanceFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        instance={selectedInstance}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['bms-instances'] })
          setFormDialogOpen(false)
          setSelectedInstance(null)
        }}
      />

      {/* 删除确认对话框 */}
      <DeleteBMSInstanceDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        instance={selectedInstance}
        onConfirm={() => {
          if (selectedInstance) {
            deleteMutation.mutate(selectedInstance.id)
          }
        }}
      />
    </div>
  )
}
