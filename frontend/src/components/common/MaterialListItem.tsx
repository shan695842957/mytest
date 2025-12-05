/**
 * Material Design 列表项组件
 * 用于移动端列表页面，符合 Material Design 规范
 * 
 * 特性：
 * - 最小高度 64px（易于点击）
 * - 支持图标、标题、描述、操作按钮
 * - 触摸反馈
 * - 支持选中和激活状态
 */

import { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MaterialListItemProps {
  /** 左侧图标 */
  icon?: ReactNode
  /** 主标题 */
  title: string
  /** 副标题/描述（支持字符串或 ReactNode） */
  description?: string | ReactNode
  /** 右侧操作按钮 */
  actions?: ReactNode
  /** 点击事件 */
  onClick?: () => void
  /** 是否选中/激活 */
  selected?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义类名 */
  className?: string
  /** 显示右侧箭头 */
  showArrow?: boolean
}

export function MaterialListItem({
  icon,
  title,
  description,
  actions,
  onClick,
  selected = false,
  disabled = false,
  className,
  showArrow = false,
}: MaterialListItemProps) {
  const content = (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 min-h-[64px]',
        'transition-colors duration-200',
        'border-b border-border last:border-b-0',
        selected && 'bg-accent',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && onClick && 'active:bg-accent/50 cursor-pointer',
        className
      )}
      onClick={disabled ? undefined : onClick}
    >
      {/* 左侧图标 */}
      {icon && (
        <div className="flex-shrink-0">
          {icon}
        </div>
      )}

      {/* 中间内容 */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-base leading-tight truncate">
          {title}
        </div>
        {description && (
          <div className={cn(
            "mt-0.5",
            typeof description === 'string' && "text-sm text-muted-foreground line-clamp-2"
          )}>
            {description}
          </div>
        )}
      </div>

      {/* 右侧操作 */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {actions}
        {showArrow && (
          <ChevronRight className="size-5 text-muted-foreground" />
        )}
      </div>
    </div>
  )

  if (onClick && !disabled) {
    return (
      <button
        type="button"
        className="w-full text-left touch-manipulation"
        onClick={onClick}
      >
        {content}
      </button>
    )
  }

  return content
}
