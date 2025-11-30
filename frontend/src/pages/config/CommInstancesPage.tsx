/**
 * 通信实例页面 - 完整 CRUD 功能
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, RefreshCw, Edit, Trash2 } from 'lucide-react'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AuthGuard } from '@/components/auth'
import { UserRole } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useCommInstanceList, useDeleteCommInstance } from '@/hooks/useCommInstanceQueries'
import type { CommInstance, CommInstanceListParams } from '@/types'
import { formatDateTime } from '@/utils/format'
import { CommInstanceFormDialog } from '@/components/config/CommInstanceFormDialog'
import { DeleteCommInstanceDialog } from '@/components/config/DeleteCommInstanceDialog'

export default function CommInstancesPage() {
  const { t } = useTranslation('config')
  const { hasAnyRole } = useAuth()
  
  // 查询参数
  const [params, setParams] = useState<CommInstanceListParams>({
    skip: 0,
    limit: 20,
  })
  
  // 对话框状态
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedInstance, setSelectedInstance] = useState<CommInstance | null>(null)
  
  // 获取数据
  const { data, isLoading, refetch } = useCommInstanceList(params)
  
  // 处理操作
  const handleSearch = (search: string) => {
    setParams(prev => ({ ...prev, search, skip: 0 }))
  }
  
  const handleEdit = (instance: CommInstance) => {
    setSelectedInstance(instance)
    setFormDialogOpen(true)
  }
  
  const handleDelete = (instance: CommInstance) => {
    setSelectedInstance(instance)
    setDeleteDialogOpen(true)
  }
  
  // 分页 - 后端返回 ApiResponse<List<CommInstance>>，data 是数组，pagination 是分页信息
  const pagination = data?.pagination
  const items = (data?.data as CommInstance[] | null | undefined) || []
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">{t('commInstance.list.title')}</CardTitle>
            <CardDescription>{t('commInstance.list.description')}</CardDescription>
          </div>
          <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
            <Button
              onClick={() => {
                setSelectedInstance(null)
                setFormDialogOpen(true)
              }}
            >
              <Plus className="mr-2 size-4" />
              {t('commInstance.form.create')}
            </Button>
          </AuthGuard>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder={t('commInstance.list.searchPlaceholder')}
                  className="pl-10"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 通信实例表格 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('commInstance.list.columns.name')}</TableHead>
                  <TableHead>{t('commInstance.list.columns.displayName')}</TableHead>
                  <TableHead>{t('commInstance.list.columns.protocolType')}</TableHead>
                  <TableHead>{t('commInstance.list.columns.pointTable')}</TableHead>
                  <TableHead>{t('commInstance.list.columns.enabled')}</TableHead>
                  <TableHead>{t('commInstance.list.columns.pollingInterval')}</TableHead>
                  <TableHead>{t('commInstance.list.columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : items.length > 0 ? (
                  items.map((instance) => (
                    <TableRow key={instance.id}>
                      <TableCell className="font-medium">{instance.name}</TableCell>
                      <TableCell>{instance.display_name}</TableCell>
                      <TableCell>{instance.protocol_type}</TableCell>
                      <TableCell className="font-mono text-sm">{instance.point_table_id}</TableCell>
                      <TableCell>
                        <Badge variant={instance.enabled ? 'default' : 'secondary'}>
                          {instance.enabled ? '启用' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell>{instance.polling_interval_ms}ms</TableCell>
                      <TableCell>
                        {hasAnyRole([UserRole.DEVELOPER, UserRole.OPERATOR]) && (
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(instance)}
                                >
                                  <Edit className="size-4" />
                            </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {t('common:common.edit')}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                onClick={() => handleDelete(instance)}
                                  className="text-destructive hover:text-destructive"
                              >
                                  <Trash2 className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {t('common:common.delete')}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-muted-foreground">{t('commInstance.list.empty')}</p>
                        <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedInstance(null)
                            setFormDialogOpen(true)
                          }}>
                            <Plus className="mr-2 size-4" />
                            {t('commInstance.form.create')}
                          </Button>
                        </AuthGuard>
                      </div>
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
                    skip: Math.max(0, (prev.skip || 0) - (prev.limit || 20)),
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
                    skip: (prev.skip || 0) + (prev.limit || 20),
                  }))}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 对话框 */}
      <CommInstanceFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        instance={selectedInstance}
      />
      <DeleteCommInstanceDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        instance={selectedInstance}
      />
    </div>
  )
}
