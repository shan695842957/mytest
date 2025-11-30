/**
 * 通信模板页面 - 完整 CRUD 功能
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, RefreshCw, Edit, Trash2, Eye, Copy } from 'lucide-react'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AuthGuard } from '@/components/auth'
import { UserRole } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { usePointTableTemplateList, useDeletePointTableTemplate } from '@/hooks/usePointTableQueries'
import { useProtocolTypes } from '@/hooks/useDictQueries'
import type { PointTableTemplate, PointTableTemplateListParams } from '@/types'
import { formatDateTime } from '@/utils/format'
import { PointTableTemplateFormDialog } from '@/components/config/PointTableTemplateFormDialog'
import { DeletePointTableTemplateDialog } from '@/components/config/DeletePointTableTemplateDialog'
import { PointTableTemplateCloneDialog } from '@/components/config/PointTableTemplateCloneDialog'

export default function CommTemplatesPage() {
  const { t } = useTranslation('config')
  const navigate = useNavigate()
  const { hasAnyRole } = useAuth()
  
  // 查询参数
  const [params, setParams] = useState<PointTableTemplateListParams>({
    skip: 0,
    limit: 20,
  })
  
  // 对话框状态
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<PointTableTemplate | null>(null)
  
  // 获取数据
  const { data, isLoading, refetch } = usePointTableTemplateList(params)
  const { data: protocolTypes } = useProtocolTypes()
  
  // 处理操作
  const handleSearch = (search: string) => {
    setParams(prev => ({ ...prev, search, skip: 0 }))
  }
  
  const handleProtocolFilter = (protocolType: string) => {
    setParams(prev => ({
      ...prev,
      protocol_type: protocolType !== 'all' ? protocolType : undefined,
      skip: 0,
    }))
  }
  
  const handleView = (template: PointTableTemplate) => {
    navigate(`/config/comm-templates/${template.id}`)
  }
  
  const handleEdit = (template: PointTableTemplate) => {
    setSelectedTemplate(template)
    setFormDialogOpen(true)
  }
  
  const handleDelete = (template: PointTableTemplate) => {
    setSelectedTemplate(template)
    setDeleteDialogOpen(true)
  }
  
  const handleClone = (template: PointTableTemplate) => {
    setSelectedTemplate(template)
    setCloneDialogOpen(true)
  }
  
  // 分页 - 后端返回 ApiResponse<List<PointTableTemplate>>，data 是数组，pagination 是分页信息
  const pagination = data?.pagination
  const items = (data?.data as PointTableTemplate[] | null | undefined) || []
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">{t('pointTable.list.title')}</CardTitle>
            <CardDescription>{t('pointTable.list.description')}</CardDescription>
          </div>
          <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
            <Button
              onClick={() => {
                setSelectedTemplate(null)
                setFormDialogOpen(true)
              }}
            >
              <Plus className="mr-2 size-4" />
              {t('pointTable.form.create')}
            </Button>
          </AuthGuard>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder={t('pointTable.list.searchPlaceholder')}
                  className="pl-10"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Select onValueChange={handleProtocolFilter} defaultValue="all">
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="协议类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部协议</SelectItem>
                  {protocolTypes?.data?.map((pt) => (
                    <SelectItem key={pt.value} value={pt.value}>
                      {pt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 点表模板表格 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('pointTable.list.columns.displayName')}</TableHead>
                  <TableHead>{t('pointTable.list.columns.name')}</TableHead>
                  <TableHead>{t('pointTable.list.columns.protocolType')}</TableHead>
                  <TableHead>{t('pointTable.list.columns.pointsCount')}</TableHead>
                  <TableHead>{t('pointTable.list.columns.description')}</TableHead>
                  <TableHead>{t('pointTable.list.columns.createdAt')}</TableHead>
                  <TableHead>{t('pointTable.list.columns.actions')}</TableHead>
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
                  items.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.display_name}</TableCell>
                      <TableCell className="font-mono text-sm">{template.name}</TableCell>
                      <TableCell>{template.protocol_type}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-muted-foreground">
                        {template.description || '-'}
                      </TableCell>
                      <TableCell>{formatDateTime(template.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleView(template)}
                              >
                                <Eye className="size-4" />
                            </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t('common:common.view')}
                            </TooltipContent>
                          </Tooltip>
                          {hasAnyRole([UserRole.DEVELOPER, UserRole.OPERATOR]) && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(template)}
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
                                    onClick={() => handleClone(template)}
                                  >
                                    <Copy className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                {t('pointTable.clone.action')}
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                onClick={() => handleDelete(template)}
                                    className="text-destructive hover:text-destructive"
                              >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                {t('common:common.delete')}
                                </TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-muted-foreground">{t('pointTable.list.empty')}</p>
                        <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedTemplate(null)
                            setFormDialogOpen(true)
                          }}>
                            <Plus className="mr-2 size-4" />
                            {t('pointTable.form.create')}
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
      <PointTableTemplateFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        template={selectedTemplate}
      />
      <PointTableTemplateCloneDialog
        open={cloneDialogOpen}
        onOpenChange={setCloneDialogOpen}
        template={selectedTemplate}
      />
      <DeletePointTableTemplateDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        template={selectedTemplate}
      />
    </div>
  )
}
