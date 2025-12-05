/**
 * 光字牌页面 - 设备树 + 光字牌展示
 */

import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getAssetTree, getLightPanelStatus } from '@/api/lightPanel'
import type {
  AssetTreeNode,
  LightPanelStatusResponse,
  LightPanelPointCard as LightPanelPointCardType,
  LightPanelGroup,
  LightPanelTagValue,
} from '@/types/lightPanel'
import { LightPanelPointCard } from '@/components/lightPanel/LightPanelPointCard'
import { cn } from '@/lib/utils'

type SemanticKey = LightPanelTagValue['semantic_type'] | 'UNKNOWN'
const SEMANTIC_ORDER: SemanticKey[] = [
  'STATUS',
  'MEASURE',
  'SETPOINT',
  'COMMAND',
  'ACCUM',
  'PARAM',
  'PARAM_SET',
  'UNKNOWN',
]

export default function LightPanelPage() {
  const { t } = useTranslation('lightPanel')
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null)

  // 获取资产树
  const { data: treeData, isLoading: treeLoading } = useQuery({
    queryKey: ['light-panel', 'asset-tree'],
    queryFn: () => getAssetTree(),
  })

  // 获取光字牌状态
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ['light-panel', 'status', selectedAssetId],
    queryFn: () => getLightPanelStatus(selectedAssetId!),
    enabled: selectedAssetId !== null,
  })

  // 自动选择第一个资产
  useEffect(() => {
    if (treeData?.data && treeData.data.length > 0 && selectedAssetId === null) {
      setSelectedAssetId(treeData.data[0].id)
    }
  }, [treeData, selectedAssetId])

  const assets = (treeData?.data as AssetTreeNode[] | null | undefined) || []
  const status = statusData?.data as LightPanelStatusResponse | null | undefined

  const semanticSections = useMemo(() => {
    if (!status?.point_cards) {
      return []
    }

    type Section = { semantic: SemanticKey; cards: LightPanelPointCardType[] }
    const sectionsMap = new Map<SemanticKey, Section>()

    const ensureSection = (semantic: SemanticKey) => {
      if (!sectionsMap.has(semantic)) {
        sectionsMap.set(semantic, { semantic, cards: [] })
      }
      return sectionsMap.get(semantic)!
    }

    status.point_cards.forEach((card) => {
      type Bucket = {
        groups: Record<string, LightPanelGroup>
        loose: LightPanelTagValue[]
      }
      const buckets = new Map<SemanticKey, Bucket>()
      const ensureBucket = (semantic: SemanticKey) => {
        if (!buckets.has(semantic)) {
          buckets.set(semantic, { groups: {}, loose: [] })
        }
        return buckets.get(semantic)!
      }

      card.groups.forEach((group) => {
        group.tags.forEach((tag) => {
          const semantic = (tag.semantic_type || 'UNKNOWN') as SemanticKey
          const bucket = ensureBucket(semantic)
          const groupKey = group.group_name || 'default'
          if (!bucket.groups[groupKey]) {
            bucket.groups[groupKey] = { group_name: group.group_name, tags: [] }
          }
          bucket.groups[groupKey].tags.push(tag)
        })
      })

      card.ungrouped_tags.forEach((tag) => {
        const semantic = (tag.semantic_type || 'UNKNOWN') as SemanticKey
        ensureBucket(semantic).loose.push(tag)
      })

      buckets.forEach((bucket, semantic) => {
        const filteredGroups = Object.values(bucket.groups).filter((g) => g.tags.length > 0)
        if (filteredGroups.length === 0 && bucket.loose.length === 0) {
          return
        }
        const newCard: LightPanelPointCardType = {
          ...card,
          groups: filteredGroups,
          ungrouped_tags: bucket.loose,
        }
        ensureSection(semantic).cards.push(newCard)
      })
    })

    const sections = Array.from(sectionsMap.values())
    sections.sort((a, b) => SEMANTIC_ORDER.indexOf(a.semantic) - SEMANTIC_ORDER.indexOf(b.semantic))
    sections.forEach((section) => {
      section.cards.sort((a, b) => a.point_name.localeCompare(b.point_name))
    })
    return sections
  }, [status])

  const getSemanticLabel = (semantic: SemanticKey) => {
    if (semantic === 'UNKNOWN') {
      return t('semantic.UNKNOWN', { defaultValue: 'UNKNOWN' })
    }
    return t(`semantic.${semantic}`, { defaultValue: semantic })
  }

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {t('title', { defaultValue: '光字牌' })}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('description', { defaultValue: '查看设备光字牌状态' })}
        </p>
      </div>
      
      <div className="flex h-[calc(100vh-12rem)] gap-4">
        {/* 左侧设备树 */}
        <div className="w-64 flex-shrink-0">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-base">{t('deviceTree')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-8rem)]">
              {treeLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : assets.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {t('noAssets')}
                </div>
              ) : (
                <div className="p-2">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAssetId(asset.id)}
                      className={cn(
                        'p-3 rounded-md cursor-pointer transition-colors mb-1',
                        selectedAssetId === asset.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      )}
                    >
                      <div className="font-medium text-sm">{asset.display_name}</div>
                      {asset.device_type_display_name && (
                        <div className={cn(
                          'text-xs mt-1',
                          selectedAssetId === asset.id
                            ? 'text-primary-foreground/80'
                            : 'text-muted-foreground'
                        )}>
                          {asset.device_type_display_name}
                        </div>
                      )}
                      {!asset.enabled && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {t('disabled')}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        </div>
        
        {/* 右侧光字牌展示 */}
        <div className="flex-1 overflow-hidden">
        {selectedAssetId === null ? (
          <Card className="h-full flex items-center justify-center">
            <CardContent>
              <p className="text-muted-foreground">{t('selectAsset')}</p>
            </CardContent>
          </Card>
        ) : statusLoading ? (
          <Card className="h-full">
            <CardContent className="p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : status ? (
          <ScrollArea className="h-full">
            <div className="space-y-6 p-4">
              {/* 资产信息 */}
              <div>
                <h2 className="text-lg font-semibold mb-2">{status.asset_display_name}</h2>
                {status.device_type_name && (
                  <p className="text-sm text-muted-foreground">{status.device_type_name}</p>
                )}
              </div>

              <Separator />

              {/* 按语义拆分的卡片区域 */}
              {semanticSections.length > 0 ? (
                semanticSections.map((section) => (
                  <div key={section.semantic} className="space-y-4">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-base font-semibold">{getSemanticLabel(section.semantic)}</h3>
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {section.semantic}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {section.cards.map((pointCard) => (
                        <LightPanelPointCard
                          key={`${section.semantic}-${pointCard.point_name}`}
                          pointCard={pointCard}
                          semantic={section.semantic}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  {t('noTags')}
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent>
              <p className="text-muted-foreground">{t('loadFailed')}</p>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  )
}

