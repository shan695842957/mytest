/**
 * 移动端表单组件
 * 针对移动端优化的表单布局和输入框
 * 
 * 特性：
 * - 大输入框（易于触摸输入）
 * - 底部操作栏（固定在底部，Safe Area 适配）
 * - 移动端优化的间距和字体大小
 */

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface MobileFormProps {
  /** 表单内容 */
  children: ReactNode
  /** 提交按钮文本 */
  submitLabel?: string
  /** 取消按钮文本 */
  cancelLabel?: string
  /** 提交处理函数 */
  onSubmit?: () => void
  /** 取消处理函数 */
  onCancel?: () => void
  /** 提交按钮是否加载中 */
  submitting?: boolean
  /** 提交按钮是否禁用 */
  submitDisabled?: boolean
  /** 显示底部操作栏 */
  showActions?: boolean
  /** 自定义底部操作 */
  actions?: ReactNode
  /** 自定义类名 */
  className?: string
  /** 内容区类名 */
  contentClassName?: string
}

export function MobileForm({
  children,
  submitLabel = '保存',
  cancelLabel = '取消',
  onSubmit,
  onCancel,
  submitting = false,
  submitDisabled = false,
  showActions = true,
  actions,
  className,
  contentClassName,
}: MobileFormProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 表单内容区 */}
      <div className={cn(
        'flex-1 overflow-y-auto',
        // 移动端：为底部操作栏预留空间
        showActions && 'pb-20 md:pb-0',
        contentClassName
      )}>
        {children}
      </div>

      {/* 底部操作栏 */}
      {showActions && (
        <div className={cn(
          // 移动端：固定在底部
          'fixed bottom-0 left-0 right-0 z-40 md:relative md:z-auto',
          'bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80',
          'border-t border-border',
          'safe-area-bottom',
          // 移动端：向上偏移，避开底部导航栏
          'md:border-t-0 md:bg-transparent',
          // 桌面端：常规内边距
          'p-4 md:p-0 md:pt-6',
          // 阴影
          'shadow-lg md:shadow-none'
        )}>
          {actions || (
            <div className="flex gap-3 w-full md:w-auto md:justify-end">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={submitting}
                  className="flex-1 md:flex-initial min-h-[44px] text-base md:text-sm md:h-9"
                >
                  {cancelLabel}
                </Button>
              )}
              {onSubmit && (
                <Button
                  type="button"
                  onClick={onSubmit}
                  disabled={submitDisabled || submitting}
                  className="flex-1 md:flex-initial min-h-[44px] text-base md:text-sm md:h-9"
                >
                  {submitting ? '保存中...' : submitLabel}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * 移动端表单字段容器
 * 提供移动端优化的间距和布局
 */
interface MobileFormFieldProps {
  /** 字段标签 */
  label?: string
  /** 字段描述 */
  description?: string
  /** 字段内容 */
  children: ReactNode
  /** 是否必填 */
  required?: boolean
  /** 错误信息 */
  error?: string
  /** 自定义类名 */
  className?: string
}

export function MobileFormField({
  label,
  description,
  children,
  required = false,
  error,
  className,
}: MobileFormFieldProps) {
  return (
    <div className={cn('space-y-2 mb-6', className)}>
      {label && (
        <label className={cn(
          'block text-base font-medium md:text-sm',
          required && "after:content-['*'] after:ml-0.5 after:text-destructive"
        )}>
          {label}
        </label>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className={cn(
        // 移动端输入框更大
        '[&_input]:text-base [&_input]:min-h-[44px] md:[&_input]:text-sm md:[&_input]:min-h-[36px]',
        '[&_select]:text-base [&_select]:min-h-[44px] md:[&_select]:text-sm md:[&_select]:min-h-[36px]',
        '[&_textarea]:text-base [&_textarea]:min-h-[88px] md:[&_textarea]:text-sm md:[&_textarea]:min-h-[80px]'
      )}>
        {children}
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
