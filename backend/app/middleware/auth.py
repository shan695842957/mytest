"""
认证中间件
自动从 Token 中提取用户信息，注入到 request.state.user
"""

from typing import Optional, Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.security import decode_access_token
from app.crud.user import user_crud
from app.database import AsyncSessionLocal


class AuthMiddleware(BaseHTTPMiddleware):
    """
    认证中间件
    
    自动从 Authorization 头提取 Token，解析用户信息
    并注入到 request.state.user，供后续使用
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """拦截请求，提取用户信息"""
        
        # 尝试从 Authorization 头获取 Token
        auth_header = request.headers.get("authorization")
        
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")
            
            # 解码 Token
            payload = decode_access_token(token)
            
            if payload:
                user_id = payload.get("user_id")
                
                if user_id:
                    # 从数据库获取用户
                    async with AsyncSessionLocal() as db:
                        user = await user_crud.get_by_id(db, user_id)
                        
                        if user and user.is_active:
                            # 注入用户信息到 request.state
                            request.state.user = user
        
        # 继续处理请求
        return await call_next(request)

