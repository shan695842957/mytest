/**
 * 登录页面 - 科技梦幻风格
 * 玻璃态 + 动态粒子 + 流动渐变
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Moon, Sun, Globe, Lock, User, ArrowRight, Sparkles, Shield, Zap, Check } from 'lucide-react'
import CN from 'country-flag-icons/react/3x2/CN'
import US from 'country-flag-icons/react/3x2/US'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { toast } from 'sonner'
import { SUPPORTED_LOCALES, type LocaleKey } from '@/config/i18n'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

// 粒子配置
interface Particle {
  id: number
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
}

export default function LoginPage() {
  const { t, i18n } = useTranslation('auth')
  const navigate = useNavigate()
  const { login } = useAuth()
  const { mode, toggleMode } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })
  
  // 生成粒子
  useEffect(() => {
    const particleCount = 30
    const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.3,
    }))
    setParticles(newParticles)
    
    // 粒子动画
    const interval = setInterval(() => {
      setParticles(prev =>
        prev.map(p => ({
          ...p,
          x: (p.x + p.speedX + 100) % 100,
          y: (p.y + p.speedY + 100) % 100,
        }))
      )
    }, 50)
    
    return () => clearInterval(interval)
  }, [])
  
  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      await login(data.username, data.password)
      toast.success(t('auth.login_success'))
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.message || t('auth.error.invalid_credentials'))
    } finally {
      setIsLoading(false)
    }
  }
  
  const changeLanguage = (locale: LocaleKey) => {
    i18n.changeLanguage(locale)
  }
  
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 动态渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 dark:from-primary/10 dark:via-background dark:to-primary/20" />
      
      {/* 动画圆圈装饰 */}
      <div className="absolute top-0 -right-40 w-80 h-80 bg-primary/20 dark:bg-primary/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 -left-40 w-96 h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* 动态粒子 */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-primary/30 dark:bg-primary/50 animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.opacity,
            transition: 'all 0.5s linear',
          }}
        />
      ))}
      
      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {t('common:app.name')}
          </span>
        </div>
        
        {/* 工具按钮 */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMode}
            className="rounded-full backdrop-blur-sm bg-background/50 hover:bg-background/80 border border-border/50"
          >
            {mode === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full backdrop-blur-sm bg-background/50 hover:bg-background/80 border border-border/50"
              >
                <Globe className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="backdrop-blur-xl bg-background/95 w-48">
              {Object.entries(SUPPORTED_LOCALES).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => changeLanguage(key as LocaleKey)}
                  className={`flex items-center justify-between ${i18n.language === key ? 'bg-primary/10' : ''}`}
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
        </div>
      </div>
      
      {/* 主内容区 */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-7xl grid lg:grid-cols-[1fr_auto] gap-32 items-center">
          {/* 左侧 - 品牌展示 */}
          <div className="hidden lg:block space-y-8 pr-16">
            {/* 主标题 */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">企业级统一认证平台</span>
              </div>
              <h1 className="text-5xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                  欢迎使用
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent">
                  {t('common:app.title')}
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                安全可靠的身份认证与权限管理系统，为您的业务保驾护航
              </p>
            </div>
            
            {/* 特性卡片 */}
            <div className="space-y-4">
              <div className="group p-4 rounded-2xl bg-background/40 dark:bg-background/20 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                    <Shield className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">企业级安全</h3>
                    <p className="text-sm text-muted-foreground">JWT 认证 + RBAC 权限控制，保障数据安全</p>
                  </div>
                </div>
              </div>
              
              <div className="group p-4 rounded-2xl bg-background/40 dark:bg-background/20 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                    <Zap className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">高效便捷</h3>
                    <p className="text-sm text-muted-foreground">简洁直观的操作界面，快速上手</p>
                  </div>
                </div>
              </div>
              
              <div className="group p-4 rounded-2xl bg-background/40 dark:bg-background/20 backdrop-blur-sm border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                    <Globe className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">国际化支持</h3>
                    <p className="text-sm text-muted-foreground">多语言界面，服务全球用户</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 右侧 - 登录表单（玻璃态卡片）*/}
          <div className="w-full max-w-md lg:w-[480px] mx-auto lg:mx-0 lg:pl-16">
            <div className="relative">
              {/* 玻璃态卡片 */}
              <div className="relative p-8 md:p-10 rounded-3xl bg-background/60 dark:bg-background/40 backdrop-blur-xl border border-border/50 shadow-2xl shadow-black/5 dark:shadow-black/20">
                {/* 顶部光晕 */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 dark:bg-primary/30 rounded-full blur-3xl" />
                
                {/* 移动端 Logo */}
                <div className="lg:hidden text-center mb-8">
                  <div className="inline-flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                      <Sparkles className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                      {t('common:app.name')}
                    </h1>
                  </div>
                </div>
                
                {/* 标题 */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {t('auth.login')}
                  </h2>
                  <p className="text-muted-foreground">
                    {t('auth.please_login')}
                  </p>
                </div>
                
                {/* 表单 */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">{t('auth.username')}</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              <Input
                                {...field}
                                className="pl-10 h-12 bg-background/50 dark:bg-background/30 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                placeholder="admin_developer"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">{t('auth.password')}</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              <Input
                                {...field}
                                type="password"
                                className="pl-10 h-12 bg-background/50 dark:bg-background/30 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                                placeholder="••••••••"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/30 group relative overflow-hidden"
                      disabled={isLoading}
                    >
                      {/* 扫光效果 */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          {t('common:common.loading')}
                        </span>
                      ) : (
                        <>
                          {t('auth.login')}
                          <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
                
                {/* 提示信息 */}
                <div className="mt-8 pt-6 border-t border-border/50">
                  <div className="text-center text-sm text-muted-foreground space-y-2">
                    <p className="font-medium text-foreground/80">测试账号</p>
                    <div className="space-y-1">
                      <p className="font-mono text-xs">开发者: admin_developer / Admin@123</p>
                      <p className="font-mono text-xs">运维者: admin_operator / Admin@123</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 底部装饰光晕 */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-40 h-40 bg-primary/10 dark:bg-primary/20 rounded-full blur-3xl -z-10" />
            </div>
          </div>
        </div>
      </div>
      
      {/* 底部版权 */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          © 2025 LCCU-V. All rights reserved.
        </p>
      </div>
    </div>
  )
}

