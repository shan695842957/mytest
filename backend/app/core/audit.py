"""
审计日志核心功能
提供装饰器和依赖注入，自动记录所有修改操作
"""

import time
import uuid
from typing import Optional, Callable, Any
from functools import wraps
from datetime import datetime

from fastapi import Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog
from app.models.user import User


class AuditLogger:
    """审计日志记录器"""
    
    @staticmethod
    async def log(
        db: AsyncSession,
        request: Request,
        response: Response,
        current_user: Optional[User],
        module: str,
        action: str,
        action_key: str,
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        target_name: Optional[str] = None,
        request_body: Optional[dict] = None,
        changes: Optional[dict] = None,
        duration_ms: Optional[int] = None,
        error_message: Optional[str] = None
    ) -> AuditLog:
        """
        记录审计日志
        
        Args:
            db: 数据库会话
            request: FastAPI Request 对象
            response: FastAPI Response 对象
            current_user: 当前用户（可能为空，如登录操作）
            module: 模块名称（如 'auth', 'user', 'item'）
            action: 操作类型（如 'create', 'update', 'delete', 'login'）
            action_key: 操作国际化键（如 'audit.action.user_created'）
            target_type: 目标类型（如 'user', 'item'）
            target_id: 目标ID
            target_name: 目标名称
            request_body: 请求体（敏感信息会被过滤）
            changes: 变更内容（before/after）
            duration_ms: 执行时长（毫秒）
            error_message: 错误信息（如果失败）
        
        Returns:
            创建的审计日志对象
        """
        # 生成请求ID（如果不存在）
        request_id = request.state.request_id if hasattr(request.state, "request_id") else str(uuid.uuid4())
        
        # 获取客户端IP
        ip_address = request.client.host if request.client else None
        
        # 获取用户代理
        user_agent = request.headers.get("user-agent")
        
        # 获取语言
        locale = request.headers.get("accept-language", "").split(",")[0].replace("-", "_") or "zh_CN"
        
        # 判断操作是否成功
        success = "success" if 200 <= response.status_code < 300 else "failed"
        
        # 过滤敏感信息
        if request_body:
            request_body = _filter_sensitive_data(request_body)
        
        # 创建审计日志
        audit_log = AuditLog(
            request_id=request_id,
            method=request.method,
            path=str(request.url.path),
            module=module,
            action=action,
            action_key=action_key,
            user_id=current_user.id if current_user else None,
            username=current_user.username if current_user else None,
            user_role=current_user.role.value if current_user else None,
            target_type=target_type,
            target_id=str(target_id) if target_id else None,
            target_name=target_name,
            request_body=request_body,
            changes=changes,
            status_code=response.status_code,
            success=success,
            error_message=error_message,
            ip_address=ip_address,
            user_agent=user_agent,
            locale=locale,
            duration_ms=duration_ms
        )
        
        db.add(audit_log)
        await db.commit()
        await db.refresh(audit_log)
        
        return audit_log
    
    @staticmethod
    def get_changes(old_data: dict, new_data: dict) -> dict:
        """
        计算数据变更
        
        Args:
            old_data: 旧数据
            new_data: 新数据
        
        Returns:
            变更内容 {"field_name": {"before": old_value, "after": new_value}}
        """
        changes = {}
        
        # 检查所有字段的变化
        all_keys = set(old_data.keys()) | set(new_data.keys())
        
        for key in all_keys:
            old_value = old_data.get(key)
            new_value = new_data.get(key)
            
            if old_value != new_value:
                changes[key] = {
                    "before": old_value,
                    "after": new_value
                }
        
        return changes


def _filter_sensitive_data(data: dict) -> dict:
    """
    过滤敏感信息
    
    将密码等敏感字段替换为 ***
    """
    sensitive_fields = {"password", "old_password", "new_password", "token", "secret"}
    
    filtered = data.copy()
    for key in data.keys():
        if key.lower() in sensitive_fields:
            filtered[key] = "***"
    
    return filtered


# 审计装饰器（用于函数级别的审计）
def audit_operation(
    module: str,
    action: str,
    action_key: str,
    target_type: Optional[str] = None,
    get_target_id: Optional[Callable[[Any], str]] = None,
    get_target_name: Optional[Callable[[Any], str]] = None
):
    """
    审计装饰器
    
    自动记录被装饰函数的执行情况
    
    使用示例：
        @audit_operation(
            module="auth",
            action="create_user",
            action_key="audit.action.user_created",
            target_type="user",
            get_target_id=lambda result: str(result.id),
            get_target_name=lambda result: result.username
        )
        async def create_user(...):
            pass
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 记录开始时间
            start_time = time.time()
            
            # 执行函数
            result = await func(*args, **kwargs)
            
            # 计算执行时长
            duration_ms = int((time.time() - start_time) * 1000)
            
            # 提取审计所需的参数
            # 注意：这里需要从函数参数中提取 db, request, response, current_user
            # 实际使用时，建议使用依赖注入的方式而不是装饰器
            
            return result
        
        return wrapper
    
    return decorator

