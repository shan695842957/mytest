-- ============================================================================
-- 迁移版本: v1.8.0
-- 创建时间: 2025-01-XX
-- 说明: BMS（电池管理系统）数据绑定系统
--       支持二级架构（簇→包→单体）和三级架构（堆→簇→包→单体）
--       支持配置化字段绑定（资产字段/DI点/自定义字段）
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. BMS 架构类型表 (bms_architectures)
-- 用途：定义BMS架构类型（二级架构、三级架构）
-- ============================================================================
CREATE TABLE IF NOT EXISTS bms_architectures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,                    -- 架构名称：'level2' | 'level3'
    display_name_zh TEXT NOT NULL,                -- 中文显示名称：'二级架构'
    display_name_en TEXT NOT NULL,                -- 英文显示名称：'Level 2 Architecture'
    description_zh TEXT NOT NULL DEFAULT '',       -- 中文描述
    description_en TEXT NOT NULL DEFAULT '',       -- 英文描述
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_bms_architectures_name ON bms_architectures(name);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_bms_architectures_timestamp
AFTER UPDATE ON bms_architectures
FOR EACH ROW
BEGIN
    UPDATE bms_architectures SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- 初始化默认架构数据
INSERT INTO bms_architectures (name, display_name_zh, display_name_en, description_zh, description_en)
VALUES 
    ('level2', '二级架构', 'Level 2 Architecture', '电池簇 → 电池包 → 电池单体', 'Battery Cluster → Battery Pack → Battery Cell'),
    ('level3', '三级架构', 'Level 3 Architecture', '电池堆 → 电池簇 → 电池包 → 电池单体', 'Battery Stack → Battery Cluster → Battery Pack → Battery Cell');

-- ============================================================================
-- 2. BMS 页面配置表 (bms_page_configs)
-- 用途：定义BMS页面类型（SYS/BCU/BAU/BMU），全局配置，所有实例共享
-- ============================================================================
CREATE TABLE IF NOT EXISTS bms_page_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    architecture_id INTEGER NOT NULL,             -- 架构ID
    page_type TEXT NOT NULL,                       -- 页面类型：'SYS' | 'BCU' | 'BAU' | 'BMU'
    display_name_zh TEXT NOT NULL,                -- 中文显示名称
    display_name_en TEXT NOT NULL,                 -- 英文显示名称
    description_zh TEXT NOT NULL DEFAULT '',       -- 中文描述
    description_en TEXT NOT NULL DEFAULT '',       -- 英文描述
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(architecture_id) REFERENCES bms_architectures(id) ON DELETE CASCADE,
    UNIQUE(architecture_id, page_type)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_bms_page_configs_architecture ON bms_page_configs(architecture_id);
CREATE INDEX IF NOT EXISTS idx_bms_page_configs_page_type ON bms_page_configs(page_type);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_bms_page_configs_timestamp
AFTER UPDATE ON bms_page_configs
FOR EACH ROW
BEGIN
    UPDATE bms_page_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- 初始化默认页面配置
INSERT INTO bms_page_configs (architecture_id, page_type, display_name_zh, display_name_en, description_zh, description_en)
SELECT 
    a.id,
    'SYS',
    '系统监控',
    'System Monitoring',
    '系统监控页面',
    'System Monitoring Page'
FROM bms_architectures a WHERE a.name = 'level2'
UNION ALL
SELECT 
    a.id,
    'BCU',
    '簇控制单元',
    'Cluster Control Unit',
    '簇控制单元页面',
    'Cluster Control Unit Page'
FROM bms_architectures a WHERE a.name = 'level2'
UNION ALL
SELECT 
    a.id,
    'BMU',
    '包管理单元',
    'Pack Management Unit',
    '包管理单元页面',
    'Pack Management Unit Page'
FROM bms_architectures a WHERE a.name = 'level2'
UNION ALL
SELECT 
    a.id,
    'SYS',
    '系统监控',
    'System Monitoring',
    '系统监控页面',
    'System Monitoring Page'
FROM bms_architectures a WHERE a.name = 'level3'
UNION ALL
SELECT 
    a.id,
    'BAU',
    '堆控制单元',
    'Stack Control Unit',
    '堆控制单元页面',
    'Stack Control Unit Page'
FROM bms_architectures a WHERE a.name = 'level3'
UNION ALL
SELECT 
    a.id,
    'BCU',
    '簇控制单元',
    'Cluster Control Unit',
    '簇控制单元页面',
    'Cluster Control Unit Page'
FROM bms_architectures a WHERE a.name = 'level3'
UNION ALL
SELECT 
    a.id,
    'BMU',
    '包管理单元',
    'Pack Management Unit',
    '包管理单元页面',
    'Pack Management Unit Page'
FROM bms_architectures a WHERE a.name = 'level3';

-- ============================================================================
-- 3. BMS 实例表 (bms_instances)
-- 用途：BMS实例，关联资产和架构
-- 说明：如果一个资产被关联到此表，就被系统识别为BMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS bms_instances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,                     -- 资产ID（外键关联 assets.id）
    architecture_id INTEGER NOT NULL,               -- 架构ID（外键关联 bms_architectures.id）
    instance_name TEXT NOT NULL,                   -- 实例名称（如 '1号电池簇', '1号电池堆'）
    display_name_zh TEXT NOT NULL,                -- 中文显示名
    display_name_en TEXT NOT NULL,                 -- 英文显示名
    enabled BOOLEAN NOT NULL DEFAULT 1,            -- 是否启用
    metadata_json TEXT NOT NULL DEFAULT '{}',      -- 自定义元数据JSON
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY(architecture_id) REFERENCES bms_architectures(id) ON DELETE RESTRICT,
    UNIQUE(asset_id, architecture_id, instance_name),
    CHECK (enabled IN (0, 1))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_bms_instances_asset_id ON bms_instances(asset_id);
CREATE INDEX IF NOT EXISTS idx_bms_instances_architecture_id ON bms_instances(architecture_id);
CREATE INDEX IF NOT EXISTS idx_bms_instances_enabled ON bms_instances(enabled);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_bms_instances_timestamp
AFTER UPDATE ON bms_instances
FOR EACH ROW
BEGIN
    UPDATE bms_instances SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- ============================================================================
-- 4. BMS 层级配置表 (bms_hierarchy_configs)
-- 用途：每个BMS实例的层级结构配置（簇数、每簇包数、串并数、温度测点数）
-- 说明：每个实例一条记录，统一配置
-- ============================================================================
CREATE TABLE IF NOT EXISTS bms_hierarchy_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bms_instance_id INTEGER NOT NULL UNIQUE,       -- BMS 实例ID（外键关联 bms_instances.id），每个实例仅一条
    cluster_count INTEGER NOT NULL DEFAULT 1,      -- 簇数量（三级架构为堆下簇数，二级架构通常为 1）
    pack_count_per_cluster INTEGER NOT NULL DEFAULT 1, -- 每个簇下的包数量
    series_count INTEGER NOT NULL,                 -- 包的串联数（如 15）
    parallel_count INTEGER NOT NULL,               -- 包的并联数（如 2）
    temperature_point_count INTEGER NOT NULL DEFAULT 0, -- 每个包的温度测点数量（统一配置，若没有则填 0）
    description_zh TEXT NOT NULL DEFAULT '',       -- 中文描述
    description_en TEXT NOT NULL DEFAULT '',       -- 英文描述
    metadata_json TEXT NOT NULL DEFAULT '{}',      -- 自定义元数据JSON
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bms_instance_id) REFERENCES bms_instances(id) ON DELETE CASCADE,
    CHECK (cluster_count >= 1),
    CHECK (pack_count_per_cluster >= 1),
    CHECK (series_count >= 1),
    CHECK (parallel_count >= 1),
    CHECK (temperature_point_count >= 0)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_bms_hierarchy_configs_instance ON bms_hierarchy_configs(bms_instance_id);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_bms_hierarchy_configs_timestamp
AFTER UPDATE ON bms_hierarchy_configs
FOR EACH ROW
BEGIN
    UPDATE bms_hierarchy_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- ============================================================================
-- 5. BMS 字段配置表 (bms_field_configs)
-- 用途：SYS/BCU/BAU 页面的字段配置（固定字段 + 可配置字段）
-- 说明：每个 BMS 实例有自己独立的字段配置
-- ============================================================================
CREATE TABLE IF NOT EXISTS bms_field_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bms_instance_id INTEGER NOT NULL,              -- BMS 实例ID（外键关联 bms_instances.id）
    page_type TEXT NOT NULL,                       -- 页面类型：'SYS' | 'BCU' | 'BAU' | 'BMU'
    field_key TEXT NOT NULL,                       -- 字段键（如 'fault', 'voltage', 'current', 'power', 'breaker_status', 'breaker_command', 'soc'）
    display_name_zh TEXT NOT NULL,                 -- 中文显示名
    display_name_en TEXT NOT NULL,                 -- 英文显示名
    field_type TEXT NOT NULL,                      -- 字段类型：'fixed' | 'dynamic'
    data_type TEXT NOT NULL,                      -- 数据类型：'boolean' | 'number' | 'enum'
    unit_zh TEXT NOT NULL DEFAULT '',              -- 中文单位
    unit_en TEXT NOT NULL DEFAULT '',              -- 英文单位
    is_required BOOLEAN NOT NULL DEFAULT 0,       -- 是否必填（固定字段为1）
    is_readable BOOLEAN NOT NULL DEFAULT 1,       -- 是否可读（1=可读，0=只写）
    is_writable BOOLEAN NOT NULL DEFAULT 0,       -- 是否可写（1=可写，0=只读）
    source_type TEXT NOT NULL,                     -- 字段来源类型：'asset_field'（资产字段）| 'custom'（自定义字段）| 'di_point'（DI点）
    read_device_type_tag_id INTEGER,               -- 读：资产字段ID（外键关联 device_type_tags.id）
    write_device_type_tag_id INTEGER,              -- 写：资产字段ID（外键关联 device_type_tags.id，仅当 is_writable=1 时使用）
    read_comm_instance_id INTEGER,                 -- 读：通信实例ID（外键关联 comm_instances.id）
    read_point_id INTEGER,                         -- 读：点表点ID（外键关联 point_table_points.id）
    write_comm_instance_id INTEGER,                -- 写：通信实例ID（外键关联 comm_instances.id，仅当 is_writable=1 时使用）
    write_point_id INTEGER,                        -- 写：点表点ID（外键关联 point_table_points.id，仅当 is_writable=1 时使用）
    sort_order INTEGER NOT NULL DEFAULT 0,          -- 排序索引（避免使用 index 关键字）
    description_zh TEXT NOT NULL DEFAULT '',       -- 中文描述
    description_en TEXT NOT NULL DEFAULT '',       -- 英文描述
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

-- 索引
CREATE INDEX IF NOT EXISTS idx_bms_field_configs_instance ON bms_field_configs(bms_instance_id);
CREATE INDEX IF NOT EXISTS idx_bms_field_configs_page_type ON bms_field_configs(page_type);
CREATE INDEX IF NOT EXISTS idx_bms_field_configs_field_key ON bms_field_configs(field_key);
CREATE INDEX IF NOT EXISTS idx_bms_field_configs_read_tag ON bms_field_configs(read_device_type_tag_id);
CREATE INDEX IF NOT EXISTS idx_bms_field_configs_read_instance ON bms_field_configs(read_comm_instance_id);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_bms_field_configs_timestamp
AFTER UPDATE ON bms_field_configs
FOR EACH ROW
BEGIN
    UPDATE bms_field_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- ============================================================================
-- 6. BMS 遥信量配置表 (bms_teleindication_configs)
-- 用途：BCU/BAU 页面的遥信量配置
-- 说明：每个 BMS 实例有自己独立的遥信量配置
-- 术语说明：遥信（Teleindication/Tele-signal）指状态信号，不是遥控（Telecontrol）
-- ============================================================================
CREATE TABLE IF NOT EXISTS bms_teleindication_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bms_instance_id INTEGER NOT NULL,              -- BMS 实例ID（外键关联 bms_instances.id）
    page_type TEXT NOT NULL,                       -- 页面类型：'BCU' | 'BAU'
    teleindication_key TEXT NOT NULL,              -- 遥信量键（如 'total_overvoltage'）
    display_name_zh TEXT NOT NULL,                 -- 中文显示名
    display_name_en TEXT NOT NULL,                 -- 英文显示名
    teleindication_type TEXT NOT NULL,             -- 遥信类型：'boolean' | 'enum' | 'bitfield'
    source_type TEXT NOT NULL,                     -- 字段来源类型：'asset_field'（资产字段）| 'di_point'（DI点）
    device_type_tag_id INTEGER,                    -- 资产字段ID（外键关联 device_type_tags.id）
    comm_instance_id INTEGER,                      -- 通信实例ID（外键关联 comm_instances.id）
    point_id INTEGER,                              -- 点表点ID（外键关联 point_table_points.id，支持子点）
    sort_order INTEGER NOT NULL DEFAULT 0,         -- 排序索引（避免使用 index 关键字）
    description_zh TEXT NOT NULL DEFAULT '',        -- 中文描述
    description_en TEXT NOT NULL DEFAULT '',        -- 英文描述
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
    -- 检查约束：遥信类型验证
    CHECK (teleindication_type IN ('boolean', 'enum', 'bitfield')),
    UNIQUE(bms_instance_id, page_type, teleindication_key)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_bms_teleindication_configs_instance ON bms_teleindication_configs(bms_instance_id);
CREATE INDEX IF NOT EXISTS idx_bms_teleindication_configs_page_type ON bms_teleindication_configs(page_type);
CREATE INDEX IF NOT EXISTS idx_bms_teleindication_configs_tag ON bms_teleindication_configs(device_type_tag_id);
CREATE INDEX IF NOT EXISTS idx_bms_teleindication_configs_instance_point ON bms_teleindication_configs(comm_instance_id, point_id);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_bms_teleindication_configs_timestamp
AFTER UPDATE ON bms_teleindication_configs
FOR EACH ROW
BEGIN
    UPDATE bms_teleindication_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- ============================================================================
-- 7. BMS 拓扑配置表 (bms_topology_configs)
-- 用途：SYS 页面的拓扑图配置
-- 说明：每个 BMS 实例有自己独立的拓扑配置
-- ============================================================================
CREATE TABLE IF NOT EXISTS bms_topology_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bms_instance_id INTEGER NOT NULL,              -- BMS 实例ID（外键关联 bms_instances.id）
    topology_type TEXT NOT NULL,                   -- 拓扑类型：'pack'（二级架构）| 'cluster'（三级架构）
    display_name_zh TEXT NOT NULL,                 -- 中文显示名
    display_name_en TEXT NOT NULL,                 -- 英文显示名
    description_zh TEXT NOT NULL DEFAULT '',       -- 中文描述
    description_en TEXT NOT NULL DEFAULT '',        -- 英文描述
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bms_instance_id) REFERENCES bms_instances(id) ON DELETE CASCADE,
    UNIQUE(bms_instance_id, topology_type),
    CHECK (topology_type IN ('pack', 'cluster'))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_bms_topology_configs_instance ON bms_topology_configs(bms_instance_id);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_bms_topology_configs_timestamp
AFTER UPDATE ON bms_topology_configs
FOR EACH ROW
BEGIN
    UPDATE bms_topology_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- ============================================================================
-- 8. BMS 拓扑字段配置表 (bms_topology_field_configs)
-- 用途：拓扑图中每个节点显示的字段
-- 说明：拓扑图的字段可以独立配置，不一定与主页面字段相同
-- ============================================================================
CREATE TABLE IF NOT EXISTS bms_topology_field_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topology_config_id INTEGER NOT NULL,           -- 拓扑配置ID
    field_key TEXT NOT NULL,                      -- 字段键（独立定义，如 'cluster_voltage', 'cluster_current', 'cluster_soc', 'cluster_breaker_status'）
    display_name_zh TEXT NOT NULL,                -- 中文显示名
    display_name_en TEXT NOT NULL,                -- 英文显示名
    display_position TEXT NOT NULL DEFAULT 'card', -- 显示位置：'header'（卡片头部，如簇编号）| 'card'（卡片主体，如电压、电流、SOC）| 'footer'（卡片底部，如分合闸按钮）
    source_type TEXT NOT NULL,                    -- 字段来源类型：'asset_field'（资产字段）| 'di_point'（DI点）
    read_device_type_tag_id INTEGER,              -- 读：资产字段ID（外键关联 device_type_tags.id）
    write_device_type_tag_id INTEGER,              -- 写：资产字段ID（外键关联 device_type_tags.id，仅当字段可写时使用）
    read_comm_instance_id INTEGER,                -- 读：通信实例ID（外键关联 comm_instances.id）
    read_point_id INTEGER,                        -- 读：点表点ID（外键关联 point_table_points.id）
    write_comm_instance_id INTEGER,                -- 写：通信实例ID（外键关联 comm_instances.id，仅当字段可写时使用）
    write_point_id INTEGER,                        -- 写：点表点ID（外键关联 point_table_points.id，仅当字段可写时使用）
    sort_order INTEGER NOT NULL DEFAULT 0,         -- 排序索引（同一位置内的显示顺序）
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

-- 索引
CREATE INDEX IF NOT EXISTS idx_bms_topology_field_configs_topology ON bms_topology_field_configs(topology_config_id);
CREATE INDEX IF NOT EXISTS idx_bms_topology_field_configs_position ON bms_topology_field_configs(display_position);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_bms_topology_field_configs_timestamp
AFTER UPDATE ON bms_topology_field_configs
FOR EACH ROW
BEGIN
    UPDATE bms_topology_field_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- ============================================================================
-- 9. BMS BMU 配置表 (bms_bmu_configs)
-- 用途：BMU 页面的配置（包含阈值配置）
-- 说明：每个 BMS 实例有自己独立的 BMU 配置
-- ============================================================================
CREATE TABLE IF NOT EXISTS bms_bmu_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bms_instance_id INTEGER NOT NULL,              -- BMS 实例ID（外键关联 bms_instances.id）
    voltage_upper_limit REAL,                      -- 电压上限（用于判断过压，超过此值为 alarm）
    voltage_lower_limit REAL,                      -- 电压下限（用于判断欠压，低于此值为 alarm）
    voltage_warning_upper_limit REAL,              -- 电压警告上限（超过此值为 warning）
    voltage_warning_lower_limit REAL,              -- 电压警告下限（低于此值为 warning）
    temperature_upper_limit REAL,                  -- 温度上限（用于判断过温，超过此值为 alarm）
    temperature_lower_limit REAL,                  -- 温度下限（用于判断欠温，低于此值为 alarm）
    temperature_warning_upper_limit REAL,          -- 温度警告上限（超过此值为 warning）
    temperature_warning_lower_limit REAL,          -- 温度警告下限（低于此值为 warning）
    description_zh TEXT NOT NULL DEFAULT '',        -- 中文描述
    description_en TEXT NOT NULL DEFAULT '',       -- 英文描述
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(bms_instance_id) REFERENCES bms_instances(id) ON DELETE CASCADE,
    UNIQUE(bms_instance_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_bms_bmu_configs_instance ON bms_bmu_configs(bms_instance_id);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_bms_bmu_configs_timestamp
AFTER UPDATE ON bms_bmu_configs
FOR EACH ROW
BEGIN
    UPDATE bms_bmu_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- ============================================================================
-- 10. BMS BMU 单体字段配置表 (bms_bmu_cell_field_configs)
-- 用途：BMU 页面显示的单体字段配置（不包含温度，温度测点单独配置）
-- 说明：每个 BMS 实例有自己独立的单体字段配置
-- ============================================================================
CREATE TABLE IF NOT EXISTS bms_bmu_cell_field_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bmu_config_id INTEGER NOT NULL,                -- BMU 配置ID
    field_key TEXT NOT NULL,                       -- 字段键（如 'voltage', 'soc', 'soh'，注意：不包含 'temperature'）
    display_name_zh TEXT NOT NULL,                 -- 中文显示名
    display_name_en TEXT NOT NULL,                 -- 英文显示名
    data_type TEXT NOT NULL,                       -- 数据类型：'number'
    unit_zh TEXT NOT NULL DEFAULT '',              -- 中文单位
    unit_en TEXT NOT NULL DEFAULT '',              -- 英文单位
    source_type TEXT NOT NULL,                     -- 字段来源类型：'asset_field'（资产字段）| 'di_point'（DI点）
    device_type_tag_id INTEGER,                    -- 资产字段ID（外键关联 device_type_tags.id）
    comm_instance_id INTEGER,                      -- 通信实例ID（外键关联 comm_instances.id）
    point_id INTEGER,                              -- 点表点ID（外键关联 point_table_points.id，支持子点）
    sort_order INTEGER NOT NULL DEFAULT 0,         -- 排序索引（避免使用 index 关键字）
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
    -- 检查约束：data_type 必须是 'number'
    CHECK (data_type = 'number'),
    UNIQUE(bmu_config_id, field_key)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_bms_bmu_cell_field_configs_bmu ON bms_bmu_cell_field_configs(bmu_config_id);
CREATE INDEX IF NOT EXISTS idx_bms_bmu_cell_field_configs_tag ON bms_bmu_cell_field_configs(device_type_tag_id);
CREATE INDEX IF NOT EXISTS idx_bms_bmu_cell_field_configs_instance_point ON bms_bmu_cell_field_configs(comm_instance_id, point_id);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_bms_bmu_cell_field_configs_timestamp
AFTER UPDATE ON bms_bmu_cell_field_configs
FOR EACH ROW
BEGIN
    UPDATE bms_bmu_cell_field_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- ============================================================================
-- 11. BMS BMU 温度测点配置表 (bms_bmu_temperature_points)
-- 用途：BMU 页面的温度测点配置
-- 说明：温度测点不是每个单体都有，需要单独配置
-- ============================================================================
CREATE TABLE IF NOT EXISTS bms_bmu_temperature_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bmu_config_id INTEGER NOT NULL,                -- BMU 配置ID
    point_number INTEGER NOT NULL,                 -- 测点编号（如 1, 2, 3...）
    display_name_zh TEXT NOT NULL,                 -- 中文显示名（如 '测点1', '测点2'）
    display_name_en TEXT NOT NULL,                 -- 英文显示名（如 'Point 1', 'Point 2'）
    unit_zh TEXT NOT NULL DEFAULT '℃',            -- 中文单位
    unit_en TEXT NOT NULL DEFAULT '°C',           -- 英文单位
    source_type TEXT NOT NULL,                     -- 字段来源类型：'asset_field'（资产字段）| 'di_point'（DI点）
    device_type_tag_id INTEGER,                    -- 资产字段ID（外键关联 device_type_tags.id）
    comm_instance_id INTEGER,                      -- 通信实例ID（外键关联 comm_instances.id）
    point_id INTEGER,                             -- 点表点ID（外键关联 point_table_points.id，支持子点）
    sort_order INTEGER NOT NULL DEFAULT 0,         -- 排序索引（避免使用 index 关键字）
    description_zh TEXT NOT NULL DEFAULT '',       -- 中文描述
    description_en TEXT NOT NULL DEFAULT '',       -- 英文描述
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

-- 索引
CREATE INDEX IF NOT EXISTS idx_bms_bmu_temperature_points_bmu ON bms_bmu_temperature_points(bmu_config_id);
CREATE INDEX IF NOT EXISTS idx_bms_bmu_temperature_points_tag ON bms_bmu_temperature_points(device_type_tag_id);
CREATE INDEX IF NOT EXISTS idx_bms_bmu_temperature_points_instance_point ON bms_bmu_temperature_points(comm_instance_id, point_id);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_bms_bmu_temperature_points_timestamp
AFTER UPDATE ON bms_bmu_temperature_points
FOR EACH ROW
BEGIN
    UPDATE bms_bmu_temperature_points SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- ============================================================================
-- 12. BMS BMU 其它数据配置表 (bms_bmu_other_data_configs)
-- 用途：某些BMS供应商提供的与单体、温度无关的数据（如均衡器状态等）
-- ============================================================================
CREATE TABLE IF NOT EXISTS bms_bmu_other_data_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bmu_config_id INTEGER NOT NULL,                -- BMU 配置ID
    field_key TEXT NOT NULL,                       -- 字段键（如 'balancer_status', 'balancer_current'）
    display_name_zh TEXT NOT NULL,                 -- 中文显示名
    display_name_en TEXT NOT NULL,                 -- 英文显示名
    data_type TEXT NOT NULL,                       -- 数据类型：'number' | 'boolean' | 'enum'
    unit_zh TEXT NOT NULL DEFAULT '',             -- 中文单位
    unit_en TEXT NOT NULL DEFAULT '',              -- 英文单位
    source_type TEXT NOT NULL,                     -- 字段来源类型：'asset_field'（资产字段）| 'di_point'（DI点）
    device_type_tag_id INTEGER,                    -- 资产字段ID（外键关联 device_type_tags.id）
    comm_instance_id INTEGER,                     -- 通信实例ID（外键关联 comm_instances.id）
    point_id INTEGER,                             -- 点表点ID（外键关联 point_table_points.id，支持子点）
    sort_order INTEGER NOT NULL DEFAULT 0,        -- 排序索引（避免使用 index 关键字）
    description_zh TEXT NOT NULL DEFAULT '',       -- 中文描述
    description_en TEXT NOT NULL DEFAULT '',       -- 英文描述
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
    -- 检查约束：数据类型验证
    CHECK (data_type IN ('number', 'boolean', 'enum')),
    UNIQUE(bmu_config_id, field_key)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_bms_bmu_other_data_configs_bmu ON bms_bmu_other_data_configs(bmu_config_id);
CREATE INDEX IF NOT EXISTS idx_bms_bmu_other_data_configs_tag ON bms_bmu_other_data_configs(device_type_tag_id);
CREATE INDEX IF NOT EXISTS idx_bms_bmu_other_data_configs_instance_point ON bms_bmu_other_data_configs(comm_instance_id, point_id);

-- 触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_bms_bmu_other_data_configs_timestamp
AFTER UPDATE ON bms_bmu_other_data_configs
FOR EACH ROW
BEGIN
    UPDATE bms_bmu_other_data_configs SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
