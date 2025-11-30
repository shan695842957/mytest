"""
审计依赖注入（方案2：可选）
通过 FastAPI 的依赖注入系统，自动记录审计日志
"""

from typing import Callable, Optional
from functools import wraps
from fastapi import Request, Response, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_current_user_optional, AuditContext


class AuditDependency:
    """
    审计依赖注入类
    
    使用示例：
        audit = AuditDependency(
            module="auth",
            action="create_user",
            action_key="audit.action.user_created"
        )
        
        @router.post("/users")
        async def create_user(
            ...,
            _audit=Depends(audit.inject)
        ):
            # 业务逻辑
            user = await user_crud.create(db, user_in)
            
            # 设置审计目标信息
            _audit.set_target("user", str(user.id), user.username)
            
            return user
    """
    
    def __init__(
        self,
        module: str,
        action: str,
        action_key: str
    ):
        self.module = module
        self.action = action
        self.action_key = action_key
    
    async def inject(self, request: Request) -> "AuditContext":
        """
        依赖注入函数
        
        返回 AuditContext，供业务代码设置目标信息
        """
        # 获取或创建审计上下文
        if not hasattr(request.state, "audit_context"):
            request.state.audit_context = AuditContext()
        
        audit_context = request.state.audit_context
        
        # 设置审计元数据
        audit_context.module = self.module
        audit_context.action = self.action
        audit_context.action_key = self.action_key
        
        return audit_context


# 便捷函数：设置审计目标
def set_audit_target(
    request: Request,
    target_type: str,
    target_id: str,
    target_name: Optional[str] = None
):
    """
    设置审计目标信息
    
    使用示例：
        @router.post("/users")
        async def create_user(request: Request, ...):
            user = await user_crud.create(db, user_in)
            
            # 设置审计目标
            set_audit_target(request, "user", str(user.id), user.username)
            
            return user
    """
    if not hasattr(request.state, "audit_context"):
        request.state.audit_context = AuditContext()
    
    audit_context = request.state.audit_context
    audit_context.target_type = target_type
    audit_context.target_id = target_id
    audit_context.target_name = target_name


# 便捷函数：设置数据变更
def set_audit_changes(
    request: Request,
    old_data: dict,
    new_data: dict
):
    """
    设置审计数据变更
    
    使用示例：
        @router.patch("/users/{user_id}")
        async def update_user(request: Request, ...):
            old_data = {"is_active": user.is_active}
            user = await user_crud.update(db, user, user_update)
            new_data = {"is_active": user.is_active}
            
            # 设置变更
            set_audit_changes(request, old_data, new_data)
            
            return user
    """
    if not hasattr(request.state, "audit_context"):
        request.state.audit_context = AuditContext()
    
    from app.core.audit import AuditLogger
    audit_context = request.state.audit_context
    audit_context.changes = AuditLogger.get_changes(old_data, new_data)


def set_audit_user(request: Request, user_id: int, username: str, user_role: str):
    """
    设置审计日志的用户信息（用于登录等特殊场景）
    
    在登录成功后调用，设置正确的用户信息到审计日志
    
    Args:
        request: FastAPI Request 对象
        user_id: 用户 ID
        username: 用户名
        user_role: 用户角色
    
    Example:
        set_audit_user(request, user.id, user.username, user.role.value)
    """
    request.state.audit_user_id = user_id
    request.state.audit_username = username
    request.state.audit_user_role = user_role

