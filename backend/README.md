# LCCU-V Backend API

生产级 FastAPI 后端服务，支持异步 SQLite、国际化、完整的认证授权系统。

---

## ⚠️ 开发者必读

**在开始开发新功能之前，请务必阅读：**

1. **📘 [AI_DEVELOPMENT_RULES.md](./AI_DEVELOPMENT_RULES.md)** - 完整开发规范（⭐⭐⭐ 必读）
2. **📙 [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - 快速参考手册

**核心原则**：
- ✅ 优先参考现有实现（`app/api/auth.py`）
- ✅ 使用统一响应格式（`ApiResponse`）
- ✅ 使用自动审计（`@audit_route` 装饰器）
- ✅ 支持国际化（`t()` 函数）
- ❌ 不要引入新技术栈（除非绝对必要）

---

## 🌟 核心特性

- ✅ **异步 SQLite**: 使用 aiosqlite + SQLAlchemy 2.0，非阻塞数据库操作
- ✅ **认证授权**: 基于 JWT 的用户认证，复杂的角色权限控制
- ✅ **国际化 (i18n)**: 支持中文和英文，自动语言检测
- ✅ **RESTful API**: 标准的 REST 接口设计
- ✅ **自动文档**: Swagger UI + ReDoc 交互式文档
- ✅ **生产就绪**: 完整的错误处理、日志、安全特性

## 技术栈

| 组件 | 版本 | 用途 |
|------|------|------|
| FastAPI | 0.109.0 | 现代高性能 Web 框架 |
| SQLAlchemy | 2.0.25 | 异步 ORM |
| aiosqlite | 0.19.0 | 异步 SQLite 驱动 |
| Pydantic | 2.5.3 | 数据验证和配置管理 |
| python-jose | 3.3.0 | JWT Token 生成和验证 |
| passlib | 1.7.4 | 密码哈希（Bcrypt） |
| Babel | 2.14.0 | 国际化支持 |
| Uvicorn | 0.27.0 | ASGI 服务器 |

## 项目结构

```
backend/
├── app/
│   ├── __init__.py           # 应用包初始化
│   ├── main.py               # FastAPI 应用主入口
│   ├── config.py             # 配置管理（Pydantic Settings）
│   ├── database.py           # 数据库配置（异步 SQLite）
│   ├── i18n.py               # 国际化支持
│   ├── models/               # 数据库模型
│   │   ├── __init__.py
│   │   └── user.py           # User 模型和 UserRole 枚举
│   ├── schemas/              # Pydantic Schemas
│   │   ├── __init__.py
│   │   └── user.py           # 用户相关的请求/响应模型
│   ├── crud/                 # 数据库 CRUD 操作
│   │   ├── __init__.py
│   │   └── user.py           # 用户 CRUD
│   ├── core/                 # 核心功能
│   │   ├── __init__.py
│   │   ├── security.py       # JWT、密码哈希
│   │   └── permissions.py    # 权限检查
│   ├── api/                  # API 路由
│   │   ├── __init__.py
│   │   ├── deps.py           # 依赖注入
│   │   ├── health.py         # 健康检查接口
│   │   └── auth.py           # 认证和用户管理接口
│   ├── scripts/              # 脚本
│   │   ├── __init__.py
│   │   └── init_builtin_users.py  # 初始化内置账号
│   └── locales/              # 翻译文件
│       ├── zh_CN.json        # 简体中文
│       └── en_US.json        # 英文
├── database/                 # 数据库相关
│   └── init_schema.sql       # 数据库建表脚本（含中文注释）
├── data/                     # 数据目录（自动创建）
│   └── app.db                # SQLite 数据库
├── requirements.txt          # Python 依赖
├── .env                      # 环境变量
├── .env.example              # 环境变量示例
├── .gitignore                # Git 忽略文件
├── run.py                    # 开发服务器启动脚本
├── start.sh                  # 一键启动脚本（推荐）
├── README.md                 # 本文件
└── AUTH_MODULE.md            # Auth 模块详细文档
```

## 🚀 快速开始

### 方式 1：一键启动（推荐）

```bash
cd backend
./start.sh
```

### 方式 2：手动启动

```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 启动开发服务器
python run.py
```

### 访问服务

- **API 根路径**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **健康检查**: http://localhost:8000/api/v1/health

## 📖 API 文档

### 健康检查接口

#### GET /api/v1/health

完整健康检查（包含数据库连接状态）

```bash
curl http://localhost:8000/api/v1/health
```

**响应示例：**

```json
{
  "status": "healthy",
  "message": "服务健康",
  "timestamp": "2024-01-01T12:00:00",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "healthy",
      "message": "数据库已连接"
    }
  }
}
```

#### GET /api/v1/health/live

Kubernetes 存活探针（轻量级检查）

#### GET /api/v1/health/ready

Kubernetes 就绪探针（检查依赖项）

### Auth 模块接口

完整的用户认证和授权系统，详见 [AUTH_MODULE.md](./AUTH_MODULE.md)

#### 核心接口：

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/v1/login` | 用户登录（获取 JWT Token） |
| GET | `/api/v1/users/me` | 获取当前用户信息 |
| POST | `/api/v1/users` | 创建用户 |
| GET | `/api/v1/users` | 获取用户列表 |
| GET | `/api/v1/users/{id}` | 获取指定用户 |
| PATCH | `/api/v1/users/{id}` | 更新用户 |
| DELETE | `/api/v1/users/{id}` | 删除用户 |
| POST | `/api/v1/users/{id}/change-password` | 修改密码 |

#### 快速测试：

```bash
# 1. 登录获取 Token
TOKEN=$(curl -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_developer","password":"Admin@123"}' \
  | jq -r '.access_token')

# 2. 获取当前用户信息
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"

# 3. 创建新用户
curl -X POST http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "password": "Test@123456",
    "role": "user"
  }'
```

## 🔐 内置账号

系统预置三个内置账号（**初始密码: Admin@123，请立即修改！**）

| 用户名 | 角色 | 权限级别 | 描述 |
|--------|------|----------|------|
| `admin_developer` | developer | 3 | 开发者（最高权限） |
| `admin_operator` | operator | 2 | 运维者（中等权限） |
| `admin_user` | user | 1 | 用户（基础权限） |

**特性：**
- ✅ 不可删除
- ✅ 可修改密码
- ✅ 可创建同级别账号
- ✅ 可管理低级别账号

## 🌐 国际化支持

所有 API 响应支持中英文，通过 `Accept-Language` 请求头切换：

```bash
# 中文响应
curl -H "Accept-Language: zh-CN" http://localhost:8000/api/v1/health

# 英文响应
curl -H "Accept-Language: en-US" http://localhost:8000/api/v1/health
```

支持的语言：
- `zh-CN`: 简体中文（默认）
- `en-US`: 英文

### 添加新语言

1. 在 `app/locales/` 创建 `{locale}.json`
2. 在 `.env` 的 `SUPPORTED_LOCALES` 中添加语言代码

## 🔒 权限系统

### 角色层级

```
Developer (权限级别 3)
    ↓ 可管理
Operator (权限级别 2)
    ↓ 可管理
User (权限级别 1)
```

### 权限规则

#### 创建用户
- ✅ 高角色可以创建低角色账号
- ✅ 内置账号可以创建同级别账号
- ❌ 不支持注册，只能被创建

#### 查看用户
- ✅ 可以查看自己
- ✅ 高角色可以查看低角色
- ✅ 内置账号可以查看同级别账号
- ✅ 创建者可以查看自己创建的账号

#### 更新/删除用户
- ✅ 高角色可以更新/删除低角色
- ✅ 内置账号可以管理同级别的非内置账号
- ❌ 内置账号不可删除

#### 修改密码
- ✅ 可以修改自己的密码（需验证旧密码）
- ✅ 高角色可以修改低角色的密码（无需旧密码）

详细权限矩阵请参考 [AUTH_MODULE.md](./AUTH_MODULE.md)

## 🗄️ 数据库

### SQLite 数据库

- **位置**: `data/app.db`
- **类型**: SQLite 3（通过 aiosqlite 异步访问）
- **连接池**: NullPool（SQLite 特殊配置）
- **自动创建**: 首次启动时自动创建表结构和内置账号

### 数据库表

#### users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键（自增） |
| username | VARCHAR(50) | 用户名（唯一） |
| hashed_password | VARCHAR(255) | 密码哈希（Bcrypt） |
| role | VARCHAR(20) | 角色（developer/operator/user） |
| is_builtin | BOOLEAN | 是否为内置账号 |
| is_active | BOOLEAN | 是否激活 |
| created_by | INTEGER | 创建者ID |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### 手动初始化数据库

```bash
# 使用 SQL 脚本初始化（可选）
sqlite3 data/app.db < database/init_schema.sql

# 或使用 Python 脚本初始化内置账号
python -m app.scripts.init_builtin_users
```

## 🛠️ 开发指南

### 添加新的 API 模块

1. 在 `app/api/` 创建新的路由文件（如 `items.py`）
2. 在 `app/main.py` 中注册路由

```python
# app/api/items.py
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user

router = APIRouter(tags=["物品管理"])

@router.get("/items")
async def get_items(current_user = Depends(get_current_user)):
    return []

# app/main.py
from app.api import items

app.include_router(
    items.router,
    prefix=settings.api_prefix,
    tags=["物品管理"]
)
```

### 添加数据库模型

```python
# app/models/item.py
from sqlalchemy import Column, Integer, String
from app.database import Base

class Item(Base):
    __tablename__ = "items"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
```

### 使用依赖注入

```python
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.api.deps import get_current_user, get_locale
from app.models.user import User

@router.get("/example")
async def example(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale)
):
    # 使用数据库会话、当前用户、语言
    pass
```

## 🧪 测试

### 使用 Swagger UI 测试

1. 访问 http://localhost:8000/docs
2. 使用内置账号登录获取 Token
3. 点击右上角 **Authorize** 按钮
4. 输入 `Bearer YOUR_TOKEN`
5. 测试其他接口

### 使用 curl 测试

参考 [AUTH_MODULE.md](./AUTH_MODULE.md) 中的测试场景

## 🚢 生产部署

### 使用 Gunicorn + Uvicorn Workers

```bash
pip install gunicorn

gunicorn app.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

### Docker 部署

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建数据目录
RUN mkdir -p data

# 暴露端口
EXPOSE 8000

# 启动服务
CMD ["gunicorn", "app.main:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000"]
```

```bash
# 构建镜像
docker build -t lccu-v-backend .

# 运行容器
docker run -d -p 8000:8000 -v $(pwd)/data:/app/data lccu-v-backend
```

### 环境变量配置（生产环境）

```bash
# .env
DEBUG=false
LOG_LEVEL=warning
DATABASE_URL=sqlite+aiosqlite:///./data/prod.db
CORS_ORIGINS=https://yourdomain.com
JWT_SECRET_KEY=your-very-long-random-secret-key
```

## 🔧 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| APP_NAME | LCCU-V API | 应用名称 |
| APP_VERSION | 1.0.0 | 应用版本 |
| DEBUG | false | 调试模式 |
| LOG_LEVEL | info | 日志级别 |
| DATABASE_URL | sqlite+aiosqlite:///./data/app.db | 数据库连接 |
| DEFAULT_LOCALE | zh_CN | 默认语言 |
| SUPPORTED_LOCALES | zh_CN,en_US | 支持的语言 |
| API_PREFIX | /api/v1 | API 路径前缀 |
| CORS_ORIGINS | http://localhost:3000 | CORS 允许的源 |

### JWT 配置

编辑 `app/core/security.py`：

```python
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24小时
```

## 📊 项目状态

- ✅ 基础架构：完成
- ✅ 健康检查：完成
- ✅ Auth 模块：完成
- ✅ 国际化：完成
- ✅ 文档：完成
- ⏳ 其他业务模块：待开发

## 📝 开发计划

- [ ] 添加刷新 Token 机制
- [ ] 实现操作日志（审计）
- [ ] 添加 API 限流
- [ ] 支持文件上传
- [ ] 添加缓存层（Redis）
- [ ] 支持 OAuth2 第三方登录

## 🐛 常见问题

### Q: 如何修改内置账号密码？

**A**: 使用 `/api/v1/users/{user_id}/change-password` 接口修改。

### Q: Token 过期了怎么办？

**A**: 重新调用 `/api/v1/login` 接口获取新 Token。

### Q: 如何查看数据库内容？

**A**: 使用 SQLite 客户端工具：

```bash
sqlite3 data/app.db
sqlite> SELECT * FROM users;
```

### Q: 如何重置所有数据？

**A**: 删除数据库文件并重启服务：

```bash
rm data/app.db
python run.py
```

## 📚 相关文档

- [AUTH_MODULE.md](./AUTH_MODULE.md) - Auth 模块详细文档
- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0 文档](https://docs.sqlalchemy.org/en/20/)
- [Pydantic 文档](https://docs.pydantic.dev/)

## 📄 许可证

MIT

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

---

**开发者**: Claude Sonnet 4.5  
**最后更新**: 2024-01-01
