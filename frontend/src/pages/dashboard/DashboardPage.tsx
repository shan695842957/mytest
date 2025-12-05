/**
 * 仪表盘页面
 * 移动端优化：卡片式单列布局，大按钮易于点击
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Users, Shield, Activity, Clock, UserCog, Settings, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { t } = useTranslation(['common', 'auth', 'menu', 'dashboard'])
  const { user, hasAnyRole } = useAuth()
  
  const stats = [
    {
      title: '欢迎回来',
      value: user?.username || '',
      description: t(`auth:role.${user?.role}`),
      icon: Users,
    },
    {
      title: '权限级别',
      value: t(`auth:role.${user?.role}`),
      description: t(`auth:role.description.${user?.role}`),
      icon: Shield,
    },
    {
      title: '账号状态',
      value: user?.is_active ? t('common:common.enabled') : t('common:common.disabled'),
      description: user?.is_builtin ? t('auth:user.is_builtin') : t('auth:user.status'),
      icon: Activity,
    },
    {
      title: '注册时间',
      value: user ? new Date(user.created_at).toLocaleDateString() : '',
      description: '账号创建日期',
      icon: Clock,
    },
  ]
  
  // 快速访问链接（根据权限过滤）
  const quickLinks = [
    {
      title: t('menu:users'),
      description: t('dashboard:quickAccess.users'),
      path: '/users',
      icon: UserCog,
      roles: [UserRole.DEVELOPER, UserRole.OPERATOR],
    },
    {
      title: t('menu:profile'),
      description: t('dashboard:quickAccess.profile'),
      path: '/profile',
      icon: Users,
      roles: [] as UserRole[], // 所有角色
    },
    {
      title: t('menu:settings'),
      description: t('dashboard:quickAccess.settings'),
      path: '/settings/frontend',
      icon: Settings,
      roles: [] as UserRole[], // 所有角色
    },
  ].filter(link => link.roles.length === 0 || hasAnyRole(link.roles))
  
  return (
    <div className="space-y-4 md:space-y-6">
      {/* 统计卡片 - 移动端单列，桌面端多列 */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 md:pb-2">
                <CardTitle className="text-sm md:text-sm font-medium">
                  {stat.title}
                </CardTitle>
                {/* 移动端图标更大 */}
                <Icon className={cn(
                  "text-muted-foreground shrink-0",
                  "size-5 md:size-4" // 移动端 20px，桌面端 16px
                )} />
              </CardHeader>
              <CardContent>
                {/* 移动端文字更大 */}
                <div className="text-2xl md:text-2xl font-bold leading-tight">{stat.value}</div>
                <p className="text-xs md:text-xs text-muted-foreground mt-2 md:mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* 功能区域 - 移动端单列，桌面端双列 */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
        {/* 快速访问 - 移动端大按钮 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">{t('dashboard:quickAccess.title', { defaultValue: '快速访问' })}</CardTitle>
            <CardDescription className="text-sm">{t('dashboard:quickAccess.description', { defaultValue: '常用功能入口' })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 md:space-y-2">
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-4 md:p-3",
                    "hover:bg-accent active:bg-accent/80 transition-colors",
                    "min-h-[64px] md:min-h-[auto]", // 移动端最小 64px 高度
                    "touch-manipulation" // 优化触摸响应
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center rounded-lg bg-primary/10 p-2",
                    "size-11 md:size-10 shrink-0" // 移动端图标容器更大
                  )}>
                    <Icon className="size-5 md:size-4 text-primary" />
            </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-base md:text-sm leading-tight">{link.title}</h4>
                    <p className="text-sm md:text-sm text-muted-foreground mt-1 line-clamp-1">
                      {link.description}
              </p>
            </div>
                  <ChevronRight className="size-5 md:size-4 text-muted-foreground shrink-0" />
                </Link>
              )
            })}
          </CardContent>
        </Card>
        
        {/* 系统信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">{t('dashboard:systemInfo.title', { defaultValue: '系统信息' })}</CardTitle>
            <CardDescription className="text-sm">{t('dashboard:systemInfo.description', { defaultValue: '当前系统状态' })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-2">
            <div className="flex justify-between items-center py-2 md:py-2">
              <span className="text-sm md:text-sm text-muted-foreground">{t('dashboard:systemInfo.version', { defaultValue: '前端版本' })}</span>
              <span className="font-mono text-sm md:text-sm">v0.3.0</span>
            </div>
            <div className="flex justify-between items-center py-2 md:py-2">
              <span className="text-sm md:text-sm text-muted-foreground">{t('dashboard:systemInfo.theme', { defaultValue: '主题' })}</span>
              <span className="font-mono text-sm md:text-sm">中性经典</span>
            </div>
            <div className="flex justify-between items-center py-2 md:py-2">
              <span className="text-sm md:text-sm text-muted-foreground">{t('dashboard:systemInfo.language', { defaultValue: '语言' })}</span>
              <span className="font-mono text-sm md:text-sm">简体中文</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
