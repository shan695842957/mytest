# 时区兼容性分析文档

> **创建时间**: 2025-01-XX  
> **作者**: AI Assistant  
> **状态**: 待评审

---

## 1. 问题概述

### 1.1 当前设计

项目中所有时间字段都使用 `DATETIME` 类型，并使用 `CURRENT_TIMESTAMP` 作为默认值：

```sql
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
```

### 1.2 潜在问题

**SQLite 的 DATETIME 类型特性**：
- SQLite 没有真正的 DATETIME 类型，实际存储为 **TEXT** 类型
- `CURRENT_TIMESTAMP` 返回的是**服务器的本地时间**（不带时区信息）
- 格式为：`"YYYY-MM-DD HH:MM:SS"`（例如：`"2025-01-01 12:00:00"`）

**时区兼容性问题**：

1. **跨时区部署问题**：
   - 服务器在中国（UTC+8）：存储 `"2025-01-01 12:00:00"`（实际是 UTC+8 时间）
   - 服务器在美国（UTC-5）：存储 `"2025-01-01 12:00:00"`（实际是 UTC-5 时间）
   - **相同的时间戳字符串，实际代表不同的 UTC 时间**

2. **数据迁移问题**：
   - 从中国服务器导出数据到美国服务器
   - 时间字符串相同，但实际时间相差 13 小时
   - **无法正确判断事件的真实发生时间**

3. **前端显示问题**：
   - 前端在不同时区访问
   - 无法正确转换时间显示
   - **用户看到的时间可能不准确**

4. **时间比较问题**：
   - 跨时区的时间比较可能出错
   - 排序、筛选功能可能异常

---

## 2. 问题示例

### 2.1 场景：跨时区部署

**场景**：
- 中国服务器（UTC+8）：2025-01-01 12:00:00（本地时间）
- 美国服务器（UTC-5）：2025-01-01 12:00:00（本地时间）

**问题**：
```
中国服务器存储：  "2025-01-01 12:00:00"  → 实际 UTC 时间：2025-01-01 04:00:00 UTC
美国服务器存储：  "2025-01-01 12:00:00"  → 实际 UTC 时间：2025-01-01 17:00:00 UTC
```

**结果**：相同的时间字符串，实际相差 13 小时！

### 2.2 场景：数据迁移

**场景**：
- 从中国服务器导出数据到美国服务器
- 审计日志中的 `created_at` 字段

**问题**：
```
原始数据（中国）：  "2025-01-01 12:00:00"
导入后（美国）：    "2025-01-01 12:00:00"  （字符串相同）
实际时间差异：      13 小时
```

**结果**：无法追溯真实的事件发生时间！

### 2.3 场景：前端显示

**场景**：
- 后端存储：`"2025-01-01 12:00:00"`（服务器本地时间，UTC+8）
- 前端用户在美国（UTC-5）访问

**问题**：
```
后端返回：        "2025-01-01 12:00:00"
前端显示：        "2025-01-01 12:00:00"  （无法知道时区）
用户期望：        "2025-01-01 23:00:00"  （UTC-5 时间，实际应该是前一天的 23:00）
```

**结果**：用户看到的时间不准确！

---

## 3. 解决方案

### 3.1 方案一：存储 UTC 时间戳（推荐）⭐

**优点**：
- ✅ 时区无关，全球统一
- ✅ 存储效率高（INTEGER 类型）
- ✅ 时间比较和排序准确
- ✅ 前端可以灵活转换时区

**实现方式**：

```sql
-- 修改表结构
created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),  -- Unix 时间戳（秒）
updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
```

**后端处理**：

```python
from datetime import datetime, timezone

# 写入时：使用 UTC 时间戳
created_at = int(datetime.now(timezone.utc).timestamp())

# 读取时：转换为 datetime 对象
created_at_dt = datetime.fromtimestamp(created_at, tz=timezone.utc)

# 返回给前端：ISO8601 格式（带时区）
created_at_iso = created_at_dt.isoformat()  # "2025-01-01T04:00:00+00:00"
```

**前端处理**：

```typescript
// 接收 ISO8601 格式时间
const createdAt = new Date("2025-01-01T04:00:00+00:00");

// 转换为用户本地时间显示
const localTime = createdAt.toLocaleString();  // 根据用户时区自动转换
```

### 3.2 方案二：存储 UTC 时间的 ISO8601 字符串

**优点**：
- ✅ 时区无关，全球统一
- ✅ 人类可读
- ✅ 标准格式（ISO8601）

**缺点**：
- ❌ 存储空间较大（TEXT 类型）
- ❌ 时间比较需要转换

**实现方式**：

```sql
-- 修改表结构
created_at TEXT NOT NULL DEFAULT (datetime('now')),  -- UTC 时间，ISO8601 格式
updated_at TEXT NOT NULL DEFAULT (datetime('now'))
```

**注意**：SQLite 的 `datetime('now')` 返回的是 UTC 时间（如果系统时区设置正确）。

**后端处理**：

```python
from datetime import datetime, timezone

# 写入时：使用 UTC 时间，ISO8601 格式
created_at = datetime.now(timezone.utc).isoformat()  # "2025-01-01T04:00:00+00:00"

# 读取时：解析 ISO8601 字符串
created_at_dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
```

### 3.3 方案三：保持现状 + 应用层处理（不推荐）

**如果暂时不改数据库结构**，可以在应用层统一处理：

**后端处理**：

```python
from datetime import datetime, timezone

# 所有时间字段统一使用 UTC
class BaseModel:
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```

**问题**：
- ❌ 数据库中的 `CURRENT_TIMESTAMP` 仍然是服务器本地时间
- ❌ 触发器中的 `CURRENT_TIMESTAMP` 仍然是服务器本地时间
- ❌ 需要修改所有触发器和默认值

---

## 4. 推荐方案：UTC 时间戳

### 4.1 数据库修改

**修改所有表的 time 字段**：

```sql
-- 原设计
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP

-- 推荐设计
created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),  -- Unix 时间戳（秒）
updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
```

**修改所有触发器**：

```sql
-- 原设计
CREATE TRIGGER update_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- 推荐设计
CREATE TRIGGER update_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = strftime('%s', 'now') WHERE id = OLD.id;
END;
```

### 4.2 后端代码修改

**SQLAlchemy 模型**：

```python
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, func

class BaseModel:
    created_at = Column(
        Integer,
        nullable=False,
        default=lambda: int(datetime.now(timezone.utc).timestamp()),
        server_default=func.strftime('%s', 'now')
    )
    updated_at = Column(
        Integer,
        nullable=False,
        default=lambda: int(datetime.now(timezone.utc).timestamp()),
        server_default=func.strftime('%s', 'now'),
        onupdate=lambda: int(datetime.now(timezone.utc).timestamp())
    )
```

**Pydantic Schema**：

```python
from datetime import datetime, timezone
from pydantic import Field

class BaseSchema:
    created_at: datetime = Field(..., description="创建时间（UTC）")
    updated_at: datetime = Field(..., description="更新时间（UTC）")
    
    @classmethod
    def from_orm_with_timestamp(cls, obj):
        """从 ORM 对象转换，处理时间戳"""
        data = obj.__dict__.copy()
        if isinstance(data.get('created_at'), int):
            data['created_at'] = datetime.fromtimestamp(data['created_at'], tz=timezone.utc)
        if isinstance(data.get('updated_at'), int):
            data['updated_at'] = datetime.fromtimestamp(data['updated_at'], tz=timezone.utc)
        return cls(**data)
```

**API 响应**：

```python
from datetime import datetime, timezone

def format_timestamp(ts: int) -> str:
    """将时间戳转换为 ISO8601 格式（带时区）"""
    dt = datetime.fromtimestamp(ts, tz=timezone.utc)
    return dt.isoformat()  # "2025-01-01T04:00:00+00:00"
```

### 4.3 前端代码修改

**时间显示组件**：

```typescript
import { format, parseISO } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

// 接收 ISO8601 格式时间（带时区）
const createdAt = "2025-01-01T04:00:00+00:00";

// 转换为用户本地时间
const localTime = utcToZonedTime(parseISO(createdAt), Intl.DateTimeFormat().resolvedOptions().timeZone);

// 格式化显示
const displayTime = format(localTime, 'yyyy-MM-dd HH:mm:ss');
```

---

## 5. 迁移方案

### 5.1 数据迁移脚本

如果已有数据，需要迁移：

```sql
-- 1. 添加新列（临时）
ALTER TABLE users ADD COLUMN created_at_new INTEGER;
ALTER TABLE users ADD COLUMN updated_at_new INTEGER;

-- 2. 迁移数据（假设原数据是 UTC+8 时区）
-- 需要根据实际情况调整时区偏移
UPDATE users 
SET created_at_new = strftime('%s', created_at) - 8*3600,  -- 减去 8 小时（UTC+8 → UTC）
    updated_at_new = strftime('%s', updated_at) - 8*3600;

-- 3. 删除旧列
ALTER TABLE users DROP COLUMN created_at;
ALTER TABLE users DROP COLUMN updated_at;

-- 4. 重命名新列
ALTER TABLE users RENAME COLUMN created_at_new TO created_at;
ALTER TABLE users RENAME COLUMN updated_at_new TO updated_at;
```

**注意**：迁移前需要确认原数据的时区！

### 5.2 渐进式迁移

如果数据量大，可以采用渐进式迁移：

1. **阶段一**：新表使用新格式，旧表保持不变
2. **阶段二**：逐步迁移旧表数据
3. **阶段三**：统一所有表格式

---

## 6. 总结

### 6.1 问题确认

✅ **确认存在时区兼容性问题**：
- SQLite 的 `DATETIME` + `CURRENT_TIMESTAMP` 存储的是服务器本地时间
- 跨时区部署会导致时间不一致
- 数据迁移会导致时间错误

### 6.2 推荐方案

✅ **推荐使用 UTC 时间戳（INTEGER 类型）**：
- 时区无关，全球统一
- 存储效率高
- 时间比较准确
- 前端可以灵活转换

### 6.3 实施建议

1. **立即修改新表设计**：所有新表使用 INTEGER 时间戳
2. **逐步迁移旧表**：制定迁移计划，逐步修改
3. **统一后端处理**：所有时间字段统一使用 UTC
4. **前端时区转换**：前端根据用户时区自动转换显示

---

## 7. 参考资源

- [SQLite Date and Time Functions](https://www.sqlite.org/lang_datefunc.html)
- [ISO 8601 - Wikipedia](https://en.wikipedia.org/wiki/ISO_8601)
- [UTC vs Local Time - Best Practices](https://en.wikipedia.org/wiki/Coordinated_Universal_Time)
- [Python datetime.timezone](https://docs.python.org/3/library/datetime.html#datetime.timezone)
- [JavaScript Date and Time](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
