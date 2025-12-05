/**
 * 设备模板页面 - 完整 CRUD 功能
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, RefreshCw, Edit, Trash2, Eye, Copy, Cpu } from 'lucide-react'
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AuthGuard } from '@/components/auth'
import { UserRole } from '@/types'
import { useDeviceTypeList } from '@/hooks/useDeviceTypeQueries'
import { useAuth } from '@/hooks/useAuth'
import type { DeviceType, DeviceTypeListParams } from '@/types'
import { formatDateTime } from '@/utils/format'
import { DeviceTypeFormDialog } from '@/components/config/DeviceTypeFormDialog'
import { DeleteDeviceTypeDialog } from '@/components/config/DeleteDeviceTypeDialog'
import { DeviceTypeCloneDialog } from '@/components/config/DeviceTypeCloneDialog'

export default function DeviceTemplatesPage() {
  const { t } = useTranslation('config')
  const navigate = useNavigate()
  const { hasAnyRole } = useAuth()
  
  // 查询参数
  const [params, setParams] = useState<DeviceTypeListParams>({
    skip: 0,
    limit: 20,
  })
  
  // 对话框状态
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false)
  const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType | null>(null)
  
  // 获取设备类型列表
  const { data, isLoading, refetch } = useDeviceTypeList(params)
  
  // 搜索
  const handleSearch = (search: string) => {
    setParams(prev => ({ ...prev, search, skip: 0 }))
  }
  
  // 处理操作
  const handleView = (deviceType: DeviceType) => {
    navigate(`/config/device-templates/${deviceType.id}`)
  }
  
  const handleEdit = (deviceType: DeviceType) => {
    setSelectedDeviceType(deviceType)
    setFormDialogOpen(true)
  }
  
  const handleDelete = (deviceType: DeviceType) => {
    setSelectedDeviceType(deviceType)
    setDeleteDialogOpen(true)
  }
  
  const handleClone = (deviceType: DeviceType) => {
    setSelectedDeviceType(deviceType)
    setCloneDialogOpen(true)
  }
  
  // 分页 - 后端返回 ApiResponse<List<DeviceType>>，data 是数组，pagination 是分页信息
  const pagination = data?.pagination
  const items = (data?.data as DeviceType[] | null | undefined) || []
  
  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          {t('deviceType.list.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('deviceType.list.description')}
        </p>
      </div>

      {/* 设备类型表格 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{t('deviceType.list.title')}</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('deviceType.list.searchPlaceholder')}
                className="pl-10 w-[200px]"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('common:common.refresh')}
            </Button>
            <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedDeviceType(null)
                  setFormDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('deviceType.form.create')}
              </Button>
            </AuthGuard>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('deviceType.list.columns.displayName')}</TableHead>
                  <TableHead>{t('deviceType.list.columns.name')}</TableHead>
                  <TableHead>{t('deviceType.list.columns.description')}</TableHead>
                  <TableHead>{t('deviceType.list.columns.tagsCount')}</TableHead>
                  <TableHead>{t('deviceType.list.columns.createdAt')}</TableHead>
                  <TableHead>{t('deviceType.list.columns.actions')}</TableHead>
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
                    </TableRow>
                  ))
                ) : items.length > 0 ? (
                  items.map((deviceType) => (
                    <TableRow key={deviceType.id}>
                      <TableCell className="font-medium">{deviceType.display_name}</TableCell>
                      <TableCell className="font-mono text-sm">{deviceType.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {deviceType.description || '-'}
                      </TableCell>
                      <TableCell>
                        {typeof deviceType.tags_count === 'number' ? deviceType.tags_count : '-'}
                      </TableCell>
                      <TableCell>{formatDateTime(deviceType.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleView(deviceType)}
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
                                    onClick={() => handleEdit(deviceType)}
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
                                    onClick={() => handleClone(deviceType)}
                                  >
                                    <Copy className="size-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {t('deviceType.clone.action')}
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(deviceType)}
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
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-muted-foreground">{t('deviceType.list.empty')}</p>
                        <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedDeviceType(null)
                            setFormDialogOpen(true)
                          }}>
                            <Plus className="mr-2 size-4" />
                            {t('deviceType.form.create')}
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
      <DeviceTypeFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        deviceType={selectedDeviceType}
      />
      <DeviceTypeCloneDialog
        open={cloneDialogOpen}
        onOpenChange={setCloneDialogOpen}
        deviceType={selectedDeviceType}
      />
      <DeleteDeviceTypeDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        deviceType={selectedDeviceType}
      />
    </div>
  )
}
