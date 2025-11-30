"""
权限检查模块
实现复杂的角色权限逻辑
"""

from typing import Optional
from fastapi import HTTPException, status

from app.models.user import User, UserRole


class PermissionChecker:
    """权限检查器"""
    
    @staticmethod
    def can_create_user(operator: User, target_role: UserRole) -> bool:
        """
        检查操作者是否可以创建指定角色的用户
        
        规则：
        1. 高角色可以创建低角色账号
        2. 内置账号可以创建同级别账号
        
        Args:
            operator: 操作者
            target_role: 目标角色
        
        Returns:
            True 如果允许创建
        """
        # 规则1: 高角色可以创建低角色
        if operator.role.level > target_role.level:
            return True
        
        # 规则2: 内置账号可以创建同级别账号
        if operator.is_builtin and operator.role == target_role:
            return True
        
        return False
    
    @staticmethod
    def can_view_user(operator: User, target: User) -> bool:
        """
        检查操作者是否可以查看目标用户
        
        规则：
        1. 可以查看自己
        2. 高角色可以查看低角色
        3. 内置账号可以查看同级别账号
        4. 创建者可以查看自己创建的账号
        
        Args:
            operator: 操作者
            target: 目标用户
        
        Returns:
            True 如果允许查看
        """
        # 规则1: 可以查看自己
        if operator.id == target.id:
            return True
        
        # 规则2: 高角色可以查看低角色
        if operator.role.level > target.role.level:
            return True
        
        # 规则3: 内置账号可以查看同级别账号
        if operator.is_builtin and operator.role == target.role:
            return True
        
        # 规则4: 创建者可以查看自己创建的账号
        if target.created_by == operator.id:
            return True
        
        return False
    
    @staticmethod
    def can_update_user(operator: User, target: User) -> bool:
        """
        检查操作者是否可以更新目标用户
        
        规则：
        1. 高角色可以更新低角色
        2. 内置账号可以更新同级别账号（除了自己）
        
        Args:
            operator: 操作者
            target: 目标用户
        
        Returns:
            True 如果允许更新
        """
        # 不能更新自己（修改密码除外）
        if operator.id == target.id:
            return False
        
        # 规则1: 高角色可以更新低角色
        if operator.role.level > target.role.level:
            return True
        
        # 规则2: 内置账号可以更新同级别账号
        if operator.is_builtin and operator.role == target.role:
            return True
        
        return False
    
    @staticmethod
    def can_delete_user(operator: User, target: User) -> bool:
        """
        检查操作者是否可以删除目标用户
        
        规则：
        1. 内置账号不可删除
        2. 高角色可以删除低角色
        3. 内置账号可以删除同级别的非内置账号
        
        Args:
            operator: 操作者
            target: 目标用户
        
        Returns:
            True 如果允许删除
        """
        # 规则1: 内置账号不可删除
        if target.is_builtin:
            return False
        
        # 不能删除自己
        if operator.id == target.id:
            return False
        
        # 规则2: 高角色可以删除低角色
        if operator.role.level > target.role.level:
            return True
        
        # 规则3: 内置账号可以删除同级别的非内置账号
        if operator.is_builtin and operator.role == target.role:
            return True
        
        return False
    
    @staticmethod
    def can_change_password(operator: User, target: User) -> bool:
        """
        检查操作者是否可以修改目标用户的密码
        
        规则：
        1. 可以修改自己的密码
        2. 高角色可以修改低角色的密码
        
        Args:
            operator: 操作者
            target: 目标用户
        
        Returns:
            True 如果允许修改密码
        """
        # 规则1: 可以修改自己的密码
        if operator.id == target.id:
            return True
        
        # 规则2: 高角色可以修改低角色的密码
        if operator.role.level > target.role.level:
            return True
        
        return False


def check_role_permission(
    current_user: User,
    required_role: UserRole,
    error_message: str = "没有权限执行此操作"
) -> None:
    """
    检查用户是否拥有指定角色或更高权限
    
    Args:
        current_user: 当前用户
        required_role: 所需的最低角色
        error_message: 错误消息
    
    Raises:
        HTTPException: 如果权限不足
    """
    if current_user.role.level < required_role.level:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=error_message
        )


def check_permission(
    operator: User,
    target: Optional[User],
    action: str,
    target_role: Optional[UserRole] = None
) -> None:
    """
    权限检查辅助函数（抛出 HTTPException）
    
    Args:
        operator: 操作者
        target: 目标用户（可选）
        action: 操作类型（create/view/update/delete/change_password）
        target_role: 目标角色（仅 create 操作需要）
    
    Raises:
        HTTPException: 如果权限不足
    """
    checker = PermissionChecker()
    
    if action == "create":
        if not target_role:
            raise ValueError("create action requires target_role")
        if not checker.can_create_user(operator, target_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="auth.error.no_permission_create"
            )
    
    elif action == "view":
        if not target:
            raise ValueError("view action requires target")
        if not checker.can_view_user(operator, target):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="auth.error.no_permission_view"
            )
    
    elif action == "update":
        if not target:
            raise ValueError("update action requires target")
        if not checker.can_update_user(operator, target):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="auth.error.no_permission_update"
            )
    
    elif action == "delete":
        if not target:
            raise ValueError("delete action requires target")
        if not checker.can_delete_user(operator, target):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="auth.error.no_permission_delete"
            )
    
    elif action == "change_password":
        if not target:
            raise ValueError("change_password action requires target")
        if not checker.can_change_password(operator, target):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="auth.error.no_permission_change_password"
            )
    
    else:
        raise ValueError(f"Unknown action: {action}")

