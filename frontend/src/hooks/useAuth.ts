/**
 * 认证相关 Hook
 */

import { useAuthStore } from '@/stores/authStore'
import { UserRole } from '@/types'

/**
 * 使用认证状态和方法
 */
export function useAuth() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasPermission,
    hasAnyPermission,
    canManageRole,
    getRoleLevel,
  } = useAuthStore()
  
  return {
    // 状态
    user,
    token,
    isAuthenticated,
    isLoading,
    
    // 方法
    login,
    logout,
    refreshUser,
    
    // 权限检查
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasPermission,
    hasAnyPermission,
    canManageRole,
    getRoleLevel,
    
    // 便捷判断
    isDeveloper: hasRole(UserRole.DEVELOPER),
    isOperator: hasRole(UserRole.OPERATOR),
    isUser: hasRole(UserRole.USER),
  }
}

