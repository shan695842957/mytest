/**
 * 主布局组件 - 移动端优先设计
 * 
 * 桌面端（md+）：侧边栏 + 顶部栏 + 主内容区
 * 移动端（<md）：Top App Bar + 主内容区 + Bottom Navigation
 * 
 * 参考 Android Material Design 规范：
 * - https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-basics
 * - https://developer.android.com/design/ui/mobile/guides/layout-and-content/layout-and-nav-patterns
 */

import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { Header } from './Header'
import { Breadcrumb } from './Breadcrumb'
import { MobileTopBar } from './MobileTopBar'
import { MobileBottomNav } from './MobileBottomNav'
import { cn } from '@/lib/utils'

export default function MainLayout() {
  return (
    <>
      {/* 移动端顶部应用栏 */}
      <MobileTopBar />
      
      {/* 桌面端布局 */}
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* 桌面端顶部工具栏 */}
          <header className="sticky top-0 z-30 hidden md:flex h-14 shrink-0 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            {/* 面包屑导航 */}
            <Breadcrumb />
            
            {/* 弹性间距 */}
            <div className="flex-1" />
            
            {/* 右侧工具栏 */}
            <Header />
          </header>
          
          {/* 主内容区 */}
          <main className={cn(
            "flex-1",
            // 移动端：适配顶部和底部导航栏
            "mobile-main-content md:mobile-content-area",
            // 桌面端：常规内边距
            "p-4"
          )}>
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">加载中...</div>
              </div>
            }>
              <Outlet />
            </Suspense>
          </main>
        </SidebarInset>
      </SidebarProvider>
      
      {/* 移动端底部导航栏 */}
      <MobileBottomNav />
    </>
  )
}
