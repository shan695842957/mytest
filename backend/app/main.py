"""
FastAPI 应用主入口
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError, HTTPException
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.database import init_db, close_db
from app.middleware import AuditMiddleware
from app.middleware.auth import AuthMiddleware
from app.api import (
    health, auth, audit, gateway, tools, port_forwarding, rathole,
    device_types, point_tables, comm_instances, assets, soe, dicts, light_panel, protocol_types, peripherals, history, bms
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理
    
    启动时：
    - 初始化数据库
    - 创建数据目录
    
    关闭时：
    - 关闭数据库连接
    """
    # 启动
    print(f"🚀 启动 {settings.app_name} v{settings.app_version}")
    
    # 创建数据目录
    from pathlib import Path
    data_dir = Path("./data")
    data_dir.mkdir(exist_ok=True)
    
    # 初始化数据库
    await init_db()
    print("✅ 数据库初始化完成")
    
    # 初始化内置账号（如果不存在）
    from app.scripts.init_builtin_users import init_builtin_users
    await init_builtin_users()
    print("✅ 内置账号初始化完成")
    
    # 初始化系统元数据（数据库指纹）
    from app.scripts.init_system_metadata import init_system_metadata
    await init_system_metadata()
    print("✅ 系统元数据初始化完成")
    
    # 启动监控数据采集调度器
    from app.core.scheduler import monitor_scheduler
    await monitor_scheduler.start()
    print("✅ 监控调度器已启动")
    
    # 清理僵尸抓包任务（应用重启恢复）
    await cleanup_zombie_capture_tasks()
    
    # 自动恢复端口转发规则
    await auto_recover_port_forwarding()
    
    # 打印 CORS 配置
    print(f"✅ CORS 允许的源: {', '.join(settings.cors_origins)}")
    
    yield
    
    # 关闭
    print("🛑 关闭应用...")
    
    # 优雅终止所有抓包任务
    await shutdown_capture_tasks()
    
    # 停止所有端口转发
    await shutdown_port_forwarding()
    
    # 停止监控调度器
    await monitor_scheduler.stop()
    print("✅ 监控调度器已停止")
    
    await close_db()
    print("✅ 数据库连接已关闭")


# 创建 FastAPI 应用
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    生产级 FastAPI 应用
    
    ## 功能特性
    
    * **认证和授权**: 基于 JWT 的用户认证，复杂的角色权限控制
    * **统一响应**: 所有 API 使用统一的响应格式
    * **自动审计**: 中间件自动记录所有修改操作（POST/PUT/PATCH/DELETE）
    * **异步数据库**: 使用 aiosqlite + SQLAlchemy 2.0
    * **国际化**: 支持中文和英文（通过 Accept-Language 头切换）
    * **RESTful API**: 标准的 REST 接口设计
    * **自动文档**: 基于 OpenAPI 3.0 的交互式文档
    
    ## 审计系统（自动化）
    
    采用中间件自动拦截方式，类似 Java Spring AOP：
    - ✅ 自动拦截所有 POST/PUT/PATCH/DELETE 请求
    - ✅ 自动记录操作者、目标、变更
    - ✅ 自动过滤敏感信息（密码、Token）
    - ✅ 自动计算执行时长
    - ✅ 支持多语言审计日志
    
    ## 统一响应格式
    
    所有接口返回统一的响应结构：
    
    ```json
    {
      "success": true,
      "code": 0,
      "message": "操作成功",
      "data": {...},
      "pagination": {...},
      "metadata": {
        "timestamp": "2024-01-01T12:00:00",
        "request_id": "uuid",
        "locale": "zh_CN"
      }
    }
    ```
    
    ## 内置账号
    
    系统预置三个内置账号（初始密码: Admin@123，请立即修改）：
    
    * **admin_developer**: 开发者角色（最高权限）
    * **admin_operator**: 运维者角色（中等权限）
    * **admin_user**: 用户角色（基础权限）
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# ⭐ CORS 中间件（必须在最前面）
# 开发模式：允许所有来源（方便局域网访问）
# 生产模式：应配置具体的 cors_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.cors_allow_all else settings.cors_origins,  # 开发模式允许所有来源
    allow_credentials=True,  # 允许携带 Cookie
    allow_methods=["*"],  # 允许所有 HTTP 方法
    allow_headers=["*"],  # 允许所有请求头
    expose_headers=["*"],  # 暴露所有响应头
)

# 认证中间件（自动提取用户信息）
app.add_middleware(AuthMiddleware)

# 审计中间件（自动记录审计日志）
app.add_middleware(AuditMiddleware)

# 注册路由
app.include_router(
    health.router,
    prefix=settings.api_prefix,
    tags=["健康检查"]
)

# ⭐ Auth 路由（注意：路径是 /api/v1/auth/xxx）
app.include_router(
    auth.router,
    prefix=f"{settings.api_prefix}/auth",  # /api/v1/auth
    tags=["认证和用户管理"]
)

app.include_router(
    audit.router,
    prefix=settings.api_prefix,
    tags=["审计日志"]
)


# 网关系统管理路由
app.include_router(
    gateway.router,
    prefix=f"{settings.api_prefix}/gateway",
    tags=["网关系统管理"]
)

# 系统工具路由
app.include_router(
    tools.router,
    prefix=f"{settings.api_prefix}/tools",
    tags=["系统工具"]
)

# 端口转发路由
app.include_router(
    port_forwarding.router,
    prefix=f"{settings.api_prefix}/tools/port-forwarding",
    tags=["端口转发"]
)

# Rathole 内网穿透路由
app.include_router(
    rathole.router,
    prefix=f"{settings.api_prefix}/tools/rathole",
    tags=["Rathole 内网穿透"]
)

# ============================================================================
# IIoT 配置系统路由
# ============================================================================

# 设备类型路由
app.include_router(
    device_types.router,
    prefix=f"{settings.api_prefix}/device-types",
    tags=["设备类型管理"]
)

# 点表模板路由
app.include_router(
    point_tables.router,
    prefix=f"{settings.api_prefix}/point-tables",
    tags=["点表模板管理"]
)

# 协议类型管理路由
app.include_router(
    protocol_types.router,
    prefix=f"{settings.api_prefix}/protocol-types",
    tags=["协议类型管理"]
)

app.include_router(
    peripherals.router,
    prefix=f"{settings.api_prefix}/peripherals",
    tags=["外设管理"]
)

# 通信实例路由
app.include_router(
    comm_instances.router,
    prefix=f"{settings.api_prefix}/comm-instances",
    tags=["通信实例管理"]
)

# 资产路由
app.include_router(
    assets.router,
    prefix=f"{settings.api_prefix}/assets",
    tags=["资产管理"]
)

# SOE 事件查询路由
app.include_router(
    soe.router,
    prefix=f"{settings.api_prefix}/soe",
    tags=["SOE事件查询"]
)

# 字典数据路由
app.include_router(
    dicts.router,
    prefix=f"{settings.api_prefix}/dicts",
    tags=["字典数据"]
)

# 光字牌路由
app.include_router(
    light_panel.router,
    prefix=f"{settings.api_prefix}/light-panel",
    tags=["光字牌"]
)

# 历史数据查询路由
app.include_router(
    history.router,
    prefix=f"{settings.api_prefix}/history",
    tags=["历史数据查询"]
)

# BMS 管理路由
app.include_router(
    bms.router,
    prefix=f"{settings.api_prefix}/bms",
    tags=["BMS管理"]
)


# 请求验证错误处理（统一返回 ApiResponse 格式）
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """请求验证错误处理器 - 返回统一的 ApiResponse 格式"""
    from app.schemas.response import error_response
    from app.api.deps import get_locale_from_header
    
    locale = get_locale_from_header(request.headers.get("Accept-Language", "zh-CN"))
    
    # 格式化验证错误信息
    errors = exc.errors()
    error_messages = []
    for error in errors:
        field = " -> ".join(str(loc) for loc in error.get("loc", []))
        msg = error.get("msg", "验证失败")
        error_messages.append(f"{field}: {msg}")
    
    # 组合错误消息
    if len(error_messages) == 1:
        message = error_messages[0]
    else:
        message = f"请求验证失败：{len(error_messages)} 个错误"
    
    # 详细错误信息（用于调试）
    error_detail = "; ".join(error_messages) if settings.debug else None
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response(
            code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            message=message,
            error=error_detail,
            locale=locale
        ).model_dump(mode='json')
    )


# Starlette HTTPException 异常处理（包括 404，统一返回 ApiResponse 格式）
@app.exception_handler(StarletteHTTPException)
async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Starlette HTTPException 异常处理器（包括 404）- 返回统一的 ApiResponse 格式"""
    from app.schemas.response import error_response
    from app.api.deps import get_locale_from_header
    
    locale = get_locale_from_header(request.headers.get("Accept-Language", "zh-CN"))
    
    # 404 特殊处理
    if exc.status_code == 404:
        message = "资源不存在"
        error = f"路径 {request.url.path} 不存在"
    else:
        if isinstance(exc.detail, str):
            message = exc.detail
            error = None
        else:
            message = "请求错误"
            error = str(exc.detail) if exc.detail else None
    
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(
            code=exc.status_code,
            message=message,
            error=error,
            locale=locale
        ).model_dump(mode='json')  # 使用 mode='json' 确保 datetime 被序列化
    )


# HTTPException 异常处理（统一返回 ApiResponse 格式）
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTPException 异常处理器 - 返回统一的 ApiResponse 格式"""
    from app.schemas.response import error_response
    from app.api.deps import get_locale_from_header
    
    locale = get_locale_from_header(request.headers.get("Accept-Language", "zh-CN"))
    
    if isinstance(exc.detail, str):
        message = exc.detail
        error = None
    else:
        message = "请求错误"
        error = str(exc.detail) if exc.detail else None
    
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(
            code=exc.status_code,
            message=message,
            error=error,
            locale=locale
        ).model_dump(mode='json')  # 使用 mode='json' 确保 datetime 被序列化
    )


# 全局异常处理
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """全局异常处理器"""
    from app.schemas.response import error_response
    from app.api.deps import get_locale_from_header
    
    locale = get_locale_from_header(request.headers.get("Accept-Language", "zh-CN"))
    
    return JSONResponse(
        status_code=500,
        content=error_response(
            code=500,
            message="服务器内部错误",
            error=str(exc) if settings.debug else None,
            locale=locale
        ).model_dump(mode='json')  # 使用 mode='json' 确保 datetime 被序列化
    )


# 根路径
async def cleanup_zombie_capture_tasks():
    """
    清理僵尸抓包任务（应用启动时执行）
    
    检查所有"running"状态的任务：
    1. 验证进程是否仍然存在且是tcpdump
    2. 进程已死 → 标记为failed
    3. 进程仍活 → 重新接管
    """
    from app.database import AsyncSessionLocal
    from app.models.capture import CaptureTask
    from app.core.capture_manager import capture_manager
    from sqlalchemy import select
    from datetime import datetime
    import psutil
    import os
    
    print("=" * 60)
    print("🔍 检查抓包任务状态...")
    print("-" * 60)
    
    async with AsyncSessionLocal() as db:
        # 查找所有running状态的任务
        result = await db.execute(
            select(CaptureTask).where(CaptureTask.status == 'running')
        )
        running_tasks = result.scalars().all()
        
        if not running_tasks:
            print("✅ 无运行中的抓包任务")
            print("=" * 60)
            return
        
        print(f"⚠️  发现 {len(running_tasks)} 个运行中的任务")
        print("-" * 60)
        
        fixed_count = 0
        recovered_count = 0
        
        for task in running_tasks:
            pid = task.pid
            
            # 尝试恢复任务
            if await capture_manager.recover_task(db, task):
                recovered_count += 1
                print(f"  ✅ 任务 #{task.id} ({task.name})")
                print(f"     PID={pid} 进程仍在运行，已恢复")
            else:
                fixed_count += 1
                
                # 计算实际运行时长
                actual_duration = 0
                if task.started_at:
                    actual_duration = int(
                        (datetime.now() - task.started_at).total_seconds()
                    )
                
                # 标记为失败
                task.status = 'failed'
                task.error_message = '服务重启导致任务中断'
                task.completed_at = datetime.now()
                task.actual_duration = actual_duration
                
                # 检查部分文件
                if task.file_path and os.path.exists(task.file_path):
                    file_size = os.path.getsize(task.file_path)
                    task.file_size = file_size
                    print(f"  🔧 任务 #{task.id} ({task.name})")
                    print(f"     PID={pid or '未知'} 进程已死，标记为失败")
                    print(f"     保留部分文件: {file_size / 1024:.1f} KB")
                else:
                    print(f"  🔧 任务 #{task.id} ({task.name})")
                    print(f"     PID={pid or '未知'} 进程已死，无文件保留")
        
        await db.commit()
        
        print("-" * 60)
        print(f"📊 处理结果: 已修复 {fixed_count} 个, 已恢复 {recovered_count} 个")
        print("=" * 60)


async def auto_recover_port_forwarding():
    """
    自动恢复端口转发规则（应用启动时执行）
    
    启动所有已启用的端口转发规则
    """
    from app.database import AsyncSessionLocal
    from app.crud.port_forwarding import port_forwarding_crud
    from app.services.port_forwarding import port_forwarding_service
    
    print("=" * 60)
    print("🔍 检查端口转发规则...")
    print("-" * 60)
    
    async with AsyncSessionLocal() as db:
        # 查找所有已启用的规则
        enabled_rules = await port_forwarding_crud.get_enabled_rules(db)
        
        if not enabled_rules:
            print("✅ 无已启用的端口转发规则")
            print("=" * 60)
            return
        
        print(f"⚠️  发现 {len(enabled_rules)} 个已启用的规则")
        print("-" * 60)
        
        success_count = 0
        failed_count = 0
        
        for rule in enabled_rules:
            try:
                await port_forwarding_service.start_forwarding(db, rule.id)
                success_count += 1
                print(f"  ✅ 启动规则 '{rule.name}' ({rule.source_host}:{rule.source_port} -> {rule.target_host}:{rule.target_port})")
            except Exception as e:
                failed_count += 1
                print(f"  ⚠️  启动规则 '{rule.name}' 失败: {e}")
        
        print("-" * 60)
        print(f"📊 恢复结果: 成功 {success_count} 个, 失败 {failed_count} 个")
        print("=" * 60)


async def shutdown_port_forwarding():
    """
    停止所有端口转发（应用关闭时执行）
    
    停止所有运行中的 socat 进程
    """
    from app.database import AsyncSessionLocal
    from app.crud.port_forwarding import port_forwarding_crud
    from app.services.port_forwarding import port_forwarding_service
    from sqlalchemy import select
    from app.models.port_forwarding import PortForwardingRule
    
    print("=" * 60)
    print("🔍 检查运行中的端口转发...")
    print("-" * 60)
    
    async with AsyncSessionLocal() as db:
        # 查找所有运行中的规则
        result = await db.execute(
            select(PortForwardingRule).where(PortForwardingRule.status == "running")
        )
        running_rules = result.scalars().all()
        
        if not running_rules:
            print("✅ 无运行中的端口转发")
            print("=" * 60)
            return
        
        print(f"⚠️  正在停止 {len(running_rules)} 个端口转发...")
        print("-" * 60)
        
        for rule in running_rules:
            try:
                await port_forwarding_service.stop_forwarding(db, rule.id)
                print(f"  ✅ 停止规则 '{rule.name}' (PID={rule.process_id})")
            except Exception as e:
                print(f"  ⚠️  停止规则 '{rule.name}' 失败: {e}")
        
        print("-" * 60)
        print("✅ 端口转发清理完成")
        print("=" * 60)


async def shutdown_capture_tasks():
    """
    优雅终止所有抓包任务（应用关闭时执行）
    
    停止所有运行中的tcpdump进程
    """
    from app.core.capture_manager import capture_manager
    
    if not capture_manager.running_tasks:
        print("✅ 无需清理抓包任务")
        return
    
    print("=" * 60)
    print(f"⚠️  正在终止 {len(capture_manager.running_tasks)} 个抓包任务...")
    print("-" * 60)
    
    for task_id, process in list(capture_manager.running_tasks.items()):
        try:
            print(f"  终止任务 #{task_id} (PID={process.pid})")
            process.terminate()
            process.wait(timeout=3)
        except Exception as e:
            print(f"  ⚠️  终止失败: {e}")
    
    print("-" * 60)
    print("✅ 抓包任务清理完成")
    print("=" * 60)


@app.get("/", tags=["根路径"])
async def root():
    """根路径，返回 API 基本信息"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": f"{settings.api_prefix}/health",
        "login": f"{settings.api_prefix}/auth/login",
        "audit": f"{settings.api_prefix}/audit-logs",
        "audit_system": "middleware (auto)",
        "cors_enabled": True,
        "cors_origins": settings.cors_origins
    }
