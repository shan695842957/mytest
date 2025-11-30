"""
API 依赖项
用于路由中的依赖注入
"""

import uuid
from typing import Optional
from fastapi import Header, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.i18n import get_i18n, I18n
from app.database import get_db
from app.core.security import decode_access_token
from app.crud.user import user_crud
from app.models.user import User


# HTTP Bearer Token 安全方案
security = HTTPBearer()


async def get_request_id(request: Request) -> str:
    """
    获取或生成请求ID
    用于追踪请求链路
    """
    if not hasattr(request.state, "request_id"):
        request.state.request_id = str(uuid.uuid4())
    return request.state.request_id


def get_locale_from_header(accept_language: Optional[str]) -> str:
    """
    从请求头字符串获取语言偏好（用于异常处理器）
    
    支持标准的 Accept-Language 头，例如：
    - zh-CN,zh;q=0.9,en;q=0.8
    - en-US
    """
    if not accept_language:
        return "zh_CN"
    
    # 简单解析 Accept-Language（生产环境可使用 babel.negotiate_locale）
    locale = accept_language.split(",")[0].strip()
    locale = locale.replace("-", "_")  # zh-CN -> zh_CN
    
    # 验证是否支持该语言
    from app.config import settings
    if locale not in settings.supported_locales:
        return settings.default_locale
    
    return locale


async def get_locale(accept_language: Optional[str] = Header(None)) -> str:
    """
    从请求头获取语言偏好（依赖注入）
    
    支持标准的 Accept-Language 头，例如：
    - zh-CN,zh;q=0.9,en;q=0.8
    - en-US
    """
    return get_locale_from_header(accept_language)


def get_translator(locale: str = Depends(get_locale)) -> I18n:
    """获取翻译器实例"""
    return get_i18n()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    获取当前登录用户（依赖注入）
    
    从 Authorization 头中解析 JWT Token，验证并返回用户对象
    
    Raises:
        HTTPException: 如果 Token 无效或用户不存在
    """
    token = credentials.credentials
    
    # 解码 Token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="auth.error.invalid_token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # 获取用户 ID
    user_id: int = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="auth.error.invalid_token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # 从数据库获取用户
    user = await user_crud.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="auth.error.user_not_found",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # 检查用户是否激活
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="auth.error.user_inactive"
        )
    
    return user


async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    获取当前用户（可选）
    
    用于不需要强制登录的接口，但需要记录操作者的场景
    如果没有 Token 或 Token 无效，返回 None
    """
    # 尝试从 Authorization 头获取 Token
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.replace("Bearer ", "")
    
    # 解码 Token
    payload = decode_access_token(token)
    if not payload:
        return None
    
    # 获取用户 ID
    user_id: int = payload.get("user_id")
    if not user_id:
        return None
    
    # 从数据库获取用户
    user = await user_crud.get_by_id(db, user_id)
    if not user or not user.is_active:
        return None
    
    return user


# 审计上下文（用于收集审计信息）
class AuditContext:
    """
    审计上下文
    用于在请求处理过程中收集审计信息
    """
    def __init__(self):
        self.module: Optional[str] = None
        self.action: Optional[str] = None
        self.action_key: Optional[str] = None
        self.target_type: Optional[str] = None
        self.target_id: Optional[str] = None
        self.target_name: Optional[str] = None
        self.request_body: Optional[dict] = None
        self.changes: Optional[dict] = None


def get_audit_context(request: Request) -> AuditContext:
    """
    获取审计上下文
    
    从请求状态中获取或创建审计上下文
    """
    if not hasattr(request.state, "audit_context"):
        request.state.audit_context = AuditContext()
    return request.state.audit_context
