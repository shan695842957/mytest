/**
 * Material Design 卡片组件
 * 移动端优化的卡片容器，提供触摸反馈
 * 
 * 特性：
 * - 移动端触摸反馈（点击效果）
 * - 支持点击交互
 * - 保持与现有 Card 组件兼容
 */

import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MaterialCardProps {
  /** 卡片标题 */
  title?: ReactNode
  /** 卡片描述 */
  description?: ReactNode
  /** 卡片内容 */
  children: ReactNode
  /** 卡片底部操作区 */
  footer?: ReactNode
  /** 点击事件 */
  onClick?: () => void
  /** 是否可点击 */
  clickable?: boolean
  /** 自定义类名 */
  className?: string
}

export function MaterialCard({
  title,
  description,
  children,
  footer,
  onClick,
  clickable = false,
  className,
}: MaterialCardProps) {
  const isClickable = clickable || !!onClick

  const cardContent = (
    <Card
      className={cn(
        // 移动端触摸反馈
        isClickable && [
          'transition-all duration-200',
          'active:scale-[0.98] active:shadow-md',
          'cursor-pointer touch-manipulation',
          'hover:shadow-md',
        ],
        className
      )}
      onClick={onClick}
    >
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  )

  // 如果可点击且没有 onClick，包装为按钮
  if (isClickable && !onClick) {
    return (
      <button
        type="button"
        className="w-full text-left touch-manipulation"
        onClick={onClick}
      >
        {cardContent}
      </button>
    )
  }

  return cardContent
}
