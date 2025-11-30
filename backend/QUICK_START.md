# 快速入门指南

## 🚀 三分钟开始使用

### 1. 启动服务

```bash
cd backend
./start.sh
```

访问: http://localhost:8000/docs

### 2. 登录获取 Token

**Swagger UI 操作**：
1. 展开 `POST /api/v1/login`
2. 点击 **Try it out**
3. 输入：
   ```json
   {
     "username": "admin_developer",
     "password": "Admin@123"
   }
   ```
4. 点击 **Execute**
5. 复制响应中的 `access_token`

**响应示例**（注意统一响应格式）：

```json
{
  "success": true,
  "code": 0,
  "message": "操作成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 86400
  },
  "metadata": {
    "timestamp": "2024-01-01T12:00:00",
    "request_id": "abc-123-def",
    "locale": "zh_CN"
  }
}
```

### 3. 认证

1. 点击页面右上角的 **Authorize** 按钮 🔓
2. 输入: `Bearer YOUR_TOKEN`（注意前缀 `Bearer `）
3. 点击 **Authorize**
4. 关闭弹窗

现在所有接口都已认证！

### 4. 测试统一响应格式

**创建用户**：

```bash
curl -X POST http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept-Language: zh-CN" \
  -d '{
    "username": "test_user",
    "password": "Test@123456",
    "role": "user"
  }'
```

**响应**（注意统一格式）：

```json
{
  "success": true,
  "code": 0,
  "message": "创建成功",
  "data": {
    "id": 4,
    "username": "test_user",
    "role": "user",
    "is_active": true,
    "is_builtin": false,
    "created_by": 1,
    "created_at": "2024-01-01T12:00:00",
    "updated_at": "2024-01-01T12:00:00"
  },
  "metadata": {
    "timestamp": "2024-01-01T12:00:00",
    "request_id": "abc-123-def",
    "locale": "zh_CN"
  }
}
```

### 5. 查看审计日志

```bash
curl -X GET http://localhost:8000/api/v1/audit-logs \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应**（自动记录的审计日志）：

```json
{
  "success": true,
  "code": 0,
  "message": "查询成功",
  "data": [
    {
      "id": 1,
      "method": "POST",
      "path": "/api/v1/login",
      "module": "auth",
      "action": "login",
      "action_key": "audit.action.user_login",
      "username": "admin_developer",
      "target_type": "user",
      "target_name": "admin_developer",
      "status_code": 200,
      "success": "success",
      "ip_address": "127.0.0.1",
      "locale": "zh_CN",
      "created_at": "2024-01-01T12:00:00",
      "duration_ms": 45
    },
    {
      "id": 2,
      "method": "POST",
      "path": "/api/v1/users",
      "module": "auth",
      "action": "create_user",
      "action_key": "audit.action.user_created",
      "username": "admin_developer",
      "target_type": "user",
      "target_id": "4",
      "target_name": "test_user",
      "request_body": {
        "username": "test_user",
        "role": "user"
      },
      "status_code": 201,
      "success": "success",
      "created_at": "2024-01-01T12:01:00",
      "duration_ms": 123
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 100,
    "total": 2,
    "total_pages": 1
  },
  "metadata": {
    "timestamp": "2024-01-01T12:02:00",
    "request_id": "xyz-789-abc",
    "locale": "zh_CN"
  }
}
```

### 6. 测试国际化

**中文**：

```bash
curl -H "Accept-Language: zh-CN" http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

响应消息: `"message": "查询成功"`

**英文**：

```bash
curl -H "Accept-Language: en-US" http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

响应消息: `"message": "Query successful"`

---

## 📝 新模块开发三步走

### 步骤 1：创建路由（使用统一响应）

```python
from fastapi import APIRouter, Depends, Request, Response
from app.schemas.response import ApiResponse, success_response
from app.api.deps import get_current_user, get_locale, get_request_id

router = APIRouter(tags=["你的模块"])

@router.post("/items", response_model=ApiResponse[ItemResponse])
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
    # 业务逻辑
    item = await item_crud.create(db, item_in)
    
    # 返回统一响应
    return success_response(
        data=item,
        message=t("response.created", locale),
        locale=locale,
        request_id=request_id
    )
```

### 步骤 2：添加审计日志

```python
import time
from app.core.audit import AuditLogger

@router.post("/items", ...)
async def create_item(...):
    start_time = time.time()
    
    # 业务逻辑
    item = await item_crud.create(db, item_in)
    
    # 记录审计日志
    duration_ms = int((time.time() - start_time) * 1000)
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
    
    return success_response(...)
```

### 步骤 3：添加国际化翻译

**`app/locales/zh_CN.json`**:

```json
{
  "audit.action.item_created": "创建物品",
  "audit.action.item_updated": "更新物品",
  "audit.action.item_deleted": "删除物品"
}
```

**`app/locales/en_US.json`**:

```json
{
  "audit.action.item_created": "Item created",
  "audit.action.item_updated": "Item updated",
  "audit.action.item_deleted": "Item deleted"
}
```

完成！现在你的模块已经：
- ✅ 使用统一响应格式
- ✅ 自动记录审计日志
- ✅ 支持多语言

---

## 🔍 常见问题

### Q1: 如何查看某个用户的所有操作？

```bash
curl -X GET "http://localhost:8000/api/v1/audit-logs?user_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Q2: 如何查看某个对象的操作历史？

```bash
curl -X GET "http://localhost:8000/api/v1/audit-logs/target/user/123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Q3: 如何过滤失败的操作？

```bash
curl -X GET "http://localhost:8000/api/v1/audit-logs?success=failed" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Q4: 审计日志会自动记录密码吗？

不会！系统会自动过滤敏感信息（`password`、`token`、`secret` 等），替换为 `***`。

### Q5: 如何添加新的错误码？

编辑 `app/schemas/response.py`:

```python
class ErrorCode:
    # 你的业务错误码（从 2000 开始）
    ITEM_NOT_FOUND = 2001
    ITEM_INVALID_STATUS = 2002
```

---

## 📚 进阶阅读

- [UNIFIED_SYSTEMS.md](./UNIFIED_SYSTEMS.md) - 三大系统详细文档
- [AUTH_MODULE.md](./AUTH_MODULE.md) - Auth 模块文档
- [README.md](./README.md) - 项目总览

---

**祝你开发愉快！** 🎉

如有问题，请查阅详细文档或联系开发团队。

