/**
 * 软件参数配置中心（世界级UI）
 * 参考：VS Code Settings、Chrome Settings、macOS System Preferences
 * 
 * 架构：
 * - 左侧：分类树形导航（可折叠）
 * - 右侧：参数面板（搜索+参数列表）
 * - 顶部：操作栏（搜索、重置、导入导出）
 */
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Settings2,
  Network,
  Info,
  Save,
  RotateCcw,
  Activity,
  AlertCircle,
  HardDrive,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { getSystemConfig, updateSystemConfig } from '@/api/gateway'
import { useAuth } from '@/hooks/useAuth'
import type { SystemConfigUpdate } from '@/types'
import { UserRole } from '@/types/permission'

/**
 * 配置分类定义
 */
interface ConfigCategory {
  id: string
  label: string
  icon: any
  description: string
  sections: ConfigSection[]
}

interface ConfigSection {
  id: string
  label: string
  items: ConfigItem[]
}

interface ConfigItem {
  module: string
  key: string
  label: string
  description: string
  type: 'switch' | 'number' | 'text' | 'select'
  value: any
  defaultValue: any
  options?: { label: string; value: any }[]
  min?: number
  max?: number
  unit?: string
  required?: boolean
  readonly?: boolean
}

export default function SoftwareConfigPage() {
  const { t } = useTranslation(['software', 'common'])
  const { hasAnyRole } = useAuth()
  const queryClient = useQueryClient()

  const isDeveloper = hasAnyRole([UserRole.DEVELOPER])
  
  const [selectedCategory, setSelectedCategory] = useState('monitor')
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['system-config'],
    queryFn: getSystemConfig,
  })

  const configItems = data?.data || []

  const configMap = useMemo(() => {
    const map: Record<string, Record<string, string>> = {}
    for (const item of configItems) {
      if (!map[item.module]) {
        map[item.module] = {}
      }
      map[item.module][item.key] = item.value
    }
    return map
  }, [configItems])

  // 配置分类定义（参考 VS Code Settings）
  const categories: ConfigCategory[] = useMemo(() => [
    {
      id: 'monitor',
      label: t('software:categories.monitor.label'),
      icon: Activity,
      description: t('software:categories.monitor.description'),
      sections: [
        {
          id: 'monitor-basic',
          label: t('software:sections.monitor.basic'),
          items: [
            {
              module: 'monitor',
              key: 'collection_enabled',
              label: t('software:params.collection_enabled.label'),
              description: t('software:params.collection_enabled.description'),
              type: 'switch',
              value: (configMap.monitor?.collection_enabled ?? 'true') === 'true',
              defaultValue: true,
            },
            {
              module: 'monitor',
              key: 'collection_interval',
              label: t('software:params.collection_interval.label'),
              description: t('software:params.collection_interval.description'),
              type: 'number',
              value: Number(configMap.monitor?.collection_interval ?? 10),
              defaultValue: 10,
              min: 5,
              max: 300,
              unit: t('software:params.collection_interval.unit'),
            },
            {
              module: 'monitor',
              key: 'retention_days',
              label: t('software:params.retention_days.label'),
              description: t('software:params.retention_days.description'),
              type: 'number',
              value: Number(configMap.monitor?.retention_days ?? 7),
              defaultValue: 7,
              min: 1,
              max: 30,
              unit: t('software:params.retention_days.unit'),
            },
          ],
        },
        {
          id: 'monitor-advanced',
          label: t('software:sections.monitor.advanced'),
          items: [
            {
              module: 'monitor',
              key: 'collect_network',
              label: t('software:params.collect_network.label'),
              description: t('software:params.collect_network.description'),
              type: 'switch',
              value: (configMap.monitor?.collect_network ?? 'true') === 'true',
              defaultValue: true,
            },
            {
              module: 'monitor',
              key: 'collect_process',
              label: t('software:params.collect_process.label'),
              description: t('software:params.collect_process.description'),
              type: 'switch',
              value: (configMap.monitor?.collect_process ?? 'true') === 'true',
              defaultValue: true,
            },
            {
              module: 'monitor',
              key: 'auto_cleanup',
              label: t('software:params.auto_cleanup.label'),
              description: t('software:params.auto_cleanup.description'),
              type: 'switch',
              value: (configMap.monitor?.auto_cleanup ?? 'true') === 'true',
              defaultValue: true,
            },
          ],
        },
      ],
    },
    {
      id: 'rathole',
      label: t('software:categories.rathole.label'),
      icon: Network,
      description: t('software:categories.rathole.description'),
      sections: [
        {
          id: 'rathole-paths',
          label: t('software:sections.rathole.paths'),
          items: [
            {
              module: 'rathole',
              key: 'config_path',
              label: t('software:params.config_path.label'),
              description: t('software:params.config_path.description'),
              type: 'text',
              value: configMap.rathole?.config_path ?? '/etc/rathole/client.toml',
              defaultValue: '/etc/rathole/client.toml',
              required: true,
            },
            {
              module: 'rathole',
              key: 'data_directory',
              label: t('software:params.data_directory.label'),
              description: t('software:params.data_directory.description'),
              type: 'text',
              value: configMap.rathole?.data_directory ?? '/var/lib/lccu-v',
              defaultValue: '/var/lib/lccu-v',
              required: true,
            },
          ],
        },
        {
          id: 'rathole-backup',
          label: t('software:sections.rathole.backup'),
          items: [
            {
              module: 'rathole',
              key: 'backup_keep_count',
              label: t('software:params.backup_keep_count.label'),
              description: t('software:params.backup_keep_count.description'),
              type: 'number',
              value: Number(configMap.rathole?.backup_keep_count ?? 7),
              defaultValue: 7,
              min: 1,
              max: 30,
              unit: t('software:params.backup_keep_count.unit'),
            },
          ],
        },
      ],
    },
    {
      id: 'system',
      label: t('software:categories.system.label'),
      icon: HardDrive,
      description: t('software:categories.system.description'),
      sections: [
        {
          id: 'system-paths',
          label: t('software:sections.system.paths'),
          items: [
            {
              module: 'system',
              key: 'data_directory',
              label: t('software:params.system_data_directory.label'),
              description: t('software:params.system_data_directory.description'),
              type: 'text',
              value: configMap.system?.data_directory ?? '/var/lib/lccu-v',
              defaultValue: '/var/lib/lccu-v',
              required: true,
            },
          ],
        },
      ],
    },
  ], [configMap, t])

  // 搜索过滤
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories
    
    const query = searchQuery.toLowerCase()
    return categories.map(cat => ({
      ...cat,
      sections: cat.sections.map(section => ({
        ...section,
        items: section.items.filter(item =>
          item.label.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.key.toLowerCase().includes(query)
        ),
      })).filter(section => section.items.length > 0),
    })).filter(cat => cat.sections.length > 0)
  }, [categories, searchQuery])

  // 当前选中的分类
  const currentCategory = useMemo(() => {
    return filteredCategories.find(cat => cat.id === selectedCategory) || filteredCategories[0]
  }, [filteredCategories, selectedCategory])

  // 修改的配置项（按模块分组）
  const [changedValues, setChangedValues] = useState<Record<string, Record<string, any>>>({})
  const changedCount = useMemo(() => (
    Object.values(changedValues).reduce((sum, moduleValues) => sum + Object.keys(moduleValues).length, 0)
  ), [changedValues])
  const hasChanges = changedCount > 0

  // 更新配置项
  const handleValueChange = (module: string, key: string, value: any) => {
    setChangedValues(prev => {
      const moduleValues = prev[module] || {}
      return {
        ...prev,
        [module]: { ...moduleValues, [key]: value },
      }
    })
  }

  // 保存配置
  const updateMutation = useMutation({
    mutationFn: (payload: SystemConfigUpdate) => updateSystemConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === 'system-config',
      })
      setChangedValues({})
      toast.success(t('software:config.updateSuccess'))
    },
    onError: (error: any) => {
      toast.error(t('common:error.operationFailed') + ': ' + error.message)
    },
  })

  const handleSave = () => {
    const payload: SystemConfigUpdate = {}
    if (changedValues.monitor && Object.keys(changedValues.monitor).length > 0) {
      payload.monitor = changedValues.monitor
    }
    if (changedValues.rathole && Object.keys(changedValues.rathole).length > 0) {
      payload.rathole = changedValues.rathole
    }
    if (changedValues.system && Object.keys(changedValues.system).length > 0) {
      payload.system = changedValues.system
    }
    if (!payload.monitor && !payload.rathole && !payload.system) {
      return
    }
    updateMutation.mutate(payload)
  }

  // 重置配置
  const handleReset = () => {
    setChangedValues({})
    toast.info(t('software:config.resetSuccess'))
  }

  // 渲染配置项
  const renderConfigItem = (item: ConfigItem) => {
    const moduleChanges = changedValues[item.module] || {}
    const currentValue = moduleChanges[item.key] ?? item.value
    const isChanged = moduleChanges[item.key] !== undefined
    const isReadonly = item.readonly || !isDeveloper

    return (
      <div 
        key={item.key} 
        className={`flex items-center justify-between py-4 px-4 rounded-lg border transition-colors ${
          isChanged ? 'bg-accent/50 border-primary' : 'bg-card border-border'
        }`}
      >
        <div className="flex-1 space-y-1 pr-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium leading-none">{item.label}</h4>
            {isChanged && <Badge variant="secondary" className="text-xs">{t('software:badges.modified')}</Badge>}
            {item.required && <Badge variant="destructive" className="text-xs">{t('software:badges.required')}</Badge>}
            {item.readonly && <Badge variant="outline" className="text-xs">{t('software:badges.readonly')}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{item.description}</p>
          {item.unit && (
            <p className="text-xs text-muted-foreground">{t('common:field.unit')}: {item.unit}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {item.type === 'switch' && (
            <Switch
              checked={currentValue}
              onCheckedChange={(checked) => handleValueChange(item.module, item.key, checked)}
              disabled={isReadonly}
            />
          )}

          {item.type === 'number' && (
            <Input
              type="number"
              value={currentValue}
              onChange={(e) => handleValueChange(item.module, item.key, Number(e.target.value))}
              min={item.min}
              max={item.max}
              disabled={isReadonly}
              className="w-32"
            />
          )}

          {item.type === 'text' && (
            <Input
              type="text"
              value={currentValue}
              onChange={(e) => handleValueChange(item.module, item.key, e.target.value)}
              disabled={isReadonly}
              className="w-64"
            />
          )}

          {item.type === 'select' && (
            <select
              value={currentValue}
              onChange={(e) => handleValueChange(item.module, item.key, e.target.value)}
              disabled={isReadonly}
              className="w-48 h-10 px-3 rounded-md border border-input bg-background"
            >
              {item.options?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {isChanged && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newValues = { ...changedValues }
                if (newValues[item.module]) {
                  delete newValues[item.module][item.key]
                  if (Object.keys(newValues[item.module]).length === 0) {
                    delete newValues[item.module]
                  }
                }
                setChangedValues(newValues)
              }}
            >
              {t('software:actions.undo')}
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="h-full flex">
        <div className="w-64 border-r bg-muted/30 p-4">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* 顶部工具栏 */}
      <div className="border-b bg-background p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings2 className="h-6 w-6" />
              {t('software:config.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('software:config.description')}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {hasChanges && (
              <>
                <Badge variant="secondary" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {t('software:config.paramCount', { count: changedCount })}
                </Badge>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {t('software:actions.reset')}
                </Button>
              </>
            )}
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={!hasChanges || !isDeveloper || updateMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? t('software:actions.saving') : t('software:actions.save')}
            </Button>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('software:config.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 权限提示 */}
        {!isDeveloper && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t('software:config.readOnlyHint')}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* 主体：左右分栏布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：分类导航 */}
        <div className="w-64 border-r bg-muted/30">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {filteredCategories.map((cat) => {
                const Icon = cat.icon
                const isActive = selectedCategory === cat.id
                const itemCount = cat.sections.reduce((sum, s) => sum + s.items.length, 0)
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{cat.label}</div>
                      <div className={`text-xs mt-0.5 ${isActive ? 'opacity-90' : 'text-muted-foreground'}`}>
                        {t('software:config.paramCount', { count: itemCount })}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* 右侧：参数面板 */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {currentCategory && (
                <>
                  {/* 分类标题 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = currentCategory.icon
                        return <Icon className="h-6 w-6" />
                      })()}
                      <h2 className="text-2xl font-bold">{currentCategory.label}</h2>
                    </div>
                    <p className="text-muted-foreground">{currentCategory.description}</p>
                  </div>

                  <Separator />

                  {/* 参数列表（按 Section 分组） */}
                  {currentCategory.sections.map((section) => (
                    <Card key={section.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{section.label}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {section.items.map((item) => renderConfigItem(item))}
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}

              {/* 无搜索结果 */}
              {searchQuery && filteredCategories.length === 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {t('software:config.noResults')}: "{searchQuery}"
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
