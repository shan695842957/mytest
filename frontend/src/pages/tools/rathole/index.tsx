/**
 * Rathole 内网穿透配置管理页面（主容器）
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Globe2 } from 'lucide-react'

import type { RatholeService, RatholeServiceCreate, RatholeServiceUpdate } from '@/types'
import {
  getRatholeConfig,
  updateRemoteAddr,
  createRatholeService,
  updateRatholeService,
  deleteRatholeService,
  getTomlContent,
  startRatholeService,
  stopRatholeService,
  restartRatholeService,
  getRatholeStatus,
  getBackups,
} from '@/api/rathole'
import { queryKeys } from '@/config/query'

import { RatholeServiceList } from './RatholeServiceList'
import { RatholeGlobalConfig } from './RatholeGlobalConfig'
import { RatholeTomlPreview } from './RatholeTomlPreview'
import { RatholeServiceDialog } from './RatholeServiceDialog'
import { RatholeServiceControl } from './RatholeServiceControl'
import { RatholeBackupManagement } from './RatholeBackupManagement'

export default function RatholePage() {
  const { t } = useTranslation(['tools', 'common'])
  const queryClient = useQueryClient()

  // 状态管理
  const [activeTab, setActiveTab] = useState('services')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<RatholeService | null>(null)

  // 查询配置
  const { data: configData } = useQuery({
    queryKey: queryKeys.rathole.config(),
    queryFn: getRatholeConfig,
  })

  // 查询 TOML 内容
  const { data: tomlData, refetch: refetchToml } = useQuery({
    queryKey: queryKeys.rathole.toml(),
    queryFn: getTomlContent,
  })

  // 查询服务状态（完全手动刷新）
  const { data: statusData, refetch: refetchStatus } = useQuery({
    queryKey: queryKeys.rathole.status(),
    queryFn: getRatholeStatus,
    // 移除自动刷新，完全手动控制
  })

  // 查询备份列表
  const { data: backupsData, refetch: refetchBackups } = useQuery({
    queryKey: queryKeys.rathole.backups(),
    queryFn: getBackups,
  })

  // 创建服务
  const createMutation = useMutation({
    mutationFn: createRatholeService,
    onSuccess: () => {
      toast.success(t('rathole.createSuccess'))
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.rathole.all() })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('rathole.createFailed'))
    },
  })

  // 更新远程地址
  const updateRemoteMutation = useMutation({
    mutationFn: (remote_addr: string) => updateRemoteAddr(remote_addr),
    onSuccess: () => {
      toast.success(t('rathole.remoteAddrUpdateSuccess'))
      queryClient.invalidateQueries({ queryKey: queryKeys.rathole.all() })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('rathole.remoteAddrUpdateFailed'))
    },
  })

  // 更新服务
  const updateMutation = useMutation({
    mutationFn: ({ old_name, data }: { old_name: string; data: RatholeServiceUpdate }) =>
      updateRatholeService(old_name, data),
    onSuccess: () => {
      toast.success(t('rathole.updateSuccess'))
      setDialogOpen(false)
      setEditingService(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.rathole.all() })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('rathole.updateFailed'))
    },
  })

  // 删除服务
  const deleteMutation = useMutation({
    mutationFn: deleteRatholeService,
    onSuccess: () => {
      toast.success(t('rathole.deleteSuccess'))
      queryClient.invalidateQueries({ queryKey: queryKeys.rathole.all() })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('rathole.deleteFailed'))
    },
  })

  // 启动服务
  const startServiceMutation = useMutation({
    mutationFn: startRatholeService,
    onSuccess: () => {
      toast.success(t('rathole.serviceStartSuccess'))
      refetchStatus()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('rathole.serviceStartFailed'))
    },
  })

  // 停止服务
  const stopServiceMutation = useMutation({
    mutationFn: stopRatholeService,
    onSuccess: () => {
      toast.success(t('rathole.serviceStopSuccess'))
      refetchStatus()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('rathole.serviceStopFailed'))
    },
  })

  // 重启服务
  const restartServiceMutation = useMutation({
    mutationFn: restartRatholeService,
    onSuccess: () => {
      toast.success(t('rathole.serviceRestartSuccess'))
      refetchStatus()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || t('rathole.serviceRestartFailed'))
    },
  })

  // 处理创建
  const handleCreate = () => {
    setEditingService(null)
    setDialogOpen(true)
  }

  // 处理编辑
  const handleEdit = (service: RatholeService) => {
    setEditingService(service)
    setDialogOpen(true)
  }

  // 获取数据
  const services = configData?.data?.services ? Object.values(configData.data.services) : []
  const remoteAddr = configData?.data?.remote_addr || ''
  const tomlContent = tomlData?.data || ''
  const serviceStatus = statusData?.data
  const backups = backupsData?.data || []

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Globe2 className="h-5 w-5" />
            {t('rathole.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('rathole.description')}</p>
        </div>
      </div>

      {/* 服务状态和控制（独立于 Tabs） */}
      <RatholeServiceControl
        serviceStatus={serviceStatus}
        onStart={() => startServiceMutation.mutate()}
        onStop={() => stopServiceMutation.mutate()}
        onRestart={() => restartServiceMutation.mutate()}
        onRefresh={refetchStatus}
        isStarting={startServiceMutation.isPending}
        isStopping={stopServiceMutation.isPending}
        isRestarting={restartServiceMutation.isPending}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* 移动端：横向滚动容器，桌面端：网格布局 */}
        <div className="w-full overflow-x-auto md:overflow-x-visible scrollbar-hide">
          <TabsList className="inline-flex w-fit md:grid md:w-full md:grid-cols-4">
            <TabsTrigger value="services" className="flex-shrink-0 whitespace-nowrap px-3 md:px-2">
              <span className="hidden md:inline">📋 </span>
              {t('rathole.serviceList')}
            </TabsTrigger>
            <TabsTrigger value="config" className="flex-shrink-0 whitespace-nowrap px-3 md:px-2">
              <span className="hidden md:inline">⚙️ </span>
              {t('rathole.globalConfig')}
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex-shrink-0 whitespace-nowrap px-3 md:px-2">
              <span className="hidden md:inline">📄 </span>
              {t('rathole.tomlPreview')}
            </TabsTrigger>
            <TabsTrigger value="backups" className="flex-shrink-0 whitespace-nowrap px-3 md:px-2">
              <span className="hidden md:inline">💾 </span>
              {t('rathole.backupManagement')}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: 服务列表 */}
        <TabsContent value="services">
          <RatholeServiceList
            services={services}
            isLoading={false}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: queryKeys.rathole.config() })}
            onCreateClick={handleCreate}
            onEditClick={handleEdit}
            onDeleteClick={(service_name) => deleteMutation.mutate(service_name)}
          />
        </TabsContent>

        {/* Tab 2: 全局配置 */}
        <TabsContent value="config">
          <RatholeGlobalConfig
            remoteAddr={remoteAddr}
            onUpdate={(config) => {
              updateRemoteMutation.mutate(config.remote_addr)
            }}
            isUpdating={updateRemoteMutation.isPending}
          />
        </TabsContent>

        {/* Tab 3: TOML 预览 */}
        <TabsContent value="preview">
          <RatholeTomlPreview tomlContent={tomlContent} onRefreshToml={refetchToml} />
        </TabsContent>

        {/* Tab 4: 备份管理 */}
        <TabsContent value="backups">
          <RatholeBackupManagement
            backups={backups}
            onRefreshBackups={refetchBackups}
            onRefreshToml={refetchToml}
          />
        </TabsContent>
      </Tabs>

      {/* 服务对话框 */}
      <RatholeServiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingService={editingService}
        onCreate={(data) => createMutation.mutate(data)}
        onUpdate={(old_name, data) => updateMutation.mutate({ old_name, data })}
        isCreating={createMutation.isPending}
        isUpdating={updateMutation.isPending}
      />
    </div>
  )
}

