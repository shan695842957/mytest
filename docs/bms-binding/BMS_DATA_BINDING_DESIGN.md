# BMS 数据绑定功能设计文档

> **版本**: v1.2.0  
> **创建时间**: 2025-01-XX  
> **最后更新**: 2025-01-XX  
> **作者**: AI Assistant  
> **状态**: 设计阶段

---

## 1. 文档目标

本文档描述如何实现 BMS（电池管理系统）数据绑定功能，将 BMS 测试面板中的变量与资产字段进行关联，实现配置化的数据展示和控制。

---

## 2. 需求概述

### 2.1 业务背景

本项目是一个用于储能系统的物联网项目，需要支持中英双语。系统通过以下流程配置设备：

1. **设备模板**（类）→ **资产**（实例）
2. **通信实例**创建流程：
   - 外设管理 → 协议类型 → 通信模板 → 通信实例
3. **资产映射**：将资产字段与通信实例的采集点关联

### 2.1.1 BMS 识别方式

**BMS 识别**：如果一个资产被关联到 `bms_instances` 表（通过 `asset_id`），就被系统识别为 BMS。

**识别逻辑**：
- 查询 BMS 资产：`SELECT DISTINCT asset_id FROM bms_instances`
- 判断资产是否为 BMS：检查资产 ID 是否存在于 `bms_instances.asset_id` 中
- 一个资产可以创建多个 BMS 实例（如：同一个资产可以是二级架构和三级架构）

**数据来源说明**：
- BMS 页面的数据**主要**来自资产字段（通过 `asset_mappings` 关联）
- 但**非 100%** 来自资产字段，还支持：
  1. **资产字段**（主要来源）：通过 `asset_mappings` 关联的资产字段（`device_type_tags.tag_name`）
  2. **DI 点**：某些 BMS 厂家提供的 DO 量，在我们的系统中是 DI，需要直接关联到通信实例的 DI 点（`comm_instances` + `point_table_points.point_name`）
  3. **二次变量计算**（将来实现）：用户用原始数据根据四则运算计算出新值（如：总功率 = 电压 * 电流 / 1000），**暂时不设计和实现**

### 2.2 BMS 架构说明

#### 2.2.1 二级架构 BMS

- **层级结构**：电池簇 → 电池包 → 电池单体
- **页面结构**：
  - **SYS 页面**：系统监控
    - 固定字段（所有BMS厂家都能提供）：告警状态（读）、电压（读）、电流（读）、功率（读，可能通过计算）、断路器状态（读）、断路器指令（写）
    - 可配置字段：SOC、SOH、SOS 等（取决于供应商）
    - 拓扑图：包数量、包展示变量（可配置）
  - **BCU 页面**：簇控制单元
    - 遥测量：全部可配置，需绑定资产字段
    - 遥信量：全部可配置，支持三种类型（布尔/枚举/位域）
  - **BMU 页面**：包管理单元
    - 串并数：可配置（如 15串2并）
    - 单体展示字段：可配置（电压/温度/SOC/SOH 等）
    - 温度测点：可配置（某些厂商在电池包中布置若干测点）

#### 2.2.2 三级架构 BMS

- **层级结构**：电池堆 → 电池簇 → 电池包 → 电池单体
- **页面结构**：
  - **SYS 页面**：系统监控
    - 固定字段（所有BMS厂家都能提供）：告警状态（读）、堆电压（读）、堆电流（读）、堆功率（读，可能通过计算）、分合闸状态（读）、分合闸指令（写）
    - 可配置字段：堆的 SOC、SOE 等
    - 拓扑图：簇数、簇字段、簇分合闸状态（读）、簇分合闸指令（写）可配置
  - **BAU 页面**：堆控制单元
    - 遥测量：全部可配置
    - 遥信量：全部可配置（布尔/枚举/位域）
  - **BCU 页面**：簇控制单元
    - 遥测量：全部可配置
    - 遥信量：全部可配置（布尔/枚举/位域）
  - **BMU 页面**：包管理单元
    - 与二级架构 BMU 相同

### 2.3 遥信量类型说明

**重要说明**：遥信量的位域拆分已在 `point_table_points.parse_rules_json` 中配置（参考 `device.md` 和 `DATABASE_DESIGN.md`），本设计不再重复配置。BMS 遥信量配置仅定义业务层面的显示信息，实际的数据拆分和解析由通信模板的点表配置完成。

#### 2.3.1 布尔类型（Boolean）

- **字段**：汉字名、英文名
- **故障等级**：使用 `device_type_tags.severity`（0~4，参考 `DATABASE_DESIGN.md`）
- **后端返回**：当前值（true/false）、故障等级（来自资产字段的 severity）

#### 2.3.2 枚举类型（Enum）

- **字段**：汉字名、英文名
- **枚举值定义**：使用 `device_type_tags.enum_json`（参考 `DATABASE_DESIGN.md`）
- **故障等级**：使用 `device_type_tags.severity`（0~4）
- **后端返回**：
  - 当前值（数字）
  - 当前值对应的故障等级（来自资产字段的 severity）
  - 每个值对应的汉字含义和英文含义（来自资产字段的 enum_json）

#### 2.3.3 复杂位域（Bitfield）

- **说明**：位域的拆分已在通信模板的 `point_table_points.parse_rules_json` 中配置（通过 `sub_points` 定义）
- **BMS 配置**：仅配置业务层面的显示信息（汉字名、英文名）
- **故障等级**：使用 `device_type_tags.severity`（0~4）
- **数据来源**：通过资产映射关联到通信实例的子点（如 `StatusWord4.mode_code`、`StatusWord4.high_temp_bit`）

---

## 3. 系统设计

### 3.1 数据库设计

#### 3.1.1 BMS 配置表

```sql
-- BMS 架构类型表
CREATE TABLE IF NOT EXISTS bms_architectures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,                    -- 架构名称：'level2' | 'level3'
    display_name TEXT NOT NULL,                   -- 显示名称：'二级架构' | '三级架构'
    description TEXT NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- BMS 页面配置表
CREATE TABLE IF NOT EXISTS bms_page_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    architecture_id INTEGER NOT NULL,             -- 架构ID
    page_type TEXT NOT NULL,                     -- 页面类型：'SYS' | 'BCU' | 'BAU' | 'BMU'
    display_name TEXT NOT NULL,                   -- 显示名称
    description TEXT NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(architecture_id) REFERENCES bms_architectures(id) ON DELETE CASCADE,
    UNIQUE(architecture_id, page_type)
);

-- BMS 字段配置表（固定字段和可配置字段）
-- 固定字段：所有BMS厂家都能提供的字段（告警状态、电压、电流、功率、断路器状态、断路器指令）
-- 可配置字段：取决于供应商的字段（SOC、SOH、SOS等）
CREATE TABLE IF NOT EXISTS bms_field_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_config_id INTEGER NOT NULL,              -- 页面配置ID
    field_key TEXT NOT NULL,                     -- 字段键（如 'fault', 'voltage', 'current', 'power', 'breaker_status', 'breaker_command', 'soc'）
    display_name_zh TEXT NOT NULL,                -- 中文显示名
    display_name_en TEXT NOT NULL,                -- 英文显示名
    field_type TEXT NOT NULL,                     -- 字段类型：'fixed' | 'dynamic'
    data_type TEXT NOT NULL,                      -- 数据类型：'boolean' | 'number' | 'enum'
    unit_zh TEXT NOT NULL DEFAULT '',              -- 中文单位
    unit_en TEXT NOT NULL DEFAULT '',              -- 英文单位
    is_required BOOLEAN NOT NULL DEFAULT 0,       -- 是否必填（固定字段为1）
    -- 读写权限
    is_readable BOOLEAN NOT NULL DEFAULT 1,       -- 是否可读（1=可读，0=只写）
    is_writable BOOLEAN NOT NULL DEFAULT 0,       -- 是否可写（1=可写，0=只读）
    -- 固定字段的预定义键（仅当 field_type='fixed' 时使用）
    -- 二级架构SYS页面固定字段：
    --   'fault'（告警状态，只读，STATUS类型）
    --   'voltage'（电压，只读，MEASURE类型）
    --   'current'（电流，只读，MEASURE类型）
    --   'power'（功率，只读，MEASURE类型，可能通过计算）
    --   'breaker_status'（断路器状态，只读，STATUS类型）
    --   'breaker_command'（断路器指令，可写，COMMAND类型）
    -- 三级架构SYS页面固定字段（同二级架构）：
    --   'fault', 'voltage', 'current', 'power', 'breaker_status', 'breaker_command'
    -- 三级架构拓扑图（簇）固定字段：
    --   'breaker_status'（簇分合闸状态，只读，STATUS类型）
    --   'breaker_command'（簇分合闸指令，可写，COMMAND类型）
    order_index INTEGER NOT NULL DEFAULT 0,        -- 排序索引
    description TEXT NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(page_config_id) REFERENCES bms_page_configs(id) ON DELETE CASCADE,
    UNIQUE(page_config_id, field_key),
    -- 检查约束：可写字段必须可读（写入后需要读取反馈）
    CHECK (is_writable = 0 OR is_readable = 1)
);

-- BMS 遥信量配置表
-- 注意：位域拆分已在 point_table_points.parse_rules_json 中配置，此处仅配置业务显示信息
-- 故障等级使用 device_type_tags.severity（0~4），枚举值使用 device_type_tags.enum_json
CREATE TABLE IF NOT EXISTS bms_telecontrol_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_config_id INTEGER NOT NULL,              -- 页面配置ID
    telecontrol_key TEXT NOT NULL,                -- 遥信量键（如 'total_overvoltage'）
    display_name_zh TEXT NOT NULL,                -- 中文显示名
    display_name_en TEXT NOT NULL,                -- 英文显示名
    telecontrol_type TEXT NOT NULL,                -- 遥信类型：'boolean' | 'enum' | 'bitfield'
    -- 注意：故障等级和枚举值定义使用资产字段的配置（device_type_tags.severity 和 enum_json）
    order_index INTEGER NOT NULL DEFAULT 0,       -- 排序索引
    description TEXT NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(page_config_id) REFERENCES bms_page_configs(id) ON DELETE CASCADE,
    UNIQUE(page_config_id, telecontrol_key)
);

-- BMS 拓扑配置表（SYS 页面的拓扑图配置）
CREATE TABLE IF NOT EXISTS bms_topology_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_config_id INTEGER NOT NULL,               -- 页面配置ID（SYS 页面）
    topology_type TEXT NOT NULL,                   -- 拓扑类型：'pack' | 'cluster'
    display_name_zh TEXT NOT NULL,                 -- 中文显示名
    display_name_en TEXT NOT NULL,                 -- 英文显示名
    description TEXT NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(page_config_id) REFERENCES bms_page_configs(id) ON DELETE CASCADE,
    UNIQUE(page_config_id, topology_type)
);

-- BMS 拓扑字段配置表（拓扑图中每个节点显示的字段）
CREATE TABLE IF NOT EXISTS bms_topology_field_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topology_config_id INTEGER NOT NULL,           -- 拓扑配置ID
    field_key TEXT NOT NULL,                       -- 字段键（引用 bms_field_configs.field_key）
    display_name_zh TEXT NOT NULL,                -- 中文显示名
    display_name_en TEXT NOT NULL,                -- 英文显示名
    order_index INTEGER NOT NULL DEFAULT 0,        -- 排序索引
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(topology_config_id) REFERENCES bms_topology_configs(id) ON DELETE CASCADE,
    UNIQUE(topology_config_id, field_key)
);

-- BMS BMU 配置表（BMU 页面的串并数和字段配置）
CREATE TABLE IF NOT EXISTS bms_bmu_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_config_id INTEGER NOT NULL,              -- 页面配置ID（BMU 页面）
    series_count INTEGER NOT NULL DEFAULT 0,       -- 串联数（如 15）
    parallel_count INTEGER NOT NULL DEFAULT 0,      -- 并联数（如 2）
    has_temperature_points BOOLEAN NOT NULL DEFAULT 0, -- 是否有温度测点
    description TEXT NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(page_config_id) REFERENCES bms_page_configs(id) ON DELETE CASCADE,
    UNIQUE(page_config_id)
);

-- BMS BMU 单体字段配置表
CREATE TABLE IF NOT EXISTS bms_bmu_cell_field_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bmu_config_id INTEGER NOT NULL,                -- BMU 配置ID
    field_key TEXT NOT NULL,                        -- 字段键（如 'voltage', 'temperature', 'soc', 'soh'）
    display_name_zh TEXT NOT NULL,                 -- 中文显示名
    display_name_en TEXT NOT NULL,                 -- 英文显示名
    data_type TEXT NOT NULL,                       -- 数据类型：'number'
    unit_zh TEXT NOT NULL DEFAULT '',               -- 中文单位
    unit_en TEXT NOT NULL DEFAULT '',               -- 英文单位
    order_index INTEGER NOT NULL DEFAULT 0,         -- 排序索引
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bmu_config_id) REFERENCES bms_bmu_configs(id) ON DELETE CASCADE,
    UNIQUE(bmu_config_id, field_key)
);
```

#### 3.1.2 BMS 绑定表（关联数据来源）

**重要说明**：
- **BMS 识别**：如果一个资产被关联到 `bms_instances` 表，就被系统识别为 BMS
- **数据来源**：BMS 页面的数据主要来自资产字段，但非 100% 来自资产字段，还支持：
  1. **资产字段**（主要来源）：通过 `asset_mappings` 关联的资产字段
  2. **DI 点**（某些 BMS 的 DO 量）：某些 BMS 厂家提供的 DO 量，在我们的系统中是 DI，需要直接关联到通信实例的 DI 点
  3. **二次变量计算**（将来实现）：用户用原始数据根据四则运算计算出新值（如：总功率 = 电压 * 电流 / 1000），**暂时不设计和实现**

```sql
-- BMS 实例表（每个 BMS 设备对应一个实例）
-- 如果一个资产被关联到此表，就被系统识别为 BMS
CREATE TABLE IF NOT EXISTS bms_instances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,                     -- 资产ID（外键关联 assets.id）
    architecture_id INTEGER NOT NULL,               -- 架构ID（外键关联 bms_architectures.id）
    instance_name TEXT NOT NULL,                   -- 实例名称（如 '1号电池簇', '1号电池堆'）
    display_name_zh TEXT NOT NULL,                  -- 中文显示名
    display_name_en TEXT NOT NULL,                  -- 英文显示名
    enabled BOOLEAN NOT NULL DEFAULT 1,             -- 是否启用
    metadata_json TEXT NOT NULL DEFAULT '{}',       -- 自定义元数据JSON
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY(architecture_id) REFERENCES bms_architectures(id) ON DELETE RESTRICT,
    UNIQUE(asset_id, architecture_id, instance_name)
);

-- BMS 字段绑定表（将 BMS 字段与数据来源关联）
-- 数据来源类型：'asset_field'（资产字段）| 'di_point'（DI点）| 'calculated'（二次变量，将来实现）
-- 支持读写分离：读和写可以绑定到不同的数据来源
CREATE TABLE IF NOT EXISTS bms_field_bindings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bms_instance_id INTEGER NOT NULL,               -- BMS 实例ID
    page_config_id INTEGER NOT NULL,                -- 页面配置ID
    field_config_id INTEGER NOT NULL,                -- 字段配置ID
    -- 读数据来源
    read_source_type TEXT NOT NULL,                 -- 读数据来源类型：'asset_field' | 'di_point' | 'calculated'
    read_asset_tag_name TEXT,                       -- 读：资产字段名（当 read_source_type='asset_field' 时使用）
    read_instance_id INTEGER,                        -- 读：通信实例ID（当 read_source_type='di_point' 时使用）
    read_point_name TEXT,                           -- 读：点表点名（当 read_source_type='di_point' 时使用）
    -- 写数据来源（仅当字段 is_writable=1 时使用）
    write_source_type TEXT,                         -- 写数据来源类型：'asset_field' | 'di_point' | 'calculated'
    write_asset_tag_name TEXT,                       -- 写：资产字段名（当 write_source_type='asset_field' 时使用，必须是 COMMAND/SETPOINT/PARAM_SET 类型）
    write_instance_id INTEGER,                      -- 写：通信实例ID（当 write_source_type='di_point' 时使用）
    write_point_name TEXT,                          -- 写：点表点名（当 write_source_type='di_point' 时使用）
    -- 当 source_type='calculated' 时使用（将来实现，暂时不设计）
    -- calculated_expression TEXT,                  -- 计算公式（如 'voltage * current / 1000'）
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bms_instance_id) REFERENCES bms_instances(id) ON DELETE CASCADE,
    FOREIGN KEY(page_config_id) REFERENCES bms_page_configs(id) ON DELETE RESTRICT,
    FOREIGN KEY(field_config_id) REFERENCES bms_field_configs(id) ON DELETE RESTRICT,
    FOREIGN KEY(read_instance_id) REFERENCES comm_instances(id) ON DELETE RESTRICT,
    FOREIGN KEY(write_instance_id) REFERENCES comm_instances(id) ON DELETE RESTRICT,
    -- 检查约束：根据 source_type 验证必填字段
    CHECK (read_source_type IN ('asset_field', 'di_point', 'calculated')),
    CHECK (write_source_type IS NULL OR write_source_type IN ('asset_field', 'di_point', 'calculated')),
    CHECK (
        (read_source_type = 'asset_field' AND read_asset_tag_name IS NOT NULL) OR
        (read_source_type = 'di_point' AND read_instance_id IS NOT NULL AND read_point_name IS NOT NULL) OR
        (read_source_type = 'calculated')
    ),
    CHECK (
        write_source_type IS NULL OR
        (write_source_type = 'asset_field' AND write_asset_tag_name IS NOT NULL) OR
        (write_source_type = 'di_point' AND write_instance_id IS NOT NULL AND write_point_name IS NOT NULL) OR
        (write_source_type = 'calculated')
    ),
    UNIQUE(bms_instance_id, page_config_id, field_config_id)
);

-- BMS 遥信量绑定表（将 BMS 遥信量与数据来源关联）
-- 数据来源类型：'asset_field'（资产字段）| 'di_point'（DI点，某些BMS的DO量）
CREATE TABLE IF NOT EXISTS bms_telecontrol_bindings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bms_instance_id INTEGER NOT NULL,               -- BMS 实例ID
    page_config_id INTEGER NOT NULL,                -- 页面配置ID
    telecontrol_config_id INTEGER NOT NULL,         -- 遥信量配置ID
    source_type TEXT NOT NULL,                      -- 数据来源类型：'asset_field' | 'di_point'
    -- 当 source_type='asset_field' 时使用
    asset_tag_name TEXT,                            -- 资产字段名（对应 device_type_tags.tag_name）
    -- 当 source_type='di_point' 时使用
    instance_id INTEGER,                            -- 通信实例ID（外键关联 comm_instances.id）
    point_name TEXT,                                -- 点表点名（对应 point_table_points.point_name，支持子点）
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bms_instance_id) REFERENCES bms_instances(id) ON DELETE CASCADE,
    FOREIGN KEY(page_config_id) REFERENCES bms_page_configs(id) ON DELETE RESTRICT,
    FOREIGN KEY(telecontrol_config_id) REFERENCES bms_telecontrol_configs(id) ON DELETE RESTRICT,
    FOREIGN KEY(instance_id) REFERENCES comm_instances(id) ON DELETE RESTRICT,
    -- 检查约束：根据 source_type 验证必填字段
    CHECK (source_type IN ('asset_field', 'di_point')),
    CHECK (
        (source_type = 'asset_field' AND asset_tag_name IS NOT NULL) OR
        (source_type = 'di_point' AND instance_id IS NOT NULL AND point_name IS NOT NULL)
    ),
    UNIQUE(bms_instance_id, page_config_id, telecontrol_config_id)
);

-- BMS 拓扑绑定表（将拓扑节点与数据来源关联）
-- 数据来源类型：'asset_field'（资产字段）| 'di_point'（DI点）| 'calculated'（二次变量，将来实现）
-- 支持读写分离：读和写可以绑定到不同的数据来源（如簇分合闸状态和指令）
CREATE TABLE IF NOT EXISTS bms_topology_bindings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bms_instance_id INTEGER NOT NULL,               -- BMS 实例ID
    topology_config_id INTEGER NOT NULL,            -- 拓扑配置ID
    topology_field_config_id INTEGER NOT NULL,       -- 拓扑字段配置ID
    -- 读数据来源
    read_source_type TEXT NOT NULL,                 -- 读数据来源类型：'asset_field' | 'di_point' | 'calculated'
    read_asset_tag_name TEXT,                       -- 读：资产字段名（当 read_source_type='asset_field' 时使用）
    read_instance_id INTEGER,                        -- 读：通信实例ID（当 read_source_type='di_point' 时使用）
    read_point_name TEXT,                           -- 读：点表点名（当 read_source_type='di_point' 时使用）
    -- 写数据来源（仅当字段可写时使用，如簇分合闸指令）
    write_source_type TEXT,                         -- 写数据来源类型：'asset_field' | 'di_point' | 'calculated'
    write_asset_tag_name TEXT,                       -- 写：资产字段名（当 write_source_type='asset_field' 时使用，必须是 COMMAND/SETPOINT/PARAM_SET 类型）
    write_instance_id INTEGER,                      -- 写：通信实例ID（当 write_source_type='di_point' 时使用）
    write_point_name TEXT,                          -- 写：点表点名（当 write_source_type='di_point' 时使用）
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bms_instance_id) REFERENCES bms_instances(id) ON DELETE CASCADE,
    FOREIGN KEY(topology_config_id) REFERENCES bms_topology_configs(id) ON DELETE RESTRICT,
    FOREIGN KEY(topology_field_config_id) REFERENCES bms_topology_field_configs(id) ON DELETE RESTRICT,
    FOREIGN KEY(read_instance_id) REFERENCES comm_instances(id) ON DELETE RESTRICT,
    FOREIGN KEY(write_instance_id) REFERENCES comm_instances(id) ON DELETE RESTRICT,
    -- 检查约束：根据 source_type 验证必填字段
    CHECK (read_source_type IN ('asset_field', 'di_point', 'calculated')),
    CHECK (write_source_type IS NULL OR write_source_type IN ('asset_field', 'di_point', 'calculated')),
    CHECK (
        (read_source_type = 'asset_field' AND read_asset_tag_name IS NOT NULL) OR
        (read_source_type = 'di_point' AND read_instance_id IS NOT NULL AND read_point_name IS NOT NULL) OR
        (read_source_type = 'calculated')
    ),
    CHECK (
        write_source_type IS NULL OR
        (write_source_type = 'asset_field' AND write_asset_tag_name IS NOT NULL) OR
        (write_source_type = 'di_point' AND write_instance_id IS NOT NULL AND write_point_name IS NOT NULL) OR
        (write_source_type = 'calculated')
    ),
    UNIQUE(bms_instance_id, topology_config_id, topology_field_config_id)
);

-- BMS BMU 绑定表（将 BMU 单体字段与数据来源关联）
-- 数据来源类型：'asset_field'（资产字段）| 'di_point'（DI点）| 'calculated'（二次变量，将来实现）
CREATE TABLE IF NOT EXISTS bms_bmu_cell_bindings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bms_instance_id INTEGER NOT NULL,               -- BMS 实例ID
    bmu_config_id INTEGER NOT NULL,                 -- BMU 配置ID
    cell_field_config_id INTEGER NOT NULL,          -- 单体字段配置ID
    source_type TEXT NOT NULL,                      -- 数据来源类型：'asset_field' | 'di_point' | 'calculated'
    -- 当 source_type='asset_field' 时使用
    asset_tag_name TEXT,                            -- 资产字段名（对应 device_type_tags.tag_name）
    -- 当 source_type='di_point' 时使用
    instance_id INTEGER,                            -- 通信实例ID（外键关联 comm_instances.id）
    point_name TEXT,                                -- 点表点名（对应 point_table_points.point_name，支持子点）
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bms_instance_id) REFERENCES bms_instances(id) ON DELETE CASCADE,
    FOREIGN KEY(bmu_config_id) REFERENCES bms_bmu_configs(id) ON DELETE RESTRICT,
    FOREIGN KEY(cell_field_config_id) REFERENCES bms_bmu_cell_field_configs(id) ON DELETE RESTRICT,
    FOREIGN KEY(instance_id) REFERENCES comm_instances(id) ON DELETE RESTRICT,
    -- 检查约束：根据 source_type 验证必填字段
    CHECK (source_type IN ('asset_field', 'di_point', 'calculated')),
    CHECK (
        (source_type = 'asset_field' AND asset_tag_name IS NOT NULL) OR
        (source_type = 'di_point' AND instance_id IS NOT NULL AND point_name IS NOT NULL) OR
        (source_type = 'calculated')
    ),
    UNIQUE(bms_instance_id, bmu_config_id, cell_field_config_id)
);
```

### 3.2 后端 API 设计

#### 3.2.1 BMS 配置管理 API

```
# 架构管理
GET    /api/bms/architectures              # 获取架构列表
GET    /api/bms/architectures/{id}         # 获取架构详情

# 页面配置管理
GET    /api/bms/page-configs              # 获取页面配置列表
GET    /api/bms/page-configs/{id}          # 获取页面配置详情
POST   /api/bms/page-configs               # 创建页面配置
PATCH  /api/bms/page-configs/{id}          # 更新页面配置
DELETE /api/bms/page-configs/{id}          # 删除页面配置

# 字段配置管理
GET    /api/bms/field-configs              # 获取字段配置列表（按页面配置ID筛选）
POST   /api/bms/field-configs              # 创建字段配置
PATCH  /api/bms/field-configs/{id}         # 更新字段配置
DELETE /api/bms/field-configs/{id}         # 删除字段配置

# 遥信量配置管理
GET    /api/bms/telecontrol-configs        # 获取遥信量配置列表（按页面配置ID筛选）
POST   /api/bms/telecontrol-configs        # 创建遥信量配置
PATCH  /api/bms/telecontrol-configs/{id}   # 更新遥信量配置
DELETE /api/bms/telecontrol-configs/{id}   # 删除遥信量配置

# 拓扑配置管理
GET    /api/bms/topology-configs           # 获取拓扑配置列表（按页面配置ID筛选）
POST   /api/bms/topology-configs           # 创建拓扑配置
PATCH  /api/bms/topology-configs/{id}      # 更新拓扑配置
DELETE /api/bms/topology-configs/{id}      # 删除拓扑配置

# BMU 配置管理
GET    /api/bms/bmu-configs                # 获取 BMU 配置列表（按页面配置ID筛选）
POST   /api/bms/bmu-configs                # 创建 BMU 配置
PATCH  /api/bms/bmu-configs/{id}           # 更新 BMU 配置
DELETE /api/bms/bmu-configs/{id}           # 删除 BMU 配置
```

#### 3.2.2 BMS 实例和绑定管理 API

```
# BMS 实例管理
GET    /api/bms/instances                  # 获取 BMS 实例列表
GET    /api/bms/instances/{id}             # 获取 BMS 实例详情
POST   /api/bms/instances                  # 创建 BMS 实例
PATCH  /api/bms/instances/{id}             # 更新 BMS 实例
DELETE /api/bms/instances/{id}             # 删除 BMS 实例

# 字段绑定管理
GET    /api/bms/instances/{id}/field-bindings        # 获取字段绑定列表
POST   /api/bms/instances/{id}/field-bindings        # 创建字段绑定
PATCH  /api/bms/field-bindings/{id}                 # 更新字段绑定
DELETE /api/bms/field-bindings/{id}                 # 删除字段绑定

# 字段写入操作
POST   /api/bms/instances/{id}/fields/{field_key}/write  # 写入字段值（如断路器指令）

# 遥信量绑定管理
GET    /api/bms/instances/{id}/telecontrol-bindings # 获取遥信量绑定列表
POST   /api/bms/instances/{id}/telecontrol-bindings # 创建遥信量绑定
PATCH  /api/bms/telecontrol-bindings/{id}           # 更新遥信量绑定
DELETE /api/bms/telecontrol-bindings/{id}             # 删除遥信量绑定

# 拓扑绑定管理
GET    /api/bms/instances/{id}/topology-bindings     # 获取拓扑绑定列表
POST   /api/bms/instances/{id}/topology-bindings     # 创建拓扑绑定
PATCH  /api/bms/topology-bindings/{id}               # 更新拓扑绑定
DELETE /api/bms/topology-bindings/{id}               # 删除拓扑绑定

# BMU 绑定管理
GET    /api/bms/instances/{id}/bmu-bindings          # 获取 BMU 绑定列表
POST   /api/bms/instances/{id}/bmu-bindings          # 创建 BMU 绑定
PATCH  /api/bms/bmu-bindings/{id}                   # 更新 BMU 绑定
DELETE /api/bms/bmu-bindings/{id}                    # 删除 BMU 绑定
```

#### 3.2.3 BMS 数据查询 API（用于前端展示）

```
# 获取 BMS 实例的实时数据
GET    /api/bms/instances/{id}/data/sys              # 获取 SYS 页面数据
GET    /api/bms/instances/{id}/data/bcu              # 获取 BCU 页面数据
GET    /api/bms/instances/{id}/data/bau              # 获取 BAU 页面数据（三级架构）
GET    /api/bms/instances/{id}/data/bmu              # 获取 BMU 页面数据

# 获取拓扑数据
GET    /api/bms/instances/{id}/topology/packs        # 获取包列表（二级架构）
GET    /api/bms/instances/{id}/topology/clusters     # 获取簇列表（三级架构）
```

### 3.3 前端页面设计

#### 3.3.1 BMS 配置管理页面

**路径**: `/config/bms-configs`

**功能**:
1. 选择架构类型（二级/三级）
2. 选择页面类型（SYS/BCU/BAU/BMU）
3. 配置字段列表（固定字段 + 可配置字段）
4. 配置遥信量列表（布尔/枚举/位域）
5. 配置拓扑图（SYS 页面）
6. 配置 BMU（串并数、单体字段、温度测点）

#### 3.3.2 BMS 绑定管理页面

**路径**: `/config/bms-bindings`

**功能**:
1. 选择资产（下拉选择，只显示已配置的资产）
2. 选择架构类型（二级/三级）
3. 创建 BMS 实例（关联资产和架构，一旦关联，资产即被识别为 BMS）
4. 配置字段绑定（将 BMS 字段与数据来源关联）：
   - 资产字段（主要来源）
   - DI 点（某些 BMS 的 DO 量）
   - 二次变量计算（将来实现，暂时不设计）
5. 配置遥信量绑定（将 BMS 遥信量与数据来源关联）：
   - 资产字段（主要来源）
   - DI 点（某些 BMS 的 DO 量）
6. 配置拓扑绑定（将拓扑节点字段与数据来源关联）
7. 配置 BMU 绑定（将单体字段与数据来源关联）

**UI 设计**:
- 左侧：BMS 实例列表
- 中间：页面配置树（SYS/BCU/BAU/BMU）
- 右侧：资产字段选择器（显示该资产的所有字段，按分组显示）

#### 3.3.3 BMS 测试面板页面（现有页面改造）

**路径**: `/test/bms-level2`, `/test/bms-level3`

**改造点**:
1. 从配置中读取字段列表（而不是硬编码）
2. 从绑定中读取资产字段关联（而不是使用临时数据）
3. 实时数据从资产字段中获取（通过 WebSocket 或轮询）

---

## 4. 实现步骤

### 4.1 第一阶段：数据库和基础 API

1. **创建数据库迁移脚本**
   - 创建所有 BMS 配置表和绑定表
   - 初始化默认数据（二级架构、三级架构的基础配置）

2. **创建后端模型**
   - `app/models/bms.py` - 所有 BMS 相关的 SQLAlchemy 模型

3. **创建后端 Schema**
   - `app/schemas/bms.py` - 所有 BMS 相关的 Pydantic Schema

4. **创建后端 CRUD**
   - `app/crud/bms.py` - 所有 BMS 相关的 CRUD 操作

5. **创建后端 API**
   - `app/api/bms.py` - 所有 BMS 相关的 API 路由

### 4.2 第二阶段：配置管理前端

1. **创建配置管理页面**
   - `frontend/src/pages/config/BMSConfigsPage.tsx`
   - 支持架构、页面、字段、遥信量的配置

2. **创建配置管理组件**
   - 字段配置对话框
   - 遥信量配置对话框（支持三种类型）
   - 拓扑配置对话框
   - BMU 配置对话框

### 4.3 第三阶段：绑定管理前端

1. **创建绑定管理页面**
   - `frontend/src/pages/config/BMSBindingsPage.tsx`
   - 支持实例创建和字段绑定

2. **创建绑定管理组件**
   - 实例创建对话框
   - 字段绑定对话框
   - 遥信量绑定对话框
   - 拓扑绑定对话框
   - BMU 绑定对话框

### 4.4 第四阶段：测试面板改造

1. **改造现有 BMS 页面**
   - 从配置中读取字段列表
   - 从绑定中读取资产字段关联
   - 实时数据从资产字段中获取

2. **创建数据查询 API**
   - 实现 `/api/bms/instances/{id}/data/*` 接口
   - 根据绑定配置，从资产字段中聚合数据

---

## 5. 数据流设计

### 5.1 配置阶段

```
开发者/运维角色
  ↓
1. 配置 BMS 架构和页面
  ↓
2. 配置字段列表（固定字段 + 可配置字段）
  ↓
3. 配置遥信量列表（布尔/枚举/位域）
  ↓
4. 配置拓扑图（SYS 页面）
  ↓
5. 配置 BMU（串并数、单体字段）
```

### 5.2 绑定阶段

```
开发者/运维角色
  ↓
1. 选择资产（已配置好的资产）
  ↓
2. 创建 BMS 实例（关联资产和架构）
   → 一旦关联，资产即被识别为 BMS
  ↓
3. 配置字段绑定（BMS 字段 → 数据来源）
   → 资产字段（主要）
   → DI 点（某些 BMS 的 DO 量）
   → 二次变量计算（将来实现）
  ↓
4. 配置遥信量绑定（BMS 遥信量 → 数据来源）
   → 资产字段（主要）
   → DI 点（某些 BMS 的 DO 量）
  ↓
5. 配置拓扑绑定（拓扑节点字段 → 数据来源）
  ↓
6. 配置 BMU 绑定（单体字段 → 数据来源）
```

### 5.3 运行阶段

```
普通用户访问 BMS 测试面板
  ↓
前端请求：GET /api/bms/instances/{id}/data/sys
  ↓
后端处理：
  1. 查询 BMS 实例配置
  2. 查询字段绑定配置（根据 read_source_type 和 write_source_type 区分数据来源）
  3. 获取实时数据（读）：
     - 资产字段：从 asset_state 中获取（通过 read_asset_tag_name）
     - DI 点：从通信实例的实时数据中获取（通过 read_instance_id + read_point_name）
     - 二次变量：根据计算公式计算（将来实现）
  4. 组装返回数据（固定字段 + 动态字段）
  5. 写入操作（写）：
     - 资产字段：通过资产字段的写入API（必须是 COMMAND/SETPOINT/PARAM_SET 类型）
     - DI 点：通过通信实例的写入API（直接写DO点）
  ↓
前端展示：
  1. 根据配置渲染字段列表
  2. 显示实时数据
  3. 支持交互（断路器控制、故障复位等）
```

---

## 6. 注意事项

### 6.1 固定字段处理

- **固定字段定义**：所有BMS厂家都能提供的字段，在配置表中标记为 `field_type='fixed'` 和 `is_required=1`
- **固定字段列表**（SYS页面）：
  - `fault`（告警状态）- 只读，STATUS类型
  - `voltage`（电压）- 只读，MEASURE类型
  - `current`（电流）- 只读，MEASURE类型
  - `power`（功率）- 只读，MEASURE类型（可能通过计算：电压 * 电流 / 1000）
  - `breaker_status`（断路器状态）- 只读，STATUS类型
  - `breaker_command`（断路器指令）- 可写，COMMAND类型
- **固定字段绑定**：需要绑定到数据来源（资产字段或DI点），不是硬编码
- **读写分离**：
  - 读：从 `read_source_type` 指定的数据来源读取
  - 写：写入到 `write_source_type` 指定的数据来源（资产字段必须是 COMMAND/SETPOINT/PARAM_SET 类型）

### 6.2 可配置字段处理

- 可配置字段（如 SOC、SOH、SOS）在配置表中标记为 `is_required=0`
- 可配置字段需要绑定到数据来源：
  - **资产字段**（主要）：绑定到 `device_type_tags.tag_name`
  - **DI 点**：某些 BMS 的 DO 量，直接关联到通信实例的 DI 点
  - **二次变量计算**（将来实现）：如总功率 = 电压 * 电流 / 1000，暂时不设计和实现
- 如果某个供应商不支持某个字段，可以不绑定，前端不显示

### 6.3 遥信量处理

- **数据来源**：
  - **资产字段**（主要）：绑定到 `device_type_tags.tag_name`，故障等级和枚举值使用资产字段的配置
  - **DI 点**（某些 BMS 的 DO 量）：某些 BMS 厂家提供的 DO 量，在我们的系统中是 DI，需要直接关联到通信实例的 DI 点
- **位域拆分**：已在通信模板的 `point_table_points.parse_rules_json` 中配置，通过子点映射（如 `StatusWord4.mode_code`、`StatusWord4.high_temp_bit`）
- **故障等级**：使用 `device_type_tags.severity`（0~4），不在 BMS 配置中重复定义
- **枚举值**：使用 `device_type_tags.enum_json`，不在 BMS 配置中重复定义

### 6.4 拓扑图处理

- 拓扑图中的节点数量（包数量、簇数量）从资产字段中获取
- 拓扑图中的节点字段（如包的电压、电流）需要绑定到数据来源（读）
- **簇的分合闸**（三级架构）：
  - 分合闸状态（读）：通过 `read_source_type` 绑定到数据来源
  - 分合闸指令（写）：通过 `write_source_type` 绑定到数据来源（资产字段必须是 COMMAND 类型）
  - 在 `bms_topology_bindings` 表中，同一个 `topology_field_config_id` 可以同时配置读和写数据来源

### 6.5 BMU 处理

- 串并数（如 15串2并）在 BMU 配置中设置
- 单体字段（电压、温度、SOC、SOH）需要绑定到资产字段
- 温度测点需要绑定到资产字段（如果资产有温度测点字段）

---

## 7. 扩展性考虑

### 7.1 多供应商支持

- 不同供应商的 BMS 可能有不同的字段和遥信量
- 通过配置表可以灵活配置不同供应商的字段列表
- 通过绑定表可以将不同供应商的字段映射到统一的数据来源：
  - 资产字段（主要）
  - DI 点（某些 BMS 的 DO 量）
  - 二次变量计算（将来实现）

### 7.4 二次变量计算（将来实现）

- **需求**：某些 BMS 厂家只提供总电压和总电流，总功率需要自己计算（电压 * 电流 / 1000）
- **实现方式**：用户用原始数据根据四则运算计算出新值
- **状态**：暂时不设计和实现，但已在绑定表中预留 `read_source_type='calculated'` 字段
- **未来扩展**：在 `bms_field_bindings` 表中添加 `calculated_expression` 字段，支持公式计算

### 7.5 写入功能支持

- **写入类型**：
  - **COMMAND**：控制命令（如断路器指令、簇分合闸指令）
  - **SETPOINT**：设定值（如目标功率）
  - **PARAM_SET**：参数设定（如保护定值）
- **写入数据来源**：
  - **资产字段**：绑定到 `device_type_tags.tag_name`，字段的 `semantic_type` 必须是 COMMAND/SETPOINT/PARAM_SET
  - **DI 点**：某些 BMS 的 DO 量，直接写入到通信实例的 DO 点
- **写入流程**：
  1. 前端调用写入API：`POST /api/bms/instances/{id}/fields/{field_key}/write`
  2. 后端根据 `write_source_type` 和 `write_asset_tag_name`/`write_point_name` 找到写入目标
  3. 如果是资产字段，调用资产字段写入API（参考 `device.md` 第 9.3 节）
  4. 如果是 DI 点，直接通过通信实例写入
  5. 写入成功后生成相应的 SOE（CMD_SENT/CMD_FAIL/SETPOINT_CHANGE/PARAM_CHANGE）

### 7.2 多架构支持

- 当前支持二级架构和三级架构
- 未来可能支持其他架构（如一级架构、四级架构）
- 通过架构表和页面配置表可以灵活扩展

### 7.3 多语言支持

- 所有显示名称都支持中英文
- 通过 `display_name_zh` 和 `display_name_en` 字段存储
- 前端根据当前语言选择显示

---

## 8. 参考文档

- [设备管理文档](../device.md) - 设备模板、资产、通信实例的配置流程
- [数据库设计文档](../DATABASE_DESIGN.md) - 数据库表结构设计
- [前端开发规范](../../.cursor/rules/frontend.mdc) - 前端开发规范
- [后端开发规范](../../.cursor/rules/backend.mdc) - 后端开发规范

### 8.1 复用现有设计

本设计遵循以下原则，避免重复配置：

1. **遥信量位域拆分**：已在 `point_table_points.parse_rules_json` 中配置（参考 `device.md` 第 5.4 节），通过 `sub_points` 定义子点，BMS 配置不再重复设计
2. **故障等级**：已在 `device_type_tags.severity` 中定义（0~4，参考 `DATABASE_DESIGN.md` 第 4.4 节），BMS 配置直接使用资产字段的 severity
3. **枚举值定义**：已在 `device_type_tags.enum_json` 中定义（参考 `DATABASE_DESIGN.md` 第 4.4 节），BMS 配置直接使用资产字段的 enum_json
4. **资产映射**：已在 `asset_mappings` 表中实现（参考 `DATABASE_DESIGN.md` 第 4.7 节），BMS 绑定复用此机制

---

## 9. 版本历史

| 版本 | 日期 | 作者 | 说明 |
|------|------|------|------|
| v1.0.0 | 2025-01-XX | AI Assistant | 初始版本，完成设计文档 |
| v1.1.0 | 2025-01-XX | AI Assistant | 重大调整：<br/>1. 删除重复配置（位域拆分、故障等级、枚举值）<br/>2. 明确 BMS 识别方式（通过 bms_instances.asset_id）<br/>3. 支持多种数据来源（资产字段/DI点/二次变量）<br/>4. 遵循现有设计文档（device.md、DATABASE_DESIGN.md） |
| v1.2.0 | 2025-01-XX | AI Assistant | 功能增强：<br/>1. 固定字段单独配置（告警状态、电压、电流、功率、断路器状态、断路器指令）<br/>2. 支持写入功能（读写分离，支持 COMMAND/SETPOINT/PARAM_SET）<br/>3. 支持簇分合闸指令绑定（三级架构拓扑图） |

---

## 10. 待办事项

- [ ] 评审设计文档
- [ ] 创建数据库迁移脚本
- [ ] 实现后端模型和 API
- [ ] 实现前端配置管理页面
- [ ] 实现前端绑定管理页面
- [ ] 改造现有 BMS 测试面板
- [ ] 编写测试用例
- [ ] 编写用户文档
