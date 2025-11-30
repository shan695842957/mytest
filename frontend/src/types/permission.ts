/**
 * 权限相关类型定义
 */

import { UserRole } from './user'

// 重新导出 UserRole 以便其他模块使用
export { UserRole } from './user'

/**
 * 权限操作类型
 */
export enum PermissionAction {
  // 用户管理
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_CHANGE_PASSWORD = 'user:change_password',
  
  // 审计日志
  AUDIT_VIEW = 'audit:view',
  AUDIT_EXPORT = 'audit:export',
  
  // 系统设置
  SYSTEM_SETTINGS = 'system:settings',
}

/**
 * 角色权限映射（基于后端业务规则）
 */
export const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  // Developer：所有权限
  [UserRole.DEVELOPER]: [
    PermissionAction.USER_VIEW,
    PermissionAction.USER_CREATE,
    PermissionAction.USER_UPDATE,
    PermissionAction.USER_DELETE,
    PermissionAction.USER_CHANGE_PASSWORD,
    PermissionAction.AUDIT_VIEW,
    PermissionAction.AUDIT_EXPORT,
    PermissionAction.SYSTEM_SETTINGS,
  ],
  
  // Operator：用户管理 + 审计查看
  [UserRole.OPERATOR]: [
    PermissionAction.USER_VIEW,
    PermissionAction.USER_CREATE,
    PermissionAction.USER_UPDATE,
    PermissionAction.USER_DELETE,
    PermissionAction.AUDIT_VIEW,
  ],
  
  // User：只能查看自己
  [UserRole.USER]: [
    PermissionAction.USER_VIEW, // 只能查看自己的信息
  ],
}

/**
 * 权限配置
 */
export interface PermissionConfig {
  roles?: UserRole[]           // 允许的角色
  permissions?: PermissionAction[] // 需要的权限
  requireAll?: boolean         // 是否需要所有权限（AND逻辑）
}

/**
 * 菜单项权限配置
 */
export interface MenuPermission extends PermissionConfig {
  hideWhenNoPermission?: boolean // 无权限时是否隐藏
}

