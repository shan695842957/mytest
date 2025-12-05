/**
 * 移动端顶部应用栏
 * 参考 Android Material Design Top App Bar 规范
 * https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-basics
 * 
 * 特性：
 * - 固定在顶部，Safe Area 适配
 * - 左侧导航按钮（抽屉）
 * - 中间标题（可滚动）
 * - 右侧操作按钮
 * - 支持搜索功能
 */

import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, Globe, Moon, Sun, Palette, Check, Circle, Droplet, Leaf, Sparkles, Sun as SunIcon, ArrowLeft } from 'lucide-react'
import CN from 'country-flag-icons/react/3x2/CN'
import US from 'country-flag-icons/react/3x2/US'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { MobileMenu } from './MobileMenu'
import { UserAvatarButton } from './UserAvatarButton'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import { SUPPORTED_LOCALES, type LocaleKey } from '@/config/i18n'
import type { ThemeColor } from '@/config/theme'

// 主题配色选项（图标组件 + 颜色类）
const COLOR_THEMES = {
  neutral: { Icon: Circle, colorClass: 'text-foreground' },
  blue: { Icon: Droplet, colorClass: 'text-blue-500' },
  green: { Icon: Leaf, colorClass: 'text-green-500' },
  purple: { Icon: Sparkles, colorClass: 'text-purple-500' },
  yellow: { Icon: SunIcon, colorClass: 'text-yellow-500' },
} as const
interface MobileTopBarProps {
  /** 显示搜索按钮 */
  showSearch?: boolean
  /** 显示通知按钮 */
  showNotification?: boolean
  /** 自定义右侧操作 */
  actions?: React.ReactNode
  /** 自定义标题 */
  title?: string
}

export function MobileTopBar({ 
  showSearch = false, 
  showNotification = false,
  actions,
  title
}: MobileTopBarProps) {
  const { t, i18n } = useTranslation(['common', 'settings'])
  const location = useLocation()
  const navigate = useNavigate()
  const { mode, color, toggleMode, setColor } = useTheme()
  
  const changeLanguage = (locale: LocaleKey) => {
    i18n.changeLanguage(locale)
  }

  // 判断是否需要显示返回按钮
  // 定义顶层路径（这些路径不应该显示返回按钮）
  const topLevelPaths = ['/dashboard', '/users', '/audit', '/settings', '/tools', '/config', '/soe', '/light-panel', '/profile', '/history']
  
  const shouldShowBackButton = () => {
    const currentPath = location.pathname
    // 如果当前路径正好等于某个顶层路径，不显示返回按钮
    if (topLevelPaths.includes(currentPath)) {
      return false
    }
    // 如果当前路径是某个顶层路径的子路径，显示返回按钮
    return topLevelPaths.some(topPath => 
      currentPath.startsWith(topPath + '/') && currentPath !== topPath
    )
  }

  // 获取父级路径
  const getParentPath = () => {
    const currentPath = location.pathname
    
    // 特殊情况：settings 和 tools 的子路由应该返回到顶层（因为中间路径没有页面）
    if (currentPath.startsWith('/settings/')) {
      // 如果是在设置子页面，直接返回到 /settings
      if (currentPath !== '/settings') {
        return '/settings'
      }
    }
    
    if (currentPath.startsWith('/tools/')) {
      // 如果是在工具子页面，直接返回到 /tools
      if (currentPath !== '/tools') {
        return '/tools'
      }
    }
    
    // 找到匹配的顶层路径
    const matchedTopPath = topLevelPaths.find(topPath => 
      currentPath.startsWith(topPath + '/')
    )
    
    if (matchedTopPath) {
      // 移除最后一个路径段，返回到父级
      const pathSegments = currentPath.split('/').filter(Boolean)
      if (pathSegments.length > 1) {
        // 移除最后一个段
        pathSegments.pop()
        const parentPath = '/' + pathSegments.join('/')
        // 如果父路径是顶层路径，直接返回
        if (topLevelPaths.includes(parentPath)) {
          return parentPath
        }
        // 否则继续向上查找，直到找到顶层路径
        return matchedTopPath
      }
      // 如果只有顶层路径，返回顶层
      return matchedTopPath
    }
    
    // 默认返回到顶层路径
    return '/dashboard'
  }

  const handleBack = () => {
    const parentPath = getParentPath()
    navigate(parentPath)
  }

  // 根据路由获取页面标题
  const getTitle = () => {
    if (title) return title
    
    // 根据路径返回标题
    const pathTitleMap: Record<string, string> = {
      '/dashboard': t('menu:dashboard'),
      '/users': t('menu:users'),
      '/audit': t('menu:audit'),
      '/settings': t('menu:settings'),
      '/tools': t('menu:tools'),
      '/config': t('menu:config'),
      '/soe': t('menu:soe'),
      '/light-panel': t('menu:light_panel'),
      '/profile': t('menu:profile'),
      '/history': t('menu:history_data'),
    }
    
    // 处理子路径，匹配更具体的路径
    if (location.pathname.startsWith('/settings/gateway')) {
      if (location.pathname === '/settings/gateway/monitor') return t('menu:gateway_monitor')
      if (location.pathname === '/settings/gateway/history') return t('menu:gateway_history')
      if (location.pathname === '/settings/gateway/network') return t('menu:gateway_network')
      if (location.pathname === '/settings/gateway/time') return t('menu:gateway_time')
      if (location.pathname === '/settings/gateway/info') return t('menu:gateway_info')
      if (location.pathname === '/settings/gateway/ssh') return t('menu:gateway_ssh')
      return t('menu:gateway_settings')
    }
    
    if (location.pathname.startsWith('/settings/software')) {
      if (location.pathname === '/settings/software/service') return t('menu:software_service')
      if (location.pathname === '/settings/software/api') return t('menu:software_api')
      if (location.pathname === '/settings/software/database') return t('menu:software_database')
      if (location.pathname === '/settings/software/config-center') return t('menu:software_config_center')
      return t('menu:software_settings')
    }
    
    if (location.pathname === '/settings/frontend') {
      return t('menu:frontend_settings')
    }
    
    // 处理工具子路径
    if (location.pathname.startsWith('/tools/')) {
      if (location.pathname === '/tools/ping') return t('menu:ping')
      if (location.pathname === '/tools/port-scan') return t('menu:port_scan')
      if (location.pathname === '/tools/arp') return t('menu:arp_table')
      if (location.pathname === '/tools/traceroute') return t('menu:traceroute')
      if (location.pathname === '/tools/network-capture') return t('menu:network_capture')
      if (location.pathname === '/tools/serial') return t('menu:serial_port')
      if (location.pathname === '/tools/port-forwarding') return t('menu:port_forwarding')
      if (location.pathname === '/tools/rathole') return t('menu:rathole')
      return t('menu:tools')
    }
    
    for (const [path, menuTitle] of Object.entries(pathTitleMap)) {
      if (location.pathname === path || location.pathname.startsWith(path + '/')) {
        return menuTitle
      }
    }
    
    return t('common:app.name')
  }

  const showBack = shouldShowBackButton()

  return (
    <header className="fixed top-0 z-40 w-full md:hidden">
      {/* Safe Area 适配 - 顶部安全区域（刘海屏等设备） */}
      <div className="safe-area-top" />
      
      {/* Top App Bar 背景 */}
      <div className="bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border">
        {/* Material Design Top App Bar 高度：56dp（约 56px） */}
        <div className="flex items-center h-14 px-3 gap-2">
          {/* 左侧 - 返回按钮或导航抽屉按钮 */}
          {showBack ? (
            <Button 
              variant="ghost" 
              size="icon"
              className="size-10 rounded-full"
              onClick={handleBack}
              aria-label={t('common:common.back')}
            >
              <ArrowLeft className="size-5" />
            </Button>
          ) : (
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="size-10 rounded-full"
                  aria-label="菜单"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className="p-0 w-80 max-w-[85vw] flex flex-col [&>button:last-child]:hidden"
              >
                {/* 可访问性标签 - 仅对屏幕阅读器可见 */}
                <SheetHeader className="sr-only">
                  <SheetTitle>
                    {t('menu:menu.title', { defaultValue: '导航菜单' })}
                  </SheetTitle>
                  <SheetDescription>
                    {t('menu:menu.description', { defaultValue: '主导航菜单，包含所有可用的功能模块' })}
                  </SheetDescription>
                </SheetHeader>
                <MobileMenu />
              </SheetContent>
            </Sheet>
          )}
          
          {/* 中间 - 页面标题 */}
          <div className="flex-1 min-w-0">
            <h1 className={cn(
              'text-base font-semibold truncate',
              'text-foreground'
            )}>
              {getTitle()}
            </h1>
          </div>
          
          {/* 右侧 - 操作按钮 */}
          <div className="flex items-center gap-1">
            {/* 搜索按钮 */}
            {showSearch && (
              <Button 
                variant="ghost" 
                size="icon"
                className="size-10 rounded-full"
                aria-label={t('common:common.search')}
              >
                <Search className="size-5" />
              </Button>
            )}
            
            {/* 通知按钮 */}
            {showNotification && (
              <Button 
                variant="ghost" 
                size="icon"
                className="size-10 rounded-full relative"
                aria-label={t('common:common.notifications')}
              >
                <Bell className="size-5" />
                {/* 通知角标 */}
                <span className="absolute top-1.5 right-1.5 size-2 bg-destructive rounded-full" />
              </Button>
            )}
            
            {/* 自定义操作 */}
            {actions}
            
            {/* 主题配色切换 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="size-10 rounded-full"
                  aria-label={t('settings:frontend.theme.title')}
                >
                  <Palette className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t('settings:frontend.theme.title')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(COLOR_THEMES).map(([key, { Icon, colorClass }]) => {
                  const themeKey = key as ThemeColor
                  return (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => setColor(themeKey)}
                      className="flex-col items-start py-2"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Icon className={`size-4 ${colorClass}`} />
                        <span className="font-medium">
                          {color === key && '✓ '}
                          {t(`settings:frontend.theme.${themeKey}.name`)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground ml-7">
                        {t(`settings:frontend.theme.${themeKey}.desc`)}
                      </span>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* 亮/暗模式切换 */}
            <Button 
              variant="ghost" 
              size="icon"
              className="size-10 rounded-full"
              onClick={toggleMode}
              aria-label={mode === 'dark' ? t('settings:frontend.appearance.light.title') : t('settings:frontend.appearance.dark.title')}
            >
              {mode === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>
            
            {/* 语言切换 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="size-10 rounded-full"
                  aria-label="选择语言"
                >
                  <Globe className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{t('settings:frontend.language.title', { defaultValue: '选择语言' })}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(SUPPORTED_LOCALES).map(([key, label]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => changeLanguage(key as LocaleKey)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {key === 'zh-CN' ? (
                        <CN className="w-6 h-4 rounded shadow-sm" title="中国" />
                      ) : (
                        <US className="w-6 h-4 rounded shadow-sm" title="United States" />
                      )}
                      <span>{label}</span>
                    </div>
                    {i18n.language === key && (
                      <Check className="size-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* 用户菜单 - 移动端简化版（只显示用户头像按钮） */}
            {/* 完整功能在左侧菜单中，这里只显示用户头像 */}
            <UserAvatarButton />
          </div>
        </div>
      </div>
    </header>
  )
}
