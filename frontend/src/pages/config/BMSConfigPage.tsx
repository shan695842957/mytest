/**
 * BMS配置详情页面 - 字段配置管理
 */

import { useMemo, useState } from 'react'
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
import { BMSFieldConfigDialog } from '@/components/config/BMSFieldConfigDialog'
import { BMSHierarchyConfigForm } from '@/components/config/BMSHierarchyConfigForm'

export default function BMSConfigPage() {
  const { t } = useTranslation(['config', 'common'])
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const instanceId = parseInt(id || '0')
  
  const [activePageType, setActivePageType] = useState<string>('SYS')
  const [fieldConfigDialogOpen, setFieldConfigDialogOpen] = useState(false)
  const [editingFieldConfig, setEditingFieldConfig] = useState<BMSFieldConfig | null>(null)
  
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
  const sysFixedFieldPresets: Array<Partial<BMSFieldConfig> & { field_key: string; display_name_zh: string; display_name_en: string; sort_order: number }> = useMemo(
    () => [
      { field_key: 'fault', display_name_zh: '告警状态', display_name_en: 'Fault Status', field_type: 'fixed', sort_order: 1 },
      { field_key: 'voltage', display_name_zh: '电压', display_name_en: 'Voltage', field_type: 'fixed', sort_order: 2 },
      { field_key: 'current', display_name_zh: '电流', display_name_en: 'Current', field_type: 'fixed', sort_order: 3 },
      { field_key: 'power', display_name_zh: '功率', display_name_en: 'Power', field_type: 'fixed', sort_order: 4 },
      { field_key: 'breaker_status', display_name_zh: '分合闸状态', display_name_en: 'Breaker Status', field_type: 'fixed', sort_order: 5 },
      { field_key: 'breaker_open_command', display_name_zh: '分闸指令', display_name_en: 'Breaker Open Command', field_type: 'fixed', sort_order: 6 },
      { field_key: 'breaker_close_command', display_name_zh: '合闸指令', display_name_en: 'Breaker Close Command', field_type: 'fixed', sort_order: 7 },
    ],
    []
  )

  const displayFieldConfigs = useMemo(() => {
    if (activePageType !== 'SYS') return fieldConfigs
    const map = new Map(fieldConfigs.map((item) => [item.field_key, item]))
    const mergedFixed = sysFixedFieldPresets.map((preset) => {
      const existed = map.get(preset.field_key)
      return (
        existed || {
          ...preset,
          source_type: '-',
          field_type: 'fixed',
        }
      )
    })
    const presetKeys = new Set(sysFixedFieldPresets.map((p) => p.field_key))
    const dynamics = fieldConfigs.filter((item) => !presetKeys.has(item.field_key))
    return [...mergedFixed, ...dynamics]
  }, [activePageType, fieldConfigs, sysFixedFieldPresets])
  
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
      <Tabs defaultValue="field-configs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="field-configs">{t('bms.config.field_configs', '字段配置')}</TabsTrigger>
          <TabsTrigger value="hierarchy-config">{t('bms.config.hierarchy_config', '层级配置')}</TabsTrigger>
        </TabsList>

        {/* 字段配置Tab */}
        <TabsContent value="field-configs">
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
                      {t('common:export')}
                    </Button>
                    <label>
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {t('common:import')}
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
                    <Button
                      onClick={() => {
                        setEditingFieldConfig(null)
                        setFieldConfigDialogOpen(true)
                      }}
                    >
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
                ) : displayFieldConfigs.length === 0 ? (
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
                        <TableHead>{t('bms.field_config.table.source_type')}</TableHead>
                        <TableHead>{t('bms.field_config.table.sort_order')}</TableHead>
                        <TableHead className="text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayFieldConfigs.map((config) => {
                        const isSysFixed =
                          activePageType === 'SYS' &&
                          sysFixedFieldPresets.some((p) => p.field_key === config.field_key)
                        return (
                          <TableRow key={config.id ?? config.field_key}>
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
                          <TableCell>
                            <Badge variant="outline">{config.source_type || '-'}</Badge>
                          </TableCell>
                          <TableCell>{config.sort_order}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <AuthGuard roles={[UserRole.DEVELOPER, UserRole.OPERATOR]}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingFieldConfig(config)
                                    setFieldConfigDialogOpen(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                    disabled={!config.id || isSysFixed}
                                    onClick={() => config.id && deleteMutation.mutate(config.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AuthGuard>
                            </div>
                          </TableCell>
                        </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
        </TabsContent>

        {/* 层级配置Tab */}
        <TabsContent value="hierarchy-config">
          <BMSHierarchyConfigForm instanceId={instanceId} />
        </TabsContent>
      </Tabs>

      {/* 字段配置对话框 */}
      <BMSFieldConfigDialog
        open={fieldConfigDialogOpen}
        onOpenChange={setFieldConfigDialogOpen}
        instanceId={instanceId}
        pageType={activePageType}
        fieldConfig={editingFieldConfig}
        onSuccess={() => {
          refetch()
        }}
      />
    </div>
  )
}
