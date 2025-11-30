# Auth 模块开发文档

## 📋 概述

Auth 模块实现了完整的用户认证和授权系统，支持复杂的角色权限控制。

## 🎯 核心功能

### 1. 角色系统

三个角色，权限级别从高到低：

| 角色 | 英文标识 | 权限级别 | 描述 |
|------|---------|----------|------|
| 开发者 | `developer` | 3 | 最高权限 |
| 运维者 | `operator` | 2 | 中等权限 |
| 用户 | `user` | 1 | 基础权限 |

### 2. 内置账号

系统预置三个内置账号（不可删除，可修改密码）：

| 用户名 | 角色 | 初始密码 |
|--------|------|----------|
| `admin_developer` | developer | Admin@123 |
| `admin_operator` | operator | Admin@123 |
| `admin_user` | user | Admin@123 |

⚠️ **安全提示**：生产环境请立即修改初始密码！

### 3. 权限规则

#### 创建用户
- ✅ 高角色可以创建低角色账号
- ✅ 内置账号可以创建同级别账号
- ❌ 不支持注册，只能被创建

**示例**：
- `admin_developer` 可以创建 developer/operator/user 账号
- `admin_operator` 可以创建 operator/user 账号（不能创建 developer）
- `admin_user` 只能创建 user 账号

#### 查看用户
- ✅ 可以查看自己
- ✅ 高角色可以查看低角色
- ✅ 内置账号可以查看同级别账号
- ✅ 创建者可以查看自己创建的账号

#### 更新用户
- ✅ 高角色可以更新低角色
- ✅ 内置账号可以更新同级别账号（除了自己）
- ❌ 不能更新自己（修改密码除外）

#### 删除用户
- ✅ 高角色可以删除低角色
- ✅ 内置账号可以删除同级别的非内置账号
- ❌ 内置账号不可删除
- ❌ 不能删除自己

#### 修改密码
- ✅ 可以修改自己的密码（需要验证旧密码）
- ✅ 高角色可以修改低角色的密码（无需旧密码）

## 🗄️ 数据库设计

### 用户表 (users)

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 用户ID
    username VARCHAR(50) NOT NULL UNIQUE,  -- 用户名
    hashed_password VARCHAR(255) NOT NULL, -- 密码哈希
    role VARCHAR(20) NOT NULL,             -- 角色
    is_builtin BOOLEAN NOT NULL DEFAULT 0, -- 是否为内置账号
    is_active BOOLEAN NOT NULL DEFAULT 1,  -- 是否激活
    created_by INTEGER,                    -- 创建者ID
    created_at DATETIME NOT NULL,          -- 创建时间
    updated_at DATETIME NOT NULL,          -- 更新时间
    
    FOREIGN KEY (created_by) REFERENCES users(id),
    CHECK (role IN ('developer', 'operator', 'user'))
);
```

### 索引

- `idx_users_username`: 用户名索引（唯一）
- `idx_users_role`: 角色索引
- `idx_users_is_active`: 激活状态索引
- `idx_users_created_by`: 创建者索引

## 🔌 API 接口

### 1. 登录

**POST** `/api/v1/login`

```bash
curl -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin_developer",
    "password": "Admin@123"
  }'
```

**响应**：

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

### 2. 获取当前用户信息

**GET** `/api/v1/users/me`

```bash
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**响应**：

```json
{
  "id": 1,
  "username": "admin_developer",
  "role": "developer",
  "is_active": true,
  "is_builtin": true,
  "created_by": null,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-01T00:00:00"
}
```

### 3. 创建用户

**POST** `/api/v1/users`

```bash
curl -X POST http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "password": "Test@123456",
    "role": "user"
  }'
```

### 4. 获取用户列表

**GET** `/api/v1/users?skip=0&limit=10&role=user`

```bash
curl -X GET "http://localhost:8000/api/v1/users?skip=0&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. 获取指定用户

**GET** `/api/v1/users/{user_id}`

```bash
curl -X GET http://localhost:8000/api/v1/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. 更新用户（激活/禁用）

**PATCH** `/api/v1/users/{user_id}`

```bash
curl -X PATCH http://localhost:8000/api/v1/users/2 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": false
  }'
```

### 7. 删除用户

**DELETE** `/api/v1/users/{user_id}`

```bash
curl -X DELETE http://localhost:8000/api/v1/users/2 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 8. 修改密码

**POST** `/api/v1/users/{user_id}/change-password`

**修改自己的密码（需要旧密码）**：

```bash
curl -X POST http://localhost:8000/api/v1/users/1/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "Admin@123",
    "new_password": "NewPassword@123"
  }'
```

**管理员修改其他用户密码（无需旧密码）**：

```bash
curl -X POST http://localhost:8000/api/v1/users/2/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "",
    "new_password": "NewPassword@123"
  }'
```

## 🌐 国际化支持

所有错误消息支持中英文，通过 `Accept-Language` 请求头切换：

```bash
# 中文
curl -H "Accept-Language: zh-CN" http://localhost:8000/api/v1/login

# 英文
curl -H "Accept-Language: en-US" http://localhost:8000/api/v1/login
```

## 🔒 安全特性

### 1. 密码安全

- **哈希算法**：Bcrypt（自动加盐，防彩虹表攻击）
- **密码强度**：最少 6 位（生产环境建议增强）
- **密码验证**：支持字母、数字、特殊字符

### 2. JWT Token

- **算法**：HS256
- **过期时间**：24 小时（可配置）
- **载荷**：user_id, username, role
- **验证**：每个受保护接口自动验证 Token

### 3. 权限控制

- **分层检查**：在 API 层进行权限验证
- **细粒度控制**：针对每个操作单独检查
- **安全拒绝**：返回 403 Forbidden（无权限）或 401 Unauthorized（未认证）

## 🧪 测试场景

### 场景 1：开发者创建运维者

```bash
# 1. 开发者登录
TOKEN=$(curl -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_developer","password":"Admin@123"}' \
  | jq -r '.access_token')

# 2. 创建运维者账号
curl -X POST http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "operator1",
    "password": "Pass@123456",
    "role": "operator"
  }'
```

### 场景 2：内置账号创建同级账号

```bash
# 1. 内置运维者登录
TOKEN=$(curl -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_operator","password":"Admin@123"}' \
  | jq -r '.access_token')

# 2. 创建另一个运维者账号
curl -X POST http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "operator2",
    "password": "Pass@123456",
    "role": "operator"
  }'
```

### 场景 3：用户查看自己创建的账号

```bash
# 查看自己创建的账号列表
curl -X GET http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer $TOKEN"
```

### 场景 4：修改密码

```bash
# 修改自己的密码
curl -X POST http://localhost:8000/api/v1/users/1/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "Admin@123",
    "new_password": "NewPassword@123"
  }'
```

## 📁 项目结构

```
backend/
├── app/
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py              # User 模型和 UserRole 枚举
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── user.py              # Pydantic Schemas
│   ├── crud/
│   │   ├── __init__.py
│   │   └── user.py              # 用户 CRUD 操作
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py          # JWT、密码哈希
│   │   └── permissions.py       # 权限检查
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py              # 依赖注入（get_current_user）
│   │   └── auth.py              # Auth API 接口
│   ├── scripts/
│   │   ├── __init__.py
│   │   └── init_builtin_users.py # 初始化内置账号
│   └── locales/
│       ├── zh_CN.json           # 中文翻译
│       └── en_US.json           # 英文翻译
├── database/
│   └── init_schema.sql          # 数据库建表脚本
└── AUTH_MODULE.md               # 本文档
```

## 🚀 快速开始

### 1. 启动服务

```bash
cd backend
./start.sh
```

### 2. 访问文档

打开浏览器访问：http://localhost:8000/docs

### 3. 测试登录

在 Swagger UI 中：
1. 展开 **POST /api/v1/login**
2. 点击 **Try it out**
3. 输入：
   ```json
   {
     "username": "admin_developer",
     "password": "Admin@123"
   }
   ```
4. 点击 **Execute**
5. 复制返回的 `access_token`

### 4. 认证测试

1. 点击页面右上角的 **Authorize** 按钮
2. 在弹窗中输入：`Bearer YOUR_TOKEN`
3. 点击 **Authorize**
4. 现在可以测试其他需要认证的接口

## 🔧 配置

### JWT 密钥（生产环境必改！）

编辑 `app/core/security.py`：

```python
SECRET_KEY = "your-secret-key-change-in-production"  # 使用环境变量
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24小时
```

建议使用环境变量：

```bash
export JWT_SECRET_KEY="your-very-long-random-secret-key"
```

### 密码策略

编辑 `app/schemas/user.py` 中的 `password_strength` 验证器：

```python
@field_validator("password")
@classmethod
def password_strength(cls, v: str) -> str:
    """增强密码强度验证"""
    if len(v) < 8:
        raise ValueError("密码长度至少8位")
    if not any(c.isupper() for c in v):
        raise ValueError("密码必须包含大写字母")
    if not any(c.islower() for c in v):
        raise ValueError("密码必须包含小写字母")
    if not any(c.isdigit() for c in v):
        raise ValueError("密码必须包含数字")
    return v
```

## 📊 权限矩阵

| 操作 | Developer | Operator | User | 内置账号特权 |
|------|-----------|----------|------|--------------|
| 创建 Developer | ✅ | ❌ | ❌ | 内置 Developer 可创建 |
| 创建 Operator | ✅ | ❌ | ❌ | 内置 Operator 可创建 |
| 创建 User | ✅ | ✅ | ❌ | 内置 User 可创建 |
| 查看高级角色 | ✅ | ❌ | ❌ | 内置账号可查看同级 |
| 查看低级角色 | ✅ | ✅ | ❌ | - |
| 查看自己 | ✅ | ✅ | ✅ | - |
| 查看创建的账号 | ✅ | ✅ | ✅ | - |
| 更新低级角色 | ✅ | ✅ | ❌ | 内置账号可更新同级 |
| 删除低级角色 | ✅ | ✅ | ❌ | 内置账号可删除同级非内置 |
| 删除内置账号 | ❌ | ❌ | ❌ | ❌ |
| 修改自己密码 | ✅ | ✅ | ✅ | ✅ |
| 修改低级密码 | ✅ | ✅ | ❌ | ❌ |

## 🐛 常见问题

### Q1: 内置账号可以删除吗？

**A**: 不可以。内置账号 (`is_builtin=true`) 不可删除，但可以修改密码。

### Q2: 如何重置内置账号密码？

**A**: 重新运行初始化脚本：

```bash
python -m app.scripts.init_builtin_users
```

### Q3: 普通用户可以看到其他用户吗？

**A**: 只能看到自己创建的用户，不能看到其他用户。

### Q4: Token 过期了怎么办？

**A**: 重新登录获取新的 Token。

### Q5: 如何添加新角色？

**A**: 编辑 `app/models/user.py` 中的 `UserRole` 枚举，并更新 `level` 属性。

## 📝 TODO

- [ ] 添加刷新 Token 机制
- [ ] 支持 OAuth2 第三方登录
- [ ] 添加操作日志（审计）
- [ ] 支持多因素认证（MFA）
- [ ] 添加密码重置（邮件）
- [ ] 支持 API Key 认证

## 📄 许可证

MIT

