/**
 * 移动端导航菜单
 * 独立组件，不依赖 SidebarProvider
 * 用于移动端 Sheet 抽屉菜单
 */

import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, X } from 'lucide-react'
import logoSvg from '@/assets/logo.svg'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { MENU_CONFIG, filterMenuByRole } from '@/config/menu'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/hooks/useTheme'
import { SUPPORTED_LOCALES, type LocaleKey } from '@/config/i18n'
import { SheetClose } from '@/components/ui/sheet'

interface MobileMenuProps {
  /** 关闭菜单的回调 */
  onClose?: () => void
}

export function MobileMenu({ onClose }: MobileMenuProps) {
  const { t, i18n } = useTranslation(['menu', 'settings', 'auth'])
  const location = useLocation()
  const navigate = useNavigate()
  const { hasAnyRole, user, logout } = useAuth()
  const { mode, toggleMode } = useTheme()
  
  // 根据权限过滤菜单
  const filteredMenu = useMemo(
    () => filterMenuByRole(MENU_CONFIG, hasAnyRole),
    [hasAnyRole]
  )

  const handleNavigate = (path: string) => {
    if (path && path !== '#') {
      navigate(path)
      // 导航后，Sheet 会在路由变化时自动关闭（通过 Link 组件的导航）
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
      onClose?.()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 头部 - Logo 和标题 */}
      <div className="flex items-center justify-between p-4 border-b">
        <Link 
          to="/" 
          className="flex items-center gap-3"
        >
          <div className="flex aspect-square size-8 items-center justify-center">
            <img src={logoSvg} alt="LCCU-V Logo" className="size-8" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold text-foreground">
              {t('common:app.name')}
            </span>
            <span className="text-xs text-muted-foreground">v0.3.0</span>
          </div>
        </Link>
        
        {/* 关闭按钮 */}
        <SheetClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
          >
            <X className="size-4" />
          </Button>
        </SheetClose>
      </div>
      
      {/* 菜单内容 - 可滚动 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('mainMenu')}
          </div>
          
          <div className="space-y-1">
            {filteredMenu.map((item) => {
              const isActive = location.pathname === item.path
              
              // 有子菜单的项
              if (item.children && item.children.length > 0) {
                return (
                  <MobileMenuItem
                    key={item.key}
                    item={item}
                    location={location}
                    onNavigate={handleNavigate}
                    t={t}
                  />
                )
              }
              
              // 普通菜单项
              return (
                <SheetClose key={item.key} asChild>
                  <Link
                    to={item.path || '#'}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                      'transition-colors duration-200',
                      'text-left',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <div className="size-5">{item.icon}</div>
                    <span className="font-medium">{t(item.label)}</span>
                  </Link>
                </SheetClose>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* 底部 - 用户信息和操作 */}
      <div className="border-t p-4 space-y-3">
        {/* 用户信息 */}
        <div className="flex items-center gap-3 px-2">
          <div 
            className="flex aspect-square size-10 items-center justify-center rounded-lg shadow-md text-sm font-semibold bg-primary text-primary-foreground"
          >
            {user?.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col gap-0.5 leading-none flex-1 min-w-0">
            <span className="font-semibold truncate">{user?.username}</span>
            <span className="text-xs text-muted-foreground">
              {t(`auth:role.${user?.role}`)}
            </span>
          </div>
        </div>
        
        <Separator />
        
        {/* 快捷操作 */}
        <div className="flex items-center justify-between px-2">
          {/* 主题切换 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMode}
            className="flex-1"
          >
            {mode === 'dark' ? '☀️' : '🌙'} {mode === 'dark' ? t('settings:frontend.appearance.light.title') : t('settings:frontend.appearance.dark.title')}
          </Button>
          
          {/* 语言切换 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex-1">
                🌐 {SUPPORTED_LOCALES[i18n.language as LocaleKey] || '中文'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(SUPPORTED_LOCALES).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => i18n.changeLanguage(key)}
                  className={i18n.language === key ? 'bg-accent' : ''}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Separator />
        
        {/* 用户菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start" size="sm">
              {t('menu:profile')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleNavigate('/profile')}>
              {t('menu:profile')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigate('/settings/frontend')}>
              {t('menu:settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              {t('auth:auth.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// 移动端菜单项组件（支持嵌套）
interface MobileMenuItemProps {
  item: any
  location: any
  onNavigate: (path: string) => void
  t: (key: string) => string
}

function MobileMenuItem({ item, location, onNavigate, t }: MobileMenuItemProps) {
  const [open, setOpen] = useState(false)
  const isActive = location.pathname === item.path || 
                  location.pathname.startsWith(item.path + '/')

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
          'transition-colors duration-200',
          'text-left',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <div className="size-5">{item.icon}</div>
        <span className="font-medium flex-1">{t(item.label)}</span>
        <ChevronRight 
          className={cn(
            'size-4 transition-transform duration-200',
            open && 'rotate-90'
          )} 
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-8 mt-1 space-y-1">
          {item.children?.map((subItem: any) => {
            const isSubActive = location.pathname === subItem.path || 
                              location.pathname.startsWith(subItem.path + '/')
            
            // 三级菜单 - 递归处理
            if (subItem.children && subItem.children.length > 0) {
              return (
                <MobileMenuItem
                  key={subItem.key}
                  item={subItem}
                  location={location}
                  onNavigate={onNavigate}
                  t={t}
                />
              )
            }
            
            // 二级菜单（最终菜单项）
            return (
              <SheetClose key={subItem.key} asChild>
                <Link
                  to={subItem.path || '#'}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md',
                    'transition-colors duration-200',
                    'text-left text-sm',
                    isSubActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground/80 hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {subItem.icon && <div className="size-4">{subItem.icon}</div>}
                  <span>{t(subItem.label)}</span>
                </Link>
              </SheetClose>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
