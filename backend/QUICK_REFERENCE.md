# LCCU-V Backend 快速参考

> 开发新功能时的速查手册

---

## 🚀 5 分钟上手

### 1. 参考哪些文件？

| 功能 | 参考文件 |
|------|----------|
| **API 路由** | `app/api/auth.py` ⭐⭐⭐ |
| **CRUD 操作** | `app/crud/user.py` ⭐⭐⭐ |
| **数据模型** | `app/models/user.py` ⭐⭐⭐ |
| **请求/响应 Schema** | `app/schemas/user.py` ⭐⭐⭐ |
| **统一响应** | `app/schemas/response.py` ⭐⭐⭐ |
| **权限检查** | `app/core/permissions.py` ⭐⭐ |
| **审计装饰器** | `app/middleware/audit.py` ⭐⭐ |
| **依赖注入** | `app/api/deps.py` ⭐⭐ |

### 2. 常用代码模板

#### 创建 API 路由

```python
from fastapi import APIRouter, Depends, Request
from app.schemas.response import ApiResponse, success_response
from app.middleware.audit import audit_route
from app.core.dependencies import set_audit_target
from app.api.deps import get_current_user, get_locale, get_request_id

router = APIRouter()

@router.post("/items")
@audit_route(
    module="item",
    action="create_item",
    action_key="audit.action.item_created"
)
async def create_item(
    item_in: ItemCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[ItemResponse]:
    # 创建资源
    item = await item_crud.create(db, item_in)
    
    # 设置审计目标
    set_audit_target(request, "item", str(item.id), item.name)
    
    return success_response(
        data=ItemResponse.model_validate(item),
        message=t("item.success.created", locale),
        locale=locale,
        request_id=request_id
    )
```

#### 统一响应

```python
from app.schemas.response import ApiResponse, success_response, paginated_response, error_response

# 成功响应
return success_response(
    data=data,
    message=t("xxx.success", locale),
    locale=locale,
    request_id=request_id
)

# 分页响应
return paginated_response(
    data=items,
    total=total,
    page=page,
    page_size=page_size,
    locale=locale,
    request_id=request_id
)

# 错误响应（通常用 HTTPException）
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail=t("xxx.error.not_found", locale)
)
```

#### 权限检查

```python
from app.core.permissions import check_permission
from app.schemas.user import UserRole

# 检查角色
check_permission(
    current_user=current_user,
    required_role=UserRole.DEVELOPER,
    error_message=t("xxx.error.permission_denied", locale)
)
```

---

## 📋 核心技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| FastAPI | 0.109+ | Web 框架 |
| SQLAlchemy | 2.0+ | 异步 ORM |
| Pydantic | 2.5+ | 数据验证 |
| passlib | 1.7.2 | 密码哈希 |
| python-jose | 3.3+ | JWT |
| Babel | 2.14+ | 国际化 |

---

## 🎯 开发检查清单

- [ ] 参考了 `app/api/auth.py`
- [ ] 使用了 `ApiResponse` 统一响应
- [ ] 使用了 `@audit_route` 装饰器
- [ ] 添加了中英文翻译
- [ ] 所有函数有类型注解
- [ ] 没有硬编码文本

---

## 📚 完整文档

详细规范请查看：`AI_DEVELOPMENT_RULES.md`

