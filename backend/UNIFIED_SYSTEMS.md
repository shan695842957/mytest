# 统一系统架构文档

## 📋 概述

本文档描述三大核心系统机制，确保所有模块都使用统一的标准：

1. **统一响应结构** - 所有 API 返回一致的响应格式
2. **操作审计系统** - 自动记录所有修改操作
3. **审计日志国际化** - 审计记录支持多语言

这三个机制是**架构级别的设计**，所有未来的模块都必须遵循。

---

## 🎯 一、统一响应结构

### 1.1 设计目标

- ✅ 所有 API 返回格式统一
- ✅ 支持分页信息
- ✅ 包含请求追踪ID
- ✅ 支持国际化
- ✅ 区分成功/失败状态

### 1.2 响应格式

```typescript
interface ApiResponse<T> {
  // 响应状态
  success: boolean;           // 是否成功
  code: number;               // 响应码（0=成功，非0=错误）
  message: string;            // 响应消息
  
  // 响应数据
  data?: T;                   // 实际数据
  
  // 错误信息（仅失败时）
  error?: string;             // 错误详情
  error_code?: string;        // 错误代码（用于i18n）
  
  // 分页信息（列表查询时）
  pagination?: {
    page: number;             // 当前页码
    page_size: number;        // 每页数量
    total: number;            // 总记录数
    total_pages: number;      // 总页数
  };
  
  // 元数据
  metadata: {
    timestamp: string;        // 响应时间
    request_id?: string;      // 请求ID
    locale: string;           // 响应语言
  };
}
```

### 1.3 使用示例

#### 成功响应（单个对象）

```python
from app.schemas.response import success_response

@router.get("/users/{id}")
async def get_user(
    user_id: int,
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
):
    user = await user_crud.get_by_id(db, user_id)
    
    return success_response(
        data=user,
        message=t("response.query_success", locale),
        locale=locale,
        request_id=request_id
    )
```

**响应示例：**

```json
{
  "success": true,
  "code": 0,
  "message": "查询成功",
  "data": {
    "id": 1,
    "username": "admin",
    "role": "developer"
  },
  "metadata": {
    "timestamp": "2024-01-01T12:00:00",
    "request_id": "abc-123-def",
    "locale": "zh_CN"
  }
}
```

#### 分页响应（列表）

```python
from app.schemas.response import paginated_response

@router.get("/users")
async def list_users(
    skip: int = 0,
    limit: int = 100,
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
):
    users = await user_crud.get_multi(db, skip, limit)
    total = await user_crud.count(db)
    
    return paginated_response(
        items=users,
        skip=skip,
        limit=limit,
        total=total,
        message=t("response.query_success", locale),
        locale=locale,
        request_id=request_id
    )
```

**响应示例：**

```json
{
  "success": true,
  "code": 0,
  "message": "查询成功",
  "data": [
    {"id": 1, "username": "admin"},
    {"id": 2, "username": "user"}
  ],
  "pagination": {
    "page": 1,
    "page_size": 100,
    "total": 2,
    "total_pages": 1
  },
  "metadata": {
    "timestamp": "2024-01-01T12:00:00",
    "request_id": "abc-123-def",
    "locale": "zh_CN"
  }
}
```

#### 错误响应

```python
from app.schemas.response import error_response, ErrorCode

@router.post("/users")
async def create_user(user_in: UserCreate):
    if await user_crud.is_username_taken(db, user_in.username):
        return error_response(
            message=t("auth.error.username_exists", locale),
            code=ErrorCode.USERNAME_EXISTS,
            error_code="auth.error.username_exists",
            locale=locale,
            request_id=request_id
        )
```

**响应示例：**

```json
{
  "success": false,
  "code": 1201,
  "message": "用户名已存在",
  "data": null,
  "error": null,
  "error_code": "auth.error.username_exists",
  "metadata": {
    "timestamp": "2024-01-01T12:00:00",
    "request_id": "abc-123-def",
    "locale": "zh_CN"
  }
}
```

### 1.4 标准错误码

```python
class ErrorCode:
    # 通用错误 (1-999)
    SUCCESS = 0
    UNKNOWN_ERROR = 1
    VALIDATION_ERROR = 2
    NOT_FOUND = 404
    INTERNAL_ERROR = 500
    
    # 认证错误 (1000-1099)
    AUTH_INVALID_CREDENTIALS = 1001
    AUTH_INVALID_TOKEN = 1002
    AUTH_USER_NOT_FOUND = 1003
    AUTH_USER_INACTIVE = 1004
    AUTH_TOKEN_EXPIRED = 1005
    
    # 权限错误 (1100-1199)
    PERMISSION_DENIED = 1100
    PERMISSION_CREATE = 1101
    PERMISSION_VIEW = 1102
    PERMISSION_UPDATE = 1103
    PERMISSION_DELETE = 1104
    
    # 业务错误 (1200+)
    USERNAME_EXISTS = 1201
    CANNOT_DELETE_BUILTIN = 1202
```

---

## 🔍 二、操作审计系统

### 2.1 设计目标

- ✅ 自动记录所有 POST/PUT/PATCH/DELETE 操作
- ✅ 记录操作者信息（用户、角色）
- ✅ 记录目标信息（类型、ID、名称）
- ✅ 记录数据变更（before/after）
- ✅ 记录请求上下文（IP、User-Agent、语言）
- ✅ 支持操作国际化描述

### 2.2 审计日志表结构

```sql
CREATE TABLE audit_logs (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 请求信息
    request_id VARCHAR(36),          -- 请求ID（追踪）
    method VARCHAR(10) NOT NULL,     -- HTTP方法
    path VARCHAR(255) NOT NULL,      -- API路径
    
    -- 操作信息
    module VARCHAR(50) NOT NULL,     -- 模块名称
    action VARCHAR(50) NOT NULL,     -- 操作类型
    action_key VARCHAR(100),         -- 操作国际化键
    
    -- 用户信息
    user_id INTEGER,                 -- 操作者ID
    username VARCHAR(50),            -- 操作者用户名
    user_role VARCHAR(20),           -- 操作者角色
    
    -- 目标信息
    target_type VARCHAR(50),         -- 目标类型
    target_id VARCHAR(50),           -- 目标ID
    target_name VARCHAR(255),        -- 目标名称
    
    -- 数据变更
    request_body TEXT,               -- 请求体（JSON）
    changes TEXT,                    -- 变更内容（JSON）
    
    -- 结果信息
    status_code INTEGER NOT NULL,    -- HTTP状态码
    success VARCHAR(10) NOT NULL,    -- 操作结果
    error_message TEXT,              -- 错误信息
    
    -- 请求上下文
    ip_address VARCHAR(45),          -- 客户端IP
    user_agent VARCHAR(500),         -- 用户代理
    locale VARCHAR(10),              -- 请求语言
    
    -- 时间戳
    created_at DATETIME NOT NULL,    -- 操作时间
    duration_ms INTEGER              -- 执行时长
);
```

### 2.3 使用方式

#### 方式1：在路由中手动记录

```python
from app.core.audit import AuditLogger
import time

@router.post("/users")
async def create_user(
    user_in: UserCreate,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    start_time = time.time()
    
    # 执行业务逻辑
    user = await user_crud.create(db, user_in)
    
    # 计算执行时长
    duration_ms = int((time.time() - start_time) * 1000)
    
    # 记录审计日志
    await AuditLogger.log(
        db=db,
        request=request,
        response=response,
        current_user=current_user,
        module="auth",                    # 模块名称
        action="create_user",             # 操作类型
        action_key="audit.action.user_created",  # 国际化键
        target_type="user",               # 目标类型
        target_id=str(user.id),           # 目标ID
        target_name=user.username,        # 目标名称
        request_body={                    # 请求体（敏感信息会自动过滤）
            "username": user_in.username,
            "role": user_in.role.value
        },
        duration_ms=duration_ms
    )
    
    return success_response(data=user)
```

#### 方式2：记录数据变更

```python
from app.core.audit import AuditLogger

@router.patch("/users/{user_id}")
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    ...
):
    # 查询用户（变更前）
    user = await user_crud.get_by_id(db, user_id)
    old_data = {"is_active": user.is_active}
    
    # 更新用户
    user = await user_crud.update_active_status(db, user, user_update.is_active)
    new_data = {"is_active": user.is_active}
    
    # 计算变更
    changes = AuditLogger.get_changes(old_data, new_data)
    # 结果: {"is_active": {"before": false, "after": true}}
    
    # 记录审计日志（包含变更）
    await AuditLogger.log(
        ...
        changes=changes,
        ...
    )
```

### 2.4 敏感信息过滤

系统会自动过滤敏感字段，替换为 `***`：

```python
# 请求体
{
  "username": "test",
  "password": "123456"  # 会被过滤
}

# 记录到审计日志
{
  "username": "test",
  "password": "***"     # 自动替换
}
```

过滤的字段包括：
- `password`
- `old_password`
- `new_password`
- `token`
- `secret`

### 2.5 审计日志查询

```bash
# 查询所有审计日志
GET /api/v1/audit-logs?skip=0&limit=100

# 按用户筛选
GET /api/v1/audit-logs?user_id=1

# 按模块筛选
GET /api/v1/audit-logs?module=auth

# 按操作类型筛选
GET /api/v1/audit-logs?action=create_user

# 按时间范围筛选
GET /api/v1/audit-logs?start_time=2024-01-01T00:00:00&end_time=2024-01-31T23:59:59

# 查询某个目标的操作历史
GET /api/v1/audit-logs/target/user/123
```

---

## 🌐 三、审计日志国际化

### 3.1 设计目标

- ✅ 审计日志描述支持多语言
- ✅ 根据请求语言返回相应的描述
- ✅ 支持操作类型翻译
- ✅ 支持模块名称翻译

### 3.2 国际化键设计

#### 操作类型（audit.action.*）

```json
{
  "audit.action.user_login": "用户登录",
  "audit.action.user_logout": "用户登出",
  "audit.action.user_created": "创建用户",
  "audit.action.user_updated": "更新用户",
  "audit.action.user_deleted": "删除用户",
  "audit.action.password_changed": "修改密码"
}
```

#### 模块名称（audit.module.*）

```json
{
  "audit.module.auth": "认证模块",
  "audit.module.user": "用户管理",
  "audit.module.system": "系统管理"
}
```

#### 目标类型（audit.target.*）

```json
{
  "audit.target.user": "用户",
  "audit.target.role": "角色",
  "audit.target.permission": "权限"
}
```

### 3.3 使用示例

```python
# 记录审计日志时指定 action_key
await AuditLogger.log(
    ...
    action_key="audit.action.user_created",  # 使用国际化键
    ...
)

# 查询审计日志时，会根据 locale 返回翻译
# 中文请求
curl -H "Accept-Language: zh-CN" /api/v1/audit-logs

# 响应（自动翻译）
{
  "data": [
    {
      "action": "create_user",
      "action_key": "audit.action.user_created",
      "action_name": "创建用户"  # 根据 action_key 翻译
    }
  ]
}

# 英文请求
curl -H "Accept-Language: en-US" /api/v1/audit-logs

# 响应
{
  "data": [
    {
      "action": "create_user",
      "action_key": "audit.action.user_created",
      "action_name": "User created"  # 英文翻译
    }
  ]
}
```

### 3.4 添加新的审计操作

步骤：

1. **在 `app/locales/zh_CN.json` 中添加翻译**

```json
{
  "audit.action.item_created": "创建物品",
  "audit.action.item_updated": "更新物品",
  "audit.action.item_deleted": "删除物品"
}
```

2. **在 `app/locales/en_US.json` 中添加翻译**

```json
{
  "audit.action.item_created": "Item created",
  "audit.action.item_updated": "Item updated",
  "audit.action.item_deleted": "Item deleted"
}
```

3. **在代码中使用**

```python
await AuditLogger.log(
    ...
    module="item",
    action="create_item",
    action_key="audit.action.item_created",  # 使用新的键
    ...
)
```

---

## 📝 四、新模块开发规范

### 4.1 必须遵循的规范

所有新模块开发时，**必须**：

1. ✅ 使用统一响应结构（`ApiResponse`）
2. ✅ 记录修改操作的审计日志
3. ✅ 支持操作国际化描述

### 4.2 完整示例

```python
from fastapi import APIRouter, Depends, Request, Response
from app.schemas.response import ApiResponse, success_response
from app.core.audit import AuditLogger
from app.api.deps import get_current_user, get_locale, get_request_id
import time

router = APIRouter(tags=["物品管理"])

@router.post(
    "/items",
    response_model=ApiResponse[ItemResponse],
    summary="创建物品"
)
async def create_item(
    item_in: ItemCreate,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[ItemResponse]:
    """创建物品"""
    start_time = time.time()
    
    # 业务逻辑
    item = await item_crud.create(db, item_in)
    
    # 计算执行时长
    duration_ms = int((time.time() - start_time) * 1000)
    
    # 记录审计日志
    response.status_code = 201
    await AuditLogger.log(
        db=db,
        request=request,
        response=response,
        current_user=current_user,
        module="item",                          # 模块名称
        action="create_item",                   # 操作类型
        action_key="audit.action.item_created", # 国际化键
        target_type="item",                     # 目标类型
        target_id=str(item.id),                 # 目标ID
        target_name=item.name,                  # 目标名称
        request_body=item_in.model_dump(),      # 请求体
        duration_ms=duration_ms
    )
    
    # 返回统一响应
    return success_response(
        data=item,
        message=t("response.created", locale),
        locale=locale,
        request_id=request_id
    )
```

### 4.3 检查清单

新模块开发完成后，请检查：

- [ ] 所有 API 接口返回 `ApiResponse` 格式
- [ ] 所有 POST/PUT/PATCH/DELETE 操作记录审计日志
- [ ] 审计日志包含完整的操作信息（模块、操作、目标）
- [ ] 添加了国际化翻译（中英文）
- [ ] 敏感信息已过滤（密码、Token等）
- [ ] 记录了数据变更（update 操作）
- [ ] 记录了执行时长

---

## 🔧 五、维护指南

### 5.1 添加新的错误码

编辑 `app/schemas/response.py`：

```python
class ErrorCode:
    # 添加新的错误码（按模块分组）
    ITEM_NOT_FOUND = 2001
    ITEM_ALREADY_EXISTS = 2002
    ITEM_INVALID_STATUS = 2003
```

### 5.2 添加新的国际化翻译

编辑 `app/locales/zh_CN.json` 和 `app/locales/en_US.json`：

```json
{
  "item.error.not_found": "物品不存在",
  "item.error.already_exists": "物品已存在",
  "audit.action.item_created": "创建物品"
}
```

### 5.3 查询审计日志

```python
from app.crud.audit_log import audit_log_crud

# 查询某用户的所有操作
logs = await audit_log_crud.get_multi(db, user_id=1)

# 查询某模块的所有操作
logs = await audit_log_crud.get_multi(db, module="auth")

# 查询某个目标的操作历史
logs = await audit_log_crud.get_by_target(db, "user", "123")

# 统计操作数量
count = await audit_log_crud.count(db, action="create_user")
```

---

## 📊 六、技术实现

### 6.1 核心文件

```
backend/
├── app/
│   ├── schemas/
│   │   └── response.py          # 统一响应结构
│   ├── models/
│   │   └── audit_log.py         # 审计日志模型
│   ├── crud/
│   │   └── audit_log.py         # 审计日志CRUD
│   ├── core/
│   │   └── audit.py             # 审计核心功能
│   ├── api/
│   │   ├── audit.py             # 审计日志查询API
│   │   └── auth.py              # Auth模块（使用审计）
│   └── locales/
│       ├── zh_CN.json           # 中文翻译
│       └── en_US.json           # 英文翻译
└── database/
    └── migration_001_audit_logs.sql  # 审计日志表
```

### 6.2 依赖关系

```
API 路由
  ↓
统一响应（success_response/paginated_response）
  ↓
审计日志（AuditLogger.log）
  ↓
数据库（audit_logs 表）
  ↓
国际化（action_key → 翻译）
```

---

## 🎓 七、最佳实践

### 7.1 DO（推荐做法）

- ✅ 所有 API 都使用 `ApiResponse` 包装
- ✅ 所有修改操作都记录审计日志
- ✅ 使用 `action_key` 支持国际化
- ✅ 记录完整的操作上下文（用户、目标、变更）
- ✅ 过滤敏感信息（密码、Token）
- ✅ 记录执行时长（性能监控）

### 7.2 DON'T（避免做法）

- ❌ 不要返回原始数据，必须用 `ApiResponse` 包装
- ❌ 不要遗漏审计日志（尤其是 DELETE 操作）
- ❌ 不要在审计日志中记录明文密码
- ❌ 不要使用硬编码的操作描述，使用 `action_key`
- ❌ 不要忘记添加国际化翻译

---

## 📚 八、相关文档

- [AUTH_MODULE.md](./AUTH_MODULE.md) - Auth 模块详细文档
- [README.md](./README.md) - 项目总览

---

**文档版本**: 1.0.0  
**最后更新**: 2024-01-01  
**维护者**: 开发团队

