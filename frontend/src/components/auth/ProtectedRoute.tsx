/**
 * 路由守卫组件
 * 用于保护需要认证的路由
 */

import { Navigate, Outlet } from 'react-router-dom'
import { UserRole } from '@/types'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  roles?: UserRole[]
  redirectTo?: string
}

/**
 * 路由守卫
 * 未登录跳转到登录页，无权限跳转到403页面
 */
export function ProtectedRoute({ roles, redirectTo = '/login' }: ProtectedRouteProps) {
  const { isAuthenticated, hasAnyRole } = useAuth()
  
  // 未登录，跳转到登录页
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }
  
  // 需要特定角色，但用户没有权限
  if (roles && roles.length > 0 && !hasAnyRole(roles)) {
    return <Navigate to="/403" replace />
  }
  
  // 通过验证，渲染子路由
  return <Outlet />
}

