# 数据库设计与 DDL 文档

## 1. 文档目标

本文档完整记录 LCCU-V 后端的数据库结构设计，包括：

- **数据库设计说明** - 实体关系、设计原则、字段含义
- **完整 DDL 语句** - 所有表的创建语句、索引、触发器（带完整注释）
- **实体关系图** - 文字版 ER 关系说明

数据库类型：**SQLite 3**，ORM：**SQLAlchemy 2.0（异步模式）**

---

## 2. 技术栈与配置

- **数据库类型**：SQLite 3（通过 `aiosqlite` 异步驱动）
- **ORM**：SQLAlchemy 2.0（异步模式）
- **会话管理**：`AsyncSession` + `async_sessionmaker`
- **配置文件**：
  - `app/database.py` - 数据库连接和会话管理
  - `app/config.py` - `settings.database_url` 配置

### 2.1 核心代码位置

- `app/database.py` - 数据库连接、Base 类、会话工厂、依赖注入
- `app/models/` - 所有 SQLAlchemy 模型定义
- `app/crud/` - 数据库 CRUD 操作封装
- `database/` - SQL 迁移脚本

---

## 3. 实体与关系总览

### 3.1 核心实体分类

#### 账号与权限
- `users` - 用户表
- `UserRole` - 角色枚举（developer/operator/user）

#### 审计与系统运行监控
- `audit_logs` - 审计日志表（记录所有修改操作）
- `capture_tasks` - 网络抓包任务表
- `monitor_history` - 系统资源监控历史数据表

#### 系统配置与元数据
- `system_metadata` - 系统元数据表（数据库指纹、版本信息等）
- `system_config` - 系统配置表（运行时配置，模块化存储）

#### 设备类型与业务字段
- `device_types` - 设备类型表
- `device_type_tags` - 业务字段模板表（定义设备类型的业务字段）

#### 点表、协议与通信实例
- `point_table_templates` - 点表模板表
- `point_table_points` - 点表点表（测点定义）
- `protocol_types` - 协议类型定义表（动态配置支持的协议）
- `protocol_type_params` - 协议参数定义表（驱动前端动态生成表单）
- `peripherals` - 外设设备表（串口、CAN、SPI 等资源池）
- `comm_instances` - 通信实例表（Modbus TCP/RTU 等）
- `asset_comm_bindings` - 资产与通信实例绑定表

#### 资产与映射
- `assets` - 资产表（逻辑资产实例）
- `asset_mappings` - 资产映射表（业务字段 → 通信点映射）
- `template_mappings` - 模板映射表（设备类型 + 点表的映射模板）

#### 事件与告警
- `soe_events` - SOE 事件表（Sequence of Events）

#### 网络工具
- `port_forwarding_rules` - 端口转发规则表

### 3.2 实体关系图（文字版 ER）

```
users (用户)
├── audit_logs.user_id → users.id (SET NULL)
├── capture_tasks.created_by → users.id
└── port_forwarding_rules.created_by → users.id

device_types (设备类型)
├── device_type_tags.device_type_id → device_types.id (CASCADE)
├── assets.device_type_id → device_types.id (RESTRICT)
└── template_mappings.device_type_id → device_types.id (CASCADE)

device_type_tags (业务字段模板)
└── 关联到 device_types

point_table_templates (点表模板)
├── point_table_points.point_table_id → point_table_templates.id (CASCADE)
├── comm_instances.point_table_id → point_table_templates.id (RESTRICT)
└── template_mappings.point_table_id → point_table_templates.id (CASCADE)

point_table_points (点表点)
└── 关联到 point_table_templates

comm_instances (通信实例)
├── asset_mappings.instance_id → comm_instances.id (RESTRICT)
├── asset_comm_bindings.instance_id → comm_instances.id (CASCADE)
├── soe_events.source_instance_id → comm_instances.id (SET NULL)
└── 协议类型字段 protocol_type 逻辑上引用 protocol_types.name

protocol_types (协议类型定义)
└── protocol_type_params.protocol_type_id → protocol_types.id (CASCADE)

protocol_type_params (协议参数定义)
└── peripheral_type 逻辑关联 peripherals.peripheral_type，驱动前端外设下拉框

peripherals (外设设备)
└── 供 protocol_type_params（input_type='peripheral'）和业务逻辑复用

assets (资产)
├── asset_mappings.asset_id → assets.id (CASCADE)
├── asset_comm_bindings.asset_id → assets.id (CASCADE)
└── soe_events.asset_id → assets.id (CASCADE)

template_mappings (模板映射)
├── device_type_id → device_types.id (CASCADE)
└── point_table_id → point_table_templates.id (CASCADE)

asset_mappings (资产映射)
├── asset_id → assets.id (CASCADE)
└── instance_id → comm_instances.id (RESTRICT)

asset_comm_bindings (资产通信绑定)
├── asset_id → assets.id (CASCADE)
└── instance_id → comm_instances.id (CASCADE)

soe_events (SOE事件)
├── asset_id → assets.id (CASCADE)
└── source_instance_id → comm_instances.id (SET NULL)

system_metadata (系统元数据)
└── 独立表，无外键

system_config (系统配置)
└── 独立表，无外键（复合唯一索引：module + key）

monitor_history (监控历史)
└── 独立表，无外键

capture_tasks (抓包任务)
└── created_by → users.id

port_forwarding_rules (端口转发)
└── created_by → users.id
```

---

## 4. 完整 DDL 语句

### 4.1 用户与权限

#### 表：`users` - 用户表

```sql
-- ============================================================================
-- 用户表 (users)
-- 用途：存储系统用户信息、角色和权限
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 基础信息
    username VARCHAR(50) NOT NULL UNIQUE,          -- 用户名（唯一，登录标识）
    hashed_password VARCHAR(255) NOT NULL,         -- 密码哈希值（bcrypt 加密）
    role VARCHAR(20) NOT NULL,                     -- 角色：developer/operator/user
    
    -- 特殊标记
    is_builtin BOOLEAN NOT NULL DEFAULT 0,         -- 是否为内置账号（1=是，0=否，内置账号不可删除）
    is_active BOOLEAN NOT NULL DEFAULT 1,          -- 是否激活（1=激活，0=禁用）
    
    -- 审计字段
    created_by INTEGER,                            -- 创建者ID（外键关联 users.id，内置账号为 NULL）
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    
    -- 外键约束
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- 检查约束
    CHECK (role IN ('developer', 'operator', 'user')),
    CHECK (is_builtin IN (0, 1)),
    CHECK (is_active IN (0, 1))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

### 4.2 审计与运行监控

#### 表：`audit_logs` - 审计日志表

```sql
-- ============================================================================
-- 审计日志表 (audit_logs)
-- 用途：记录所有 POST/PUT/PATCH/DELETE 操作的详细信息，用于审计和追溯
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 请求信息
    request_id VARCHAR(36),                        -- 请求ID（UUID，用于追踪同一请求）
    method VARCHAR(10) NOT NULL,                   -- HTTP方法（POST/PUT/PATCH/DELETE）
    path VARCHAR(255) NOT NULL,                    -- API路径（如 /api/users/123）
    
    -- 操作信息
    module VARCHAR(50) NOT NULL,                   -- 模块名称（auth/user/device/asset 等）
    action VARCHAR(50) NOT NULL,                   -- 操作类型（create/update/delete/login 等）
    action_key VARCHAR(100),                       -- 操作国际化键（用于 i18n 显示）
    
    -- 用户信息
    user_id INTEGER,                               -- 操作者ID（外键关联 users.id）
    username VARCHAR(50),                          -- 操作者用户名（冗余字段，防止用户删除后无法追溯）
    user_role VARCHAR(20),                         -- 操作者角色（冗余字段）
    
    -- 目标信息
    target_type VARCHAR(50),                       -- 目标类型（user/item/device/asset 等）
    target_id VARCHAR(50),                         -- 目标ID（字符串类型，适配不同业务）
    target_name VARCHAR(255),                      -- 目标名称（便于查看，如用户名、设备名）
    
    -- 数据变更
    request_body JSON,                             -- 请求体（JSON格式，完整记录请求数据）
    changes JSON,                                  -- 变更内容（JSON格式，包含 before/after 对比）
    
    -- 结果信息
    status_code INTEGER NOT NULL,                  -- HTTP状态码（200/400/404/500 等）
    success VARCHAR(10) NOT NULL,                  -- 操作结果（success/failed）
    error_message TEXT,                            -- 错误信息（如果失败）
    
    -- 请求上下文
    ip_address VARCHAR(45),                        -- 客户端IP地址（支持IPv6）
    user_agent VARCHAR(500),                       -- 用户代理字符串（浏览器/客户端信息）
    locale VARCHAR(10),                            -- 请求语言（zh-CN/en-US 等）
    
    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 操作时间
    
    -- 执行时长
    duration_ms INTEGER,                           -- 执行时长（毫秒）
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- 检查约束
    CHECK (success IN ('success', 'failed'))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_method ON audit_logs(method);
CREATE INDEX IF NOT EXISTS idx_audit_logs_path ON audit_logs(path);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON audit_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
```

#### 表：`capture_tasks` - 网络抓包任务表

```sql
-- ============================================================================
-- 网络抓包任务表 (capture_tasks)
-- 用途：管理网络数据包捕获任务，记录任务状态和结果
-- ============================================================================
CREATE TABLE IF NOT EXISTS capture_tasks (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 任务基本信息
    name VARCHAR(100) NOT NULL,                    -- 任务名称
    interface VARCHAR(50) NOT NULL,                -- 网络接口名称（如 eth0, wlan0）
    filter_expression TEXT,                        -- 过滤表达式（BPF格式，如 tcp port 80）
    duration INTEGER NOT NULL,                     -- 持续时间（秒）
    packet_count INTEGER,                          -- 最大抓包数量（NULL 表示不限制）
    
    -- 任务状态信息
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 任务状态：pending/running/completed/failed
    pid INTEGER,                                   -- 进程ID（运行中的任务）
    file_path TEXT,                                -- 抓包文件路径（.pcap 文件）
    file_size INTEGER DEFAULT 0,                   -- 文件大小（字节）
    actual_duration INTEGER DEFAULT 0,             -- 实际运行时长（秒）
    error_message TEXT,                            -- 错误信息（如果失败）
    
    -- 关联信息
    created_by INTEGER NOT NULL,                   -- 创建者ID（外键关联 users.id）
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    started_at DATETIME,                           -- 开始时间（任务启动时）
    completed_at DATETIME,                         -- 完成时间（任务结束或失败时）
    expires_at DATETIME NOT NULL,                  -- 过期时间（文件自动删除时间）
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    
    -- 外键约束
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    -- 检查约束
    CHECK (status IN ('pending', 'running', 'completed', 'failed'))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_capture_tasks_status ON capture_tasks(status);
CREATE INDEX IF NOT EXISTS idx_capture_tasks_created_by ON capture_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_capture_tasks_created_at ON capture_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_capture_tasks_expires_at ON capture_tasks(expires_at);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_capture_tasks_timestamp
AFTER UPDATE ON capture_tasks
FOR EACH ROW
BEGIN
    UPDATE capture_tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

#### 表：`monitor_history` - 系统资源监控历史数据表

```sql
-- ============================================================================
-- 系统资源监控历史数据表 (monitor_history)
-- 用途：存储系统资源使用历史（CPU、内存、磁盘、网络），用于前端展示曲线图
-- 设计原则：只保留前端实际使用的字段，减少存储和查询开销
-- ============================================================================
CREATE TABLE IF NOT EXISTS monitor_history (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 时间戳
    timestamp DATETIME NOT NULL,                   -- 监控时间点（精确到秒）
    
    -- CPU数据（只保留使用率）
    cpu_percent REAL NOT NULL,                     -- CPU总使用率（0-100）
    
    -- 内存数据（只保留使用率）
    memory_percent REAL NOT NULL,                  -- 内存使用率（0-100）
    
    -- 磁盘数据（只保留使用率）
    disk_percent REAL NOT NULL,                    -- 磁盘使用率（0-100）
    
    -- 网络数据（保留全部，用于多网卡展示）
    network_interfaces TEXT,                       -- 网卡流量数据（JSON对象，包含每个网卡的收发速率）
    network_total_recv_rate REAL,                  -- 总接收速率（KB/s）
    network_total_sent_rate REAL,                  -- 总发送速率（KB/s）
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- 记录创建时间
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_monitor_history_timestamp ON monitor_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_monitor_history_created_at ON monitor_history(created_at);
```

### 4.3 系统配置与元数据

#### 表：`system_metadata` - 系统元数据表

```sql
-- ============================================================================
-- 系统元数据表 (system_metadata)
-- 用途：存储数据库指纹信息（如安装ID、版本等），用于备份验证和系统标识
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_metadata (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 元数据信息
    key VARCHAR(50) NOT NULL UNIQUE,               -- 元数据键（如 install_id, version, db_version）
    value TEXT NOT NULL,                           -- 元数据值（如 UUID、版本号）
    description VARCHAR(200),                      -- 描述信息
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- 更新时间
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_system_metadata_key ON system_metadata(key);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_system_metadata_timestamp
AFTER UPDATE ON system_metadata
FOR EACH ROW
BEGIN
    UPDATE system_metadata SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

#### 表：`system_config` - 系统配置表

```sql
-- ============================================================================
-- 系统配置表 (system_config)
-- 用途：存储运行时可调整的全局配置，模块化存储（module + key 唯一）
-- 示例：module='rathole', key='config_path', value='/etc/rathole/client.toml'
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_config (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 配置信息
    module VARCHAR(50) NOT NULL DEFAULT 'default', -- 模块名称（如 system/monitor/rathole）
    key VARCHAR(100) NOT NULL,                     -- 配置键（模块内唯一）
    value TEXT NOT NULL,                           -- 配置值（JSON 字符串或普通字符串）
    description VARCHAR(255),                      -- 描述信息
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    
    -- 复合唯一约束（同一模块下配置键唯一）
    UNIQUE(module, key)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_system_config_module ON system_config(module);
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_system_config_timestamp
AFTER UPDATE ON system_config
FOR EACH ROW
BEGIN
    UPDATE system_config SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

### 4.4 设备类型与业务字段

#### 表：`device_types` - 设备类型表

```sql
-- ============================================================================
-- 设备类型表 (device_types)
-- 用途：定义设备类型模板（如 B型压缩机、C型泵等），作为资产的模板
-- ============================================================================
CREATE TABLE IF NOT EXISTS device_types (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 基本信息
    name TEXT NOT NULL UNIQUE,                     -- 内部名称（唯一，如 'B_COMPRESSOR'）
    display_name TEXT NOT NULL,                    -- 显示名称（前端展示，如 'B型压缩机'）
    model TEXT NOT NULL DEFAULT '',                -- 型号（如 'B-2000'）
    manufacturer TEXT NOT NULL DEFAULT '',         -- 厂家（如 'XX压缩机有限公司'）
    description TEXT NOT NULL DEFAULT '',          -- 描述信息
    
    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_device_types_name ON device_types(name);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_device_types_timestamp
AFTER UPDATE ON device_types
FOR EACH ROW
BEGIN
    UPDATE device_types SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

#### 表：`device_type_tags` - 业务字段模板表

```sql
-- ============================================================================
-- 业务字段模板表 (device_type_tags)
-- 用途：定义设备类型的业务字段（如出口压力、运行模式、高温报警等）
-- 这些字段是逻辑层的业务概念，不直接对应通信层的寄存器
-- ============================================================================
CREATE TABLE IF NOT EXISTS device_type_tags (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 关联信息
    device_type_id INTEGER NOT NULL,               -- 设备类型ID（外键关联 device_types.id）
    
    -- 字段基本信息
    tag_name TEXT NOT NULL,                        -- 内部字段名（如 'OUTLET_PRESSURE', 'RUN_MODE', 'HIGH_TEMP_ALM'）
    display_name TEXT NOT NULL,                    -- 显示名称（如 '出口压力', '运行模式', '高温报警'）
    data_type TEXT NOT NULL,                       -- 数据类型：BOOL/INT/FLOAT/ENUM
    semantic_type TEXT NOT NULL,                   -- 语义类型：MEASURE/STATUS/ACCUM/PARAM/SETPOINT/COMMAND/CONFIG
    
    -- 字段属性
    engineering_unit TEXT NOT NULL DEFAULT '',     -- 工程单位（如 'bar', '℃', 'kW'）
    group_name TEXT NOT NULL DEFAULT '',           -- UI分组名称（如 '运行模式', '独立报警', '工艺量'）
    severity INTEGER NOT NULL DEFAULT 0,           -- 严重性：0=信息, 1=提示, 2=警告, 3=故障, 4=紧急
    description TEXT NOT NULL DEFAULT '',          -- 描述信息
    enum_json TEXT NOT NULL DEFAULT '{}',          -- ENUM值映射JSON（当 data_type='ENUM' 时使用）
    
    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    
    -- 外键约束
    FOREIGN KEY(device_type_id) REFERENCES device_types(id) ON DELETE CASCADE,
    
    -- 检查约束
    CHECK (data_type IN ('BOOL', 'INT', 'FLOAT', 'ENUM')),
    CHECK (semantic_type IN ('MEASURE', 'STATUS', 'ACCUM', 'PARAM', 'SETPOINT', 'COMMAND', 'CONFIG')),
    CHECK (severity BETWEEN 0 AND 4)
);

-- 唯一索引（同一设备类型下字段名唯一）
CREATE UNIQUE INDEX IF NOT EXISTS idx_device_type_tags_unique
ON device_type_tags(device_type_id, tag_name);

-- 索引
CREATE INDEX IF NOT EXISTS idx_device_type_tags_device_type ON device_type_tags(device_type_id);
CREATE INDEX IF NOT EXISTS idx_device_type_tags_semantic_type ON device_type_tags(semantic_type);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_device_type_tags_timestamp
AFTER UPDATE ON device_type_tags
FOR EACH ROW
BEGIN
    UPDATE device_type_tags SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

### 4.5 点表与通信实例

#### 表：`point_table_templates` - 点表模板表

```sql
-- ============================================================================
-- 点表模板表 (point_table_templates)
-- 用途：定义点表模板（如 Modbus_B型压缩机_v1），包含协议类型和所有测点定义
-- ============================================================================
CREATE TABLE IF NOT EXISTS point_table_templates (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 基本信息
    name TEXT NOT NULL UNIQUE,                     -- 内部名称（唯一，如 'Modbus_B_Compressor_v1'）
    display_name TEXT NOT NULL,                    -- 显示名称（前端展示）
    protocol_type TEXT NOT NULL,                   -- 协议类型（如 'modbus_tcp', 'modbus_rtu', 'opcua'）
    description TEXT NOT NULL DEFAULT '',          -- 描述信息
    
    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP   -- 更新时间
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_point_table_templates_name ON point_table_templates(name);
CREATE INDEX IF NOT EXISTS idx_point_table_templates_protocol ON point_table_templates(protocol_type);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_point_table_templates_timestamp
AFTER UPDATE ON point_table_templates
FOR EACH ROW
BEGIN
    UPDATE point_table_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

#### 表：`point_table_points` - 点表点表

```sql
-- ============================================================================
-- 点表点表 (point_table_points)
-- 用途：定义点表模板中的每个测点（信号层），对应通信层的寄存器/地址
-- ============================================================================
CREATE TABLE IF NOT EXISTS point_table_points (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 关联信息
    point_table_id INTEGER NOT NULL,               -- 点表模板ID（外键关联 point_table_templates.id）
    
    -- 点位基本信息
    point_name TEXT NOT NULL,                      -- 内部点名（如 'Pressure_raw', 'StatusWord2'）
    display_name TEXT NOT NULL,                    -- 显示名称（前端展示）
    address TEXT NOT NULL,                         -- 寄存器/地址（如 '40001', 'HR40010'）
    io_type TEXT NOT NULL,                         -- IO类型：AI/AO/DI/DO/STRING
    raw_type TEXT NOT NULL,                        -- 原始数据类型：INT16/UINT16/INT32/UINT32/FLOAT32/FLOAT64/BITFIELD16
    byte_order TEXT NOT NULL,                      -- 字节序：BE/LE/BE_SWAP/LE_SWAP
    
    -- 数据转换
    scale_k REAL NOT NULL DEFAULT 1.0,             -- 缩放系数k（转换公式：value = raw * k + b）
    scale_b REAL NOT NULL DEFAULT 0.0,             -- 缩放系数b
    parse_rules_json TEXT NOT NULL DEFAULT '{}',   -- 复杂解析规则JSON（用于位域、掩码等复杂解析）
    
    -- 其他属性
    description TEXT NOT NULL DEFAULT '',          -- 描述信息
    is_active INTEGER NOT NULL DEFAULT 1,          -- 是否启用（1=启用，0=禁用）
    
    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    
    -- 外键约束
    FOREIGN KEY(point_table_id) REFERENCES point_table_templates(id) ON DELETE CASCADE,
    
    -- 检查约束
    CHECK (io_type IN ('AI', 'AO', 'DI', 'DO', 'STRING')),
    CHECK (raw_type IN ('INT16', 'UINT16', 'INT32', 'UINT32', 'FLOAT32', 'FLOAT64', 'BITFIELD16')),
    CHECK (byte_order IN ('BE', 'LE', 'BE_SWAP', 'LE_SWAP')),
    CHECK (is_active IN (0, 1))
);

-- 唯一索引（同一点表模板下点名唯一）
CREATE UNIQUE INDEX IF NOT EXISTS idx_points_unique
ON point_table_points(point_table_id, point_name);

-- 索引
CREATE INDEX IF NOT EXISTS idx_point_table_points_point_table_id ON point_table_points(point_table_id);
CREATE INDEX IF NOT EXISTS idx_point_table_points_address ON point_table_points(address);
CREATE INDEX IF NOT EXISTS idx_point_table_points_is_active ON point_table_points(is_active);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_point_table_points_timestamp
AFTER UPDATE ON point_table_points
FOR EACH ROW
BEGIN
    UPDATE point_table_points SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

#### 表：`comm_instances` - 通信实例表

```sql
-- ============================================================================
-- 通信实例表 (comm_instances)
-- 用途：定义通信实例（如 PLC-01），包含协议配置和轮询参数
-- 一个通信实例对应一个点表模板，可以连接多个资产
-- ============================================================================
CREATE TABLE IF NOT EXISTS comm_instances (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 基本信息
    name TEXT NOT NULL UNIQUE,                     -- 实例名称（唯一，如 'PLC-01', 'DCS-Main'）
    display_name TEXT NOT NULL,                    -- 显示名称（前端展示）
    enabled INTEGER NOT NULL DEFAULT 1,            -- 是否启用（1=启用，0=禁用）
    
    -- 关联信息
    point_table_id INTEGER NOT NULL,               -- 点表模板ID（外键关联 point_table_templates.id）
    
    -- 协议信息
    protocol_type TEXT NOT NULL,                   -- 协议类型（对应 protocol_types.name）
    protocol_config TEXT NOT NULL,                 -- 协议配置JSON（根据不同协议类型存储不同的配置参数）
    
    -- protocol_config JSON 格式示例（实际由 protocol_type_params 表驱动）：
    --   Modbus TCP: {"ip": "192.168.1.100", "port": 502, "unit_id": 1}
    --   Modbus RTU: {"serial": "/dev/ttyS0", "baud": 9600, "parity": "N", "stop_bits": 1, "unit_id": 1}
    --   OPC UA: {"endpoint_url": "opc.tcp://192.168.1.100:4840", "security_mode": "None", "security_policy": "None"}
    --   MQTT: {"broker_host": "192.168.1.100", "broker_port": 1883, "topic": "sensors/+/data", "client_id": "gateway_01"}
    
    -- 通信参数
    polling_interval_ms INTEGER NOT NULL,          -- 轮询周期（毫秒）
    timeout_ms INTEGER NOT NULL,                   -- 超时时间（毫秒）
    retries INTEGER NOT NULL,                      -- 重试次数
    
    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    
    -- 外键约束
    FOREIGN KEY(point_table_id) REFERENCES point_table_templates(id) ON DELETE RESTRICT,
    
    -- 检查约束
    CHECK (enabled IN (0, 1))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_comm_instances_name ON comm_instances(name);
CREATE INDEX IF NOT EXISTS idx_comm_instances_enabled ON comm_instances(enabled);
CREATE INDEX IF NOT EXISTS idx_comm_instances_point_table_id ON comm_instances(point_table_id);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_comm_instances_timestamp
AFTER UPDATE ON comm_instances
FOR EACH ROW
BEGIN
    UPDATE comm_instances SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

### 4.5 协议类型与参数

> 对应迁移脚本：`database/migration_016_protocol_type_management.sql`

#### 表：`protocol_types` - 协议类型定义表

```sql
-- ============================================================================
-- 协议类型表 (protocol_types)
-- 用途：定义系统支持的通信协议类型，配合 protocol_type_params 驱动动态配置
-- ============================================================================
CREATE TABLE IF NOT EXISTS protocol_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,                -- 协议类型内部名称，comm_instances.protocol_type 引用
    display_name VARCHAR(200) NOT NULL,               -- 显示名称
    enabled BOOLEAN NOT NULL DEFAULT 1,               -- 是否启用
    description TEXT NOT NULL DEFAULT '',             -- 描述
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_protocol_types_enabled ON protocol_types(enabled);

CREATE TRIGGER IF NOT EXISTS update_protocol_types_timestamp
AFTER UPDATE ON protocol_types
FOR EACH ROW
BEGIN
    UPDATE protocol_types SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

#### 表：`protocol_type_params` - 协议参数定义表

```sql
-- ============================================================================
-- 协议类型参数表 (protocol_type_params)
-- 用途：定义协议的参数清单，指导前端动态生成表单并限制通信实例配置
-- ============================================================================
CREATE TABLE IF NOT EXISTS protocol_type_params (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    protocol_type_id INTEGER NOT NULL,                 -- 协议类型ID
    param_name VARCHAR(100) NOT NULL,                  -- 参数内部名称
    display_name VARCHAR(200) NOT NULL,                -- 参数显示名称
    data_type VARCHAR(20) NOT NULL,                    -- 数据类型：string/integer/float/boolean/enum
    input_type VARCHAR(50) NOT NULL DEFAULT 'text',    -- 前端输入类型：text/number/select/peripheral
    peripheral_type VARCHAR(50),                       -- 当 input_type='peripheral' 时指定外设类型
    required BOOLEAN NOT NULL DEFAULT 1,               -- 是否必填
    default_value TEXT,                                -- 默认值
    description TEXT NOT NULL DEFAULT '',              -- 描述
    constraints_json TEXT NOT NULL DEFAULT '{}',       -- 约束 JSON（枚举、范围、正则等）
    order_index INTEGER NOT NULL DEFAULT 0,            -- 排序索引
    placeholder TEXT,                                  -- 占位提示
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(protocol_type_id) REFERENCES protocol_types(id) ON DELETE CASCADE,
    UNIQUE(protocol_type_id, param_name)
);

CREATE INDEX IF NOT EXISTS idx_protocol_type_params_proto ON protocol_type_params(protocol_type_id);
CREATE INDEX IF NOT EXISTS idx_protocol_type_params_order ON protocol_type_params(order_index);

CREATE TRIGGER IF NOT EXISTS update_protocol_type_params_timestamp
AFTER UPDATE ON protocol_type_params
FOR EACH ROW
BEGIN
    UPDATE protocol_type_params SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

### 4.6 外设设备

> 对应迁移脚本：`database/migration_017_peripheral_management.sql`

#### 表：`peripherals` - 外设设备表

```sql
-- ============================================================================
-- 外设设备表 (peripherals)
-- 用途：集中管理串口、CAN 口等外设资源，供协议参数引用
-- ============================================================================
CREATE TABLE IF NOT EXISTS peripherals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,                  -- 内部名称，如 ttyS0
    display_name VARCHAR(200) NOT NULL,                -- 显示名称，如 串口0
    peripheral_type VARCHAR(50) NOT NULL,              -- 外设类型（serial/can/spi/i2c/gpio/pwm/adc/dac/other）
    device_path VARCHAR(255) NOT NULL UNIQUE,          -- 设备路径（/dev/ttyS0 等）
    enabled BOOLEAN NOT NULL DEFAULT 1,                -- 是否启用
    description TEXT NOT NULL DEFAULT '',              -- 描述
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (enabled IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_peripherals_name ON peripherals(name);
CREATE INDEX IF NOT EXISTS idx_peripherals_type ON peripherals(peripheral_type);
CREATE INDEX IF NOT EXISTS idx_peripherals_enabled ON peripherals(enabled);

CREATE TRIGGER IF NOT EXISTS update_peripherals_timestamp
AFTER UPDATE ON peripherals
FOR EACH ROW
BEGIN
    UPDATE peripherals SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

### 4.7 资产与映射

#### 表：`assets` - 资产表

```sql
-- ============================================================================
-- 资产表 (assets)
-- 用途：定义逻辑资产实例（如 北区1号压缩机），是设备类型的实例化
-- 资产通过映射表与通信点关联，通过 SOE 表记录事件
-- ============================================================================
CREATE TABLE IF NOT EXISTS assets (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 基本信息
    name TEXT NOT NULL UNIQUE,                     -- 内部名称（唯一，如 'North_Compressor_01'）
    display_name TEXT NOT NULL,                    -- 显示名称（前端展示，如 '北区1号压缩机'）
    
    -- 关联信息
    device_type_id INTEGER NOT NULL,               -- 设备类型ID（外键关联 device_types.id）
    
    -- 其他属性
    location TEXT NOT NULL DEFAULT '',             -- 位置信息（如 '北区机房'）
    enabled INTEGER NOT NULL DEFAULT 1,            -- 是否启用（1=启用，0=禁用）
    metadata_json TEXT NOT NULL DEFAULT '{}',      -- 自定义元数据JSON（扩展字段）
    
    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    
    -- 外键约束
    FOREIGN KEY(device_type_id) REFERENCES device_types(id) ON DELETE RESTRICT,
    
    -- 检查约束
    CHECK (enabled IN (0, 1))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_assets_name ON assets(name);
CREATE INDEX IF NOT EXISTS idx_assets_device_type_id ON assets(device_type_id);
CREATE INDEX IF NOT EXISTS idx_assets_enabled ON assets(enabled);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_assets_timestamp
AFTER UPDATE ON assets
FOR EACH ROW
BEGIN
    UPDATE assets SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

#### 表：`template_mappings` - 模板映射表

```sql
-- ============================================================================
-- 模板映射表 (template_mappings)
-- 用途：定义设备类型 + 点表模板的映射关系（模板层映射）
-- 描述业务字段如何映射到通信点，支持直接映射、位映射、位掩码枚举等
-- ============================================================================
CREATE TABLE IF NOT EXISTS template_mappings (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 关联信息
    device_type_id INTEGER NOT NULL,               -- 设备类型ID（外键关联 device_types.id）
    point_table_id INTEGER NOT NULL,               -- 点表模板ID（外键关联 point_table_templates.id）
    
    -- 映射信息
    asset_tag_name TEXT NOT NULL,                  -- 业务字段名（对应 device_type_tags.tag_name）
    point_name TEXT NOT NULL,                      -- 点表点名（对应 point_table_points.point_name）
    binding_kind TEXT NOT NULL,                    -- 绑定类型：DIRECT/BIT/BITMASK_ENUM
    
    -- 位映射相关字段（仅当 binding_kind='BIT' 或 'BITMASK_ENUM' 时使用）
    bit_index INTEGER,                             -- 位索引（仅当 binding_kind='BIT' 时使用，0-15）
    bit_mask INTEGER,                              -- 位掩码（仅当 binding_kind='BITMASK_ENUM' 时使用）
    bit_shift INTEGER,                             -- 位偏移（仅当 binding_kind='BITMASK_ENUM' 时使用）
    
    -- ENUM映射
    enum_json TEXT NOT NULL DEFAULT '{}',          -- ENUM值映射JSON（当 data_type='ENUM' 时使用）
    
    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    
    -- 外键约束
    FOREIGN KEY(device_type_id) REFERENCES device_types(id) ON DELETE CASCADE,
    FOREIGN KEY(point_table_id) REFERENCES point_table_templates(id) ON DELETE CASCADE,
    
    -- 检查约束
    CHECK (binding_kind IN ('DIRECT', 'BIT', 'BITMASK_ENUM'))
);

-- 唯一索引（同一设备类型+点表模板下，业务字段名唯一）
CREATE UNIQUE INDEX IF NOT EXISTS idx_template_mappings_unique
ON template_mappings(device_type_id, point_table_id, asset_tag_name);

-- 索引
CREATE INDEX IF NOT EXISTS idx_template_mappings_device_type_id ON template_mappings(device_type_id);
CREATE INDEX IF NOT EXISTS idx_template_mappings_point_table_id ON template_mappings(point_table_id);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_template_mappings_timestamp
AFTER UPDATE ON template_mappings
FOR EACH ROW
BEGIN
    UPDATE template_mappings SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

#### 表：`asset_mappings` - 资产映射表

```sql
-- ============================================================================
-- 资产映射表 (asset_mappings)
-- 用途：定义资产业务字段到通信点的实际映射（实例层映射）
-- 可以从模板映射自动生成，也可以手动覆盖（is_overridden=1）
-- ============================================================================
CREATE TABLE IF NOT EXISTS asset_mappings (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 关联信息
    asset_id INTEGER NOT NULL,                     -- 资产ID（外键关联 assets.id）
    asset_tag_name TEXT NOT NULL,                  -- 业务字段名（对应 device_type_tags.tag_name）
    instance_id INTEGER NOT NULL,                  -- 通信实例ID（外键关联 comm_instances.id）
    point_name TEXT NOT NULL,                      -- 点表点名（对应 point_table_points.point_name）
    
    -- 映射信息
    binding_kind TEXT NOT NULL,                    -- 绑定类型：DIRECT/BIT/BITMASK_ENUM
    bit_index INTEGER,                             -- 位索引（仅当 binding_kind='BIT' 时使用）
    bit_mask INTEGER,                              -- 位掩码（仅当 binding_kind='BITMASK_ENUM' 时使用）
    bit_shift INTEGER,                             -- 位偏移（仅当 binding_kind='BITMASK_ENUM' 时使用）
    enum_json TEXT NOT NULL DEFAULT '{}',          -- ENUM值映射JSON
    
    -- 覆盖标记
    is_overridden INTEGER NOT NULL DEFAULT 0,      -- 是否覆盖模板映射（1=是，0=否，手动修改时设为1）
    
    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    
    -- 外键约束
    FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY(instance_id) REFERENCES comm_instances(id) ON DELETE RESTRICT,
    
    -- 检查约束
    CHECK (binding_kind IN ('DIRECT', 'BIT', 'BITMASK_ENUM')),
    CHECK (is_overridden IN (0, 1))
);

-- 唯一索引（同一资产下，业务字段名唯一）
CREATE UNIQUE INDEX IF NOT EXISTS idx_asset_mappings_unique
ON asset_mappings(asset_id, asset_tag_name);

-- 索引
CREATE INDEX IF NOT EXISTS idx_asset_mappings_asset_id ON asset_mappings(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_mappings_instance_point
ON asset_mappings(instance_id, point_name);
CREATE INDEX IF NOT EXISTS idx_asset_mappings_is_overridden ON asset_mappings(is_overridden);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_asset_mappings_timestamp
AFTER UPDATE ON asset_mappings
FOR EACH ROW
BEGIN
    UPDATE asset_mappings SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

#### 表：`asset_comm_bindings` - 资产与通信实例绑定表

```sql
-- ============================================================================
-- 资产与通信实例绑定表 (asset_comm_bindings)
-- 用途：定义资产与通信实例的粗粒度绑定关系（一个资产可以绑定多个通信实例）
-- ============================================================================
CREATE TABLE IF NOT EXISTS asset_comm_bindings (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 关联信息
    asset_id INTEGER NOT NULL,                     -- 资产ID（外键关联 assets.id）
    instance_id INTEGER NOT NULL,                  -- 通信实例ID（外键关联 comm_instances.id）
    
    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    
    -- 外键约束
    FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY(instance_id) REFERENCES comm_instances(id) ON DELETE CASCADE
);

-- 唯一索引（同一资产+通信实例组合唯一）
CREATE UNIQUE INDEX IF NOT EXISTS idx_asset_comm_unique
ON asset_comm_bindings(asset_id, instance_id);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_asset_comm_bindings_timestamp
AFTER UPDATE ON asset_comm_bindings
FOR EACH ROW
BEGIN
    UPDATE asset_comm_bindings SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

### 4.7 事件与告警

#### 表：`soe_events` - SOE 事件表

```sql
-- ============================================================================
-- SOE 事件表 (soe_events)
-- 用途：记录 Sequence of Events（事件序列），包括告警、状态变化、命令执行等
-- ============================================================================
CREATE TABLE IF NOT EXISTS soe_events (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 关联信息
    asset_id INTEGER NOT NULL,                     -- 资产ID（外键关联 assets.id）
    asset_tag_name TEXT NOT NULL,                  -- 业务字段名（对应 device_type_tags.tag_name）
    
    -- 事件信息
    event_type TEXT NOT NULL,                      -- 事件类型：ALARM_ON/ALARM_OFF/STATE_CHANGE/CMD_SENT/CMD_FAIL/PARAM_CHANGE/SETPOINT_CHANGE
    severity INTEGER NOT NULL,                     -- 严重性：0=信息, 1=提示, 2=警告, 3=故障, 4=紧急
    
    -- 事件值
    value_num REAL,                                -- 数值（如果事件有数值）
    value_text TEXT NOT NULL DEFAULT '',           -- 文本值（事件描述或文本内容）
    
    -- 来源信息
    source_instance_id INTEGER,                    -- 源通信实例ID（外键关联 comm_instances.id，NULL 表示系统产生）
    source_point_name TEXT,                        -- 源点表点名（触发事件的通信点）
    
    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 事件发生时间（设备上报时间）
    inserted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 写入DB时间（系统接收时间）
    
    -- 扩展信息
    extra_json TEXT NOT NULL DEFAULT '{}',         -- 扩展信息JSON（存储额外的事件属性）
    
    -- 外键约束
    FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY(source_instance_id) REFERENCES comm_instances(id) ON DELETE SET NULL,
    
    -- 检查约束
    CHECK (event_type IN ('ALARM_ON', 'ALARM_OFF', 'STATE_CHANGE', 'CMD_SENT', 'CMD_FAIL', 'PARAM_CHANGE', 'SETPOINT_CHANGE')),
    CHECK (severity BETWEEN 0 AND 4)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_soe_events_asset_id ON soe_events(asset_id);
CREATE INDEX IF NOT EXISTS idx_soe_events_asset_tag_name ON soe_events(asset_tag_name);
CREATE INDEX IF NOT EXISTS idx_soe_events_event_type ON soe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_soe_events_severity ON soe_events(severity);
CREATE INDEX IF NOT EXISTS idx_soe_events_created_at ON soe_events(created_at);
CREATE INDEX IF NOT EXISTS idx_soe_asset_time ON soe_events(asset_id, created_at);
```

### 4.8 网络工具

#### 表：`port_forwarding_rules` - 端口转发规则表

```sql
-- ============================================================================
-- 端口转发规则表 (port_forwarding_rules)
-- 用途：管理端口转发规则，支持 TCP/UDP 协议的端口转发
-- ============================================================================
CREATE TABLE IF NOT EXISTS port_forwarding_rules (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 基本信息
    name VARCHAR(100) NOT NULL UNIQUE,             -- 规则名称（唯一标识）
    source_host VARCHAR(50) NOT NULL DEFAULT '0.0.0.0',  -- 源主机（监听地址，默认 0.0.0.0 表示所有接口）
    source_port INTEGER NOT NULL,                  -- 源端口（监听端口）
    target_host VARCHAR(255) NOT NULL,             -- 目标主机（转发目标地址）
    target_port INTEGER NOT NULL,                  -- 目标端口（转发目标端口）
    protocol VARCHAR(10) NOT NULL DEFAULT 'tcp',   -- 协议类型（tcp/udp）
    
    -- 状态信息
    is_enabled BOOLEAN NOT NULL DEFAULT 1,         -- 是否启用（1=启用，0=禁用）
    status VARCHAR(20) NOT NULL DEFAULT 'stopped', -- 运行状态：stopped/running/error
    process_id INTEGER,                            -- 进程ID（运行中的转发进程）
    error_message TEXT,                            -- 错误信息（如果启动失败）
    
    -- 关联信息
    created_by INTEGER,                            -- 创建者ID（外键关联 users.id）
    
    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    
    -- 外键约束
    FOREIGN KEY (created_by) REFERENCES users(id),
    
    -- 检查约束
    CHECK (protocol IN ('tcp', 'udp')),
    CHECK (status IN ('stopped', 'running', 'error')),
    CHECK (source_port >= 1 AND source_port <= 65535),
    CHECK (target_port >= 1 AND target_port <= 65535)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_port_forwarding_name ON port_forwarding_rules(name);
CREATE INDEX IF NOT EXISTS idx_port_forwarding_status ON port_forwarding_rules(status);
CREATE INDEX IF NOT EXISTS idx_port_forwarding_is_enabled ON port_forwarding_rules(is_enabled);
CREATE INDEX IF NOT EXISTS idx_port_forwarding_source_port ON port_forwarding_rules(source_port);
CREATE INDEX IF NOT EXISTS idx_port_forwarding_created_by ON port_forwarding_rules(created_by);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_port_forwarding_timestamp
AFTER UPDATE ON port_forwarding_rules
FOR EACH ROW
BEGIN
    UPDATE port_forwarding_rules SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
```

---

## 5. 设计原则与约定

### 5.1 字段命名约定

- **主键**：统一使用 `id INTEGER PRIMARY KEY AUTOINCREMENT`
- **时间戳**：`created_at`（创建时间）、`updated_at`（更新时间）
- **布尔字段**：使用 `INTEGER` 类型，0/1 表示，并添加 CHECK 约束
- **枚举字段**：使用 `VARCHAR` 或 `TEXT`，并添加 CHECK 约束
- **JSON字段**：使用 `TEXT` 类型存储 JSON 字符串（SQLite 不支持原生 JSON 类型）

### 5.2 外键删除策略

- **CASCADE**：子表记录随父表删除（如 `device_type_tags` 随 `device_types` 删除）
- **RESTRICT**：禁止删除父表记录（如 `assets` 不允许删除有资产使用的 `device_types`）
- **SET NULL**：父表删除时子表外键置为 NULL（如 `audit_logs.user_id` 在用户删除后置为 NULL）

### 5.3 索引设计原则

- **唯一索引**：所有 `UNIQUE` 字段自动创建唯一索引
- **查询索引**：为常用查询字段创建索引（如 `status`、`created_at`、`enabled`）
- **复合索引**：为复合查询条件创建复合索引（如 `(asset_id, created_at)`）
- **外键索引**：所有外键字段自动创建索引

### 5.4 触发器约定

- **更新时间触发器**：所有表都有 `update_xxx_updated_at` 触发器，自动更新 `updated_at` 字段

### 5.5 JSON 字段处理约定

以下字段使用 `TEXT` 存储 JSON 字符串，应用层负责序列化/反序列化：

- `DeviceTypeTag.enum_json` - ENUM 值映射
- `PointTablePoint.parse_rules_json` - 解析规则
- `Asset.metadata_json` - 资产元数据
- `CommInstance.protocol_config` - 协议配置（**重要**：不同协议类型有不同的配置参数结构）
- `SOEEvent.extra_json` - 事件扩展信息
- `MonitorHistory.network_interfaces` - 网络接口信息

#### 5.5.1 协议配置（protocol_config）格式说明

`CommInstance.protocol_config` 字段根据 `protocol_type` 的不同，存储不同结构的 JSON 配置。协议和参数的元数据来自数据库：

- `protocol_types` 表：定义当前系统支持的协议类型（`comm_instances.protocol_type` 与该表的 `name` 字段保持一致）
- `protocol_type_params` 表：定义每种协议的参数清单（`data_type`、`required`、默认值、`input_type`、`peripheral_type` 等）
- `peripherals` 表：集中维护系统可用的外设设备（串口、CAN、SPI 等），当参数 `input_type='peripheral'` 时可供选择

`protocol_type_params.input_type` 支持 `text` / `number` / `select` / `peripheral` 四种渲染方式：

| 输入类型 | 说明 |
| --- | --- |
| text | 普通文本输入（默认） |
| number | 数值输入（配合 `data_type=integer/float`） |
| select | 下拉枚举，需要在 `constraints_json.enum` 中列出可选值 |
| peripheral | 外设下拉选择，需设置 `peripheral_type`（serial/can/...），前端将联动 `peripherals` 表 |

下表展示常见协议的参数示例，实际可通过 `protocol_types` / `protocol_type_params` 调整：

| 协议类型 | 配置参数 | JSON 示例 |
|---------|---------|-----------|
| **modbus_tcp** | ip, port, unit_id | `{"ip": "192.168.1.100", "port": 502, "unit_id": 1}` |
| **modbus_rtu** | serial, baud, parity, stop_bits, unit_id | `{"serial": "/dev/ttyS0", "baud": 9600, "parity": "N", "stop_bits": 1, "unit_id": 1}` |
| **modbus_ascii** | serial, baud, parity, stop_bits, unit_id | `{"serial": "/dev/ttyUSB0", "baud": 19200, "parity": "E", "stop_bits": 1, "unit_id": 2}` |
| **opcua** | endpoint_url, security_mode, security_policy | `{"endpoint_url": "opc.tcp://192.168.1.100:4840", "security_mode": "None", "security_policy": "None"}` |
| **mqtt** | broker_host, broker_port, topic, client_id | `{"broker_host": "192.168.1.100", "broker_port": 1883, "topic": "sensors/+/data", "client_id": "gateway_01"}` |
| **bacnet** | device_id, network_number, mac_address | `{"device_id": 1, "network_number": 0, "mac_address": "192.168.1.100"}` |
| **dnp3** | ip, port, master_id, outstation_id | `{"ip": "192.168.1.100", "port": 20000, "master_id": 1, "outstation_id": 10}` |
| **iec104** | ip, port, common_address, ioa_start | `{"ip": "192.168.1.100", "port": 2404, "common_address": 1, "ioa_start": 1}` |

**注意**：
- 协议类型（`protocol_type`）应与 `protocol_types.name` 一致，`/api/protocol-types` API 提供管理能力
- 协议参数定义在 `protocol_type_params` 表中，前端根据该表的 `input_type` / `peripheral_type` 动态生成 UI
- 外设参数需先在 `peripherals` 表中登记，通信实例配置时只能选择已登记的设备，避免手动输入
- 协议配置（`protocol_config`）仍是 JSON 格式的 TEXT 字段，后端通过 `ProtocolConfigValidator`（`app/core/protocol_validator.py`）比对数据库定义进行严格校验

### 5.6 数据访问约定

- 所有数据库访问通过 `AsyncSession`（异步模式）
- 使用 `Depends(get_db)` 注入数据库会话
- CRUD 操作封装在 `app/crud/` 目录
- 写操作（create/update/delete）由 CRUD 类负责 `commit` 和 `refresh`

---

## 6. 表统计

| 分类 | 表名 | 说明 | 记录数估算 |
|------|------|------|-----------|
| 用户权限 | `users` | 用户表 | < 100 |
| 审计监控 | `audit_logs` | 审计日志 | 持续增长（需定期清理） |
| 审计监控 | `capture_tasks` | 抓包任务 | < 1000 |
| 审计监控 | `monitor_history` | 监控历史 | 持续增长（保留7-30天） |
| 系统配置 | `system_metadata` | 系统元数据 | < 10 |
| 系统配置 | `system_config` | 系统配置 | < 100 |
| 设备类型 | `device_types` | 设备类型 | < 100 |
| 设备类型 | `device_type_tags` | 业务字段 | < 1000 |
| 点表通信 | `point_table_templates` | 点表模板 | < 100 |
| 点表通信 | `point_table_points` | 点表点 | < 10000 |
| 点表通信 | `comm_instances` | 通信实例 | < 100 |
| 点表通信 | `protocol_types` | 协议类型定义 | < 50 |
| 点表通信 | `protocol_type_params` | 协议参数定义 | < 500 |
| 点表通信 | `peripherals` | 外设设备资源 | < 200 |
| 资产映射 | `assets` | 资产 | < 1000 |
| 资产映射 | `template_mappings` | 模板映射 | < 10000 |
| 资产映射 | `asset_mappings` | 资产映射 | < 100000 |
| 资产映射 | `asset_comm_bindings` | 资产绑定 | < 5000 |
| 事件告警 | `soe_events` | SOE事件 | 持续增长（需定期清理） |
| 网络工具 | `port_forwarding_rules` | 端口转发 | < 100 |

---

## 7. 数据库维护建议

### 7.1 定期清理

- **audit_logs**：根据保留策略定期清理旧日志（建议保留 90 天）
- **monitor_history**：根据保留策略定期清理旧数据（建议保留 7-30 天）
- **soe_events**：根据保留策略定期清理旧事件（建议保留 30-90 天）
- **capture_tasks**：自动删除过期的抓包文件和相关记录

### 7.2 备份策略

- 定期备份 `data/app.db` 文件
- 备份前检查 `system_metadata` 表确认数据库来源
- 建议每日备份，保留最近 7 天的备份

### 7.3 性能优化

- 定期执行 `VACUUM` 回收空间
- 定期执行 `ANALYZE` 更新统计信息
- 对于大表（如 `audit_logs`、`soe_events`），考虑按时间分区

---

## 8. 版本信息

- **文档版本**：v1.1.0
- **数据库版本**：基于 SQLite 3
- **最后更新**：2025-11-20

---

## 9. 参考文档

- SQLAlchemy 2.0 文档：https://docs.sqlalchemy.org/en/20/
- SQLite 3 文档：https://www.sqlite.org/docs.html
- 项目架构文档：`BACKEND_ARCHITECTURE.md`
- CRUD 使用规范：`AI_DEVELOPMENT_RULES.md`
