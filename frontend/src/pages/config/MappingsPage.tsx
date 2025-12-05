/**
 * 资产映射页面 - 三栏布局 + 通信实例同步
 */

import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Link2, Save, X, ChevronsUpDown, Check, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  useAssetDetail,
  useAssetMappingList,
  useUpdateAssetMapping,
  useDeleteAssetMapping,
  useCreateAssetMapping,
  useSyncAssetCommInstances,
  useAssetList,
} from '@/hooks/useAssetQueries'
import { useCommInstanceList } from '@/hooks/useCommInstanceQueries'
import { useDeviceTypeDetail } from '@/hooks/useDeviceTypeQueries'
import { usePointTablePointList } from '@/hooks/usePointTableQueries'
import { useSemanticTypes } from '@/hooks/useDictQueries'
import type {
  AssetMappingDetail,
  AssetDetail,
  Asset,
  DeviceTypeDetail,
  CommInstance,
  PointTablePoint,
  DictItem,
} from '@/types'

type PointOption = {
  key: string
  label: string
  description?: string
  address?: string
  rawType?: string
}

const parseRulesJson = (value: unknown): any => {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
  return value
}

const buildPointOptions = (points: PointTablePoint[] | undefined): PointOption[] => {
  if (!points) return []
  const options: PointOption[] = []
  for (const point of points) {
    const rules = parseRulesJson(point.parse_rules_json)
    const subPoints = Array.isArray(rules?.sub_points) ? rules.sub_points : []
    if (subPoints.length > 0) {
      subPoints.forEach((sub: any) => {
        const parts: string[] = []
        if (sub.kind === 'BIT' && typeof sub.bit === 'number') {
          parts.push(`bit ${sub.bit}`)
        }
        if (
          sub.kind === 'BITS_RANGE' &&
          typeof sub.bit_from === 'number' &&
          typeof sub.bit_to === 'number'
        ) {
          parts.push(`bits ${sub.bit_from}-${sub.bit_to}`)
        }
        if (sub.type) {
          parts.push(sub.type)
        }
        options.push({
          key: `${point.point_name}.${sub.name}`,
          label: `${point.display_name || point.point_name} · ${sub.name}`,
          description:
            parts.length > 0
              ? `${point.address} · ${parts.join(' / ')}`
              : `${point.address} (${point.raw_type})`,
          address: point.address,
          rawType: point.raw_type,
        })
      })
    } else {
      options.push({
        key: point.point_name,
        label: point.display_name || point.point_name,
        description: `${point.address} (${point.raw_type})`,
        address: point.address,
        rawType: point.raw_type,
      })
    }
  }
  return options
}

export default function MappingsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('config')
  
  const assetId = id ? parseInt(id, 10) : 0
  
  const [selectedTagName, setSelectedTagName] = useState<string | null>(null)
  const [selectedInstanceId, setSelectedInstanceId] = useState<number | null>(null)
  const [selectedPointName, setSelectedPointName] = useState<string | null>(null)
  const [bindingDialogOpen, setBindingDialogOpen] = useState(false)
  const [bindingSelection, setBindingSelection] = useState<number[]>([])
  const [pointSearch, setPointSearch] = useState('')
  const [assetSwitcherOpen, setAssetSwitcherOpen] = useState(false)
  
  const { data: assetResponse, isLoading: isLoadingAsset } = useAssetDetail(assetId)
  const asset = assetResponse?.data as AssetDetail | null | undefined
  const { data: mappingsResponse, isLoading: isLoadingMappings } = useAssetMappingList(assetId)
  const mappingList = (mappingsResponse?.data as AssetMappingDetail[] | null | undefined) || []
  const { data: assetListResponse, isLoading: isLoadingAssetList } = useAssetList({ limit: 100 })
  const switchableAssets = (assetListResponse?.data as Asset[] | null | undefined) || []
  const { data: commInstancesResponse } = useCommInstanceList()
  const allCommInstances = (commInstancesResponse?.data as CommInstance[] | null | undefined) || []
  const { data: deviceTypeResponse } = useDeviceTypeDetail(asset?.device_type_id || 0)
  const deviceType = deviceTypeResponse?.data as DeviceTypeDetail | null | undefined
  const { data: semanticTypesResponse } = useSemanticTypes()
  const semanticTypes = (semanticTypesResponse?.data as DictItem[] | null | undefined) || []
  
  const boundInstanceIds = asset?.comm_instance_ids || []
  const boundInstances = allCommInstances.filter((inst) => boundInstanceIds.includes(inst.id))
  
  const selectedInstance =
    boundInstances.find((inst) => inst.id === selectedInstanceId) || boundInstances[0] || null
  
  const { data: pointsResponse } = usePointTablePointList(selectedInstance?.point_table_id || 0)
  const pointOptions = useMemo(
    () => buildPointOptions(pointsResponse?.data as PointTablePoint[] | undefined),
    [pointsResponse]
  )
  
  const filteredPointOptions = useMemo(() => {
    if (!pointSearch) return pointOptions
    const keyword = pointSearch.toLowerCase()
    return pointOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(keyword) ||
        option.description?.toLowerCase().includes(keyword)
    )
  }, [pointOptions, pointSearch])
  
  const updateMutation = useUpdateAssetMapping()
  const deleteMutation = useDeleteAssetMapping()
  const createMutation = useCreateAssetMapping()
  const syncBindingsMutation = useSyncAssetCommInstances()
  
  const currentMapping = mappingList.find((m) => m.asset_tag_name === selectedTagName)
  const currentTag = deviceType?.tags?.find((tag) => tag.tag_name === selectedTagName)
  
  const tagEntries = (deviceType?.tags || []).map((tag) => ({
    tag,
    mapping: mappingList.find((m) => m.asset_tag_name === tag.tag_name),
  }))
  
  const tagsByGroup = tagEntries.reduce<Record<string, typeof tagEntries>>((acc, entry) => {
    const group = entry.tag.group_name || t('mapping.left.ungrouped')
    if (!acc[group]) {
      acc[group] = []
    }
    acc[group].push(entry)
    return acc
  }, {})
  
  useEffect(() => {
    if (!boundInstanceIds.length) {
      setSelectedInstanceId(null)
      return
    }
    setSelectedInstanceId((prev) =>
      prev && boundInstanceIds.includes(prev) ? prev : boundInstanceIds[0]
    )
  }, [boundInstanceIds])
  
  useEffect(() => {
    if (bindingDialogOpen) {
      setBindingSelection(boundInstanceIds)
    }
  }, [bindingDialogOpen, boundInstanceIds])
  
  useEffect(() => {
    if (!selectedTagName) {
      setSelectedPointName(null)
      return
    }
    if (currentMapping?.instance_id) {
      setSelectedInstanceId(currentMapping.instance_id)
      setSelectedPointName(currentMapping.point_name)
    } else {
      setSelectedPointName(null)
    }
  }, [selectedTagName, currentMapping])
  
  // 当切换通信实例或点表变化时，验证当前选中的子点是否在新的点表中
  useEffect(() => {
    if (!selectedPointName) {
      return
    }
    // 如果点表为空，清空选择
    if (pointOptions.length === 0) {
      setSelectedPointName(null)
      return
    }
    // 检查当前选中的子点是否在新的点表中
    const exists = pointOptions.some(opt => opt.key === selectedPointName)
    if (!exists) {
      // 如果不存在，清空选择
      setSelectedPointName(null)
    }
  }, [selectedInstanceId, pointOptions])
  
  const handleSaveMapping = async () => {
    if (!selectedTagName || !selectedInstanceId || !selectedPointName) {
      return
    }
    try {
      if (currentMapping && currentMapping.id) {
        await updateMutation.mutateAsync({
          mappingId: currentMapping.id,
          data: {
            instance_id: selectedInstanceId,
            point_name: selectedPointName,
          },
        })
      } else {
        await createMutation.mutateAsync({
          assetId,
          data: {
            asset_tag_name: selectedTagName,
            instance_id: selectedInstanceId,
            point_name: selectedPointName,
          },
        })
      }
      setSelectedTagName(null)
      setSelectedPointName(null)
    } catch {
      // handled by mutation
    }
  }
  
  const handleClearMapping = async () => {
    if (!currentMapping || !currentMapping.id) {
      return
    }
    try {
      await deleteMutation.mutateAsync(currentMapping.id)
      setSelectedTagName(null)
      setSelectedPointName(null)
    } catch {
      // handled by mutation
    }
  }
  
  const handleSyncBindings = async () => {
    if (!asset) return
    try {
      await syncBindingsMutation.mutateAsync({
        assetId: asset.id,
        data: { comm_instance_ids: bindingSelection },
      })
      setBindingDialogOpen(false)
    } catch {
      // handled by mutation
    }
  }
  
  if (isLoadingAsset) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  
  if (!asset) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">资产不存在</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/config/assets')}>
              <ArrowLeft className="mr-2 size-4" />
              返回列表
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const renderBoundInstances = () => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">{asset.display_name}</CardTitle>
            <CardDescription className="mt-1 text-xs text-muted-foreground uppercase tracking-wide">
              {t('mapping.boundInstances')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('mapping.assetSwitcher.label')}</span>
            <Popover open={assetSwitcherOpen} onOpenChange={setAssetSwitcherOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-56 justify-between"
                  disabled={isLoadingAssetList}
                >
                  <span className="truncate text-left">{asset.display_name}</span>
                  <ChevronsUpDown className="ml-2 size-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0">
                <Command>
                  <CommandInput placeholder={t('mapping.assetSwitcher.search') ?? ''} />
                  <CommandList>
                    {isLoadingAssetList ? (
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : switchableAssets.length > 0 ? (
                      <CommandGroup>
                        {switchableAssets.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={`${item.display_name} ${item.name}`}
                            onSelect={() => {
                              setAssetSwitcherOpen(false)
                              if (item.id !== asset.id) {
                                navigate(`/config/assets/${item.id}/mappings`)
                              }
                            }}
                            className="flex items-center justify-between"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{item.display_name}</span>
                              <span className="text-xs text-muted-foreground">
                                #{item.name}
                              </span>
                            </div>
                            {item.id === asset.id && (
                              <Check className="size-4 text-primary" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ) : (
                      <CommandEmpty>{t('mapping.assetSwitcher.empty')}</CommandEmpty>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {boundInstances.length ? (
          boundInstances.map((instance) => (
            <Badge
              key={instance.id}
              variant={instance.id === selectedInstanceId ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedInstanceId(instance.id)}
            >
              {instance.display_name}
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{t('mapping.noInstances')}</p>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setBindingDialogOpen(true)}
          className="ml-auto"
        >
          <Link2 className="mr-2 size-4" />
          {t('mapping.syncButton')}
        </Button>
      </CardContent>
    </Card>
  )
  
  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/config/assets')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('mapping.title')}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1 ml-10">
          {asset.display_name}
        </p>
      </div>
      
      {renderBoundInstances()}
      
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-240px)] max-h-screen overflow-hidden">
        <div className="col-span-3 border-r min-h-0">
          <Card className="h-full overflow-hidden flex flex-col min-h-0">
            <CardHeader>
              <CardTitle>{t('mapping.left.title')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto">
              <Command className="h-full min-h-0">
                <CommandInput placeholder={t('mapping.left.title')} />
                <CommandList className="max-h-none flex-1 overflow-y-auto">
                  {isLoadingMappings ? (
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : Object.keys(tagsByGroup).length > 0 ? (
                    <div className="space-y-2 p-2">
                      {Object.entries(tagsByGroup).map(([group, entries]) => (
                        <div key={group} className="space-y-1">
                          <div className="px-4 py-2 text-sm font-medium text-muted-foreground">
                            {group} ({entries.length})
                          </div>
                          <CommandGroup>
                            {entries.map(({ tag, mapping }) => (
                              <CommandItem
                                key={tag.tag_name}
                                value={tag.tag_name}
                                onSelect={() => setSelectedTagName(tag.tag_name)}
                                className="flex items-center justify-between px-4 py-2"
                              >
                                <div className="flex items-center gap-2">
                                  <span>{tag.display_name}</span>
                                  {mapping?.instance_id ? (
                                    <Badge variant="outline" className="text-xs">
                                      {t('mapping.left.mapped')}
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      {t('mapping.left.unmapped')}
                                    </Badge>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <CommandEmpty>{t('deviceType.list.empty')}</CommandEmpty>
                  )}
                </CommandList>
              </Command>
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-6 min-h-0">
          <Card className="h-full overflow-hidden flex flex-col min-h-0">
            <CardHeader>
              <CardTitle>{t('mapping.center.title')}</CardTitle>
              <CardDescription>
                {selectedTagName ? `${t('mapping.center.fieldName')}: ${currentTag?.display_name || selectedTagName}` : t('mapping.center.emptyField')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 overflow-auto min-h-0">
              {selectedTagName ? (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {t('mapping.center.semanticType')}: {currentTag?.semantic_type ? (semanticTypes.find((st) => st.value === currentTag.semantic_type)?.label || currentTag.semantic_type) : '-'}
                    </p>
                    {currentTag?.group_name && (
                      <p className="text-sm text-muted-foreground">
                        {t('deviceType.tagForm.groupName')}: {currentTag.group_name}
                      </p>
                    )}
                  </div>
                  
                  {currentMapping?.instance_id && currentMapping.point_name && (() => {
                    // 从 pointOptions 中查找对应的点，获取其 display_name
                    const pointOption = pointOptions.find(opt => opt.key === currentMapping.point_name)
                    const pointDisplayName = pointOption?.label || currentMapping.point_name
                    
                    return (
                      <div className="rounded-lg border p-3 text-sm space-y-1">
                        <div>{t('mapping.center.boundInstance')}: {currentMapping.instance_display_name || currentMapping.instance_name}</div>
                        <div>{t('mapping.center.boundPoint')}: {pointDisplayName}</div>
                        {currentMapping.point_address && (
                          <div>{t('mapping.center.pointDetails')}: {currentMapping.point_address} ({currentMapping.point_raw_type})</div>
                        )}
                      </div>
                    )
                  })()}
                  
                  {boundInstances.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('mapping.center.noInstance')}</p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('mapping.center.boundInstance')}</label>
                        <Select
                          value={selectedInstanceId?.toString() || selectedInstance?.id?.toString()}
                          onValueChange={(value) => {
                            setSelectedInstanceId(parseInt(value, 10))
                            setSelectedPointName(null)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('mapping.center.boundInstance')} />
                          </SelectTrigger>
                          <SelectContent>
                            {boundInstances.map((instance) => (
                              <SelectItem key={instance.id} value={instance.id.toString()}>
                                {instance.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t('mapping.center.boundPoint')}</label>
                        <Select
                          value={
                            selectedPointName && pointOptions.some(opt => opt.key === selectedPointName)
                              ? selectedPointName
                              : undefined
                          }
                          onValueChange={(value) => setSelectedPointName(value || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('mapping.center.boundPoint')} />
                          </SelectTrigger>
                          <SelectContent>
                            {pointOptions.map((option) => (
                              <SelectItem key={option.key} value={option.key}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={handleSaveMapping}
                          disabled={!selectedInstanceId || !selectedPointName}
                        >
                          <Save className="mr-2 size-4" />
                          {t('mapping.center.save')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleClearMapping}
                          disabled={!currentMapping?.instance_id}
                        >
                          <X className="mr-2 size-4" />
                          {t('mapping.center.clear')}
                        </Button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  {t('mapping.center.emptyField')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-3 border-l min-h-0">
          <Card className="h-full overflow-hidden flex flex-col min-h-0">
            <CardHeader>
              <CardTitle>{t('mapping.right.title')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto">
              <Command className="h-full min-h-0">
                <CommandInput
                  placeholder={t('mapping.right.search')}
                  value={pointSearch}
                  onValueChange={setPointSearch}
                />
                <CommandList className="max-h-none flex-1 overflow-y-auto">
                  {!selectedInstanceId ? (
                    <CommandEmpty>{t('mapping.right.emptyNoInstance')}</CommandEmpty>
                  ) : filteredPointOptions.length === 0 ? (
                    <CommandEmpty>{t('mapping.right.emptyNoPoint')}</CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {filteredPointOptions.map((option) => (
                        <CommandItem
                          key={option.key}
                          value={option.key}
                          onSelect={() => setSelectedPointName(option.key)}
                          className="flex items-center justify-between px-4 py-2"
                        >
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Dialog open={bindingDialogOpen} onOpenChange={setBindingDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('mapping.bindingDialog.title')}</DialogTitle>
            <DialogDescription>{t('mapping.bindingDialog.description')}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-80 pr-4">
            <div className="space-y-3">
              {allCommInstances.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('mapping.bindingDialog.empty')}</p>
              ) : (
                allCommInstances.map((instance) => {
                  const checked = bindingSelection.includes(instance.id)
                  return (
                    <div
                      key={instance.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{instance.display_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {instance.protocol_type} · #{instance.point_table_id}
                        </span>
                      </div>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          const next = new Set(bindingSelection)
                          if (value) {
                            next.add(instance.id)
                          } else {
                            next.delete(instance.id)
                          }
                          setBindingSelection(Array.from(next))
                        }}
                      />
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBindingDialogOpen(false)}>
              {t('common:common.cancel')}
            </Button>
            <Button
              onClick={handleSyncBindings}
              disabled={syncBindingsMutation.isPending}
            >
              {syncBindingsMutation.isPending ? t('common:common.loading') : t('mapping.syncButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
