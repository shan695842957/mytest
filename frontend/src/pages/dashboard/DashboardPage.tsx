/**
 * 仪表盘页面
 */

import { useTranslation } from 'react-i18next'
import { Users, Shield, Activity, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  
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
      value: user?.is_active ? '正常' : '已禁用',
      description: user?.is_builtin ? '内置账号' : '普通账号',
      icon: Activity,
    },
    {
      title: '注册时间',
      value: user ? new Date(user.created_at).toLocaleDateString() : '',
      description: '账号创建日期',
      icon: Clock,
    },
  ]
  
  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* 功能区域 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>快速访问</CardTitle>
            <CardDescription>常用功能入口</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="rounded-lg border p-3 hover:bg-accent transition-colors cursor-pointer">
              <h4 className="font-medium">用户管理</h4>
              <p className="text-sm text-muted-foreground mt-1">
                管理系统用户和权限
              </p>
            </div>
            <div className="rounded-lg border p-3 hover:bg-accent transition-colors cursor-pointer">
              <h4 className="font-medium">个人中心</h4>
              <p className="text-sm text-muted-foreground mt-1">
                查看和编辑个人信息
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>系统信息</CardTitle>
            <CardDescription>当前系统状态</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">前端版本</span>
              <span className="font-mono text-sm">v0.2.0</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">主题</span>
              <span className="font-mono text-sm">科技蓝</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">语言</span>
              <span className="font-mono text-sm">简体中文</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
