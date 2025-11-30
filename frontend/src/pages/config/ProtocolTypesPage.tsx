/**
 * 协议类型管理页面 - 完整 CRUD 功能
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, RefreshCw, Edit, Trash2, Settings } from 'lucide-react'
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
import { useProtocolTypeList, useDeleteProtocolType } from '@/hooks/useProtocolTypeQueries'
import type { ProtocolType, ProtocolTypeListParams } from '@/types'
import { formatDateTime } from '@/utils/format'
import { ProtocolTypeFormDialog } from '@/components/config/ProtocolTypeFormDialog'
import { DeleteProtocolTypeDialog } from '@/components/config/DeleteProtocolTypeDialog'
import { ProtocolTypeParamsDialog } from '@/components/config/ProtocolTypeParamsDialog'

export default function ProtocolTypesPage() {
  const { t } = useTranslation('config')
  
  // 查询参数
  const [params, setParams] = useState<ProtocolTypeListParams>({
    skip: 0,
    limit: 20,
    include_params: false,
  })
  
  // 对话框状态
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [paramsDialogOpen, setParamsDialogOpen] = useState(false)
  const [selectedProtocolType, setSelectedProtocolType] = useState<ProtocolType | null>(null)
  
  // 获取数据
  const { data, isLoading, refetch } = useProtocolTypeList(params)
  
  // 处理操作
  const handleSearch = (search: string) => {
    setParams(prev => ({ ...prev, search, skip: 0 }))
  }
  
  const handleEdit = (protocolType: ProtocolType) => {
    setSelectedProtocolType(protocolType)
    setFormDialogOpen(true)
  }
  
  const handleDelete = (protocolType: ProtocolType) => {
    setSelectedProtocolType(protocolType)
    setDeleteDialogOpen(true)
  }
  
  const handleManageParams = (protocolType: ProtocolType) => {
    setSelectedProtocolType(protocolType)
    setParamsDialogOpen(true)
  }
  
  // 分页
  const pagination = data?.pagination
  const items = (data?.data as ProtocolType[] | null | undefined) || []
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">{t('protocolType.list.title')}</CardTitle>
            <CardDescription>{t('protocolType.list.description')}</CardDescription>
          </div>
          <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
            <Button
              onClick={() => {
                setSelectedProtocolType(null)
                setFormDialogOpen(true)
              }}
            >
              <Plus className="mr-2 size-4" />
              {t('protocolType.form.create')}
            </Button>
          </AuthGuard>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder={t('protocolType.list.searchPlaceholder')}
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
      
      {/* 协议类型表格 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('protocolType.list.columns.name')}</TableHead>
                  <TableHead>{t('protocolType.list.columns.displayName')}</TableHead>
                  <TableHead>{t('protocolType.list.columns.enabled')}</TableHead>
                  <TableHead>{t('protocolType.list.columns.paramsCount')}</TableHead>
                  <TableHead>{t('protocolType.list.columns.description')}</TableHead>
                  <TableHead>{t('protocolType.list.columns.createdAt')}</TableHead>
                  <TableHead className="w-[120px]">{t('protocolType.list.columns.actions')}</TableHead>
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
                  items.map((protocolType) => (
                    <TableRow key={protocolType.id}>
                      <TableCell className="font-medium">{protocolType.name}</TableCell>
                      <TableCell>{protocolType.display_name}</TableCell>
                      <TableCell>
                        <Badge variant={protocolType.enabled ? 'default' : 'secondary'}>
                          {protocolType.enabled ? t('common.enabled', { ns: 'common' }) : t('common.disabled', { ns: 'common' })}
                        </Badge>
                      </TableCell>
                      <TableCell>{protocolType.params?.length || 0}</TableCell>
                      <TableCell className="max-w-xs truncate">{protocolType.description || '-'}</TableCell>
                      <TableCell>{formatDateTime(protocolType.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleManageParams(protocolType)}
                                >
                                  <Settings className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('protocolType.list.manageParams')}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(protocolType)}
                                >
                                  <Edit className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('protocolType.list.edit')}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(protocolType)}
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('protocolType.list.delete')}</TooltipContent>
                            </Tooltip>
                          </AuthGuard>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {t('protocolType.list.empty')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* 分页 */}
          {pagination && pagination.total > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <div className="text-sm text-muted-foreground">
                {t('pagination.total', { total: pagination.total, ns: 'common' })}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={params.skip === 0}
                  onClick={() => setParams(prev => ({ ...prev, skip: Math.max(0, prev.skip! - prev.limit!) }))}
                >
                  {t('pagination.previous', { ns: 'common' })}
                </Button>
                <div className="text-sm">
                  {t('pagination.page', { 
                    current: Math.floor(params.skip! / params.limit!) + 1,
                    total: Math.ceil(pagination.total / params.limit!),
                    ns: 'common'
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={params.skip! + params.limit! >= pagination.total}
                  onClick={() => setParams(prev => ({ ...prev, skip: prev.skip! + prev.limit! }))}
                >
                  {t('pagination.next', { ns: 'common' })}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 对话框 */}
      <ProtocolTypeFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        protocolType={selectedProtocolType}
      />
      
      <DeleteProtocolTypeDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        protocolType={selectedProtocolType}
      />
      
      <ProtocolTypeParamsDialog
        open={paramsDialogOpen}
        onOpenChange={setParamsDialogOpen}
        protocolType={selectedProtocolType}
      />
    </div>
  )
}

