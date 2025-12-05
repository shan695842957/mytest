/**
 * 顶部导航栏 - 右侧工具栏
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { LogOut, Globe, Moon, Sun, User as UserIcon, Palette, Clock, Check, MonitorSmartphone, Server, Circle, Droplet, Leaf, Sparkles, Sun as SunIcon } from 'lucide-react'
import CN from 'country-flag-icons/react/3x2/CN'
import US from 'country-flag-icons/react/3x2/US'
import { Button } from '@/components/ui/button'
import { usePageVisibility } from '@/hooks/usePageVisibility'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { getTimeConfig } from '@/api/gateway'
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

export function Header() {
  const { t, i18n } = useTranslation(['common', 'auth', 'menu', 'settings'])
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { mode, color, toggleMode, setColor } = useTheme()
  const isPageVisible = usePageVisibility()
  
  const [currentTime, setCurrentTime] = useState(new Date())
  const [gatewayTimeOffset, setGatewayTimeOffset] = useState(0) // 网关时间偏移（毫秒）
  const [gatewayTimezone, setGatewayTimezone] = useState('UTC+0')
  const [gatewayTimezoneName, setGatewayTimezoneName] = useState('')
  
  // 获取网关时间配置（5分钟校准一次 + 页面可见性检测）
  const { data: timeData } = useQuery({
    queryKey: ['gateway', 'time'],
    queryFn: getTimeConfig,
    refetchInterval: () => {
      // 页面不可见时不刷新
      if (!isPageVisible) return false
      return 300000 // 5分钟校准一次（原5秒）
    },
    staleTime: 60000, // 1分钟内复用缓存
    retry: false, // 失败不重试，避免权限问题
  })
  
  // 当获取到网关时间时，计算偏移量
  useEffect(() => {
    if (timeData?.data?.time_info) {
      const gatewayTime = new Date(timeData.data.time_info.local_time)
      const localTime = new Date()
      const offset = gatewayTime.getTime() - localTime.getTime()
      
      setGatewayTimeOffset(offset)
      setGatewayTimezone(timeData.data.time_info.timezone_offset || 'UTC+0')
      setGatewayTimezoneName(timeData.data.time_info.timezone || '')
    }
  }, [timeData])
  
  // 本地计时器（每秒更新）
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  // 格式化时间显示（通用函数）
  const formatTime = (time: Date, timezone?: string) => {
    const isZh = i18n.language === 'zh-CN'
    
    // 获取时区偏移（小时）
    const timezoneOffset = timezone ? timezone : `UTC${-time.getTimezoneOffset() / 60 >= 0 ? '+' : ''}${-time.getTimezoneOffset() / 60}`
    
    // 格式化时间
    const hours = time.getHours().toString().padStart(2, '0')
    const minutes = time.getMinutes().toString().padStart(2, '0')
    const seconds = time.getSeconds().toString().padStart(2, '0')
    
    // 格式化日期
    const year = time.getFullYear()
    const month = (time.getMonth() + 1).toString().padStart(2, '0')
    const day = time.getDate().toString().padStart(2, '0')
    
    // 星期
    const weekdays = isZh 
      ? ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weekday = weekdays[time.getDay()]
    
    if (isZh) {
      return {
        date: `${year}年${month}月${day}日 ${weekday}`,
        time: `${hours}:${minutes}:${seconds}`,
        timezone: timezoneOffset
      }
    } else {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return {
        date: `${monthNames[time.getMonth()]} ${day}, ${year} ${weekday}`,
        time: `${hours}:${minutes}:${seconds}`,
        timezone: timezoneOffset
      }
    }
  }
  
  // 本地时间
  const localTimeInfo = formatTime(currentTime)
  
  // 网关时间（本地计时器 + 偏移量）
  const getGatewayTimeInfo = () => {
    // 网关时间 = 当前本地时间 + 偏移量
    const gatewayTime = new Date(currentTime.getTime() + gatewayTimeOffset)
    return formatTime(gatewayTime, gatewayTimezone)
  }
  
  const gatewayTimeInfo = getGatewayTimeInfo()
  
  const changeLanguage = (locale: LocaleKey) => {
    i18n.changeLanguage(locale)
  }
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  return (
    <div className="flex flex-1 items-center justify-end gap-2">
      <TooltipProvider>
        {/* 网关时间 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted/70 transition-colors cursor-help">
              <div className="flex items-center gap-1">
                <Server className="size-3.5 text-muted-foreground shrink-0" />
                <Clock className="size-3.5 text-muted-foreground shrink-0" />
              </div>
              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium tabular-nums">{gatewayTimeInfo.time}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-accent/20 text-accent-foreground border border-accent/30 whitespace-nowrap">
                    {t('common:time.gatewayShort')}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">{gatewayTimeInfo.date}</span>
              </div>
              <div className="ml-1 px-2 py-0.5 rounded-md bg-accent/20 text-[10px] font-mono text-accent-foreground">
                {gatewayTimeInfo.timezone}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="max-w-xs rounded-xl border border-border/70 bg-background/95 text-foreground shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/85"
          >
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-sm">{t('common:time.gateway')}</p>
              <p className="text-xs text-muted-foreground">
                {gatewayTimezoneName || t('common:time.gatewayTimezone')}
              </p>
              <p className="text-xs text-muted-foreground opacity-70">
                {t('common:time.gatewayHint')}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
        
        {/* 本地时间 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted/70 transition-colors cursor-help">
              <div className="flex items-center gap-1">
                <MonitorSmartphone className="size-3.5 text-primary shrink-0" />
                <Clock className="size-3.5 text-primary shrink-0" />
              </div>
        <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium tabular-nums">{localTimeInfo.time}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                    {t('common:time.localShort')}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">{localTimeInfo.date}</span>
        </div>
        <div className="ml-1 px-2 py-0.5 rounded-md bg-primary/10 text-[10px] font-mono text-primary">
                {localTimeInfo.timezone}
        </div>
      </div>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="max-w-xs rounded-xl border border-border/70 bg-background/95 text-foreground shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/85"
          >
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-sm">{t('common:time.local')}</p>
              <p className="text-xs text-muted-foreground">
                当前浏览器/电脑的本地时间
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {/* 主题配色切换 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Palette className="size-4" />
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
      <Button variant="ghost" size="icon" onClick={toggleMode}>
        {mode === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
      
      {/* 语言切换 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Globe className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>选择语言</DropdownMenuLabel>
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
      
      {/* 用户菜单 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Avatar className="size-7">
              <AvatarFallback className="text-xs">
                {user?.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="hidden lg:inline-block text-sm">
              {user?.username}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground">
                {t(`auth:role.${user?.role}`)}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <UserIcon className="mr-2 size-4" />
            {t('menu:profile')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 size-4" />
            {t('auth:auth.logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}


