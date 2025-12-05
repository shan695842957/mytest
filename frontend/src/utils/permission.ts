/**
 * 权限工具函数
 */

import type { User, UserRole } from '@/types'
import { ROLE_LEVELS } from '@/types'

/**
 * 权限检查器（后端业务规则的前端实现）
 */
export class PermissionChecker {
  /**
   * 检查操作者是否可以创建指定角色的用户
   * 规则：
   * 1. 高角色可以创建低角色账号
   * 2. 内置账号可以创建同级别账号
   */
  static canCreateUser(operator: User, targetRole: UserRole): boolean {
    // 规则1: 高角色可以创建低角色
    if (ROLE_LEVELS[operator.role] > ROLE_LEVELS[targetRole]) {
      return true
    }
    
    // 规则2: 内置账号可以创建同级别账号
    if (operator.is_builtin && operator.role === targetRole) {
      return true
    }
    
    return false
  }
  
  /**
   * 检查操作者是否可以查看目标用户
   * 规则：
   * 1. 可以查看自己
   * 2. 高角色可以查看低角色
   * 3. 内置账号可以查看同级别账号
   * 4. 创建者可以查看自己创建的账号
   */
  static canViewUser(operator: User, target: User): boolean {
    // 规则1: 可以查看自己
    if (operator.id === target.id) {
      return true
    }
    
    // 规则2: 高角色可以查看低角色
    if (ROLE_LEVELS[operator.role] > ROLE_LEVELS[target.role]) {
      return true
    }
    
    // 规则3: 内置账号可以查看同级别账号
    if (operator.is_builtin && operator.role === target.role) {
      return true
    }
    
    // 规则4: 创建者可以查看自己创建的账号
    if (target.created_by === operator.id) {
      return true
    }
    
    return false
  }
  
  /**
   * 检查操作者是否可以更新目标用户
   * 规则：
   * 1. 高角色可以更新低角色
   * 2. 内置账号可以更新同级别账号（除了自己）
   */
  static canUpdateUser(operator: User, target: User): boolean {
    // 不能更新自己（修改密码除外）
    if (operator.id === target.id) {
      return false
    }
    
    // 规则1: 高角色可以更新低角色
    if (ROLE_LEVELS[operator.role] > ROLE_LEVELS[target.role]) {
      return true
    }
    
    // 规则2: 内置账号可以更新同级别账号
    if (operator.is_builtin && operator.role === target.role) {
      return true
    }
    
    return false
  }
  
  /**
   * 检查操作者是否可以删除目标用户
   * 规则：
   * 1. 内置账号不可删除
   * 2. 高角色可以删除低角色
   * 3. 内置账号可以删除同级别的非内置账号
   */
  static canDeleteUser(operator: User, target: User): boolean {
    // 规则1: 内置账号不可删除
    if (target.is_builtin) {
      return false
    }
    
    // 不能删除自己
    if (operator.id === target.id) {
      return false
    }
    
    // 规则2: 高角色可以删除低角色
    if (ROLE_LEVELS[operator.role] > ROLE_LEVELS[target.role]) {
      return true
    }
    
    // 规则3: 内置账号可以删除同级别的非内置账号
    if (operator.is_builtin && operator.role === target.role) {
      return true
    }
    
    return false
  }
  
  /**
   * 检查操作者是否可以修改目标用户的密码
   * 规则：
   * 1. 可以修改自己的密码
   * 2. 高角色可以修改低角色的密码
   */
  static canChangePassword(operator: User, target: User): boolean {
    // 规则1: 可以修改自己的密码
    if (operator.id === target.id) {
      return true
    }
    
    // 规则2: 高角色可以修改低角色的密码
    if (ROLE_LEVELS[operator.role] > ROLE_LEVELS[target.role]) {
      return true
    }
    
    return false
  }
}

