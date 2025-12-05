/**
 * 资产页面 - 完整 CRUD 功能
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, RefreshCw, Edit, Trash2, Settings, Building2 } from 'lucide-react'
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
import { AuthGuard } from '@/components/auth'
import { UserRole } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useAssetList } from '@/hooks/useAssetQueries'
import { useDeviceTypeList } from '@/hooks/useDeviceTypeQueries'
import type { Asset, AssetListParams } from '@/types'
import { formatDateTime } from '@/utils/format'
import { AssetFormDialog } from '@/components/config/AssetFormDialog'
import { DeleteAssetDialog } from '@/components/config/DeleteAssetDialog'

export default function AssetsPage() {
  const { t } = useTranslation('config')
  const navigate = useNavigate()
  const { hasAnyRole } = useAuth()
  
  // 查询参数
  const [params, setParams] = useState<AssetListParams>({
    skip: 0,
    limit: 20,
  })
  
  // 对话框状态
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  
  // 获取数据
  const { data, isLoading, refetch } = useAssetList(params)
  const { data: deviceTypes } = useDeviceTypeList()
  
  // 处理操作
  const handleSearch = (search: string) => {
    setParams(prev => ({ ...prev, search, skip: 0 }))
  }
  
  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset)
    setFormDialogOpen(true)
  }
  
  const handleDelete = (asset: Asset) => {
    setSelectedAsset(asset)
    setDeleteDialogOpen(true)
  }
  
  const handleMappings = (asset: Asset) => {
    navigate(`/config/assets/${asset.id}/mappings`)
  }
  
  // 分页 - 后端返回 ApiResponse<List<Asset>>，data 是数组，pagination 是分页信息
  const pagination = data?.pagination
  const items = (data?.data as Asset[] | null | undefined) || []
  
  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {t('asset.list.title')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('asset.list.description')}
        </p>
      </div>

      {/* 资产表格 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{t('asset.list.title')}</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('asset.list.searchPlaceholder')}
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
                  setSelectedAsset(null)
                  setFormDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('asset.form.create')}
              </Button>
            </AuthGuard>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('asset.list.columns.name')}</TableHead>
                  <TableHead>{t('asset.list.columns.displayName')}</TableHead>
                  <TableHead>{t('asset.list.columns.deviceType')}</TableHead>
                  <TableHead>{t('asset.list.columns.location')}</TableHead>
                  <TableHead>{t('asset.list.columns.enabled')}</TableHead>
                  <TableHead>{t('asset.list.columns.actions')}</TableHead>
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
                  items.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell>{asset.display_name}</TableCell>
                      <TableCell>
                        {(asset as any).device_type_display_name || '-'}
                      </TableCell>
                      <TableCell>{asset.location || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={asset.enabled ? 'default' : 'secondary'}>
                          {asset.enabled ? '启用' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleMappings(asset)}
                              >
                                <Settings className="size-4" />
                            </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              映射配置
                            </TooltipContent>
                          </Tooltip>
                          {hasAnyRole([UserRole.DEVELOPER, UserRole.OPERATOR]) && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(asset)}
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
                                onClick={() => handleDelete(asset)}
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
                        <p className="text-muted-foreground">{t('asset.list.empty')}</p>
                        <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedAsset(null)
                            setFormDialogOpen(true)
                          }}>
                            <Plus className="mr-2 size-4" />
                            {t('asset.form.create')}
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
      <AssetFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        asset={selectedAsset}
      />
      <DeleteAssetDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        asset={selectedAsset}
      />
    </div>
  )
}
