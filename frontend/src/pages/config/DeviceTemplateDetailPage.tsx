/**
 * 设备类型详情页面 - 包含基本信息 and 业务字段管理
 */

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus, Edit, Trash2, MoreHorizontal, Copy, Cpu } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AuthGuard } from '@/components/auth'
import { UserRole } from '@/types'
import {
  useDeviceTypeDetail,
  useDeviceTypeTagList,
  useDeleteDeviceTypeTag,
} from '@/hooks/useDeviceTypeQueries'
import { DeviceTypeTagFormDialog } from '@/components/config/DeviceTypeTagFormDialog'
import { DeleteDeviceTypeTagDialog } from '@/components/config/DeleteDeviceTypeTagDialog'
import { DeviceTypeTagCloneDialog } from '@/components/config/DeviceTypeTagCloneDialog'
import type { DeviceTypeTag, DeviceTypeDetail } from '@/types'
import { formatDateTime } from '@/utils/format'

export default function DeviceTemplateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('config')
  
  const deviceTypeId = id ? parseInt(id, 10) : 0
  
  // 业务字段筛选
  const [semanticTypeFilter, setSemanticTypeFilter] = useState<string>('all')
  
  // 对话框状态
  const [tagFormDialogOpen, setTagFormDialogOpen] = useState(false)
  const [deleteTagDialogOpen, setDeleteTagDialogOpen] = useState(false)
  const [tagCloneDialogOpen, setTagCloneDialogOpen] = useState(false)
  const [selectedTag, setSelectedTag] = useState<DeviceTypeTag | null>(null)
  
  // 获取设备类型详情
  const { data: deviceTypeResponse, isLoading: isLoadingDetail } = useDeviceTypeDetail(deviceTypeId)
  const deviceType = deviceTypeResponse?.data as DeviceTypeDetail | null | undefined
  
  // 获取业务字段列表
  const { data: tagsResponse, isLoading: isLoadingTags } = useDeviceTypeTagList(
    deviceTypeId,
    semanticTypeFilter !== 'all' ? semanticTypeFilter : undefined
  )
  const tags = tagsResponse
  
  const deleteTagMutation = useDeleteDeviceTypeTag()
  
  // 处理操作
  const handleAddTag = () => {
    setSelectedTag(null)
    setTagFormDialogOpen(true)
  }
  
  const handleEditTag = (tag: DeviceTypeTag) => {
    setSelectedTag(tag)
    setTagFormDialogOpen(true)
  }
  
  const handleDeleteTag = (tag: DeviceTypeTag) => {
    setSelectedTag(tag)
    setDeleteTagDialogOpen(true)
  }
  
  const handleCloneTag = (tag: DeviceTypeTag) => {
    setSelectedTag(tag)
    setTagCloneDialogOpen(true)
  }
  
  if (isLoadingDetail) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  
  if (!deviceType) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('deviceType.error.notFound')}</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/config/device-templates')}>
              <ArrowLeft className="mr-2 size-4" />
              返回列表
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // 后端返回 ApiResponse<List<DeviceTypeTag>>，data 是数组
  const tagList = (tags?.data as DeviceTypeTag[] | null | undefined) || []
  
  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/config/device-templates')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            {deviceType.display_name}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1 ml-10">
          {deviceType.name} · {t('deviceType.detail.tags')} {tagList.length}
        </p>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="tags" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">{t('deviceType.detail.basicInfo')}</TabsTrigger>
          <TabsTrigger value="tags">
            {t('deviceType.detail.tags')} ({tagList.length})
          </TabsTrigger>
        </TabsList>
        
        {/* 基本信息 Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('deviceType.detail.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">显示名称</label>
                  <p className="mt-1">{deviceType.display_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">内部名称</label>
                  <p className="mt-1 font-mono text-sm">{deviceType.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">型号</label>
                  <p className="mt-1">{deviceType.model || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">厂家</label>
                  <p className="mt-1">{deviceType.manufacturer || '-'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">描述</label>
                  <p className="mt-1">{deviceType.description || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">创建时间</label>
                  <p className="mt-1">{formatDateTime(deviceType.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">更新时间</label>
                  <p className="mt-1">{formatDateTime(deviceType.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 业务字段 Tab */}
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('deviceType.detail.tags')}</CardTitle>
                  <CardDescription>管理设备类型的业务字段</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={semanticTypeFilter} onValueChange={setSemanticTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="筛选语义类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="MEASURE">测量量</SelectItem>
                      <SelectItem value="STATUS">状态量</SelectItem>
                      <SelectItem value="ACCUM">累积量</SelectItem>
                      <SelectItem value="PARAM">参数值</SelectItem>
                      <SelectItem value="SETPOINT">设定值</SelectItem>
                      <SelectItem value="COMMAND">控制命令</SelectItem>
                      <SelectItem value="PARAM_SET">参数设定</SelectItem>
                    </SelectContent>
                  </Select>
                  <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
                    <Button onClick={handleAddTag}>
                      <Plus className="mr-2 size-4" />
                      {t('deviceType.detail.addTag')}
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
                      <TableHead>字段名</TableHead>
                      <TableHead>显示名</TableHead>
                      <TableHead>数据类型</TableHead>
                      <TableHead>语义类型</TableHead>
                      <TableHead>分组</TableHead>
                      <TableHead>严重性</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingTags ? (
                      Array.from({ length: 3 }).map((_, index) => (
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
                    ) : tagList.length > 0 ? (
                      tagList.map((tag) => (
                        <TableRow key={tag.id}>
                          <TableCell className="font-mono text-sm">{tag.tag_name}</TableCell>
                          <TableCell className="font-medium">{tag.display_name}</TableCell>
                          <TableCell>{tag.data_type}</TableCell>
                          <TableCell>{tag.semantic_type}</TableCell>
                          <TableCell>{tag.group_name || '-'}</TableCell>
                          <TableCell>{tag.severity}</TableCell>
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
                                  <DropdownMenuItem onClick={() => handleEditTag(tag)}>
                                    <Edit className="mr-2 size-4" />
                                    {t('common:common.edit')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCloneTag(tag)}>
                                    <Copy className="mr-2 size-4" />
                                    {t('deviceType.tagClone.action')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteTag(tag)}
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
                        <TableCell colSpan={7} className="h-24 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-muted-foreground">暂无业务字段</p>
                            <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
                              <Button variant="outline" size="sm" onClick={handleAddTag}>
                                <Plus className="mr-2 size-4" />
                                {t('deviceType.detail.addTag')}
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
      <DeviceTypeTagFormDialog
        open={tagFormDialogOpen}
        onOpenChange={setTagFormDialogOpen}
        deviceTypeId={deviceTypeId}
        tag={selectedTag}
      />
      <DeleteDeviceTypeTagDialog
        open={deleteTagDialogOpen}
        onOpenChange={setDeleteTagDialogOpen}
        tag={selectedTag}
      />
      <DeviceTypeTagCloneDialog
        open={tagCloneDialogOpen}
        onOpenChange={setTagCloneDialogOpen}
        tag={selectedTag}
      />
    </div>
  )
}

