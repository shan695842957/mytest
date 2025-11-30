# 审计日志角色权限说明

## 📋 权限规则

### 1. Developer（开发者）- 级别 3
**可查看范围**：所有审计日志
- ✅ Developer 的操作记录
- ✅ Operator 的操作记录
- ✅ User 的操作记录

**规则**：`allowed_roles = ["developer", "operator", "user"]`

---

### 2. Operator（运维者）- 级别 2
**可查看范围**：同级别和子级别的审计日志
- ❌ Developer 的操作记录
- ✅ Operator 的操作记录
- ✅ User 的操作记录

**规则**：`allowed_roles = ["operator", "user"]`

---

### 3. User（用户）- 级别 1
**可查看范围**：同级别的所有审计日志
- ❌ Developer 的操作记录
- ❌ Operator 的操作记录
- ✅ 所有 User 级别的操作记录

**规则**：`allowed_roles = ["user"]`

---

## 🎯 实现方式

### 1. API 层（app/api/audit.py）

在 `query_audit_logs` 函数中，根据当前用户角色确定允许查看的角色列表：

```python
from app.models.user import UserRole

# 角色权限检查
allowed_roles = []

if current_user.role == UserRole.DEVELOPER:
    # Developer 可以查看所有级别的审计日志
    allowed_roles = ["developer", "operator", "user"]

elif current_user.role == UserRole.OPERATOR:
    # Operator 只能查看 Operator 和 User 级别的审计日志
    allowed_roles = ["operator", "user"]

elif current_user.role == UserRole.USER:
    # User 只能查看自己的审计日志
    if user_id and user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=t("auth.error.no_permission_view", locale)
        )
    user_id = current_user.id  # 强制只查询自己的记录
    allowed_roles = ["user"]
```

### 2. CRUD 层（app/crud/audit_log.py）

在 `get_multi` 和 `count` 方法中，添加 `allowed_roles` 参数：

```python
async def get_multi(
    self,
    db: AsyncSession,
    # ... 其他参数 ...
    allowed_roles: Optional[List[str]] = None
) -> List[AuditLog]:
    # ... 构建筛选条件 ...
    
    # ⭐ 角色权限过滤：只能查看允许的角色的审计日志
    if allowed_roles:
        conditions.append(AuditLog.user_role.in_(allowed_roles))
    
    # ... 执行查询 ...
```

### 3. SQL 查询

最终生成的 SQL 查询（以 Operator 为例）：

```sql
SELECT * FROM audit_logs
WHERE user_role IN ('operator', 'user')  -- ⭐ 角色过滤
ORDER BY created_at DESC
LIMIT 100;
```

---

## 📊 权限矩阵

| 当前用户角色 | 可查看的审计日志 | allowed_roles | 额外限制 |
|-------------|-----------------|---------------|---------|
| **Developer** | 所有 | `["developer", "operator", "user"]` | 无 |
| **Operator** | Operator + User | `["operator", "user"]` | 无 |
| **User** | 所有 User 级别 | `["user"]` | 无 |

---

## 🧪 测试场景

### 场景 1：Developer 查询审计日志

```bash
# Developer 登录
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin_developer", "password": "Admin@123"}' \
  | jq -r '.data.access_token')

# 查询审计日志（可以看到所有角色的记录）
curl -X GET "http://localhost:8000/api/v1/audit-logs" \
  -H "Authorization: Bearer $TOKEN"

# ✅ 结果：可以看到 developer、operator、user 的所有审计日志
```

### 场景 2：Operator 查询审计日志

```bash
# Operator 登录
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin_operator", "password": "Admin@123"}' \
  | jq -r '.data.access_token')

# 查询审计日志（只能看到 operator 和 user 的记录）
curl -X GET "http://localhost:8000/api/v1/audit-logs" \
  -H "Authorization: Bearer $TOKEN"

# ✅ 结果：只能看到 operator 和 user 的审计日志
# ❌ 结果：看不到 developer 的审计日志
```

### 场景 3：User 查询审计日志

```bash
# User 登录
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "normal_user", "password": "User@123"}' \
  | jq -r '.data.access_token')

# 查询审计日志（可以看到所有 User 级别的记录）
curl -X GET "http://localhost:8000/api/v1/audit-logs" \
  -H "Authorization: Bearer $TOKEN"

# ✅ 结果：可以看到所有 user_role = "user" 的审计日志
# ❌ 结果：看不到 developer 和 operator 的审计日志
```

---

## 🔒 安全性保证

### 1. 数据库层过滤
通过 SQL 的 `WHERE user_role IN (...)` 条件，从数据库层面保证只返回允许的角色的记录。

### 2. 应用层验证
在 API 层判断当前用户角色，确保 `allowed_roles` 列表正确。

### 3. 强制限制
对于 User 角色，强制设置 `user_id = current_user.id`，防止绕过查询其他用户的记录。

### 4. 双重检查
- **查询时**：通过 `allowed_roles` 过滤
- **返回时**：如果有额外的权限检查需求，可以在返回前再次验证

---

## ✅ 优势

1. **细粒度权限控制**：基于角色的精确权限控制
2. **性能优化**：在数据库层面过滤，不需要在应用层遍历
3. **安全性高**：从 SQL 查询层面保证数据隔离
4. **易于扩展**：新增角色时，只需修改 `allowed_roles` 列表
5. **审计完整**：所有查询操作本身也会被记录到审计日志

---

## 📝 注意事项

1. **审计日志的 user_role 字段必须准确**：
   - 在记录审计日志时，必须正确记录 `user_role`
   - 参考：`app/middleware/audit.py` 中的 `user_role=current_user.role.value`

2. **角色名称必须一致**：
   - 数据库中存储的角色名称：`"developer"`、`"operator"`、`"user"`（小写）
   - `allowed_roles` 列表中的角色名称必须与数据库一致

3. **未认证的操作**：
   - 如果审计日志的 `user_role` 为 `NULL`（未认证操作），则所有角色都看不到
   - 可以通过修改逻辑，让 Developer 可以查看 `NULL` 角色的记录

---

## 🎓 最佳实践

### 1. 始终使用角色过滤
```python
# ✅ 正确：使用 allowed_roles
logs = await audit_log_crud.get_multi(
    db=db,
    allowed_roles=["developer", "operator", "user"]
)

# ❌ 错误：不使用 allowed_roles
logs = await audit_log_crud.get_multi(db=db)
```

### 2. 记录审计日志时确保 user_role 字段
```python
# ✅ 正确：记录 user_role
audit_log = AuditLog(
    user_id=current_user.id,
    username=current_user.username,
    user_role=current_user.role.value,  # ⭐ 必须
    # ... 其他字段 ...
)

# ❌ 错误：不记录 user_role
audit_log = AuditLog(
    user_id=current_user.id,
    username=current_user.username,
    # user_role 缺失
)
```

### 3. API 文档中说明权限
```python
@router.get(
    "/audit-logs",
    summary="查询审计日志",
    description="""
    查询审计日志（支持多维度筛选和分页）
    
    权限要求：
    - Developer：可以查看所有审计日志
    - Operator：可以查看 Operator 和 User 级别的审计日志
    - User：只能查看自己的审计日志
    """
)
async def query_audit_logs(...):
    ...
```

---

**实施时间**：2025-11-06
**版本**：v1.0.0

