/**
 * 光字牌点卡片组件 - 显示同一寄存器在某个语义下的业务字段
 */

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type {
  LightPanelPointCard as LightPanelPointCardType,
  LightPanelTagValue,
} from '@/types/lightPanel'
import { LightPanelGroupRenderer } from './LightPanelGroupRenderer'

type SemanticKey = LightPanelTagValue['semantic_type'] | 'UNKNOWN'

interface LightPanelPointCardProps {
  pointCard: LightPanelPointCardType
  semantic?: SemanticKey
}

export function LightPanelPointCard({ pointCard, semantic }: LightPanelPointCardProps) {
  const { t } = useTranslation('lightPanel')
  const { point_display_name, instance_name, raw_value, groups, ungrouped_tags } = pointCard

  const allTags = useMemo(
    () => [...groups.flatMap(group => group.tags), ...ungrouped_tags],
    [groups, ungrouped_tags]
  )

  const getSemanticLabel = (semanticKey?: SemanticKey) => {
    if (!semanticKey) {
      return ''
    }
    if (semanticKey === 'UNKNOWN') {
      return t('semantic.UNKNOWN', { defaultValue: 'UNKNOWN' })
    }
    return t(`semantic.${semanticKey}`, { defaultValue: semanticKey })
  }

  const getCardTitle = () => {
    const hasEnum = allTags.some(tag => tag.data_type === 'ENUM')
    const hasBool = allTags.some(tag => tag.data_type === 'BOOL')
    const hasBitfield = allTags.some(tag => tag.data_type === 'BITFIELD16')
    const hasNumeric = allTags.some(tag => tag.data_type === 'INT' || tag.data_type === 'FLOAT')

    let typeSuffix = ''
    if (hasBitfield) {
      typeSuffix = hasEnum || hasBool ? '(16位-混合)' : '(16位-二进制)'
    } else if (hasEnum) {
      typeSuffix = '(多枚举)'
    } else if (hasBool) {
      typeSuffix = '(二状态)'
    } else if (hasNumeric) {
      typeSuffix = '(数值)'
    }

    return `${point_display_name}${typeSuffix}`
  }

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight">{getCardTitle()}</CardTitle>
          {raw_value !== null && raw_value !== undefined && (
            <Badge variant="outline" className="text-xs">
              值: {raw_value}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {instance_name && <span>{instance_name}</span>}
          {semantic && (
            <span className="uppercase tracking-wide font-semibold">{getSemanticLabel(semantic)}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {groups.map(group => (
          <LightPanelGroupRenderer key={group.group_name} group={group} />
        ))}

        {ungrouped_tags.length > 0 && (
          <div className="space-y-2">
            {ungrouped_tags.map(tag => (
              <div key={tag.tag_name} className="flex items-center justify-between text-sm">
                <span>{tag.display_name}</span>
                <span className="text-muted-foreground">
                  {tag.value !== null && tag.value !== undefined ? String(tag.value) : '-'}
                </span>
              </div>
            ))}
          </div>
        )}

        {groups.length === 0 && ungrouped_tags.length === 0 && (
          <div className="text-sm text-muted-foreground">{t('semantic.noData')}</div>
        )}
      </CardContent>
    </Card>
  )
}

