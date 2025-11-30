# Backend 架构说明（供 AI 遵循）

## 1. 文档目标

本说明用于让 AI 明确当前后端的**技术架构**与**技术栈**，在自动生成或修改代码时必须遵循现有设计，而不是随意更换框架或风格。

---

## 2. 技术架构总览

- **框架**：FastAPI 异步 Web 框架  
- **应用入口**：
  - `run.py`：启动脚本（通常由 uvicorn 调用）
  - `app/main.py`：FastAPI 应用主入口，集中完成：
    - 应用生命周期管理（`lifespan`）
    - 中间件注册（CORS、Auth、Audit）
    - 路由注册（`app.api.*` 各子模块）
- **架构风格**：分层 + 包结构清晰
  - 配置 / 基础设施层：`app/config.py`, `app/database.py`
  - 领域模型层：`app/models`, `app/schemas`
  - 数据访问层：`app/crud`
  - 核心功能层：`app/core`
  - 中间件层：`app/middleware`
  - 服务（业务服务）层：`app/services`
  - API 接口层：`app/api`
  - 运维脚本：`app/scripts`
- **统一特性**：
  - 统一响应结构（`app.schemas.response`）
  - JWT 认证与 RBAC 权限（`app.core.security`, `app.core.permissions`）
  - 自动审计日志（`app.core.audit` + `app.middleware.AuditMiddleware`）
  - 国际化（`app/i18n.py` + `app/locales`）
  - 异步数据库访问（SQLAlchemy 2 + aiosqlite）

---

## 3. 技术栈（以 requirements.txt 为准）

- **Web & API**
  - `fastapi==0.109.0`
  - `uvicorn[standard]==0.27.0`
- **数据与模型**
  - `sqlalchemy[asyncio]==2.0.25`（异步 ORM）
  - `aiosqlite==0.19.0`（SQLite 异步驱动）
  - `pydantic==2.5.3`（数据校验 / Schema）
  - `pydantic-settings==2.1.0`（配置管理）
- **国际化**
  - `babel==2.14.0`
- **安全与认证**
  - `bcrypt==4.0.1`
  - `passlib[bcrypt]==1.7.4`
  - `python-jose[cryptography]==3.3.0`（JWT）
- **工具类**
  - `python-multipart==0.0.6`
  - `python-dotenv==1.0.0`
  - `psutil==5.9.8`
  - `toml==0.10.2`
  - `pyserial>=3.5`（串口通信）
- **测试**
  - `pytest==7.4.4`
  - `pytest-asyncio==0.23.3`
  - `httpx==0.26.0`

**要求：**  
AI 在生成代码时必须基于上述栈，不得随意引入新的 Web 框架、ORM 或数据库类型，除非用户明确要求。

---

## 4. 分层结构与目录说明

- **根目录（backend/）**
  - `run.py`：应用启动入口
  - `requirements.txt`：依赖定义
  - `database/`, `backups/`, `captures/`, `data/`：数据库与数据文件目录
  - 文档：`README.md` 及其他业务文档

- **`app/`（核心后端代码）**
  - **`main.py`**
    - 创建 `FastAPI` 应用（标题、版本、描述、OpenAPI 文档路径）
    - `lifespan`：启动和关闭逻辑
      - 启动：`init_db()`, 创建数据目录, 初始化内置用户与系统元数据, 启动监控调度器、恢复端口转发、清理僵尸抓包任务
      - 关闭：优雅停止抓包任务、端口转发与调度器，关闭数据库连接
    - 注册中间件：CORS、`AuthMiddleware`、`AuditMiddleware`
    - 注册路由：`health`, `auth`, `audit`, `gateway`, `tools`, `port_forwarding`, `rathole`, `device_types`, `point_tables`, `comm_instances`, `assets`, `soe`, `dicts`, `light_panel` 等

  - **`config.py`**
    - `Settings(BaseSettings)` 读取环境变量（通过 `.env`）
      - 应用配置：名称、版本、debug、日志等级
      - 数据库配置：`database_url`
      - JWT 配置：`secret_key`, `algorithm`, `access_token_expire_minutes`
      - CORS：`cors_origins`（多前端地址）
      - 其他业务相关配置（备份加密 key 等）
    - 导出全局 `settings`

  - **`database.py`**
    - 定义 `Base`（SQLAlchemy DeclarativeBase）
    - 创建异步 `engine`（SQLite + `NullPool`）
    - `AsyncSessionLocal`：统一的异步 Session 工厂
    - `get_db()`：FastAPI 依赖，统一管理 `commit/rollback/close`
    - `init_db()` / `close_db()`：应用生命周期使用

  - **`models/`**
    - 定义领域模型（如 `User`, `AuditLog`, `SystemConfig` 等）

  - **`schemas/`**
    - Pydantic v2 模型（请求 / 响应 DTO，例如 `UserCreate`, `UserResponse`, `Token`）
    - 使用 `model_validate` 将 ORM 模型转换为响应模型

  - **`crud/`**
    - 每个模型对应的 CRUD 操作封装（如 `user_crud`）

  - **`core/`**
    - `security.py`：密码哈希（bcrypt）、JWT `create_access_token` / `decode_access_token`
    - `permissions.py`：`PermissionChecker` 与 `check_permission`，基于 `UserRole.level` 控制 `create/view/update/delete/change_password` 权限
    - `audit.py`：`AuditLogger`，记录审计日志（请求信息、用户、目标、变更、执行时长、错误信息等）
    - `dependencies.py`：审计/上下文相关的依赖与工具（如 `set_audit_target`, `set_audit_changes`, `set_audit_user`, `get_request_id` 等）
    - `scheduler.py`：`monitor_scheduler`（监控任务调度器）

  - **`middleware/`**
    - `auth.py` → `AuthMiddleware`：
      - 从 `Authorization: Bearer <token>` 解析 JWT
      - 通过 `AsyncSessionLocal + user_crud` 获取用户
      - 将有效用户对象注入 `request.state.user`
    - `AuditMiddleware`：
      - 自动拦截变更请求（POST/PUT/PATCH/DELETE）
      - 结合 `AuditLogger`、依赖函数记录审计日志

  - **`api/`**
    - 通过 `APIRouter` 定义 RESTful API
    - 典型模块：
      - `auth.py`：登录、用户管理、改密码等
      - `audit.py`：审计日志查询
      - `gateway.py`：网关系统管理
      - `tools.py`：系统工具
      - `port_forwarding.py`：端口转发规则管理
      - `rathole.py`：Rathole 客户端配置管理
      - 设备/点表/通信实例/资产/SOE/字典/灯光面板等业务模块

    - 通用依赖 `api/deps.py`：
      - `get_current_user()`：解析 JWT，查库校验用户与状态
      - `get_locale()`：根据 Header 获取语言
      - `get_request_id()`：统一请求 ID 等

  - **`services/`**
    - `rathole.py` 中的 `RatholeService`：
      - 读写 Rathole 配置（TOML 文件）
      - 结合 `SystemConfig` 读取数据目录，管理配置备份、状态等

  - **`scripts/`**
    - `init_builtin_users.py`：初始化内置账号
    - `init_system_metadata.py`：初始化系统元数据等

---

## 5. 请求处理流程（简化）

1. 客户端发起 HTTP 请求  
2. CORS 中间件处理跨域  
3. `AuthMiddleware`（如有 Token）解析用户并注入 `request.state.user`  
4. 路由依赖（如 `get_current_user`）做强认证与用户状态校验  
5. 业务处理：
   - API 层只做参数接收和调用 service / crud
   - 数据访问统一通过 `AsyncSession`（`get_db` 依赖注入）
   - 权限校验统一通过 `check_permission`
6. 统一响应封装为 `ApiResponse`（`success_response` / `paginated_response`）  
7. `AuditMiddleware` + `AuditLogger` 自动记录审计日志  
8. 返回响应给客户端  

---

## 6. AI 开发规范（必须遵守）

- **框架与栈不变更**
  - 使用 **现有 FastAPI + SQLAlchemy(Async) + SQLite** 架构。
  - 不要更换为其他 Web 框架（例如 Django、Flask）或 ORM，也不要引入新数据库（如 MySQL/PostgreSQL），除非用户明确提出。

- **异步优先**
  - 新接口采用 `async def`，数据库访问使用 `AsyncSession` 与 SQLAlchemy 2 异步风格。
  - 使用 `get_db()` 依赖获取 Session，不自行管理 `commit/rollback`。

- **分层与目录规范**
  - 新增 API → 放在 `app/api/<module>.py`，使用 `APIRouter`。
  - 领域模型 → 放在 `app/models`。
  - 请求/响应 Schema → 放在 `app/schemas`。
  - 数据访问逻辑 → 放在 `app/crud`，通过函数封装。
  - 复杂业务逻辑 → 放在 `app/services`，API 层只做分发和装配。
  - 不要把复杂业务直接写进路由函数。

- **统一响应格式**
  - 所有新接口必须返回 `ApiResponse`，使用现有工具函数：
    - `success_response(...)`
    - `paginated_response(...)`
  - 不直接返回裸字典或 ORM 对象列表。

- **认证与权限**
  - 需要登录的接口：
    - 通过 `Depends(get_current_user)` 获取当前用户。
  - 需要权限控制的操作：
    - 使用 `check_permission` 或 `check_role_permission` 等辅助函数。
    - 绝对不要在代码中写死角色字符串比较（例如直接比较 `"admin"` 字符串）。

- **审计日志**
  - 所有修改系统状态的接口（POST/PUT/PATCH/DELETE）：
    - 必须参与审计。
    - 可使用已有的 `@audit_route(...)` 装饰器和 `set_audit_target`, `set_audit_changes` 等机制。
  - 不在日志中记录密码、Token 等敏感字段；如果需要，先通过已有的过滤逻辑处理。

- **国际化**
  - 错误信息和提示尽量使用 **i18n key**，而不是写死中文字符串，例如：
    - `"auth.error.invalid_credentials"`, `"auth.error.user_inactive"` 等
  - 通过 `t(key, locale)` 获取最终展示文本。
  - 新增文案时，应在 `locales` 中增加对应翻译，而不是直接在代码中硬编码中文/英文句子。

- **配置管理**
  - 新增配置项写入 `Settings`（`app/config.py`），并通过环境变量 / `.env` 管理。
  - 不在代码中硬编码敏感信息（密钥、账号、密码）。

- **Pydantic v2 兼容性**
  - 使用 Pydantic v2 风格 API，例如：
    - 从 ORM 实例构建响应模型时，优先使用 `ModelClass.model_validate(obj)`。
  - 避免使用 Pydantic v1 已废弃的 API。

- **测试与质量**
  - 使用 `pytest` + `pytest-asyncio` + `httpx` 为新接口编写测试（如用户有此要求）。
  - 遵循已有代码风格和类型标注（异步函数尽量加返回类型注解）。

---

**总结**：  
AI 在本项目中进行后端开发时，必须基于以上架构和技术栈工作，保持分层结构、统一响应、认证与审计体系、国际化和异步数据库访问的一致性。如需引入新的技术或大规模重构，必须视为“重大架构变更”，只在用户明确说明时才执行。
