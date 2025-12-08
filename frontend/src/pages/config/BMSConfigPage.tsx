/**
 * BMS配置详情页面 - 字段配置管理
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Download, Upload, RefreshCw, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getBMSInstanceDetail,
  getBMSFieldConfigList,
  deleteBMSFieldConfig,
  exportBMSFieldConfigs,
  importBMSFieldConfigs,
  type BMSFieldConfig,
} from '@/api/bms'
import { formatDateTime } from '@/utils/format'
import { AuthGuard } from '@/components/auth'
import { UserRole } from '@/types'

export default function BMSConfigPage() {
  const { t } = useTranslation('config')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const instanceId = parseInt(id || '0')
  
  const [activePageType, setActivePageType] = useState<string>('SYS')
  
  // 获取BMS实例详情
  const { data: instanceData, isLoading: instanceLoading } = useQuery({
    queryKey: ['bms-instance', instanceId],
    queryFn: () => getBMSInstanceDetail(instanceId),
    enabled: !!instanceId,
  })
  
  // 获取字段配置列表
  const { data: fieldConfigsData, isLoading: fieldConfigsLoading, refetch } = useQuery({
    queryKey: ['bms-field-configs', instanceId, activePageType],
    queryFn: () => getBMSFieldConfigList(instanceId, activePageType),
    enabled: !!instanceId,
  })
  
  // 删除Mutation
  const deleteMutation = useMutation({
    mutationFn: (fieldConfigId: number) => deleteBMSFieldConfig(instanceId, fieldConfigId),
    onSuccess: () => {
      toast.success(t('bms.field_config.deleted_success'))
      queryClient.invalidateQueries({ queryKey: ['bms-field-configs'] })
    },
    onError: (error: any) => {
      toast.error(t('bms.field_config.delete_failed'), {
        description: error?.response?.data?.detail || error.message,
      })
    },
  })
  
  // 导出
  const handleExport = async () => {
    try {
      await exportBMSFieldConfigs(instanceId, activePageType)
      toast.success(t('bms.field_config.exported_success'))
    } catch (error: any) {
      toast.error(t('bms.field_config.export_failed'), {
        description: error?.response?.data?.detail || error.message,
      })
    }
  }
  
  // 导入
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      const result = await importBMSFieldConfigs(instanceId, activePageType, file, 'update')
      toast.success(t('bms.field_config.imported_success'), {
        description: t('bms.field_config.import_result', {
          success: result.data?.success_count || 0,
          failed: result.data?.failed_count || 0,
        }),
      })
      queryClient.invalidateQueries({ queryKey: ['bms-field-configs'] })
    } catch (error: any) {
      toast.error(t('bms.field_config.import_failed'), {
        description: error?.response?.data?.detail || error.message,
      })
    }
    
    // 清空文件输入
    event.target.value = ''
  }
  
  const instance = instanceData?.data
  const fieldConfigs = (fieldConfigsData?.data as BMSFieldConfig[] | null | undefined) || []
  
  const pageTypes = ['SYS', 'BCU', 'BAU', 'BMU']
  
  if (instanceLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }
  
  if (!instance) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('bms.instance.not_found')}
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/config/bms')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{instance.display_name_zh}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('bms.config.description')}
          </p>
        </div>
      </div>
      
      {/* 配置管理Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>{t('bms.config.field_configs')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activePageType} onValueChange={setActivePageType}>
            <TabsList className="grid w-full grid-cols-4">
              {pageTypes.map((pageType) => (
                <TabsTrigger key={pageType} value={pageType}>
                  {pageType}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {pageTypes.map((pageType) => (
              <TabsContent key={pageType} value={pageType} className="space-y-4">
                {/* 操作栏 */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => refetch()}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                      <Download className="h-4 w-4 mr-2" />
                      {t('common.export')}
                    </Button>
                    <label>
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {t('common.import')}
                        </span>
                      </Button>
                      <Input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleImport}
                      />
                    </label>
                  </div>
                  <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('bms.field_config.create')}
                    </Button>
                  </AuthGuard>
                </div>
                
                {/* 字段配置表格 */}
                {fieldConfigsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : fieldConfigs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('bms.field_config.empty')}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('bms.field_config.table.field_key')}</TableHead>
                        <TableHead>{t('bms.field_config.table.display_name')}</TableHead>
                        <TableHead>{t('bms.field_config.table.field_type')}</TableHead>
                        <TableHead>{t('bms.field_config.table.data_type')}</TableHead>
                        <TableHead>{t('bms.field_config.table.source_type')}</TableHead>
                        <TableHead>{t('bms.field_config.table.sort_order')}</TableHead>
                        <TableHead className="text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fieldConfigs.map((config) => (
                        <TableRow key={config.id}>
                          <TableCell className="font-medium">{config.field_key}</TableCell>
                          <TableCell>
                            {config.display_name_zh}
                            {config.display_name_en && (
                              <span className="text-muted-foreground ml-2">
                                ({config.display_name_en})
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={config.field_type === 'fixed' ? 'default' : 'secondary'}>
                              {config.field_type === 'fixed' ? t('bms.field_config.fixed') : t('bms.field_config.dynamic')}
                            </Badge>
                          </TableCell>
                          <TableCell>{config.data_type}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{config.source_type}</Badge>
                          </TableCell>
                          <TableCell>{config.sort_order}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    // TODO: 打开编辑对话框
                                    toast.info(t('common.coming_soon'))
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteMutation.mutate(config.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AuthGuard>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
