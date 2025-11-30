/**
 * 主布局组件 - 响应式设计
 * 桌面端：侧边栏 + 顶部栏
 * 移动端：抽屉式侧边栏
 */

import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { Header } from './Header'
import { MobileHeader } from './MobileHeader'
import { Breadcrumb } from './Breadcrumb'

export default function MainLayout() {
  return (
    <>
      {/* 移动端导航 */}
      <MobileHeader />
      
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
          <main className="flex-1 p-4 md:p-6">
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
    </>
  )
}


