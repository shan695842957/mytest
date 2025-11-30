/**
 * 菜单相关类型定义
 */

import type { ReactNode } from 'react'
import type { UserRole } from './user'

/**
 * 菜单项配置
 */
export interface MenuItem {
  key: string
  label: string
  icon?: ReactNode
  path?: string
  roles?: UserRole[]        // 允许访问的角色
  children?: MenuItem[]
  hideInMenu?: boolean      // 是否在菜单中隐藏
}

/**
 * 面包屑项
 */
export interface BreadcrumbItem {
  label: string
  path?: string
}

