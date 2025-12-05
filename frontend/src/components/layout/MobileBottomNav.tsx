/**
 * 移动端底部导航栏
 * 参考 Android Material Design Bottom Navigation 规范
 * https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns
 * 
 * 特性：
 * - 固定在底部，易于拇指操作
 * - 最多显示5个主要导航项
 * - 图标 + 文字标签
 * - 选中状态高亮显示
 * - Safe Area 适配（底部安全区域）
 */

import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Settings, Wrench, Database, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types'

// 底部导航主要页面配置
const BOTTOM_NAV_ITEMS = [
  {
    key: 'dashboard',
    path: '/dashboard',
    label: 'dashboard',
    icon: LayoutDashboard,
    roles: [] as UserRole[], // 所有角色
  },
  {
    key: 'light-panel',
    path: '/light-panel',
    label: 'light_panel',
    icon: Activity,
    roles: [] as UserRole[], // 所有角色
  },
  {
    key: 'config',
    path: '/config',
    label: 'config',
    icon: Database,
    roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
  },
  {
    key: 'tools',
    path: '/tools',
    label: 'tools',
    icon: Wrench,
    roles: [] as UserRole[], // 所有角色
  },
  {
    key: 'settings',
    path: '/settings',
    label: 'settings',
    icon: Settings,
    roles: [] as UserRole[], // 所有角色
  },
]

export function MobileBottomNav() {
  const { t } = useTranslation('menu')
  const location = useLocation()
  const { hasAnyRole } = useAuth()

  // 根据权限过滤导航项
  const visibleItems = BOTTOM_NAV_ITEMS.filter(item => {
    if (item.roles.length === 0) return true
    return hasAnyRole(item.roles)
  })

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Safe Area 适配 - 底部安全区域（iPhone 等设备） */}
      <div className="safe-area-bottom" />
      
      {/* 导航栏背景 */}
      <div className="bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-t border-border">
        {/* Material Design 底部导航栏高度：56dp（约 56px） */}
        <div className="flex items-center justify-around h-14 px-2">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
                            (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
            
            return (
              <Link
                key={item.key}
                to={item.path}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full py-1',
                  'transition-colors duration-200',
                  'active:bg-accent/50',
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                )}
              >
                {/* 图标容器 */}
                <div className={cn(
                  'relative flex items-center justify-center',
                  'transition-all duration-200'
                )}>
                  <Icon className={cn(
                    'size-5 transition-all duration-200',
                    isActive && 'scale-105'
                  )} />
                  
                  {/* 激活指示器 - Material Design 规范 */}
                  {isActive && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />
                  )}
                </div>
                
                {/* 文字标签 */}
                <span className={cn(
                  'text-[11px] font-medium leading-tight truncate w-full text-center',
                  'transition-all duration-200',
                  isActive && 'font-semibold'
                )}>
                  {t(item.label)}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
