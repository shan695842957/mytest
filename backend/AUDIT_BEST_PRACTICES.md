# 审计日志最佳实践

## 📋 概述

本文档详细说明 FastAPI/Python 中审计日志的三种实现方式，对比优劣，推荐最佳实践。

---

## 🎯 三种实现方式对比

| 方式 | 原理 | 优点 | 缺点 | 推荐度 |
|------|------|------|------|--------|
| **方案1：中间件** | 类似 Java AOP 切片拦截 | ✅ 自动拦截<br>✅ 零侵入<br>✅ 统一管理 | ⚠️ 需要额外配置元数据 | ⭐⭐⭐⭐⭐ |
| **方案2：依赖注入** | FastAPI 特色 | ✅ 类型安全<br>✅ 显式声明<br>✅ 易于测试 | ⚠️ 需要在每个路由声明 | ⭐⭐⭐⭐ |
| **方案3：手动调用** | 业务代码自觉 | ✅ 完全控制<br>✅ 灵活 | ❌ 容易遗漏<br>❌ 代码冗余 | ⭐⭐ |

---

## 🌟 方案1：中间件（推荐）

### 原理

类似 **Java Spring AOP** 的切面拦截，在请求进入和离开时自动拦截。

```
客户端请求
    ↓
[中间件拦截] ← 自动记录开始时间、请求体
    ↓
业务逻辑处理
    ↓
[中间件拦截] ← 自动记录审计日志
    ↓
返回响应
```

### 实现

#### 1. 注册中间件

```python
# app/main.py
from app.middleware import AuditMiddleware, AuthMiddleware

app = FastAPI(...)

# 注册认证中间件（提取用户信息）
app.add_middleware(AuthMiddleware)

# 注册审计中间件（自动记录）
app.add_middleware(AuditMiddleware)
```

#### 2. 在路由中设置审计元数据

**方式A：使用装饰器（推荐）**

```python
from app.middleware.audit import audit_route

@router.post("/users")
@audit_route(
    module="auth",
    action="create_user",
    action_key="audit.action.user_created"
)
async def create_user(...):
    """创建用户"""
    user = await user_crud.create(db, user_in)
    
    # 设置审计目标信息
    from app.core.dependencies import set_audit_target
    set_audit_target(request, "user", str(user.id), user.username)
    
    return success_response(data=user)
```

**方式B：使用 request.state（更灵活）**

```python
@router.post("/users")
async def create_user(request: Request, ...):
    """创建用户"""
    
    # 设置审计元数据（在业务逻辑中）
    if not hasattr(request.state, "audit_context"):
        from app.api.deps import AuditContext
        request.state.audit_context = AuditContext()
    
    request.state.audit_context.module = "auth"
    request.state.audit_context.action = "create_user"
    request.state.audit_context.action_key = "audit.action.user_created"
    
    # 业务逻辑
    user = await user_crud.create(db, user_in)
    
    # 设置目标信息
    request.state.audit_context.target_type = "user"
    request.state.audit_context.target_id = str(user.id)
    request.state.audit_context.target_name = user.username
    
    return success_response(data=user)
```

### 优点

1. ✅ **零侵入** - 业务代码无需手动调用 `AuditLogger.log()`
2. ✅ **自动拦截** - 所有 POST/PUT/PATCH/DELETE 自动记录
3. ✅ **统一管理** - 审计逻辑集中在中间件
4. ✅ **性能监控** - 自动记录执行时长
5. ✅ **不易遗漏** - 只要是修改操作就会被拦截

### 缺点

⚠️ 需要业务代码设置审计元数据（module、action、target）

### 适用场景

- ✅ **大型项目** - 接口多，统一管理
- ✅ **团队协作** - 避免遗漏
- ✅ **审计要求高** - 确保所有操作都被记录

---

## 🎨 方案2：依赖注入

### 原理

利用 **FastAPI 的依赖注入系统**，在路由参数中声明审计依赖。

```python
@router.post("/users")
async def create_user(
    ...,
    _audit: AuditContext = Depends(audit.inject)  # 依赖注入
):
    user = await user_crud.create(db, user_in)
    
    # 设置目标信息
    _audit.set_target("user", str(user.id), user.username)
    
    return user
```

### 实现

#### 1. 创建审计依赖

```python
from app.core.dependencies import AuditDependency

# 创建审计依赖实例
create_user_audit = AuditDependency(
    module="auth",
    action="create_user",
    action_key="audit.action.user_created"
)
```

#### 2. 在路由中使用

```python
@router.post("/users")
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    _audit: AuditContext = Depends(create_user_audit.inject)
):
    """创建用户"""
    user = await user_crud.create(db, user_in)
    
    # 设置目标信息
    _audit.set_target("user", str(user.id), user.username)
    
    return success_response(data=user)
```

### 优点

1. ✅ **类型安全** - 利用 FastAPI 的类型系统
2. ✅ **显式声明** - 一眼看出哪些路由有审计
3. ✅ **易于测试** - 可以 mock 依赖
4. ✅ **IDE 友好** - 自动完成和类型检查

### 缺点

⚠️ 需要在每个路由参数中声明依赖（略显繁琐）

### 适用场景

- ✅ **中型项目** - 接口数量适中
- ✅ **类型安全要求高** - 充分利用 FastAPI 特性
- ✅ **需要精细控制** - 某些接口需要特殊审计逻辑

---

## 📝 方案3：手动调用（不推荐）

### 原理

在业务代码中手动调用 `AuditLogger.log()`。

```python
@router.post("/users")
async def create_user(...):
    user = await user_crud.create(db, user_in)
    
    # 手动调用审计日志 ❌
    await AuditLogger.log(
        db=db,
        request=request,
        response=response,
        current_user=current_user,
        module="auth",
        action="create_user",
        action_key="audit.action.user_created",
        target_type="user",
        target_id=str(user.id),
        target_name=user.username,
        duration_ms=...
    )
    
    return user
```

### 优点

✅ **完全控制** - 可以精确控制审计内容  
✅ **灵活** - 可以在任意位置调用

### 缺点

❌ **容易遗漏** - 依赖开发者自觉  
❌ **代码冗余** - 每个接口都要重复相似代码  
❌ **维护困难** - 审计逻辑分散在各处  
❌ **不统一** - 不同开发者可能写法不一致

### 适用场景

⚠️ **不推荐使用**，除非有特殊需求（如复杂的审计逻辑）

---

## 🏆 最佳实践推荐

### 推荐方案：**方案1（中间件） + 方案2（依赖注入）混合使用**

#### 配置

```python
# 1. 注册中间件（自动拦截所有请求）
app.add_middleware(AuthMiddleware)    # 提取用户信息
app.add_middleware(AuditMiddleware)   # 记录审计日志

# 2. 使用装饰器标记审计元数据
from app.middleware.audit import audit_route

@router.post("/users")
@audit_route(
    module="auth",
    action="create_user",
    action_key="audit.action.user_created"
)
async def create_user(request: Request, ...):
    user = await user_crud.create(db, user_in)
    
    # 3. 设置目标信息（便捷函数）
    from app.core.dependencies import set_audit_target
    set_audit_target(request, "user", str(user.id), user.username)
    
    return success_response(data=user)
```

#### 优势

1. ✅ **自动化** - 中间件自动拦截，不易遗漏
2. ✅ **声明式** - 装饰器清晰标记审计信息
3. ✅ **简洁** - 业务代码只需设置目标信息
4. ✅ **统一** - 审计逻辑集中管理

---

## 📊 性能对比

| 方案 | 性能开销 | 说明 |
|------|----------|------|
| 方案1：中间件 | ~2-5ms | 每个请求都会经过中间件 |
| 方案2：依赖注入 | ~1-3ms | 只在声明的路由执行 |
| 方案3：手动调用 | ~1-2ms | 手动控制，开销最小 |

**结论**：性能差异可以忽略，应优先考虑代码可维护性。

---

## 🔧 迁移指南

### 从手动调用（方案3）迁移到中间件（方案1）

#### 步骤1：注册中间件

```python
# app/main.py
from app.middleware import AuditMiddleware, AuthMiddleware

app.add_middleware(AuthMiddleware)
app.add_middleware(AuditMiddleware)
```

#### 步骤2：更新路由

**迁移前（手动调用）：**

```python
@router.post("/users")
async def create_user(...):
    start_time = time.time()
    user = await user_crud.create(db, user_in)
    
    # 手动调用 ❌
    await AuditLogger.log(
        db=db,
        request=request,
        response=response,
        current_user=current_user,
        module="auth",
        action="create_user",
        action_key="audit.action.user_created",
        target_type="user",
        target_id=str(user.id),
        target_name=user.username,
        duration_ms=int((time.time() - start_time) * 1000)
    )
    
    return success_response(data=user)
```

**迁移后（中间件）：**

```python
from app.middleware.audit import audit_route
from app.core.dependencies import set_audit_target

@router.post("/users")
@audit_route(
    module="auth",
    action="create_user",
    action_key="audit.action.user_created"
)
async def create_user(request: Request, ...):
    user = await user_crud.create(db, user_in)
    
    # 只需设置目标信息 ✅
    set_audit_target(request, "user", str(user.id), user.username)
    
    return success_response(data=user)
```

**代码减少：~15行 → ~3行（减少80%）**

---

## 📚 Java Spring AOP 对比

### Java Spring AOP

```java
@Aspect
@Component
public class AuditAspect {
    
    @Around("@annotation(audit)")
    public Object logAudit(ProceedingJoinPoint joinPoint, Audit audit) {
        // 前置：记录开始时间
        long start = System.currentTimeMillis();
        
        try {
            // 执行业务逻辑
            Object result = joinPoint.proceed();
            
            // 后置：记录审计日志
            auditService.log(audit, result, start);
            
            return result;
        } catch (Exception e) {
            // 异常处理
        }
    }
}

// 使用
@PostMapping("/users")
@Audit(module="auth", action="create_user")
public User createUser(@RequestBody UserCreate userIn) {
    return userService.create(userIn);
}
```

### FastAPI 中间件（等价实现）

```python
# 中间件（等价于 @Around）
class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start = time.time()
        
        # 执行业务逻辑
        response = await call_next(request)
        
        # 记录审计日志
        await self._log_audit(request, response, start)
        
        return response

# 使用（等价于 @Audit）
@router.post("/users")
@audit_route(module="auth", action="create_user")
async def create_user(user_in: UserCreate):
    return await user_service.create(user_in)
```

**结论**：FastAPI 中间件 = Java Spring AOP

---

## ✅ 总结

| 场景 | 推荐方案 |
|------|----------|
| **新项目** | 方案1（中间件） |
| **大型项目** | 方案1（中间件） |
| **中型项目** | 方案1 + 方案2 混合 |
| **小型项目** | 方案2（依赖注入） |
| **特殊需求** | 方案3（手动调用） |

**最佳实践**：
1. 优先使用中间件（自动化）
2. 使用装饰器标记元数据（声明式）
3. 使用便捷函数设置目标信息（简洁）
4. 避免手动调用（除非特殊需求）

---

**文档版本**: 1.0.0  
**最后更新**: 2024-01-01

