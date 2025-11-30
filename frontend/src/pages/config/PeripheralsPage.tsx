/**
 * 外设设备管理页面 - 完整 CRUD 功能
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
import { usePeripheralList, useDeletePeripheral } from '@/hooks/usePeripheralQueries'
import type { Peripheral, PeripheralListParams } from '@/types'
import { formatDateTime } from '@/utils/format'
import { PeripheralFormDialog } from '@/components/config/PeripheralFormDialog'
import { DeletePeripheralDialog } from '@/components/config/DeletePeripheralDialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function PeripheralsPage() {
  const { t } = useTranslation('config')
  
  // 查询参数
  const [params, setParams] = useState<PeripheralListParams>({
    skip: 0,
    limit: 20,
  })
  const [peripheralTypeFilter, setPeripheralTypeFilter] = useState<string>('all')
  
  // 对话框状态
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPeripheral, setSelectedPeripheral] = useState<Peripheral | null>(null)
  
  // 获取数据
  const queryParams: PeripheralListParams = {
    ...params,
    peripheral_type: peripheralTypeFilter !== 'all' ? peripheralTypeFilter : undefined,
  }
  const { data, isLoading, refetch } = usePeripheralList(queryParams)
  
  // 处理操作
  const handleSearch = (search: string) => {
    setParams(prev => ({ ...prev, skip: 0 }))
    // 注意：后端 API 目前不支持搜索，这里只是重置分页
  }
  
  const handleEdit = (peripheral: Peripheral) => {
    setSelectedPeripheral(peripheral)
    setFormDialogOpen(true)
  }
  
  const handleDelete = (peripheral: Peripheral) => {
    setSelectedPeripheral(peripheral)
    setDeleteDialogOpen(true)
  }
  
  // 分页
  const pagination = data?.pagination
  const items = (data?.data as Peripheral[] | null | undefined) || []
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">{t('peripheral.list.title')}</CardTitle>
            <CardDescription>{t('peripheral.list.description')}</CardDescription>
          </div>
          <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
            <Button
              onClick={() => {
                setSelectedPeripheral(null)
                setFormDialogOpen(true)
              }}
            >
              <Plus className="mr-2 size-4" />
              {t('peripheral.form.create')}
            </Button>
          </AuthGuard>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder={t('peripheral.list.searchPlaceholder')}
                  className="pl-10"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            <Select
              value={peripheralTypeFilter}
              onValueChange={(value) => {
                setPeripheralTypeFilter(value)
                setParams(prev => ({ ...prev, skip: 0 }))
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('peripheral.list.filterAll')}</SelectItem>
                <SelectItem value="serial">{t('peripheral.list.filterSerial')}</SelectItem>
                <SelectItem value="can">{t('peripheral.list.filterCan')}</SelectItem>
                <SelectItem value="spi">{t('peripheral.list.filterSpi')}</SelectItem>
                <SelectItem value="i2c">{t('peripheral.list.filterI2c')}</SelectItem>
                <SelectItem value="gpio">{t('peripheral.list.filterGpio')}</SelectItem>
                <SelectItem value="pwm">{t('peripheral.list.filterPwm')}</SelectItem>
                <SelectItem value="adc">{t('peripheral.list.filterAdc')}</SelectItem>
                <SelectItem value="dac">{t('peripheral.list.filterDac')}</SelectItem>
                <SelectItem value="other">{t('peripheral.list.filterOther')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 外设表格 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('peripheral.list.columns.name')}</TableHead>
                  <TableHead>{t('peripheral.list.columns.displayName')}</TableHead>
                  <TableHead>{t('peripheral.list.columns.type')}</TableHead>
                  <TableHead>{t('peripheral.list.columns.devicePath')}</TableHead>
                  <TableHead>{t('peripheral.list.columns.enabled')}</TableHead>
                  <TableHead>{t('peripheral.list.columns.description')}</TableHead>
                  <TableHead>{t('peripheral.list.columns.createdAt')}</TableHead>
                  <TableHead className="w-[120px]">{t('peripheral.list.columns.actions')}</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : items.length > 0 ? (
                  items.map((peripheral) => (
                    <TableRow key={peripheral.id}>
                      <TableCell className="font-medium">{peripheral.name}</TableCell>
                      <TableCell>{peripheral.display_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{peripheral.peripheral_type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{peripheral.device_path}</TableCell>
                      <TableCell>
                        <Badge variant={peripheral.enabled ? 'default' : 'secondary'}>
                          {peripheral.enabled ? t('common.enabled', { ns: 'common' }) : t('common.disabled', { ns: 'common' })}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{peripheral.description || '-'}</TableCell>
                      <TableCell>{formatDateTime(peripheral.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(peripheral)}
                                >
                                  <Edit className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('peripheral.list.edit')}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(peripheral)}
                                >
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('peripheral.list.delete')}</TooltipContent>
                            </Tooltip>
                          </AuthGuard>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      {t('peripheral.list.empty')}
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
      <PeripheralFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        peripheral={selectedPeripheral}
      />
      
      <DeletePeripheralDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        peripheral={selectedPeripheral}
      />
    </div>
  )
}

