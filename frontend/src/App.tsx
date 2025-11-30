import { Suspense } from 'react'
import { BrowserRouter, useRoutes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/ThemeProvider'
import { queryClient } from '@/config/query'
import { routes } from '@/config/routes'
import { usePageTitle } from '@/hooks/usePageTitle'
import '@/config/i18n'

function AppRoutes() {
  return useRoutes(routes)
}

function AppContent() {
  // 动态更新页面标题
  usePageTitle()
  
  return (
    <>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <AppRoutes />
      </Suspense>
      <Toaster />
    </>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
