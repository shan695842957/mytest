"""
审计中间件（方案1：推荐）
自动拦截所有 POST/PUT/PATCH/DELETE 请求，记录审计日志
类似 Java 的 AOP 切片拦截
"""

import time
import uuid
from typing import Callable, Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.models.audit_log import AuditLog
from app.database import AsyncSessionLocal


class AuditMiddleware(BaseHTTPMiddleware):
    """
    审计中间件
    
    自动拦截所有修改操作（POST/PUT/PATCH/DELETE），记录审计日志
    
    特性：
    - 自动记录所有修改操作（无需手动调用）
    - 支持路由元数据配置（通过 route.endpoint.__audit__）
    - 自动过滤敏感信息
    - 性能监控（记录执行时长）
    - 支持跳过审计（通过 skip_audit 参数）
    """
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.audit_methods = {"POST", "PUT", "PATCH", "DELETE"}
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """拦截请求"""
        
        # 生成请求ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # 只拦截修改操作
        if request.method not in self.audit_methods:
            return await call_next(request)
        
        # 检查是否跳过审计（特殊路由）
        if self._should_skip_audit(request):
            return await call_next(request)
        
        # 记录开始时间
        start_time = time.time()
        
        # 获取请求体（需要缓存，因为只能读取一次）
        request_body = await self._get_request_body(request)
        
        # 执行请求
        response = await call_next(request)
        
        # 计算执行时长
        duration_ms = int((time.time() - start_time) * 1000)
        
        # 异步记录审计日志（不阻塞响应）
        await self._log_audit(
            request=request,
            response=response,
            request_body=request_body,
            duration_ms=duration_ms
        )
        
        return response
    
    def _should_skip_audit(self, request: Request) -> bool:
        """
        判断是否跳过审计
        
        跳过规则：
        1. /health 健康检查接口
        2. /docs、/openapi.json 文档接口
        3. 路由元数据标记 skip_audit=True
        """
        path = request.url.path
        
        # 跳过健康检查和文档
        skip_paths = ["/health", "/docs", "/redoc", "/openapi.json"]
        if any(path.startswith(p) for p in skip_paths):
            return True
        
        # 检查路由元数据
        if hasattr(request.state, "route"):
            route = request.state.route
            if hasattr(route, "endpoint"):
                endpoint = route.endpoint
                if hasattr(endpoint, "__audit__"):
                    return endpoint.__audit__.get("skip", False)
        
        return False
    
    async def _get_request_body(self, request: Request) -> Optional[dict]:
        """
        获取请求体
        
        注意：Request.body() 只能调用一次，需要缓存
        """
        try:
            # 尝试解析 JSON
            if request.headers.get("content-type", "").startswith("application/json"):
                body = await request.json()
                return self._filter_sensitive_data(body)
        except Exception:
            pass
        
        return None
    
    def _filter_sensitive_data(self, data: dict) -> dict:
        """过滤敏感信息"""
        sensitive_fields = {"password", "old_password", "new_password", "token", "secret"}
        
        filtered = data.copy()
        for key in data.keys():
            if key.lower() in sensitive_fields:
                filtered[key] = "***"
        
        return filtered
    
    async def _log_audit(
        self,
        request: Request,
        response: Response,
        request_body: Optional[dict],
        duration_ms: int
    ):
        """
        记录审计日志
        
        从请求中提取：
        - 用户信息（从 request.state.user）
        - 审计元数据（从 request.state.audit_context）
        - 请求上下文（IP、User-Agent、Locale）
        """
        try:
            # 获取当前用户（如果已认证）
            current_user = getattr(request.state, "user", None)
            
            # ⭐ 获取审计上下文（优先从装饰器，其次从 request.state）
            audit_metadata = self._get_audit_metadata(request)
            audit_context = getattr(request.state, "audit_context", None)
            
            # 提取审计元数据（优先使用装饰器的元数据）
            module = audit_metadata.get("module") or self._extract_module(request, audit_context)
            action = audit_metadata.get("action") or self._extract_action(request, audit_context)
            action_key = audit_metadata.get("action_key") or self._extract_action_key(request, audit_context)
            target_type = audit_context.target_type if audit_context else None
            target_id = audit_context.target_id if audit_context else None
            target_name = audit_context.target_name if audit_context else None
            changes = audit_context.changes if audit_context else None
            
            # ⭐ 优先使用 set_audit_user 设置的用户信息（用于登录等场景）
            user_id = getattr(request.state, "audit_user_id", None) or (current_user.id if current_user else None)
            username = getattr(request.state, "audit_username", None) or (current_user.username if current_user else None)
            user_role = getattr(request.state, "audit_user_role", None) or (current_user.role.value if current_user else None)
            
            # 获取请求上下文
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")
            locale = request.headers.get("accept-language", "").split(",")[0].replace("-", "_") or "zh_CN"
            
            # 判断操作是否成功
            success = "success" if 200 <= response.status_code < 300 else "failed"
            
            # 创建审计日志
            async with AsyncSessionLocal() as db:
                audit_log = AuditLog(
                    request_id=str(request.state.request_id),
                    method=request.method,
                    path=str(request.url.path),
                    module=module,
                    action=action,
                    action_key=action_key,
                    user_id=user_id,  # ⭐ 使用提取的用户信息
                    username=username,  # ⭐ 使用提取的用户信息
                    user_role=user_role,  # ⭐ 使用提取的用户信息
                    target_type=target_type,
                    target_id=target_id,
                    target_name=target_name,
                    request_body=request_body,
                    changes=changes,
                    status_code=response.status_code,
                    success=success,
                    error_message=None,  # TODO: 提取错误信息
                    ip_address=ip_address,
                    user_agent=user_agent,
                    locale=locale,
                    duration_ms=duration_ms
                )
                
                db.add(audit_log)
                await db.commit()
        
        except Exception as e:
            # 审计日志失败不应影响业务
            print(f"❌ 审计日志记录失败: {e}")
    
    def _get_audit_metadata(self, request: Request) -> dict:
        """
        从路由的 endpoint 中获取 @audit_route 装饰器的元数据
        """
        try:
            # 尝试从 request.scope 中获取路由
            if "route" in request.scope:
                route = request.scope["route"]
                if hasattr(route, "endpoint"):
                    endpoint = route.endpoint
                    if hasattr(endpoint, "__audit__"):
                        return endpoint.__audit__
            
            # 尝试从 request.state 中获取
            if hasattr(request.state, "route"):
                route = request.state.route
                if hasattr(route, "endpoint"):
                    endpoint = route.endpoint
                    if hasattr(endpoint, "__audit__"):
                        return endpoint.__audit__
        except Exception as e:
            print(f"⚠️ 获取审计元数据失败: {e}")
        
        return {}
    
    def _extract_module(self, request: Request, audit_context) -> str:
        """提取模块名称"""
        if audit_context and audit_context.module:
            return audit_context.module
        
        # 从路径推断（例如 /api/v1/users -> users）
        path_parts = request.url.path.strip("/").split("/")
        if len(path_parts) >= 3:
            return path_parts[2]  # /api/v1/users -> users
        
        return "unknown"
    
    def _extract_action(self, request: Request, audit_context) -> str:
        """提取操作类型"""
        if audit_context and audit_context.action:
            return audit_context.action
        
        # 从方法推断
        method_map = {
            "POST": "create",
            "PUT": "update",
            "PATCH": "update",
            "DELETE": "delete"
        }
        return method_map.get(request.method, "unknown")
    
    def _extract_action_key(self, request: Request, audit_context) -> Optional[str]:
        """提取操作国际化键"""
        if audit_context and audit_context.action_key:
            return audit_context.action_key
        
        return None


# 辅助装饰器：在路由上标记审计元数据
def audit_route(
    module: str,
    action: str,
    action_key: str,
    skip: bool = False
):
    """
    路由审计装饰器
    
    使用示例：
        @router.post("/users")
        @audit_route(
            module="auth",
            action="create_user",
            action_key="audit.action.user_created"
        )
        async def create_user(...):
            pass
    """
    def decorator(func):
        func.__audit__ = {
            "module": module,
            "action": action,
            "action_key": action_key,
            "skip": skip
        }
        return func
    return decorator

