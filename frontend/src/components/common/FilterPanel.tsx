/**
 * 通用筛选面板组件
 * 大厂级设计：参考 Apple、Google 风格
 */

import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FilterPanelProps {
  title?: string
  description?: string
  children: ReactNode
  onQuery?: () => void
  onReset?: () => void
  onRefresh?: () => void
  actions?: ReactNode  // 额外的操作按钮（如创建按钮）
  className?: string
  queryText?: string
  resetText?: string
  refreshText?: string
}

export function FilterPanel({
  title,
  description,
  children,
  onQuery,
  onReset,
  onRefresh,
  actions,
  className,
  queryText,
  resetText,
  refreshText,
}: FilterPanelProps) {
  const { t } = useTranslation('common')

  return (
    <Card className={cn('shadow-sm', className)}>
      {(title || description || onRefresh) && (
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            {title && <CardTitle className="text-2xl">{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              onClick={onRefresh}
              className="w-full sm:w-auto"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              {refreshText || t('common.refresh')}
            </Button>
          )}
        </CardHeader>
      )}

      <CardContent className="space-y-6">
        {/* 筛选字段区域 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {children}
        </div>
      </CardContent>

      {(onQuery || onReset || actions) && (
        <>
          <Separator />
          <CardFooter className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            {/* 左侧：额外操作按钮 */}
            <div className="flex gap-2">
              {actions}
            </div>
            
            {/* 右侧：重置和查询按钮 */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            {onReset && (
              <Button type="button" variant="outline" onClick={onReset}>
                <Trash2 className="h-4 w-4 mr-2" />
                  {resetText || t('common.reset')}
              </Button>
            )}
            {onQuery && (
              <Button type="button" onClick={onQuery}>
                  {queryText || t('common.search')}
              </Button>
            )}
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  )
}

interface FilterFieldProps {
  label: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function FilterField({ label, icon, children, className }: FilterFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {label}
      </Label>
      {children}
    </div>
  )
}
