# BMS 数据绑定功能设计文档

> **版本**: v1.4.1  
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
    - 遥测量：全部可配置，需配置数据来源（资产字段或DI点）
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
    display_name_zh TEXT NOT NULL,                -- 中文显示名称：'二级架构'
    display_name_en TEXT NOT NULL,                -- 英文显示名称：'Level 2 Architecture'
    description_zh TEXT NOT NULL DEFAULT '',       -- 中文描述
    description_en TEXT NOT NULL DEFAULT '',      -- 英文描述
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- BMS 页面配置表
CREATE TABLE IF NOT EXISTS bms_page_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    architecture_id INTEGER NOT NULL,             -- 架构ID
    page_type TEXT NOT NULL,                     -- 页面类型：'SYS' | 'BCU' | 'BAU' | 'BMU'
    display_name_zh TEXT NOT NULL,                -- 中文显示名称
    display_name_en TEXT NOT NULL,                -- 英文显示名称
    description_zh TEXT NOT NULL DEFAULT '',      -- 中文描述
    description_en TEXT NOT NULL DEFAULT '',       -- 英文描述
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(architecture_id) REFERENCES bms_architectures(id) ON DELETE CASCADE,
    UNIQUE(architecture_id, page_type)
);

-- BMS 字段配置表（固定字段和可配置字段）
-- 固定字段：所有BMS厂家都能提供的字段（告警状态、电压、电流、功率、断路器状态、断路器指令）
-- 可配置字段：取决于供应商的字段（SOC、SOH、SOS等）
-- 说明：每个 BMS 实例有自己独立的字段配置
CREATE TABLE IF NOT EXISTS bms_field_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bms_instance_id INTEGER NOT NULL,               -- BMS 实例ID（外键关联 bms_instances.id）
    page_type TEXT NOT NULL,                        -- 页面类型：'SYS' | 'BCU' | 'BAU' | 'BMU'
    field_key TEXT NOT NULL,                       -- 字段键（如 'fault', 'voltage', 'current', 'power', 'breaker_status', 'breaker_command', 'soc'）
    display_name_zh TEXT NOT NULL,                  -- 中文显示名
    display_name_en TEXT NOT NULL,                  -- 英文显示名
    field_type TEXT NOT NULL,                       -- 字段类型：'fixed' | 'dynamic'
    data_type TEXT NOT NULL,                        -- 数据类型：'boolean' | 'number' | 'enum'
    unit_zh TEXT NOT NULL DEFAULT '',               -- 中文单位
    unit_en TEXT NOT NULL DEFAULT '',               -- 英文单位
    is_required BOOLEAN NOT NULL DEFAULT 0,        -- 是否必填（固定字段为1）
    -- 读写权限
    is_readable BOOLEAN NOT NULL DEFAULT 1,         -- 是否可读（1=可读，0=只写）
    is_writable BOOLEAN NOT NULL DEFAULT 0,         -- 是否可写（1=可写，0=只读）
    -- 字段来源类型（明确字段的数据来源）
    source_type TEXT NOT NULL,                      -- 字段来源类型：'asset_field'（资产字段）| 'custom'（自定义字段）| 'di_point'（DI点）
    -- 当 source_type='asset_field' 时使用（外键关联，不使用名称依赖）
    read_device_type_tag_id INTEGER,                -- 读：资产字段ID（外键关联 device_type_tags.id）
    write_device_type_tag_id INTEGER,                -- 写：资产字段ID（外键关联 device_type_tags.id，仅当 is_writable=1 时使用）
    -- 当 source_type='di_point' 时使用
    read_comm_instance_id INTEGER,                  -- 读：通信实例ID（外键关联 comm_instances.id）
    read_point_id INTEGER,                          -- 读：点表点ID（外键关联 point_table_points.id）
    write_comm_instance_id INTEGER,                  -- 写：通信实例ID（外键关联 comm_instances.id，仅当 is_writable=1 时使用）
    write_point_id INTEGER,                         -- 写：点表点ID（外键关联 point_table_points.id，仅当 is_writable=1 时使用）
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
    sort_order INTEGER NOT NULL DEFAULT 0,          -- 排序索引（避免使用 index 关键字）
    description_zh TEXT NOT NULL DEFAULT '',        -- 中文描述
    description_en TEXT NOT NULL DEFAULT '',        -- 英文描述
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bms_instance_id) REFERENCES bms_instances(id) ON DELETE CASCADE,
    FOREIGN KEY(read_device_type_tag_id) REFERENCES device_type_tags(id) ON DELETE RESTRICT,
    FOREIGN KEY(write_device_type_tag_id) REFERENCES device_type_tags(id) ON DELETE RESTRICT,
    FOREIGN KEY(read_comm_instance_id) REFERENCES comm_instances(id) ON DELETE RESTRICT,
    FOREIGN KEY(read_point_id) REFERENCES point_table_points(id) ON DELETE RESTRICT,
    FOREIGN KEY(write_comm_instance_id) REFERENCES comm_instances(id) ON DELETE RESTRICT,
    FOREIGN KEY(write_point_id) REFERENCES point_table_points(id) ON DELETE RESTRICT,
    -- 检查约束：字段来源类型验证
    CHECK (source_type IN ('asset_field', 'custom', 'di_point')),
    -- 检查约束：根据 source_type 验证必填字段
    CHECK (
        (source_type = 'asset_field' AND read_device_type_tag_id IS NOT NULL) OR
        (source_type = 'custom') OR
        (source_type = 'di_point' AND read_comm_instance_id IS NOT NULL AND read_point_id IS NOT NULL)
    ),
    -- 检查约束：可写字段必须可读（写入后需要读取反馈）
    CHECK (is_writable = 0 OR is_readable = 1),
    -- 检查约束：可写字段必须配置写数据来源
    CHECK (
        is_writable = 0 OR
        (source_type = 'asset_field' AND write_device_type_tag_id IS NOT NULL) OR
        (source_type = 'di_point' AND write_comm_instance_id IS NOT NULL AND write_point_id IS NOT NULL)
    ),
    UNIQUE(bms_instance_id, page_type, field_key)
);

-- BMS 遥信量配置表
-- 注意：位域拆分已在 point_table_points.parse_rules_json 中配置，此处仅配置业务显示信息
-- 说明：每个 BMS 实例有自己独立的遥信量配置
-- 术语说明：遥信（Teleindication/Tele-signal）指状态信号，不是遥控（Telecontrol）
CREATE TABLE IF NOT EXISTS bms_teleindication_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bms_instance_id INTEGER NOT NULL,               -- BMS 实例ID（外键关联 bms_instances.id）
    page_type TEXT NOT NULL,                        -- 页面类型：'BCU' | 'BAU'
    teleindication_key TEXT NOT NULL,                -- 遥信量键（如 'total_overvoltage'）
    display_name_zh TEXT NOT NULL,                  -- 中文显示名
    display_name_en TEXT NOT NULL,                  -- 英文显示名
    teleindication_type TEXT NOT NULL,               -- 遥信类型：'boolean' | 'enum' | 'bitfield'
    -- 字段来源类型（明确遥信量的数据来源）
    source_type TEXT NOT NULL,                      -- 字段来源类型：'asset_field'（资产字段）| 'di_point'（DI点）
    -- 当 source_type='asset_field' 时使用（外键关联，不使用名称依赖）
    device_type_tag_id INTEGER,                     -- 资产字段ID（外键关联 device_type_tags.id）
    -- 当 source_type='di_point' 时使用
    comm_instance_id INTEGER,                       -- 通信实例ID（外键关联 comm_instances.id）
    point_id INTEGER,                                -- 点表点ID（外键关联 point_table_points.id，支持子点）
    -- 注意：故障等级和枚举值定义使用资产字段的配置（device_type_tags.severity 和 enum_json）
    sort_order INTEGER NOT NULL DEFAULT 0,          -- 排序索引（避免使用 index 关键字）
    description_zh TEXT NOT NULL DEFAULT '',         -- 中文描述
    description_en TEXT NOT NULL DEFAULT '',         -- 英文描述
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bms_instance_id) REFERENCES bms_instances(id) ON DELETE CASCADE,
    FOREIGN KEY(device_type_tag_id) REFERENCES device_type_tags(id) ON DELETE RESTRICT,
    FOREIGN KEY(comm_instance_id) REFERENCES comm_instances(id) ON DELETE RESTRICT,
    FOREIGN KEY(point_id) REFERENCES point_table_points(id) ON DELETE RESTRICT,
    -- 检查约束：字段来源类型验证
    CHECK (source_type IN ('asset_field', 'di_point')),
    -- 检查约束：根据 source_type 验证必填字段
    CHECK (
        (source_type = 'asset_field' AND device_type_tag_id IS NOT NULL) OR
        (source_type = 'di_point' AND comm_instance_id IS NOT NULL AND point_id IS NOT NULL)
    ),
    UNIQUE(bms_instance_id, page_type, teleindication_key)
);

-- BMS 拓扑配置表（SYS 页面的拓扑图配置）
-- 说明：每个 BMS 实例有自己独立的拓扑配置
CREATE TABLE IF NOT EXISTS bms_topology_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bms_instance_id INTEGER NOT NULL,               -- BMS 实例ID（外键关联 bms_instances.id）
    topology_type TEXT NOT NULL,                    -- 拓扑类型：'pack'（二级架构）| 'cluster'（三级架构）
    display_name_zh TEXT NOT NULL,                  -- 中文显示名
    display_name_en TEXT NOT NULL,                  -- 英文显示名
    description_zh TEXT NOT NULL DEFAULT '',        -- 中文描述
    description_en TEXT NOT NULL DEFAULT '',         -- 英文描述
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bms_instance_id) REFERENCES bms_instances(id) ON DELETE CASCADE,
    UNIQUE(bms_instance_id, topology_type)
);

-- BMS 拓扑字段配置表（拓扑图中每个节点显示的字段）
-- 说明：拓扑图的字段可以独立配置，不一定与主页面字段相同
-- 例如：主页面显示"堆电压"，拓扑图显示"簇电压"
-- 说明：每个 BMS 实例有自己独立的拓扑字段配置
CREATE TABLE IF NOT EXISTS bms_topology_field_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topology_config_id INTEGER NOT NULL,            -- 拓扑配置ID
    field_key TEXT NOT NULL,                        -- 字段键（独立定义，如 'cluster_voltage', 'cluster_current', 'cluster_soc', 'cluster_breaker_status'）
    display_name_zh TEXT NOT NULL,                  -- 中文显示名
    display_name_en TEXT NOT NULL,                  -- 英文显示名
    display_position TEXT NOT NULL DEFAULT 'card',  -- 显示位置：'header'（卡片头部，如簇编号）| 'card'（卡片主体，如电压、电流、SOC）| 'footer'（卡片底部，如分合闸按钮）
    -- 字段来源类型（明确字段的数据来源）
    source_type TEXT NOT NULL,                      -- 字段来源类型：'asset_field'（资产字段）| 'di_point'（DI点）
    -- 当 source_type='asset_field' 时使用（外键关联，不使用名称依赖）
    read_device_type_tag_id INTEGER,                 -- 读：资产字段ID（外键关联 device_type_tags.id）
    write_device_type_tag_id INTEGER,                -- 写：资产字段ID（外键关联 device_type_tags.id，仅当字段可写时使用）
    -- 当 source_type='di_point' 时使用
    read_comm_instance_id INTEGER,                  -- 读：通信实例ID（外键关联 comm_instances.id）
    read_point_id INTEGER,                           -- 读：点表点ID（外键关联 point_table_points.id）
    write_comm_instance_id INTEGER,                  -- 写：通信实例ID（外键关联 comm_instances.id，仅当字段可写时使用）
    write_point_id INTEGER,                         -- 写：点表点ID（外键关联 point_table_points.id，仅当字段可写时使用）
    sort_order INTEGER NOT NULL DEFAULT 0,          -- 排序索引（同一位置内的显示顺序）
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(topology_config_id) REFERENCES bms_topology_configs(id) ON DELETE CASCADE,
    FOREIGN KEY(read_device_type_tag_id) REFERENCES device_type_tags(id) ON DELETE RESTRICT,
    FOREIGN KEY(write_device_type_tag_id) REFERENCES device_type_tags(id) ON DELETE RESTRICT,
    FOREIGN KEY(read_comm_instance_id) REFERENCES comm_instances(id) ON DELETE RESTRICT,
    FOREIGN KEY(read_point_id) REFERENCES point_table_points(id) ON DELETE RESTRICT,
    FOREIGN KEY(write_comm_instance_id) REFERENCES comm_instances(id) ON DELETE RESTRICT,
    FOREIGN KEY(write_point_id) REFERENCES point_table_points(id) ON DELETE RESTRICT,
    -- 检查约束：字段来源类型验证
    CHECK (source_type IN ('asset_field', 'di_point')),
    -- 检查约束：根据 source_type 验证必填字段
    CHECK (
        (source_type = 'asset_field' AND read_device_type_tag_id IS NOT NULL) OR
        (source_type = 'di_point' AND read_comm_instance_id IS NOT NULL AND read_point_id IS NOT NULL)
    ),
    UNIQUE(topology_config_id, field_key),
    CHECK (display_position IN ('header', 'card', 'footer'))
);

-- BMS BMU 配置表（BMU 页面的字段配置）
-- 注意：串并数（series_count、parallel_count）现在从 bms_hierarchy_configs 表获取，不再在此表配置
-- 说明：每个 BMS 实例有自己独立的 BMU 配置
CREATE TABLE IF NOT EXISTS bms_bmu_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bms_instance_id INTEGER NOT NULL,               -- BMS 实例ID（外键关联 bms_instances.id）
    -- 阈值配置（用于判断单体电压和温度测点的颜色状态）
    -- 这些阈值对每个BMS实例是一致的
    voltage_upper_limit REAL,                       -- 电压上限（用于判断过压，超过此值为 alarm）
    voltage_lower_limit REAL,                       -- 电压下限（用于判断欠压，低于此值为 alarm）
    voltage_warning_upper_limit REAL,               -- 电压警告上限（超过此值为 warning）
    voltage_warning_lower_limit REAL,                -- 电压警告下限（低于此值为 warning）
    temperature_upper_limit REAL,                    -- 温度上限（用于判断过温，超过此值为 alarm）
    temperature_lower_limit REAL,                    -- 温度下限（用于判断欠温，低于此值为 alarm）
    temperature_warning_upper_limit REAL,            -- 温度警告上限（超过此值为 warning）
    temperature_warning_lower_limit REAL,            -- 温度警告下限（低于此值为 warning）
    description_zh TEXT NOT NULL DEFAULT '',        -- 中文描述
    description_en TEXT NOT NULL DEFAULT '',         -- 英文描述
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bms_instance_id) REFERENCES bms_instances(id) ON DELETE CASCADE,
    UNIQUE(bms_instance_id)
);

-- BMS BMU 单体字段配置表
-- 说明：每个 BMS 实例有自己独立的单体字段配置
-- 注意：温度字段不在此表配置，温度测点单独在 bms_bmu_temperature_points 表中配置
CREATE TABLE IF NOT EXISTS bms_bmu_cell_field_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bmu_config_id INTEGER NOT NULL,                 -- BMU 配置ID
    field_key TEXT NOT NULL,                         -- 字段键（如 'voltage', 'soc', 'soh'，注意：不包含 'temperature'）
    display_name_zh TEXT NOT NULL,                   -- 中文显示名
    display_name_en TEXT NOT NULL,                   -- 英文显示名
    data_type TEXT NOT NULL,                         -- 数据类型：'number'
    unit_zh TEXT NOT NULL DEFAULT '',                -- 中文单位
    unit_en TEXT NOT NULL DEFAULT '',                -- 英文单位
    -- 字段来源类型（明确字段的数据来源）
    source_type TEXT NOT NULL,                       -- 字段来源类型：'asset_field'（资产字段）| 'di_point'（DI点）
    -- 当 source_type='asset_field' 时使用（外键关联，不使用名称依赖）
    device_type_tag_id INTEGER,                      -- 资产字段ID（外键关联 device_type_tags.id）
    -- 当 source_type='di_point' 时使用
    comm_instance_id INTEGER,                         -- 通信实例ID（外键关联 comm_instances.id）
    point_id INTEGER,                                 -- 点表点ID（外键关联 point_table_points.id，支持子点）
    sort_order INTEGER NOT NULL DEFAULT 0,           -- 排序索引（避免使用 index 关键字）
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bmu_config_id) REFERENCES bms_bmu_configs(id) ON DELETE CASCADE,
    FOREIGN KEY(device_type_tag_id) REFERENCES device_type_tags(id) ON DELETE RESTRICT,
    FOREIGN KEY(comm_instance_id) REFERENCES comm_instances(id) ON DELETE RESTRICT,
    FOREIGN KEY(point_id) REFERENCES point_table_points(id) ON DELETE RESTRICT,
    -- 检查约束：字段来源类型验证
    CHECK (source_type IN ('asset_field', 'di_point')),
    -- 检查约束：根据 source_type 验证必填字段
    CHECK (
        (source_type = 'asset_field' AND device_type_tag_id IS NOT NULL) OR
        (source_type = 'di_point' AND comm_instance_id IS NOT NULL AND point_id IS NOT NULL)
    ),
    -- 检查约束：field_key 不能是 'temperature'（温度测点单独配置）
    CHECK (field_key != 'temperature'),
    UNIQUE(bmu_config_id, field_key)
);

-- 说明：温度测点不是每个单体都有，需要单独配置
-- 注意：温度测点的数量从 bms_hierarchy_configs.temperature_point_count 获取（统一配置），具体测点在此表定义
CREATE TABLE IF NOT EXISTS bms_bmu_temperature_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bmu_config_id INTEGER NOT NULL,                 -- BMU 配置ID
    point_number INTEGER NOT NULL,                    -- 测点编号（如 1, 2, 3...）
    display_name_zh TEXT NOT NULL,                   -- 中文显示名（如 '测点1', '测点2'）
    display_name_en TEXT NOT NULL,                   -- 英文显示名（如 'Point 1', 'Point 2'）
    unit_zh TEXT NOT NULL DEFAULT '℃',              -- 中文单位
    unit_en TEXT NOT NULL DEFAULT '°C',              -- 英文单位
    -- 字段来源类型（明确温度测点的数据来源）
    source_type TEXT NOT NULL,                       -- 字段来源类型：'asset_field'（资产字段）| 'di_point'（DI点）
    -- 当 source_type='asset_field' 时使用（外键关联，不使用名称依赖）
    device_type_tag_id INTEGER,                      -- 资产字段ID（外键关联 device_type_tags.id）
    -- 当 source_type='di_point' 时使用
    comm_instance_id INTEGER,                         -- 通信实例ID（外键关联 comm_instances.id）
    point_id INTEGER,                                 -- 点表点ID（外键关联 point_table_points.id，支持子点）
    sort_order INTEGER NOT NULL DEFAULT 0,           -- 排序索引（避免使用 index 关键字）
    description_zh TEXT NOT NULL DEFAULT '',         -- 中文描述
    description_en TEXT NOT NULL DEFAULT '',         -- 英文描述
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bmu_config_id) REFERENCES bms_bmu_configs(id) ON DELETE CASCADE,
    FOREIGN KEY(device_type_tag_id) REFERENCES device_type_tags(id) ON DELETE RESTRICT,
    FOREIGN KEY(comm_instance_id) REFERENCES comm_instances(id) ON DELETE RESTRICT,
    FOREIGN KEY(point_id) REFERENCES point_table_points(id) ON DELETE RESTRICT,
    -- 检查约束：字段来源类型验证
    CHECK (source_type IN ('asset_field', 'di_point')),
    -- 检查约束：根据 source_type 验证必填字段
    CHECK (
        (source_type = 'asset_field' AND device_type_tag_id IS NOT NULL) OR
        (source_type = 'di_point' AND comm_instance_id IS NOT NULL AND point_id IS NOT NULL)
    ),
    UNIQUE(bmu_config_id, point_number)
);

-- BMS BMU 其它数据配置表
-- 说明：某些BMS供应商提供的与单体、温度无关的数据（如均衡器状态等）
CREATE TABLE IF NOT EXISTS bms_bmu_other_data_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bmu_config_id INTEGER NOT NULL,                 -- BMU 配置ID
    field_key TEXT NOT NULL,                         -- 字段键（如 'balancer_status', 'balancer_current'）
    display_name_zh TEXT NOT NULL,                   -- 中文显示名
    display_name_en TEXT NOT NULL,                   -- 英文显示名
    data_type TEXT NOT NULL,                         -- 数据类型：'number' | 'boolean' | 'enum'
    unit_zh TEXT NOT NULL DEFAULT '',                -- 中文单位
    unit_en TEXT NOT NULL DEFAULT '',                -- 英文单位
    -- 字段来源类型（明确字段的数据来源）
    source_type TEXT NOT NULL,                       -- 字段来源类型：'asset_field'（资产字段）| 'di_point'（DI点）
    -- 当 source_type='asset_field' 时使用（外键关联，不使用名称依赖）
    device_type_tag_id INTEGER,                      -- 资产字段ID（外键关联 device_type_tags.id）
    -- 当 source_type='di_point' 时使用
    comm_instance_id INTEGER,                         -- 通信实例ID（外键关联 comm_instances.id）
    point_id INTEGER,                                 -- 点表点ID（外键关联 point_table_points.id，支持子点）
    sort_order INTEGER NOT NULL DEFAULT 0,           -- 排序索引（避免使用 index 关键字）
    description_zh TEXT NOT NULL DEFAULT '',         -- 中文描述
    description_en TEXT NOT NULL DEFAULT '',         -- 英文描述
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bmu_config_id) REFERENCES bms_bmu_configs(id) ON DELETE CASCADE,
    FOREIGN KEY(device_type_tag_id) REFERENCES device_type_tags(id) ON DELETE RESTRICT,
    FOREIGN KEY(comm_instance_id) REFERENCES comm_instances(id) ON DELETE RESTRICT,
    FOREIGN KEY(point_id) REFERENCES point_table_points(id) ON DELETE RESTRICT,
    -- 检查约束：字段来源类型验证
    CHECK (source_type IN ('asset_field', 'di_point')),
    -- 检查约束：根据 source_type 验证必填字段
    CHECK (
        (source_type = 'asset_field' AND device_type_tag_id IS NOT NULL) OR
        (source_type = 'di_point' AND comm_instance_id IS NOT NULL AND point_id IS NOT NULL)
    ),
    UNIQUE(bmu_config_id, field_key)
);
```

#### 3.1.2 BMS 实例和层级节点表

**重要说明**：
- **BMS 识别**：如果一个资产被关联到 `bms_instances` 表，就被系统识别为 BMS
- **字段来源**：BMS 页面的数据来源在字段配置表中直接定义，支持：
  1. **资产字段**（主要来源）：通过外键关联 `device_type_tags.id`
  2. **DI 点**（某些 BMS 的 DO 量）：通过外键关联 `comm_instances.id` 和 `point_table_points.id`
  3. **自定义字段**（仅用于显示，无数据来源）
  4. **二次变量计算**（将来实现）：用户用原始数据根据四则运算计算出新值（如：总功率 = 电压 * 电流 / 1000），**暂时不设计和实现**

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

CREATE TABLE IF NOT EXISTS bms_hierarchy_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bms_instance_id INTEGER NOT NULL UNIQUE,         -- BMS 实例ID（外键关联 bms_instances.id），每个实例仅一条
    cluster_count INTEGER NOT NULL DEFAULT 1,         -- 簇数量（三级架构为堆下簇数，二级架构通常为 1）
    pack_count_per_cluster INTEGER NOT NULL DEFAULT 1,-- 每个簇下的包数量
    series_count INTEGER NOT NULL,                    -- 包的串联数（如 15）
    parallel_count INTEGER NOT NULL,                  -- 包的并联数（如 2）
    temperature_point_count INTEGER NOT NULL DEFAULT 0,-- 每个包的温度测点数量（统一配置，若没有则填 0）
    description_zh TEXT NOT NULL DEFAULT '',         -- 中文描述
    description_en TEXT NOT NULL DEFAULT '',          -- 英文描述
    metadata_json TEXT NOT NULL DEFAULT '{}',        -- 自定义元数据JSON
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bms_instance_id) REFERENCES bms_instances(id) ON DELETE CASCADE,
    CHECK (cluster_count >= 1),
    CHECK (pack_count_per_cluster >= 1),
    CHECK (series_count >= 1),
    CHECK (parallel_count >= 1),
    CHECK (temperature_point_count >= 0)
);

-- 注意：字段绑定信息现在直接存储在字段配置表中，不再需要单独的绑定表
-- bms_field_configs 表已经包含了字段来源信息（source_type、device_type_tag_id、comm_instance_id、point_id）
-- bms_teleindication_configs 表已经包含了遥信量来源信息
-- bms_topology_field_configs 表已经包含了拓扑字段来源信息
-- bms_bmu_cell_field_configs 表已经包含了单体字段来源信息（不包含温度）
-- bms_bmu_temperature_points 表已经包含了温度测点来源信息
-- bms_bmu_other_data_configs 表已经包含了其它数据来源信息
```

### 3.2 后端 API 设计

#### 3.2.1 BMS 架构和页面配置 API

**说明**：架构和页面配置是全局的，所有 BMS 实例共享。

```
# 架构管理
GET    /api/bms/architectures              # 获取架构列表
GET    /api/bms/architectures/{id}         # 获取架构详情

# 页面配置管理（全局配置，所有实例共享）
GET    /api/bms/page-configs              # 获取页面配置列表
GET    /api/bms/page-configs/{id}          # 获取页面配置详情
POST   /api/bms/page-configs               # 创建页面配置
PATCH  /api/bms/page-configs/{id}          # 更新页面配置
DELETE /api/bms/page-configs/{id}          # 删除页面配置
```

#### 3.2.2 BMS 实例和层级管理 API

# BMS 实例管理
GET    /api/bms/instances                  # 获取 BMS 实例列表
GET    /api/bms/instances/{id}             # 获取 BMS 实例详情
POST   /api/bms/instances                  # 创建 BMS 实例
PATCH  /api/bms/instances/{id}             # 更新 BMS 实例
DELETE /api/bms/instances/{id}             # 删除 BMS 实例

# BMS 层级配置管理（简化：每个实例一条记录）
GET    /api/bms/instances/{id}/hierarchy-config        # 获取层级配置（簇数、每簇包数、串并数、温度测点数）
POST   /api/bms/instances/{id}/hierarchy-config        # 创建层级配置
PATCH  /api/bms/hierarchy-configs/{id}                 # 更新层级配置
DELETE /api/bms/hierarchy-configs/{id}                 # 删除层级配置

#### 3.2.3 BMS 字段配置管理 API

**说明**：字段绑定信息现在直接存储在字段配置表中，不再需要单独的绑定表。配置字段时直接指定数据来源。

# 字段写入操作
POST   /api/bms/instances/{id}/fields/{field_key}/write  # 写入字段值（如断路器指令）

#### 3.2.4 BMS 数据查询 API（用于前端展示）

```
# 获取 BMS 实例的实时数据
GET    /api/bms/instances/{id}/data/sys              # 获取 SYS 页面数据
GET    /api/bms/instances/{id}/data/bcu              # 获取 BCU 页面数据
GET    /api/bms/instances/{id}/data/bau              # 获取 BAU 页面数据（三级架构）
GET    /api/bms/instances/{id}/data/bmu              # 获取 BMU 页面数据

# 获取拓扑数据
GET    /api/bms/instances/{id}/topology/packs        # 获取包列表（二级架构，从层级节点获取）
GET    /api/bms/instances/{id}/topology/clusters     # 获取簇列表（三级架构，从层级节点获取）
GET    /api/bms/instances/{id}/hierarchy-summary     # 根据 hierarchy-config 生成层级概览/树（用于拓扑图渲染，包含簇/包编号、串并数、温度测点数）
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
6. 配置层级结构（堆/簇/包节点，包括数量、串并数等）
7. 配置 BMU（阈值配置、单体字段、温度测点、其它数据）

#### 3.3.2 BMS 配置管理页面（实例级别）

**路径**: `/config/bms-instances`

**功能**:
1. 选择资产（下拉选择，只显示已配置的资产）
2. 选择架构类型（二级/三级）
3. 创建 BMS 实例（关联资产和架构，一旦关联，资产即被识别为 BMS）
4. 配置层级结构（堆/簇/包节点，包括数量、串并数等）
5. 配置 SYS 页面字段（固定字段 + 可配置字段，每个字段配置数据来源）
6. 配置 BCU/BAU 页面字段（遥测量和遥信量，每个字段配置数据来源）
7. 配置拓扑图字段（簇/包的显示字段，每个字段配置数据来源）
8. 配置 BMU 页面字段（单体字段，每个字段配置数据来源）

**UI 设计**:
- 左侧：BMS 实例列表
- 中间：页面配置树（SYS/BCU/BAU/BMU）
- 右侧：资产字段选择器（显示该资产的所有字段，按分组显示）

#### 3.3.3 BMS 测试面板页面（现有页面改造）

**路径**: `/test/bms-level2`, `/test/bms-level3`

**改造点**:
1. 从配置中读取字段列表（根据 `bms_instance_id` 和 `page_type` 查询）
2. 从字段配置中读取数据来源（`source_type`、`device_type_tag_id`、`comm_instance_id`、`point_id`）
3. 实时数据从资产字段或 DI 点中获取（通过 WebSocket 或轮询）

---

## 4. 实现步骤

### 4.1 第一阶段：数据库和基础 API

1. **创建数据库迁移脚本**
   - 创建所有 BMS 配置表（字段绑定信息集成在配置表中）
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
   - BMU 配置对话框（阈值配置、单体字段、温度测点、其它数据）

### 4.3 第三阶段：实例配置管理前端

1. **创建实例配置管理页面**
   - `frontend/src/pages/config/BMSInstancesPage.tsx`
   - 支持实例创建和字段配置（数据来源直接在配置时指定）

2. **创建配置管理组件**
   - 实例创建对话框
   - 字段配置对话框（直接选择数据来源：asset_field / custom / di_point）
   - 遥信量配置对话框
   - 拓扑字段配置对话框
   - BMU 配置对话框（阈值配置、单体字段、温度测点、其它数据）

### 4.4 第四阶段：测试面板改造

1. **改造现有 BMS 页面**
   - 从配置中读取字段列表（根据 `bms_instance_id` 和 `page_type` 查询）
   - 从字段配置中读取数据来源（`source_type`、`read_device_type_tag_id`、`read_comm_instance_id`、`read_point_id`）
   - 实时数据从资产字段或 DI 点中获取（通过 WebSocket 或轮询）

2. **创建数据查询 API**
   - 实现 `/api/bms/instances/{id}/data/*` 接口
   - 根据字段配置的数据来源，从资产字段或 DI 点中聚合数据

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
5. 配置层级结构（堆/簇/包节点，包括数量、串并数等）
6. 配置 BMU（阈值配置、单体字段、温度测点、其它数据）
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
3. 配置层级结构（堆/簇/包节点）
   → 三级架构：创建堆节点 → 创建簇节点（指定数量）→ 创建包节点（指定数量、串并数）
   → 二级架构：创建簇节点 → 创建包节点（指定数量、串并数）
  ↓
4. 配置 SYS 页面字段（固定字段 + 可配置字段，每个字段配置数据来源）
   → 资产字段（主要，通过外键关联 device_type_tags.id）
   → DI 点（某些 BMS 的 DO 量，通过外键关联 comm_instances.id 和 point_table_points.id）
   → 自定义字段（仅用于显示，无数据来源）
  ↓
5. 配置 BCU/BAU 页面字段（遥测量和遥信量，每个字段配置数据来源）
   → 遥测量：在 bms_field_configs 表中配置（page_type='BCU' 或 'BAU'）
   → 遥信量：在 bms_teleindication_configs 表中配置（page_type='BCU' 或 'BAU'）
  ↓
6. 配置拓扑图字段（簇/包的显示字段，每个字段配置数据来源）
   → 在 bms_topology_field_configs 表中配置
   → 拓扑图的节点数量从 bms_hierarchy_configs 表获取（cluster_count、pack_count_per_cluster），前端/后端按编号生成节点（第 X 簇 / 第 X 包）
  ↓
7. 配置 BMU 页面
   → 配置阈值（电压上限/下限、温度上限/下限，在 bms_bmu_configs 表中）
   → 配置单体字段（电压、SOC、SOH等，在 bms_bmu_cell_field_configs 表中，不包含温度）
   → 配置温度测点（在 bms_bmu_temperature_points 表中单独配置）
   → 配置其它数据（均衡器等，在 bms_bmu_other_data_configs 表中配置）
   → 包的串并数从 bms_hierarchy_configs 表中获取（series_count、parallel_count）
```

### 5.3 运行阶段

```
普通用户访问 BMS 测试面板
  ↓
前端请求：GET /api/bms/instances/{id}/data/sys
  ↓
后端处理：
  1. 查询 BMS 实例配置
  2. 查询字段配置（根据 bms_instance_id 和 page_type）
  3. 根据字段配置的 source_type 获取实时数据（读）：
     - asset_field：从字段配置的 read_device_type_tag_id 获取 device_type_tags，然后从 asset_state 中获取数据
     - di_point：从字段配置的 read_comm_instance_id 和 read_point_id 获取实时数据
     - custom：无数据来源，仅用于显示
  4. 组装返回数据（固定字段 + 动态字段）
  5. 写入操作（写）：
     - asset_field：从字段配置的 write_device_type_tag_id 获取 device_type_tags，通过资产字段的写入API（必须是 COMMAND/SETPOINT/PARAM_SET 类型）
     - di_point：从字段配置的 write_comm_instance_id 和 write_point_id，通过通信实例的写入API（直接写DO点）
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
  - 读：根据 `source_type` 和对应的读字段（`read_device_type_tag_id` 或 `read_comm_instance_id` + `read_point_id`）获取数据
  - 写：根据 `source_type` 和对应的写字段（`write_device_type_tag_id` 或 `write_comm_instance_id` + `write_point_id`）写入数据（资产字段必须是 COMMAND/SETPOINT/PARAM_SET 类型）

### 6.2 可配置字段处理

- 可配置字段（如 SOC、SOH、SOS）在配置表中标记为 `field_type='dynamic'` 和 `is_required=0`
- 可配置字段的数据来源在配置表中直接定义：
  - **资产字段**（主要）：通过外键 `device_type_tag_id` 关联到 `device_type_tags.id`
  - **DI 点**：某些 BMS 的 DO 量，通过外键 `comm_instance_id` 和 `point_id` 关联
  - **自定义字段**：`source_type='custom'`，无数据来源，仅用于显示
  - **二次变量计算**（将来实现）：如总功率 = 电压 * 电流 / 1000，暂时不设计和实现
- 如果某个供应商不支持某个字段，可以不创建该字段配置，前端不显示

### 6.3 遥信量处理（BCU/BAU 页面）

- **数据来源**：在 `bms_teleindication_configs` 表中直接定义
  - **资产字段**（主要）：通过外键 `device_type_tag_id` 关联到 `device_type_tags.id`
    - 故障等级和枚举值使用资产字段的配置（`device_type_tags.severity` 和 `enum_json`）
  - **DI 点**（某些 BMS 的 DO 量）：通过外键 `comm_instance_id` 和 `point_id` 关联
- **位域拆分**：已在通信模板的 `point_table_points.parse_rules_json` 中配置，通过子点映射（如 `StatusWord4.mode_code`、`StatusWord4.high_temp_bit`）
- **故障等级**：使用 `device_type_tags.severity`（0~4），不在 BMS 配置中重复定义
- **枚举值**：使用 `device_type_tags.enum_json`，不在 BMS 配置中重复定义

### 6.4 拓扑图处理

- **节点数量与编号生成**：从 `bms_hierarchy_configs` 表获取
  - 三级架构：`cluster_count` 表示堆下簇数量，`pack_count_per_cluster` 表示每簇下包数量
  - 二级架构：`cluster_count` 通常为 1，`pack_count_per_cluster` 表示簇下包数量
  - 前端/后端按数量生成节点编号：第 X 簇 / 第 X 包（无需逐节点存表）
- **节点字段**：拓扑图中的节点字段（如簇/包的电压、电流、SOC）在 `bms_topology_field_configs` 表中配置
  - 每个字段的数据来源在配置表中直接定义（`source_type`、`read_device_type_tag_id`、`read_comm_instance_id`、`read_point_id`）
- **簇的分合闸**（三级架构）：
  - 分合闸状态（读）：在 `bms_topology_field_configs` 表中配置 `read_device_type_tag_id` 或 `read_comm_instance_id` + `read_point_id`
  - 分合闸指令（写）：在 `bms_topology_field_configs` 表中配置 `write_device_type_tag_id` 或 `write_comm_instance_id` + `write_point_id`（资产字段必须是 COMMAND 类型）

### 6.5 BMU 处理

- **串并数**：在 `bms_hierarchy_configs` 表中统一设置（`series_count`、`parallel_count`），用于计算每包单体数量及显示串并数
- **阈值配置**：在 `bms_bmu_configs` 表中配置
  - 电压阈值：`voltage_upper_limit`（过压报警）、`voltage_lower_limit`（欠压报警）、`voltage_warning_upper_limit`（过压警告）、`voltage_warning_lower_limit`（欠压警告）
  - 温度阈值：`temperature_upper_limit`（过温报警）、`temperature_lower_limit`（欠温报警）、`temperature_warning_upper_limit`（过温警告）、`temperature_warning_lower_limit`（欠温警告）
  - 这些阈值用于判断单体和温度测点的颜色状态（normal/warning/alarm）
- **单体字段**（电压、SOC、SOH等，**不包含温度**）：在 `bms_bmu_cell_field_configs` 表中配置
  - 不同供应商提供的字段不同（某些供应商提供电压、SOC、SOH，我们公司只提供电压）
  - 每个字段的数据来源在配置表中直接定义（`source_type`、`device_type_tag_id`、`comm_instance_id`、`point_id`）
  - **注意**：温度字段不在此表配置，温度测点单独配置
- **温度测点**：在 `bms_bmu_temperature_points` 表中单独配置
  - 温度测点数量从 `bms_hierarchy_configs.temperature_point_count` 获取（统一配置），再按数量生成测点编号（第 X 测点）
  - 每个温度测点的数据来源在配置表中直接定义（`source_type`、`device_type_tag_id`、`comm_instance_id`、`point_id`）
- **其它数据**（均衡器等）：在 `bms_bmu_other_data_configs` 表中配置
  - 某些BMS供应商提供的与单体、温度无关的数据（如均衡器状态、均衡电流等）
  - 每个字段的数据来源在配置表中直接定义（`source_type`、`device_type_tag_id`、`comm_instance_id`、`point_id`）

---

## 7. 扩展性考虑

### 7.1 多供应商支持

- 不同供应商的 BMS 可能有不同的字段和遥信量
- 通过配置表可以灵活配置不同供应商的字段列表
- 每个字段的数据来源在配置表中直接定义，支持：
  - 资产字段（主要，通过外键关联）
  - DI 点（某些 BMS 的 DO 量，通过外键关联）
  - 自定义字段（仅用于显示）
  - 二次变量计算（将来实现）

### 7.4 二次变量计算（将来实现）

- **需求**：某些 BMS 厂家只提供总电压和总电流，总功率需要自己计算（电压 * 电流 / 1000）
- **实现方式**：用户用原始数据根据四则运算计算出新值
- **状态**：暂时不设计和实现，但已在字段配置表中预留 `source_type='calculated'` 字段
- **未来扩展**：在字段配置表中添加 `calculated_expression` 字段，支持公式计算

### 7.5 写入功能支持

- **写入类型**：
  - **COMMAND**：控制命令（如断路器指令、簇分合闸指令）
  - **SETPOINT**：设定值（如目标功率）
  - **PARAM_SET**：参数设定（如保护定值）
- **写入数据来源**：
  - **资产字段**：通过外键关联 `device_type_tags.id`，字段的 `semantic_type` 必须是 COMMAND/SETPOINT/PARAM_SET
  - **DI 点**：某些 BMS 的 DO 量，通过外键关联 `comm_instances.id` 和 `point_table_points.id`，直接写入到通信实例的 DO 点
- **写入流程**：
  1. 前端调用写入API：`POST /api/bms/instances/{id}/fields/{field_key}/write`
  2. 后端查询字段配置（`bms_field_configs` 表，根据 `bms_instance_id` 和 `field_key`）
  3. 根据字段配置的 `write_device_type_tag_id` 或 `write_comm_instance_id` + `write_point_id` 找到写入目标
  4. 如果是资产字段，调用资产字段写入API（参考 `device.md` 第 9.3 节）
  5. 如果是 DI 点，直接通过通信实例写入
  6. 写入成功后生成相应的事件记录（SOE：CMD_SENT/CMD_FAIL/SETPOINT_CHANGE/PARAM_CHANGE）

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
| v1.2.1 | 2025-01-XX | AI Assistant | 国际化修正：<br/>1. 所有显示名称字段改为双语（display_name_zh/display_name_en）<br/>2. 所有描述字段改为双语（description_zh/description_en）<br/>3. 避免 SQLite 关键字冲突（order_index → sort_order） |
| v1.2.2 | 2025-01-XX | AI Assistant | 界面位置优化：<br/>1. 拓扑字段配置增加 display_position（header/card/footer）<br/>2. 明确固定字段初始化方式<br/>3. 创建完整的 CSV demo 示例 |
| v1.2.3 | 2025-01-XX | AI Assistant | 层级结构配置：<br/>1. 新增 bms_hierarchy_nodes 表，配置堆/簇/包节点<br/>2. 支持配置堆下簇数量、簇下包数量<br/>3. 支持配置每个包的串并数<br/>4. 拓扑图和BMU页面从层级节点获取数据 |
| v1.3.0 | 2025-01-XX | AI Assistant | 重大重构：<br/>1. 所有配置表关联到 bms_instances（每个实例独立配置）<br/>2. 字段配置表直接包含数据来源信息（外键关联，不使用名称依赖）<br/>3. 删除独立的绑定表，绑定信息集成到配置表<br/>4. 明确 BAU、BCU、BMU 页面的配置方式 |
| v1.4.0 | 2025-01-XX | AI Assistant | BMU 功能增强：<br/>1. BMU 配置表添加阈值字段（电压/温度上下限，用于判断颜色状态）<br/>2. 温度测点单独配置（bms_bmu_temperature_points 表）<br/>3. 添加其它数据配置（bms_bmu_other_data_configs 表，如均衡器等）<br/>4. 单体字段配置移除温度字段（温度单独配置） |
| v1.4.1 | 2025-01-XX | AI Assistant | 层级配置简化：<br/>1. bms_hierarchy_nodes 精简为 bms_hierarchy_configs（每个实例一条记录）<br/>2. 统一配置簇数量、每簇包数量、包的串并数、包的温度测点数量<br/>3. 拓扑与 BMU 串并数、测点数量均从 bms_hierarchy_configs 读取并按编号生成 |

---

## 10. 待办事项

- [ ] 评审设计文档
- [ ] 创建数据库迁移脚本
- [ ] 实现后端模型和 API
- [ ] 实现前端配置管理页面
- [ ] 实现前端实例配置管理页面
- [ ] 改造现有 BMS 测试面板
- [ ] 编写测试用例
- [ ] 编写用户文档
