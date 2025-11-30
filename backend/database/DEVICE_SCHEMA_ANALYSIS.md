# 设备数据库结构分析报告

## 📋 文档说明

本文档对比分析 `device.md` 设计文档要求与当前数据库结构的差异，并提供迁移方案。

**分析日期**: 2025-11-11  
**参考文档**: `backend/device.md`  
**当前数据库版本**: v1.4.0 (migration_005_device_type.sql)

---

## 1. 核心差异概览

### 1.1 设计理念差异

| 维度 | device.md 要求 | 当前数据库 | 差异说明 |
|------|----------------|-----------|---------|
| **设计理念** | 简化的资产-映射模型 | 复杂的模板-解码模型 | 完全不同的架构 |
| **核心表数** | 9 张核心表 | 11+ 张表 | 当前更复杂 |
| **点表设计** | 点表模板独立管理 | 通信模板+解码输出 | 当前支持多输出解码 |
| **映射方式** | 模板映射+资产映射 | 模板映射+实例映射 | 当前更细粒度 |
| **SOE 支持** | ✅ 有 soe_events 表 | ❌ 无 SOE 表 | **关键缺失** |

### 1.2 表结构对比

#### device.md 要求的 9 张核心表：

1. ✅ `device_types` - 设备类型
2. ✅ `device_type_tags` - 业务字段模板
3. ✅ `point_table_templates` - 点表模板
4. ✅ `point_table_points` - 点表中的测点（信号层）
5. ✅ `comm_instances` - 通信实例
6. ✅ `assets` - 资产实例
7. ✅ `template_mappings` - 模板映射
8. ✅ `asset_mappings` - 资产映射
9. ❌ `soe_events` - **SOE 事件表（缺失）**

#### 当前数据库实际表结构：

1. ✅ `device_type` - 设备类型（结构不同）
2. ✅ `device_template` - 设备模板（多一层）
3. ✅ `template_point` - 模板点（类似 device_type_tags）
4. ✅ `comm_template` - 通信模板
5. ✅ `comm_point_template` - 通信点模板（类似 point_table_points）
6. ✅ `decoder_output_template` - 解码输出模板（多一层）
7. ✅ `template_mapping` - 模板映射
8. ✅ `comm_channel` - 通信通道（类似 comm_instances）
9. ✅ `device` - 设备实例（类似 assets）
10. ✅ `device_point` - 设备点
11. ✅ `device_comm_binding` - 设备通信绑定
12. ✅ `mapping_instance` - 实例映射（类似 asset_mappings）
13. ❌ **无 SOE 表**

---

## 2. 详细表结构对比

### 2.1 设备类型表

#### device.md 要求：`device_types`

```sql
CREATE TABLE device_types (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,              -- 内部名：如 'B_COMPRESSOR'
    display_name TEXT NOT NULL,             -- UI 名称：如 'B 型压缩机'
    description TEXT NOT NULL DEFAULT '',
    created_at_utc INTEGER NOT NULL,         -- UTC 毫秒
    updated_at_utc INTEGER NOT NULL
);
```

#### 当前数据库：`device_type`

```sql
CREATE TABLE device_type (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type_code VARCHAR(50) NOT NULL UNIQUE,   -- 类型编码：如 'PCS'
    name_zh VARCHAR(100) NOT NULL,           -- 中文名称
    name_en VARCHAR(100) NOT NULL,           -- 英文名称
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**差异**：
- ✅ 都有设备类型概念
- ❌ 字段命名不同（name vs type_code）
- ❌ 时间字段格式不同（UTC 毫秒 vs DATETIME）
- ❌ 当前数据库有 is_active、created_by 字段
- ❌ 当前数据库有中英文分离

---

### 2.2 业务字段模板

#### device.md 要求：`device_type_tags`

```sql
CREATE TABLE device_type_tags (
    id INTEGER PRIMARY KEY,
    device_type_id INTEGER NOT NULL,
    tag_name TEXT NOT NULL,                  -- 如 'OUTLET_PRESSURE'
    display_name TEXT NOT NULL,              -- 如 '出口压力'
    data_type TEXT NOT NULL,                 -- 'BOOL'|'INT'|'FLOAT'|'ENUM'
    semantic_type TEXT NOT NULL,             -- 'MEASURE'|'STATUS'|'ACCUM'|'PARAM'|'SETPOINT'|'COMMAND'|'CONFIG'
    engineering_unit TEXT NOT NULL DEFAULT '',
    group_name TEXT NOT NULL DEFAULT '',      -- 光字牌分组
    severity INTEGER NOT NULL DEFAULT 0,      -- 0-4：信息/提示/警告/故障/紧急
    description TEXT NOT NULL DEFAULT '',
    created_at_utc INTEGER NOT NULL,
    updated_at_utc INTEGER NOT NULL,
    UNIQUE(device_type_id, tag_name)
);
```

#### 当前数据库：`template_point`

```sql
CREATE TABLE template_point (
    tpoint_id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,             -- 指向 device_template（不是 device_type！）
    point_key TEXT NOT NULL,                 -- 如 'measurement.active_power'
    display_name TEXT NOT NULL,
    signal_kind TEXT NOT NULL,               -- 'measurement'|'status'|'counter'|'parameter'|'setpoint'|'control'|'param_write'
    data_type TEXT NOT NULL,                 -- 'int'|'float'|'bool'|'string'
    unit TEXT,
    writable INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(template_id, point_key)
);
```

**差异**：
- ❌ **关键差异**：device.md 要求业务字段属于 `device_type`，当前数据库属于 `device_template`（多一层）
- ❌ 字段命名不同（tag_name vs point_key）
- ❌ semantic_type vs signal_kind（语义相同但值不同）
- ❌ 缺少 `group_name`（光字牌分组）
- ❌ 缺少 `severity`（严重级别）
- ❌ 缺少 `engineering_unit`（工程单位，当前只有 unit）

---

### 2.3 点表模板

#### device.md 要求：`point_table_templates` + `point_table_points`

```sql
-- 点表模板
CREATE TABLE point_table_templates (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    protocol_type TEXT NOT NULL,             -- 如 'modbus_tcp'
    description TEXT NOT NULL DEFAULT '',
    created_at_utc INTEGER NOT NULL,
    updated_at_utc INTEGER NOT NULL
);

-- 点表中的测点
CREATE TABLE point_table_points (
    id INTEGER PRIMARY KEY,
    point_table_id INTEGER NOT NULL,
    point_name TEXT NOT NULL,                -- 如 'StatusWord2'
    display_name TEXT NOT NULL,
    address TEXT NOT NULL,                   -- 如 '40001'
    io_type TEXT NOT NULL,                   -- 'AI'|'AO'|'DI'|'DO'|'STRING'
    raw_type TEXT NOT NULL,                  -- 'INT16'|'UINT16'|'INT32'|'UINT32'|'FLOAT32'|'FLOAT64'|'BITFIELD16'
    byte_order TEXT NOT NULL,                -- 'BE'|'LE'|'BE_SWAP'|'LE_SWAP'
    scale_k REAL NOT NULL DEFAULT 1.0,
    scale_b REAL NOT NULL DEFAULT 0.0,
    description TEXT NOT NULL DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at_utc INTEGER NOT NULL,
    updated_at_utc INTEGER NOT NULL,
    UNIQUE(point_table_id, point_name)
);
```

#### 当前数据库：`comm_template` + `comm_point_template` + `decoder_output_template`

```sql
-- 通信模板
CREATE TABLE comm_template (
    ctemplate_id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,             -- 对应 device_template
    protocol TEXT NOT NULL,                  -- 'ModbusTCP'|'ModbusRTU'|'IEC104'|'SNMP'|'MQTT'|'Custom'
    description TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(template_id)
);

-- 通信点模板
CREATE TABLE comm_point_template (
    cptpl_id INTEGER PRIMARY KEY AUTOINCREMENT,
    ctemplate_id INTEGER NOT NULL,
    func_code INTEGER NOT NULL,              -- 功能码
    base_address INTEGER NOT NULL,          -- 基础地址
    quantity INTEGER NOT NULL DEFAULT 1,     -- 连读数量
    raw_datatype TEXT NOT NULL,              -- 'u16'|'i16'|'u32'|'i32'|'f32'|'raw'
    bit_order TEXT NOT NULL DEFAULT 'LSB0',  -- 'LSB0'|'MSB0'
    word_order TEXT NOT NULL DEFAULT 'LE',   -- 'LE'|'BE'
    poll_group TEXT NOT NULL DEFAULT 'normal', -- 'fast'|'normal'|'slow'
    note TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ctemplate_id) REFERENCES comm_template(ctemplate_id)
);

-- 解码输出模板（多输出解码）
CREATE TABLE decoder_output_template (
    dout_tpl_id INTEGER PRIMARY KEY AUTOINCREMENT,
    cptpl_id INTEGER NOT NULL,
    out_key TEXT NOT NULL,                   -- 输出键：如 'B0', 'N1'
    extract_type TEXT NOT NULL,              -- 'bit'|'slice'|'raw'
    bit_index INTEGER,                        -- extract_type='bit' 时的位序
    start_bit INTEGER,                        -- extract_type='slice' 起始位
    bit_len INTEGER,                          -- extract_type='slice' 长度
    signed_flag INTEGER NOT NULL DEFAULT 0,
    scale_k REAL NOT NULL DEFAULT 1.0,
    scale_b REAL NOT NULL DEFAULT 0.0,
    out_data_type TEXT NOT NULL DEFAULT 'float',
    unit TEXT,
    description TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cptpl_id, out_key)
);
```

**差异**：
- ❌ **架构差异**：device.md 是单层点表，当前数据库是三层（通信模板→通信点→解码输出）
- ❌ 当前数据库支持**多输出解码**（一个通信点可拆成多个输出），device.md 不支持
- ❌ 字段命名不同（point_name vs out_key）
- ❌ 地址格式不同（TEXT '40001' vs INTEGER base_address）
- ❌ 缺少 io_type（AI/AO/DI/DO/STRING）
- ❌ 缺少 BITFIELD16 类型（当前用 bit/slice 实现）

---

### 2.4 通信实例

#### device.md 要求：`comm_instances`

```sql
CREATE TABLE comm_instances (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,               -- 如 'PLC-01'
    display_name TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    point_table_id INTEGER NOT NULL,         -- 关联点表模板
    protocol_type TEXT NOT NULL,
    protocol_config TEXT NOT NULL,           -- JSON：IP/端口/站号等
    polling_interval_ms INTEGER NOT NULL,
    timeout_ms INTEGER NOT NULL,
    retries INTEGER NOT NULL,
    created_at_utc INTEGER NOT NULL,
    updated_at_utc INTEGER NOT NULL
);
```

#### 当前数据库：`comm_channel`

```sql
CREATE TABLE comm_channel (
    channel_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,               -- 如 'CH1'
    protocol TEXT NOT NULL,
    ip TEXT,
    port INTEGER,
    serial_port TEXT,                        -- 串口号（RTU）
    baudrate INTEGER,
    parity TEXT CHECK (parity IN ('N','E','O')),
    databits INTEGER CHECK (databits IN (7,8)),
    stopbits INTEGER CHECK (stopbits IN (1,2)),
    timeout_ms INTEGER NOT NULL DEFAULT 2000,
    enabled INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**差异**：
- ❌ **关键差异**：device.md 的通信实例关联点表模板，当前数据库的通道是独立的
- ❌ 当前数据库缺少 `point_table_id`（不关联点表）
- ❌ 当前数据库缺少 `polling_interval_ms`、`retries`
- ❌ 当前数据库缺少 `protocol_config` JSON（用独立字段代替）
- ✅ 当前数据库有串口参数（RTU 支持）

---

### 2.5 资产实例

#### device.md 要求：`assets`

```sql
CREATE TABLE assets (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,               -- 如 '北区1号压缩机'
    display_name TEXT NOT NULL,
    device_type_id INTEGER NOT NULL,         -- 关联设备类型
    location TEXT NOT NULL DEFAULT '',
    enabled INTEGER NOT NULL DEFAULT 1,
    metadata_json TEXT NOT NULL DEFAULT '{}',
    created_at_utc INTEGER NOT NULL,
    updated_at_utc INTEGER NOT NULL
);
```

#### 当前数据库：`device`

```sql
CREATE TABLE device (
    device_id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,            -- 关联 device_template（不是 device_type！）
    name TEXT NOT NULL UNIQUE,               -- 如 '1#PCS'
    vendor TEXT NOT NULL,                    -- 冗余保存
    model TEXT NOT NULL,
    device_class TEXT NOT NULL,
    description TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**差异**：
- ❌ **关键差异**：device.md 关联 `device_type`，当前数据库关联 `device_template`（多一层）
- ❌ 字段命名不同（assets vs device）
- ❌ 缺少 `location`（位置信息）
- ❌ 缺少 `metadata_json`（元数据）
- ❌ 当前数据库有 vendor/model/device_class 冗余字段

---

### 2.6 模板映射

#### device.md 要求：`template_mappings`

```sql
CREATE TABLE template_mappings (
    id INTEGER PRIMARY KEY,
    device_type_id INTEGER NOT NULL,
    point_table_id INTEGER NOT NULL,
    asset_tag_name TEXT NOT NULL,            -- 业务字段名：如 'RUN_MODE'
    point_name TEXT NOT NULL,                -- 点表点名：如 'StatusWord2'
    binding_kind TEXT NOT NULL,              -- 'DIRECT'|'BIT'|'BITMASK_ENUM'
    bit_index INTEGER,                       -- binding_kind='BIT'
    bit_mask INTEGER,                        -- binding_kind='BITMASK_ENUM'
    bit_shift INTEGER,                       -- binding_kind='BITMASK_ENUM'
    enum_json TEXT NOT NULL DEFAULT '{}',    -- ENUM 状态码映射
    created_at_utc INTEGER NOT NULL,
    updated_at_utc INTEGER NOT NULL,
    UNIQUE(device_type_id, point_table_id, asset_tag_name)
);
```

#### 当前数据库：`template_mapping`

```sql
CREATE TABLE template_mapping (
    tmapping_id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,            -- 设备模板
    dout_tpl_id INTEGER NOT NULL,           -- 解码输出模板
    point_key TEXT NOT NULL,                -- 语义点键
    direction TEXT NOT NULL DEFAULT 'read',  -- 'read'|'write'|'readwrite'
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(template_id, dout_tpl_id, point_key)
);
```

**差异**：
- ❌ **关键差异**：device.md 是 `device_type + point_table` 映射，当前是 `device_template + decoder_output` 映射
- ❌ 当前数据库缺少 `binding_kind`、`bit_index`、`bit_mask`、`bit_shift`、`enum_json`（这些信息在 decoder_output_template 中）
- ❌ 当前数据库有 `direction`（读写方向），device.md 没有

---

### 2.7 资产映射

#### device.md 要求：`asset_mappings`

```sql
CREATE TABLE asset_mappings (
    id INTEGER PRIMARY KEY,
    asset_id INTEGER NOT NULL,
    asset_tag_name TEXT NOT NULL,            -- 业务字段名
    instance_id INTEGER NOT NULL,            -- 通信实例ID
    point_name TEXT NOT NULL,                -- 点表点名
    binding_kind TEXT NOT NULL,              -- 'DIRECT'|'BIT'|'BITMASK_ENUM'
    bit_index INTEGER,
    bit_mask INTEGER,
    bit_shift INTEGER,
    enum_json TEXT NOT NULL DEFAULT '{}',
    is_overridden INTEGER NOT NULL DEFAULT 0, -- 是否覆盖模板映射
    created_at_utc INTEGER NOT NULL,
    updated_at_utc INTEGER NOT NULL,
    UNIQUE(asset_id, asset_tag_name)
);
```

#### 当前数据库：`mapping_instance`

```sql
CREATE TABLE mapping_instance (
    imap_id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER NOT NULL,
    point_id INTEGER NOT NULL,               -- 设备点（目标）
    channel_id INTEGER NOT NULL,              -- 具体通道
    slave_id INTEGER,                         -- 具体从站/信息体地址
    func_code INTEGER NOT NULL,              -- 具体功能码
    address INTEGER NOT NULL,                -- 具体地址
    quantity INTEGER NOT NULL DEFAULT 1,
    extract_type TEXT NOT NULL,              -- 'bit'|'slice'|'raw'
    bit_index INTEGER,
    start_bit INTEGER,
    bit_len INTEGER,
    signed_flag INTEGER NOT NULL DEFAULT 0,
    scale_k REAL NOT NULL DEFAULT 1.0,
    scale_b REAL NOT NULL DEFAULT 0.0,
    out_data_type TEXT NOT NULL DEFAULT 'float',
    unit TEXT,
    direction TEXT NOT NULL DEFAULT 'read',
    source_dout_tpl INTEGER NOT NULL,        -- 来源的解码输出模板
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(point_id, direction)
);
```

**差异**：
- ❌ **关键差异**：device.md 是 `asset + tag` 映射到 `instance + point`，当前是 `device + point` 映射到 `channel + 具体地址`
- ❌ 当前数据库更细粒度（包含 func_code、address、quantity 等）
- ❌ 当前数据库缺少 `is_overridden`（覆盖标记）
- ❌ 当前数据库缺少 `enum_json`（ENUM 映射）

---

### 2.8 SOE 事件表（关键缺失）

#### device.md 要求：`soe_events`

```sql
CREATE TABLE soe_events (
    id INTEGER PRIMARY KEY,
    asset_id INTEGER NOT NULL,
    asset_tag_name TEXT NOT NULL,
    event_type TEXT NOT NULL,                -- 'ALARM_ON'|'ALARM_OFF'|'STATE_CHANGE'|'CMD_SENT'|'CMD_FAIL'|'PARAM_CHANGE'
    severity INTEGER NOT NULL,
    value_num REAL,
    value_text TEXT NOT NULL DEFAULT '',
    source_instance_id INTEGER,
    source_point_name TEXT,
    created_at_utc INTEGER NOT NULL,
    inserted_at_utc INTEGER NOT NULL,
    extra_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_soe_asset_time ON soe_events(asset_id, created_at_utc);
CREATE INDEX idx_soe_time ON soe_events(created_at_utc);
```

#### 当前数据库：**❌ 无 SOE 表**

**影响**：
- ❌ 无法记录状态变化事件
- ❌ 无法记录命令发送事件
- ❌ 无法记录参数变更事件
- ❌ 无法实现历史 SOE 查询
- ❌ 无法实现趋势+SOE 联动

---

## 3. 关键功能缺失

### 3.1 SOE 事件系统

| 功能 | device.md 要求 | 当前数据库 | 状态 |
|------|----------------|-----------|------|
| SOE 事件表 | ✅ 有 `soe_events` | ❌ 无 | **关键缺失** |
| 状态变化记录 | ✅ ALARM_ON/OFF, STATE_CHANGE | ❌ 无 | **缺失** |
| 命令记录 | ✅ CMD_SENT, CMD_FAIL | ❌ 无 | **缺失** |
| 参数变更记录 | ✅ PARAM_CHANGE | ❌ 无 | **缺失** |

### 3.2 业务字段语义类型

| 语义类型 | device.md | 当前数据库 | 状态 |
|---------|-----------|-----------|------|
| MEASURE | ✅ | ✅ measurement | ✅ 支持 |
| STATUS | ✅ | ✅ status | ✅ 支持 |
| ACCUM | ✅ | ✅ counter | ✅ 支持 |
| PARAM | ✅ | ✅ parameter | ✅ 支持 |
| SETPOINT | ✅ | ✅ setpoint | ✅ 支持 |
| COMMAND | ✅ | ✅ control | ✅ 支持 |
| CONFIG | ✅ | ❌ param_write | ⚠️ 部分支持 |

### 3.3 光字牌支持

| 功能 | device.md 要求 | 当前数据库 | 状态 |
|------|----------------|-----------|------|
| 分组显示 | ✅ group_name | ❌ 无 | **缺失** |
| 严重级别 | ✅ severity (0-4) | ❌ 无 | **缺失** |
| 工程单位 | ✅ engineering_unit | ⚠️ unit | ⚠️ 部分支持 |

### 3.4 16 位混合状态字支持

| 功能 | device.md 要求 | 当前数据库 | 状态 |
|------|----------------|-----------|------|
| BITFIELD16 类型 | ✅ 支持 | ⚠️ 用 bit/slice 实现 | ⚠️ 部分支持 |
| BIT 映射 | ✅ binding_kind='BIT' | ✅ extract_type='bit' | ✅ 支持 |
| BITMASK_ENUM 映射 | ✅ binding_kind='BITMASK_ENUM' | ⚠️ 用 slice 实现 | ⚠️ 部分支持 |
| ENUM JSON 映射 | ✅ enum_json | ❌ 无 | **缺失** |

---

## 4. 架构差异总结

### 4.1 层级差异

**device.md 架构**（3 层）：
```
device_type (设备类型)
  └── device_type_tags (业务字段)
  └── point_table_templates (点表模板)
      └── point_table_points (测点)
  └── template_mappings (模板映射)
  └── assets (资产实例)
      └── asset_mappings (资产映射)
```

**当前数据库架构**（4 层）：
```
device_type (设备类型)
  └── device_template (设备模板)
      └── template_point (模板点)
      └── comm_template (通信模板)
          └── comm_point_template (通信点)
              └── decoder_output_template (解码输出)
      └── template_mapping (模板映射)
  └── device (设备实例)
      └── device_point (设备点)
      └── device_comm_binding (通信绑定)
      └── mapping_instance (实例映射)
```

**差异**：
- 当前数据库多了一层 `device_template`（设备模板）
- 当前数据库多了一层 `decoder_output_template`（多输出解码）
- 当前数据库有 `device_comm_binding`（设备通信绑定参数）

### 4.2 设计理念差异

| 维度 | device.md | 当前数据库 |
|------|-----------|-----------|
| **点表管理** | 独立点表模板 | 通信模板内嵌 |
| **映射方式** | 模板映射+资产映射 | 模板映射+实例映射 |
| **解码能力** | 单输出（一个点一个值） | 多输出（一个点多个值） |
| **地址管理** | 点表内地址 | 实例映射中地址 |
| **灵活性** | 简化，易用 | 复杂，强大 |

---

## 5. 迁移方案建议

### 方案 A：完全重建（推荐用于新项目）

**适用场景**：
- 新项目，无历史数据
- 需要严格符合 device.md 要求
- 不需要多输出解码功能

**步骤**：
1. 创建新的 9 张表（符合 device.md）
2. 删除旧的设备相关表
3. 迁移现有数据（如果有）

**优点**：
- ✅ 100% 符合 device.md 要求
- ✅ 结构简单，易维护
- ✅ 支持 SOE 事件

**缺点**：
- ❌ 丢失多输出解码能力
- ❌ 需要重写业务代码

---

### 方案 B：适配现有结构（推荐用于已有项目）

**适用场景**：
- 已有项目，有历史数据
- 需要保留多输出解码功能
- 可以接受架构差异

**步骤**：
1. **补充缺失功能**：
   - 创建 `soe_events` 表
   - 在 `template_point` 添加 `group_name`、`severity` 字段
   - 在 `device` 添加 `location`、`metadata_json` 字段
   - 在 `template_mapping` 添加 `enum_json` 字段

2. **适配字段命名**：
   - 创建视图（View）映射到 device.md 命名
   - 或创建适配层 API

3. **时间字段统一**：
   - 创建函数将 DATETIME 转换为 UTC 毫秒
   - 或修改应用层处理

**优点**：
- ✅ 保留现有功能
- ✅ 最小改动
- ✅ 支持多输出解码

**缺点**：
- ⚠️ 不完全符合 device.md
- ⚠️ 需要适配层

---

### 方案 C：混合方案（推荐）

**适用场景**：
- 需要符合 device.md 要求
- 但也要保留多输出解码能力

**步骤**：
1. **保留核心表**，补充缺失字段
2. **创建 SOE 表**（必须）
3. **创建适配视图**，映射到 device.md 命名
4. **统一时间格式**（UTC 毫秒）

**优点**：
- ✅ 既符合 device.md，又保留功能
- ✅ 通过视图层适配

**缺点**：
- ⚠️ 需要维护两套命名

---

## 6. 推荐方案：方案 C（混合方案）

### 6.1 立即需要补充的表和字段

#### 1. 创建 SOE 事件表（必须）

```sql
-- migration_011_soe_events.sql
CREATE TABLE soe_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,               -- 对应 device.device_id
    asset_tag_name TEXT NOT NULL,            -- 对应 template_point.point_key
    event_type TEXT NOT NULL,                -- 'ALARM_ON'|'ALARM_OFF'|'STATE_CHANGE'|'CMD_SENT'|'CMD_FAIL'|'PARAM_CHANGE'
    severity INTEGER NOT NULL,
    value_num REAL,
    value_text TEXT NOT NULL DEFAULT '',
    source_instance_id INTEGER,              -- 对应 comm_channel.channel_id
    source_point_name TEXT,                  -- 对应 comm_point_template 的点名
    created_at_utc INTEGER NOT NULL,         -- UTC 毫秒
    inserted_at_utc INTEGER NOT NULL,        -- UTC 毫秒
    extra_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_soe_asset_time ON soe_events(asset_id, created_at_utc);
CREATE INDEX idx_soe_time ON soe_events(created_at_utc);
```

#### 2. 补充 template_point 字段

```sql
-- migration_012_template_point_enhance.sql
ALTER TABLE template_point ADD COLUMN group_name TEXT NOT NULL DEFAULT '';
ALTER TABLE template_point ADD COLUMN severity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE template_point ADD COLUMN engineering_unit TEXT NOT NULL DEFAULT '';
```

#### 3. 补充 device 字段

```sql
-- migration_013_device_enhance.sql
ALTER TABLE device ADD COLUMN location TEXT NOT NULL DEFAULT '';
ALTER TABLE device ADD COLUMN metadata_json TEXT NOT NULL DEFAULT '{}';
```

#### 4. 补充 template_mapping 字段

```sql
-- migration_014_template_mapping_enhance.sql
ALTER TABLE template_mapping ADD COLUMN enum_json TEXT NOT NULL DEFAULT '{}';
```

### 6.2 创建适配视图（可选）

为符合 device.md 命名，创建视图映射：

```sql
-- 设备类型视图
CREATE VIEW device_types AS
SELECT 
    id,
    type_code AS name,
    name_zh AS display_name,
    description,
    (julianday(created_at) - 2440587.5) * 86400000 AS created_at_utc,
    (julianday(updated_at) - 2440587.5) * 86400000 AS updated_at_utc
FROM device_type;

-- 业务字段视图
CREATE VIEW device_type_tags AS
SELECT 
    tpoint_id AS id,
    (SELECT type_id FROM device_template WHERE tpl_id = tp.template_id) AS device_type_id,
    point_key AS tag_name,
    display_name,
    data_type,
    signal_kind AS semantic_type,
    engineering_unit,
    group_name,
    severity,
    description,
    (julianday(created_at) - 2440587.5) * 86400000 AS created_at_utc,
    (julianday(updated_at) - 2440587.5) * 86400000 AS updated_at_utc
FROM template_point tp;
```

---

## 7. 实施优先级

### P0（必须立即实施）

1. ✅ **创建 SOE 事件表** - 关键功能缺失
2. ✅ **补充 template_point 字段** - group_name, severity, engineering_unit
3. ✅ **补充 device 字段** - location, metadata_json

### P1（重要，尽快实施）

4. ✅ **补充 template_mapping 字段** - enum_json
5. ✅ **统一时间格式** - UTC 毫秒转换函数
6. ✅ **创建适配视图** - 映射到 device.md 命名

### P2（可选，按需实施）

7. ⚠️ **支持 BITFIELD16 类型** - 在 point_table_points 中
8. ⚠️ **支持 ENUM JSON 映射** - 在 asset_mappings 中
9. ⚠️ **支持 is_overridden** - 在 asset_mappings 中

---

## 8. 总结

### 8.1 核心问题

1. ❌ **缺少 SOE 事件表** - 最关键缺失
2. ❌ **架构层级不同** - device.md 3 层，当前 4 层
3. ❌ **字段命名不同** - 需要适配层
4. ❌ **时间格式不同** - UTC 毫秒 vs DATETIME

### 8.2 当前数据库优势

1. ✅ **多输出解码** - 一个通信点可拆成多个输出
2. ✅ **更细粒度映射** - 实例映射包含具体地址
3. ✅ **设备模板层** - 支持厂商+型号+版本

### 8.3 建议

**推荐采用方案 C（混合方案）**：
- 补充缺失的 SOE 表和字段
- 创建适配视图映射到 device.md 命名
- 保留现有多输出解码能力
- 通过视图层实现兼容

---

**文档版本**: v1.0  
**最后更新**: 2025-11-11  
**维护者**: AI Assistant






