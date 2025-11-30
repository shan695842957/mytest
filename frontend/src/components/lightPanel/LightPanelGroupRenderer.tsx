/**
 * 光字牌分组渲染器 - 渲染一个分组内的所有字段
 */

import { Button } from '@/components/ui/button'
import type { LightPanelGroup } from '@/types/lightPanel'
import { cn } from '@/lib/utils'

interface LightPanelGroupRendererProps {
  group: LightPanelGroup
}

export function LightPanelGroupRenderer({ group }: LightPanelGroupRendererProps) {
  const { group_name, tags } = group

  // 检查分组内的字段类型
  const enumTags = tags.filter(t => t.data_type === 'ENUM')
  const boolTags = tags.filter(t => t.data_type === 'BOOL')
  const bitfieldTags = tags.filter(t => t.data_type === 'BITFIELD16')
  const otherTags = tags.filter(t => 
    t.data_type !== 'ENUM' && t.data_type !== 'BOOL' && t.data_type !== 'BITFIELD16'
  )

  return (
    <div className="space-y-3">
      {/* 分组标题 */}
      <h4 className="text-sm font-semibold text-foreground">{group_name}</h4>
      
      {/* ENUM类型：显示所有枚举选项（一个ENUM字段显示所有按钮） */}
      {enumTags.length > 0 && enumTags.map((tag) => {
        const enumValue = String(tag.value || '0')
        return (
          <div key={tag.tag_name} className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(tag.enum_json).map(([code, label]) => {
                const isActive = code === enumValue
                return (
                  <Button
                    key={code}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      'text-xs min-w-[60px]',
                      isActive && 'font-semibold'
                    )}
                    disabled
                  >
                    {label}
                  </Button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* BOOL类型：每个字段一个按钮（类似图片中的独立报警） */}
      {boolTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {boolTags.map((tag) => {
            const boolValue = tag.value === true || tag.value === 'true' || tag.value === 1
            return (
              <Button
                key={tag.tag_name}
                variant={boolValue ? 'destructive' : 'outline'}
                size="sm"
                className={cn(
                  'text-xs min-w-[80px]',
                  boolValue && 'font-semibold'
                )}
                disabled
              >
                {tag.display_name}
              </Button>
            )
          })}
        </div>
      )}

      {/* BITFIELD16类型：16个bit按钮（5列布局） */}
      {bitfieldTags.length > 0 && bitfieldTags.map((tag) => {
        const bitArray = tag.bits || Array(16).fill(0)
        const rawVal = tag.raw_value || 0

        return (
          <div key={tag.tag_name} className="space-y-2">
            <div className="text-xs text-muted-foreground mb-2">值: {rawVal}</div>
            <div className="grid grid-cols-5 gap-1">
              {bitArray.map((bit, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-1.5 text-xs text-center rounded border min-h-[3rem] flex flex-col items-center justify-center',
                    bit === 1
                      ? 'bg-primary/20 text-primary border-primary/50'
                      : 'bg-muted/50 text-muted-foreground border-border'
                  )}
                >
                  <div className="font-medium text-[10px] mb-0.5">Bit {index}</div>
                  <div className={cn(
                    'text-xs font-semibold',
                    bit === 1 ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {bit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* 其他类型（INT/FLOAT等） */}
      {otherTags.map((tag) => {
        const { data_type, value, display_name } = tag

        if (data_type === 'INT' || data_type === 'FLOAT') {
          const numValue = typeof value === 'number' ? value : parseFloat(String(value || 0))
          const displayValue = data_type === 'FLOAT' ? numValue.toFixed(2) : numValue.toString()

          return (
            <div key={tag.tag_name} className="flex items-center justify-between">
              <span className="text-sm">{display_name}</span>
              <span className="text-lg font-semibold">{displayValue}</span>
            </div>
          )
        }

        return (
          <div key={tag.tag_name} className="flex items-center justify-between">
            <span className="text-sm">{display_name}</span>
            <span className="text-sm font-medium">{String(value || '-')}</span>
          </div>
        )
      })}
    </div>
  )
}

