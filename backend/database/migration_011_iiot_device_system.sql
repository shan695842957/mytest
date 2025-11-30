-- ============================================================================
-- 迁移版本: v1.5.0
-- 创建时间: 2025-11-11
-- 说明: 工业网关 IIoT 平台设备系统重构
--       按照 device.md 完整设计，删除所有旧表，创建9个新表
--       所有时间字段使用 UTC 毫秒（INTEGER），非 DATETIME
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- 删除所有旧的设备相关表
-- ============================================================================

DROP TABLE IF EXISTS mapping_instance;
DROP TABLE IF EXISTS device_comm_binding;
DROP TABLE IF EXISTS device_point;
DROP TABLE IF EXISTS device;
DROP TABLE IF EXISTS decoder_output;
DROP TABLE IF EXISTS comm_point;
DROP TABLE IF EXISTS comm_channel;
DROP TABLE IF EXISTS template_mapping;
DROP TABLE IF EXISTS decoder_output_template;
DROP TABLE IF EXISTS comm_point_template;
DROP TABLE IF EXISTS comm_template;
DROP TABLE IF EXISTS template_point;
DROP TABLE IF EXISTS device_template;
DROP TABLE IF EXISTS device_type;
DROP TABLE IF EXISTS comm_to_point_map;
DROP TABLE IF EXISTS alarm_rule;

-- ============================================================================
-- 1. device_types - 设备类型
-- ============================================================================

CREATE TABLE IF NOT EXISTS device_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,                    -- 内部名，如 'B_COMPRESSOR'
    display_name TEXT NOT NULL,                   -- UI 名称，如 'B 型压缩机'
    description TEXT NOT NULL DEFAULT '',
    created_at_utc INTEGER NOT NULL,             -- UTC 毫秒
    updated_at_utc INTEGER NOT NULL               -- UTC 毫秒
);

CREATE INDEX IF NOT EXISTS idx_device_types_name ON device_types(name);

-- ============================================================================
-- 2. device_type_tags - 业务字段模板
-- ============================================================================

CREATE TABLE IF NOT EXISTS device_type_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_type_id INTEGER NOT NULL,
    tag_name TEXT NOT NULL,                       -- 内部名，如 'OUTLET_PRESSURE', 'RUN_MODE', 'HIGH_TEMP_ALM'
    display_name TEXT NOT NULL,                   -- UI 名称，如 '出口压力', '运行模式', '高温报警'
    data_type TEXT NOT NULL,                      -- 'BOOL'|'INT'|'FLOAT'|'ENUM'
    semantic_type TEXT NOT NULL,                  -- 'MEASURE'|'STATUS'|'ACCUM'|'PARAM'|'SETPOINT'|'COMMAND'|'CONFIG'
    engineering_unit TEXT NOT NULL DEFAULT '',    -- 测量量单位，如 'bar', '℃'
    group_name TEXT NOT NULL DEFAULT '',          -- 光字牌分组，如 '运行模式', '独立报警', '工艺量'
    severity INTEGER NOT NULL DEFAULT 0,           -- 0 信息，1 提示，2 警告，3 故障，4 紧急
    description TEXT NOT NULL DEFAULT '',
    created_at_utc INTEGER NOT NULL,
    updated_at_utc INTEGER NOT NULL,
    FOREIGN KEY (device_type_id) REFERENCES device_types(id) ON DELETE CASCADE,
    CHECK (data_type IN ('BOOL', 'INT', 'FLOAT', 'ENUM')),
    CHECK (semantic_type IN ('MEASURE', 'STATUS', 'ACCUM', 'PARAM', 'SETPOINT', 'COMMAND', 'CONFIG')),
    CHECK (severity BETWEEN 0 AND 4)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_device_type_tags_unique
ON device_type_tags(device_type_id, tag_name);

CREATE INDEX IF NOT EXISTS idx_device_type_tags_device_type ON device_type_tags(device_type_id);
CREATE INDEX IF NOT EXISTS idx_device_type_tags_semantic_type ON device_type_tags(semantic_type);

-- ============================================================================
-- 3. point_table_templates - 点表模板
-- ============================================================================

CREATE TABLE IF NOT EXISTS point_table_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,                    -- 模板名，如 'Modbus_B_Compressor_v1'
    display_name TEXT NOT NULL,                   -- UI 名称
    protocol_type TEXT NOT NULL,                  -- 例如 'modbus_tcp', 'modbus_rtu'
    description TEXT NOT NULL DEFAULT '',
    created_at_utc INTEGER NOT NULL,
    updated_at_utc INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_point_table_templates_name ON point_table_templates(name);
CREATE INDEX IF NOT EXISTS idx_point_table_templates_protocol ON point_table_templates(protocol_type);

-- ============================================================================
-- 4. point_table_points - 点表中的每个测点（信号层）
-- ============================================================================

CREATE TABLE IF NOT EXISTS point_table_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    point_table_id INTEGER NOT NULL,
    point_name TEXT NOT NULL,                     -- 点名，如 'Pressure_raw', 'StatusWord2'
    display_name TEXT NOT NULL,                   -- UI 名称
    address TEXT NOT NULL,                        -- 例如 '40001' 或 'HR40010'
    io_type TEXT NOT NULL,                        -- 'AI'|'AO'|'DI'|'DO'|'STRING'
    raw_type TEXT NOT NULL,                       -- 'INT16'|'UINT16'|'INT32'|'UINT32'|'FLOAT32'|'FLOAT64'|'BITFIELD16'
    byte_order TEXT NOT NULL,                     -- 'BE'|'LE'|'BE_SWAP'|'LE_SWAP'
    scale_k REAL NOT NULL DEFAULT 1.0,
    scale_b REAL NOT NULL DEFAULT 0.0,
    description TEXT NOT NULL DEFAULT '',
    is_active INTEGER NOT NULL DEFAULT 1,         -- 0=禁用，1=启用
    created_at_utc INTEGER NOT NULL,
    updated_at_utc INTEGER NOT NULL,
    FOREIGN KEY (point_table_id) REFERENCES point_table_templates(id) ON DELETE CASCADE,
    CHECK (io_type IN ('AI', 'AO', 'DI', 'DO', 'STRING')),
    CHECK (raw_type IN ('INT16', 'UINT16', 'INT32', 'UINT32', 'FLOAT32', 'FLOAT64', 'BITFIELD16')),
    CHECK (byte_order IN ('BE', 'LE', 'BE_SWAP', 'LE_SWAP')),
    CHECK (is_active IN (0, 1))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_points_unique
ON point_table_points(point_table_id, point_name);

CREATE INDEX IF NOT EXISTS idx_point_table_points_table ON point_table_points(point_table_id);
CREATE INDEX IF NOT EXISTS idx_point_table_points_active ON point_table_points(is_active);

-- ============================================================================
-- 5. comm_instances - 通信实例
-- ============================================================================

CREATE TABLE IF NOT EXISTS comm_instances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,                    -- 实例名，如 'PLC-01'
    display_name TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,          -- 0=禁用，1=启用
    point_table_id INTEGER NOT NULL,
    protocol_type TEXT NOT NULL,
    protocol_config TEXT NOT NULL,                -- JSON：IP/端口/站号/串口参数等
    polling_interval_ms INTEGER NOT NULL,
    timeout_ms INTEGER NOT NULL,
    retries INTEGER NOT NULL,
    created_at_utc INTEGER NOT NULL,
    updated_at_utc INTEGER NOT NULL,
    FOREIGN KEY (point_table_id) REFERENCES point_table_templates(id) ON DELETE RESTRICT,
    CHECK (enabled IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_comm_instances_name ON comm_instances(name);
CREATE INDEX IF NOT EXISTS idx_comm_instances_enabled ON comm_instances(enabled);
CREATE INDEX IF NOT EXISTS idx_comm_instances_point_table ON comm_instances(point_table_id);

-- ============================================================================
-- 6. assets - 资产实例
-- ============================================================================

CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,                    -- 资产名，如 'North_Compressor_01'
    display_name TEXT NOT NULL,                   -- UI 名称，如 '北区1号压缩机'
    device_type_id INTEGER NOT NULL,
    location TEXT NOT NULL DEFAULT '',
    enabled INTEGER NOT NULL DEFAULT 1,           -- 0=禁用，1=启用
    metadata_json TEXT NOT NULL DEFAULT '{}',    -- JSON 元数据
    created_at_utc INTEGER NOT NULL,
    updated_at_utc INTEGER NOT NULL,
    FOREIGN KEY (device_type_id) REFERENCES device_types(id) ON DELETE RESTRICT,
    CHECK (enabled IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_assets_name ON assets(name);
CREATE INDEX IF NOT EXISTS idx_assets_device_type ON assets(device_type_id);
CREATE INDEX IF NOT EXISTS idx_assets_enabled ON assets(enabled);

-- ============================================================================
-- 7. template_mappings - 设备类型 + 点表 的模板映射
-- ============================================================================

CREATE TABLE IF NOT EXISTS template_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_type_id INTEGER NOT NULL,
    point_table_id INTEGER NOT NULL,
    asset_tag_name TEXT NOT NULL,                 -- 业务字段名，如 'RUN_MODE', 'ALM_MAIN_PUMP'
    point_name TEXT NOT NULL,                     -- 点表点名，如 'StatusWord2'
    binding_kind TEXT NOT NULL,                   -- 'DIRECT'|'BIT'|'BITMASK_ENUM'
    bit_index INTEGER,                            -- 仅当 binding_kind='BIT'
    bit_mask INTEGER,                             -- 仅当 binding_kind='BITMASK_ENUM'
    bit_shift INTEGER,                            -- 仅当 binding_kind='BITMASK_ENUM'
    enum_json TEXT NOT NULL DEFAULT '{}',         -- 当 data_type='ENUM' 时存状态码映射
    created_at_utc INTEGER NOT NULL,
    updated_at_utc INTEGER NOT NULL,
    FOREIGN KEY (device_type_id) REFERENCES device_types(id) ON DELETE CASCADE,
    FOREIGN KEY (point_table_id) REFERENCES point_table_templates(id) ON DELETE CASCADE,
    CHECK (binding_kind IN ('DIRECT', 'BIT', 'BITMASK_ENUM'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_template_mappings_unique
ON template_mappings(device_type_id, point_table_id, asset_tag_name);

CREATE INDEX IF NOT EXISTS idx_template_mappings_device_type ON template_mappings(device_type_id);
CREATE INDEX IF NOT EXISTS idx_template_mappings_point_table ON template_mappings(point_table_id);

-- ============================================================================
-- 8. asset_mappings - 具体资产的映射
-- ============================================================================

CREATE TABLE IF NOT EXISTS asset_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    asset_tag_name TEXT NOT NULL,                 -- 业务字段名
    instance_id INTEGER NOT NULL,                 -- 通信实例ID
    point_name TEXT NOT NULL,                     -- 点表点名
    binding_kind TEXT NOT NULL,                   -- 'DIRECT'|'BIT'|'BITMASK_ENUM'
    bit_index INTEGER,
    bit_mask INTEGER,
    bit_shift INTEGER,
    enum_json TEXT NOT NULL DEFAULT '{}',
    is_overridden INTEGER NOT NULL DEFAULT 0,     -- 0=使用模板，1=已覆盖
    created_at_utc INTEGER NOT NULL,
    updated_at_utc INTEGER NOT NULL,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (instance_id) REFERENCES comm_instances(id) ON DELETE RESTRICT,
    CHECK (binding_kind IN ('DIRECT', 'BIT', 'BITMASK_ENUM')),
    CHECK (is_overridden IN (0, 1))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_asset_mappings_unique
ON asset_mappings(asset_id, asset_tag_name);

CREATE INDEX IF NOT EXISTS idx_asset_mappings_instance_point
ON asset_mappings(instance_id, point_name);

CREATE INDEX IF NOT EXISTS idx_asset_mappings_asset ON asset_mappings(asset_id);

-- ============================================================================
-- 9. soe_events - SOE 事件表
-- ============================================================================

CREATE TABLE IF NOT EXISTS soe_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    asset_tag_name TEXT NOT NULL,
    event_type TEXT NOT NULL,                     -- 'ALARM_ON'|'ALARM_OFF'|'STATE_CHANGE'|'CMD_SENT'|'CMD_FAIL'|'PARAM_CHANGE'
    severity INTEGER NOT NULL,                    -- 0-4
    value_num REAL,                               -- 数值（如有）
    value_text TEXT NOT NULL DEFAULT '',          -- 文本值
    source_instance_id INTEGER,                   -- 来源通信实例
    source_point_name TEXT,                      -- 来源点名
    created_at_utc INTEGER NOT NULL,              -- 事件发生时间（UTC 毫秒）
    inserted_at_utc INTEGER NOT NULL,             -- 插入时间（UTC 毫秒）
    extra_json TEXT NOT NULL DEFAULT '{}',        -- 额外信息 JSON
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (source_instance_id) REFERENCES comm_instances(id) ON DELETE SET NULL,
    CHECK (event_type IN ('ALARM_ON', 'ALARM_OFF', 'STATE_CHANGE', 'CMD_SENT', 'CMD_FAIL', 'PARAM_CHANGE')),
    CHECK (severity BETWEEN 0 AND 4)
);

CREATE INDEX IF NOT EXISTS idx_soe_asset_time
ON soe_events(asset_id, created_at_utc);

CREATE INDEX IF NOT EXISTS idx_soe_time
ON soe_events(created_at_utc);

CREATE INDEX IF NOT EXISTS idx_soe_event_type ON soe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_soe_asset_tag ON soe_events(asset_id, asset_tag_name);

-- ============================================================================
-- 触发器：自动更新 updated_at_utc（使用当前 UTC 毫秒）
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS update_device_types_timestamp
AFTER UPDATE ON device_types
FOR EACH ROW
BEGIN
    UPDATE device_types SET updated_at_utc = (strftime('%s', 'now') * 1000) WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_device_type_tags_timestamp
AFTER UPDATE ON device_type_tags
FOR EACH ROW
BEGIN
    UPDATE device_type_tags SET updated_at_utc = (strftime('%s', 'now') * 1000) WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_point_table_templates_timestamp
AFTER UPDATE ON point_table_templates
FOR EACH ROW
BEGIN
    UPDATE point_table_templates SET updated_at_utc = (strftime('%s', 'now') * 1000) WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_point_table_points_timestamp
AFTER UPDATE ON point_table_points
FOR EACH ROW
BEGIN
    UPDATE point_table_points SET updated_at_utc = (strftime('%s', 'now') * 1000) WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_comm_instances_timestamp
AFTER UPDATE ON comm_instances
FOR EACH ROW
BEGIN
    UPDATE comm_instances SET updated_at_utc = (strftime('%s', 'now') * 1000) WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_assets_timestamp
AFTER UPDATE ON assets
FOR EACH ROW
BEGIN
    UPDATE assets SET updated_at_utc = (strftime('%s', 'now') * 1000) WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_template_mappings_timestamp
AFTER UPDATE ON template_mappings
FOR EACH ROW
BEGIN
    UPDATE template_mappings SET updated_at_utc = (strftime('%s', 'now') * 1000) WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_asset_mappings_timestamp
AFTER UPDATE ON asset_mappings
FOR EACH ROW
BEGIN
    UPDATE asset_mappings SET updated_at_utc = (strftime('%s', 'now') * 1000) WHERE id = OLD.id;
END;

-- ============================================================================
-- 数据库版本信息
-- ============================================================================

INSERT INTO schema_version (version, description)
VALUES ('1.5.0', '工业网关 IIoT 平台设备系统重构：删除旧表，创建9个新表（device_types, device_type_tags, point_table_templates, point_table_points, comm_instances, assets, template_mappings, asset_mappings, soe_events）');

-- ============================================================================
-- 脚本结束
-- ============================================================================

