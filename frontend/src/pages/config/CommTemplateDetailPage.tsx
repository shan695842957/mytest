/**
 * 通信模板详情页面 - 包含基本信息和点管理
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus, Edit, Trash2, MoreHorizontal, Copy, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { AuthGuard } from '@/components/auth'
import { UserRole } from '@/types'
import {
  usePointTableTemplateDetail,
  usePointTablePointList,
  useDeletePointTablePoint,
} from '@/hooks/usePointTableQueries'
import { PointTablePointFormDialog } from '@/components/config/PointTablePointFormDialog'
import { DeletePointTablePointDialog } from '@/components/config/DeletePointTablePointDialog'
import { PointTablePointCloneDialog } from '@/components/config/PointTablePointCloneDialog'
import type { PointTablePoint, PointTableTemplateDetail } from '@/types'
import { formatDateTime } from '@/utils/format'

export default function CommTemplateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('config')
  
  const templateId = id ? parseInt(id, 10) : 0
  
  // 点筛选
  const [pointNameFilter, setPointNameFilter] = useState<string>('')
  const [addressFilter, setAddressFilter] = useState<string>('')
  
  // 对话框状态
  const [pointFormDialogOpen, setPointFormDialogOpen] = useState(false)
  const [deletePointDialogOpen, setDeletePointDialogOpen] = useState(false)
const [pointCloneDialogOpen, setPointCloneDialogOpen] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<PointTablePoint | null>(null)
  
  // 获取数据
  const { data: templateResponse, isLoading: isLoadingDetail } = usePointTableTemplateDetail(templateId)
  const template = templateResponse?.data as PointTableTemplateDetail | null | undefined
  const { data: pointsResponse, isLoading: isLoadingPoints } = usePointTablePointList(
    templateId,
    pointNameFilter || undefined,
    addressFilter || undefined
  )
  const points = pointsResponse
  
  const deletePointMutation = useDeletePointTablePoint()
  
  // 处理操作
  const handleAddPoint = () => {
    setSelectedPoint(null)
    setPointFormDialogOpen(true)
  }
  
  const handleEditPoint = (point: PointTablePoint) => {
    setSelectedPoint(point)
    setPointFormDialogOpen(true)
  }
  
  const handleDeletePoint = (point: PointTablePoint) => {
    setSelectedPoint(point)
    setDeletePointDialogOpen(true)
  }

const handleClonePoint = (point: PointTablePoint) => {
  setSelectedPoint(point)
  setPointCloneDialogOpen(true)
}
  
  if (isLoadingDetail) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  
  if (!template) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">通信模板不存在</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/config/comm-templates')}>
              <ArrowLeft className="mr-2 size-4" />
              返回列表
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // 后端返回 ApiResponse<List<PointTablePoint>>，data 是数组
  const pointList = (points?.data as PointTablePoint[] | null | undefined) || []
  
  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/config/comm-templates')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Radio className="h-5 w-5" />
            {template.display_name}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1 ml-10">
          {template.name} · {template.protocol_type}
        </p>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="points" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">{t('pointTable.detail.basicInfo')}</TabsTrigger>
          <TabsTrigger value="points">
            {t('pointTable.detail.points')} ({pointList.length})
          </TabsTrigger>
        </TabsList>
        
        {/* 基本信息 Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('pointTable.detail.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">显示名称</label>
                  <p className="mt-1">{template.display_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">内部名称</label>
                  <p className="mt-1 font-mono text-sm">{template.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">协议类型</label>
                  <p className="mt-1">{template.protocol_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">描述</label>
                  <p className="mt-1">{template.description || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">创建时间</label>
                  <p className="mt-1">{formatDateTime(template.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">更新时间</label>
                  <p className="mt-1">{formatDateTime(template.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 点表点 Tab */}
        <TabsContent value="points" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('pointTable.detail.points')}</CardTitle>
                  <CardDescription>管理点表模板的点</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="筛选点名"
                    className="w-[200px]"
                    value={pointNameFilter}
                    onChange={(e) => setPointNameFilter(e.target.value)}
                  />
                  <Input
                    placeholder="筛选地址"
                    className="w-[200px]"
                    value={addressFilter}
                    onChange={(e) => setAddressFilter(e.target.value)}
                  />
                  <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
                    <Button onClick={handleAddPoint}>
                      <Plus className="mr-2 size-4" />
                      {t('pointTable.detail.addPoint')}
                    </Button>
                  </AuthGuard>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>点名</TableHead>
                      <TableHead>显示名</TableHead>
                      <TableHead>地址</TableHead>
                      <TableHead>IO类型</TableHead>
                      <TableHead>原始类型</TableHead>
                      <TableHead>字节序</TableHead>
                      <TableHead>缩放K</TableHead>
                      <TableHead>缩放B</TableHead>
                      <TableHead>启用</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingPoints ? (
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
                          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        </TableRow>
                      ))
                    ) : pointList.length > 0 ? (
                      pointList.map((point) => (
                        <TableRow key={point.id}>
                          <TableCell className="font-mono text-sm">{point.point_name}</TableCell>
                          <TableCell className="font-medium">{point.display_name}</TableCell>
                          <TableCell>{point.address}</TableCell>
                          <TableCell>{point.io_type}</TableCell>
                          <TableCell>{point.raw_type}</TableCell>
                          <TableCell>{point.byte_order}</TableCell>
                          <TableCell>{point.scale_k}</TableCell>
                          <TableCell>{point.scale_b}</TableCell>
                          <TableCell>
                            <Badge variant={point.is_active ? 'default' : 'secondary'}>
                              {point.is_active ? '启用' : '禁用'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>操作</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
                                  <DropdownMenuItem onClick={() => handleEditPoint(point)}>
                                    <Edit className="mr-2 size-4" />
                                    {t('common:common.edit')}
                                  </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleClonePoint(point)}>
                                <Copy className="mr-2 size-4" />
                                {t('pointTable.pointClone.action')}
                              </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeletePoint(point)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 size-4" />
                                    {t('common:common.delete')}
                                  </DropdownMenuItem>
                                </AuthGuard>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-muted-foreground">暂无点表点</p>
                            <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
                              <Button variant="outline" size="sm" onClick={handleAddPoint}>
                                <Plus className="mr-2 size-4" />
                                {t('pointTable.detail.addPoint')}
                              </Button>
                            </AuthGuard>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* 对话框 */}
      <PointTablePointFormDialog
        open={pointFormDialogOpen}
        onOpenChange={setPointFormDialogOpen}
        templateId={templateId}
        point={selectedPoint}
      />
      <DeletePointTablePointDialog
        open={deletePointDialogOpen}
        onOpenChange={setDeletePointDialogOpen}
        point={selectedPoint}
      />
      <PointTablePointCloneDialog
        open={pointCloneDialogOpen}
        onOpenChange={setPointCloneDialogOpen}
        point={selectedPoint}
      />
    </div>
  )
}

