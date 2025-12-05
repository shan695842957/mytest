/**
 * 权限守卫组件
 * 用于控制组件级别的权限
 */

import type { ReactNode } from 'react'
import type { UserRole, PermissionAction } from '@/types'
import { useAuth } from '@/hooks/useAuth'

interface AuthGuardProps {
  children: ReactNode
  roles?: UserRole[]
  permissions?: PermissionAction[]
  requireAll?: boolean
  fallback?: ReactNode
  fallbackMessage?: string
}

/**
 * 权限守卫组件
 * 根据角色或权限控制子组件的显示
 */
export function AuthGuard({
  children,
  roles,
  permissions,
  requireAll = false,
  fallback = null,
  fallbackMessage,
}: AuthGuardProps) {
  const { hasAnyRole, hasAllRoles, hasPermission, hasAnyPermission } = useAuth()
  
  // 检查角色权限
  let hasRolePermission = true
  if (roles && roles.length > 0) {
    hasRolePermission = requireAll
      ? hasAllRoles(roles)
      : hasAnyRole(roles)
  }
  
  // 检查操作权限
  let hasActionPermission = true
  if (permissions && permissions.length > 0) {
    hasActionPermission = requireAll
      ? permissions.every(p => hasPermission(p))
      : hasAnyPermission(permissions)
  }
  
  // 综合判断
  const hasAccess = hasRolePermission && hasActionPermission
  
  if (!hasAccess) {
    if (fallbackMessage) {
      return <div className="text-sm text-muted-foreground">{fallbackMessage}</div>
    }
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

