/**
 * 认证状态管理
 * 使用 Zustand 管理用户登录状态和权限
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { User } from '@/types'
import { UserRole, PermissionAction, ROLE_LEVELS, ROLE_PERMISSIONS } from '@/types'
import { STORAGE_KEYS } from '@/config/constants'
import { login as loginApi, getCurrentUser } from '@/api/auth'

/**
 * 认证状态接口
 */
interface AuthState {
  // 状态
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // 操作方法
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  refreshUser: () => Promise<void>
  
  // 权限检查方法
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  hasAllRoles: (roles: UserRole[]) => boolean
  hasPermission: (permission: PermissionAction) => boolean
  hasAnyPermission: (permissions: PermissionAction[]) => boolean
  canManageRole: (targetRole: UserRole) => boolean
  getRoleLevel: () => number
}

/**
 * 创建认证 Store
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        
        /**
         * 登录
         */
        login: async (username: string, password: string) => {
          set({ isLoading: true })
          try {
            const response = await loginApi({ username, password })
            
            // 保存 Token 和用户信息
            const { access_token, user } = response.data!
            localStorage.setItem(STORAGE_KEYS.TOKEN, access_token)
            
            set({
              token: access_token,
              user,
              isAuthenticated: true,
              isLoading: false,
            })
          } catch (error) {
            set({ isLoading: false })
            throw error
          }
        },
        
        /**
         * 退出登录
         */
        logout: () => {
          localStorage.removeItem(STORAGE_KEYS.TOKEN)
          localStorage.removeItem(STORAGE_KEYS.USER)
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          })
        },
        
        /**
         * 设置用户信息
         */
        setUser: (user: User) => {
          set({ user, isAuthenticated: true })
        },
        
        /**
         * 刷新用户信息
         */
        refreshUser: async () => {
          try {
            const response = await getCurrentUser()
            set({ user: response.data! })
          } catch (error) {
            // 刷新失败则退出登录
            get().logout()
            throw error
          }
        },
        
        /**
         * 检查是否拥有指定角色
         */
        hasRole: (role: UserRole) => {
          const { user } = get()
          return user?.role === role
        },
        
        /**
         * 检查是否拥有任一角色
         */
        hasAnyRole: (roles: UserRole[]) => {
          const { user } = get()
          return user ? roles.includes(user.role) : false
        },
        
        /**
         * 检查是否拥有所有角色
         */
        hasAllRoles: (roles: UserRole[]) => {
          const { user } = get()
          if (!user) return false
          return roles.every(role => user.role === role)
        },
        
        /**
         * 检查是否拥有指定权限
         */
        hasPermission: (permission: PermissionAction) => {
          const { user } = get()
          if (!user) return false
          
          const rolePermissions = ROLE_PERMISSIONS[user.role]
          return rolePermissions.includes(permission)
        },
        
        /**
         * 检查是否拥有任一权限
         */
        hasAnyPermission: (permissions: PermissionAction[]) => {
          return permissions.some(permission => get().hasPermission(permission))
        },
        
        /**
         * 检查是否可以管理目标角色
         * 规则：权限级别高的可以管理权限级别低的
         */
        canManageRole: (targetRole: UserRole) => {
          const { user } = get()
          if (!user) return false
          
          const userLevel = ROLE_LEVELS[user.role]
          const targetLevel = ROLE_LEVELS[targetRole]
          return userLevel > targetLevel
        },
        
        /**
         * 获取当前用户角色级别
         */
        getRoleLevel: () => {
          const { user } = get()
          return user ? ROLE_LEVELS[user.role] : 0
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
)

