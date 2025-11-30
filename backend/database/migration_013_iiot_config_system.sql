-- ============================================================================
-- 迁移版本: v1.3.0
-- 创建时间: 2025-01-XX
-- 说明: IIoT 配置系统表结构（设备类型、点表模板、通信实例、资产、映射、SOE）
-- ============================================================================

-- ============================================================================
-- 1. 设备类型表 (device_types)
-- ============================================================================
CREATE TABLE IF NOT EXISTS device_types (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL UNIQUE,        -- 内部名称，如 'B_COMPRESSOR'
    display_name TEXT    NOT NULL,               -- 前端显示名称，如 'B型压缩机'
    model        TEXT    NOT NULL DEFAULT '',    -- 型号
    manufacturer TEXT    NOT NULL DEFAULT '',    -- 厂家
    description  TEXT    NOT NULL DEFAULT '',
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_device_types_name ON device_types(name);

-- ============================================================================
-- 2. 业务字段模板表 (device_type_tags)
-- ============================================================================
CREATE TABLE IF NOT EXISTS device_type_tags (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    device_type_id INTEGER NOT NULL,             -- 外键：设备类型
    tag_name       TEXT    NOT NULL,            -- 内部字段名，如 'OUTLET_PRESSURE'
    display_name   TEXT    NOT NULL,            -- 显示名，如 '出口压力'
    data_type      TEXT    NOT NULL,            -- 'BOOL' | 'INT' | 'FLOAT' | 'ENUM'
    semantic_type  TEXT    NOT NULL,            -- 7 种语义之一
    engineering_unit TEXT NOT NULL DEFAULT '',  -- 工程单位，如 'bar'
    group_name     TEXT    NOT NULL DEFAULT '', -- UI 分组，如 '运行模式','独立报警'
    severity       INTEGER NOT NULL DEFAULT 0, -- 严重性：0~4
    description    TEXT    NOT NULL DEFAULT '',
    enum_json      TEXT    NOT NULL DEFAULT '{}', -- ENUM 值映射 JSON
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(device_type_id) REFERENCES device_types(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_device_type_tags_unique
ON device_type_tags(device_type_id, tag_name);

CREATE INDEX IF NOT EXISTS idx_device_type_tags_semantic_type 
ON device_type_tags(semantic_type);

-- ============================================================================
-- 3. 点表模板表 (point_table_templates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS point_table_templates (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL UNIQUE,        -- 内部名，如 'COMP_MODBUS_V1'
    display_name TEXT    NOT NULL,               -- 显示名
    protocol_type TEXT   NOT NULL,               -- 'modbus_tcp', 'modbus_rtu', ...
    description  TEXT    NOT NULL DEFAULT '',
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_point_table_templates_name ON point_table_templates(name);
CREATE INDEX IF NOT EXISTS idx_point_table_templates_protocol ON point_table_templates(protocol_type);

-- ============================================================================
-- 4. 点表点表 (point_table_points)
-- ============================================================================
CREATE TABLE IF NOT EXISTS point_table_points (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    point_table_id INTEGER NOT NULL,            -- 外键：点表模板
    point_name     TEXT    NOT NULL,            -- 内部点名，如 'StatusWord2'
    display_name   TEXT    NOT NULL,            -- 显示名
    address        TEXT    NOT NULL,            -- 寄存器/地址，如 '40001'
    io_type        TEXT    NOT NULL,            -- 'AI' | 'AO' | 'DI' | 'DO' | 'STRING'
    raw_type       TEXT    NOT NULL,            -- 'INT16' | 'UINT16' | 'INT32' | 'FLOAT32' | 'BITFIELD16' 等
    byte_order     TEXT    NOT NULL,            -- 'BE' | 'LE' | 'BE_SWAP' | 'LE_SWAP'
    scale_k        REAL    NOT NULL DEFAULT 1.0, -- kx+b 中的 k
    scale_b        REAL    NOT NULL DEFAULT 0.0, -- kx+b 中的 b
    parse_rules_json TEXT NOT NULL DEFAULT '{}', -- 复杂解析规则 JSON
    description    TEXT    NOT NULL DEFAULT '',
    is_active      INTEGER NOT NULL DEFAULT 1,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(point_table_id) REFERENCES point_table_templates(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_points_unique
ON point_table_points(point_table_id, point_name);

CREATE INDEX IF NOT EXISTS idx_point_table_points_address 
ON point_table_points(address);

-- ============================================================================
-- 5. 通信实例表 (comm_instances)
-- ============================================================================
CREATE TABLE IF NOT EXISTS comm_instances (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT    NOT NULL UNIQUE,     -- 内部 ID，如 'PLC-01'
    display_name   TEXT    NOT NULL,            -- 显示名
    enabled        INTEGER NOT NULL DEFAULT 1,
    point_table_id INTEGER NOT NULL,
    protocol_type  TEXT    NOT NULL,            -- 冗余字段，明确协议类型
    protocol_config TEXT   NOT NULL,            -- JSON：IP/PORT/UNIT_ID/串口参数等
    polling_interval_ms INTEGER NOT NULL,      -- 轮询周期
    timeout_ms     INTEGER NOT NULL,            -- 超时
    retries        INTEGER NOT NULL,            -- 重试次数
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(point_table_id) REFERENCES point_table_templates(id)
);

CREATE INDEX IF NOT EXISTS idx_comm_instances_name ON comm_instances(name);
CREATE INDEX IF NOT EXISTS idx_comm_instances_enabled ON comm_instances(enabled);

-- ============================================================================
-- 6. 资产表 (assets)
-- ============================================================================
CREATE TABLE IF NOT EXISTS assets (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT    NOT NULL UNIQUE,     -- 内部名，如 'NORTH_COMP_01'
    display_name   TEXT    NOT NULL,            -- 显示名，如 '北区1号压缩机'
    device_type_id INTEGER NOT NULL,
    location       TEXT    NOT NULL DEFAULT '',
    enabled        INTEGER NOT NULL DEFAULT 1,
    metadata_json  TEXT    NOT NULL DEFAULT '{}', -- 自定义元数据
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(device_type_id) REFERENCES device_types(id)
);

CREATE INDEX IF NOT EXISTS idx_assets_name ON assets(name);
CREATE INDEX IF NOT EXISTS idx_assets_device_type ON assets(device_type_id);
CREATE INDEX IF NOT EXISTS idx_assets_enabled ON assets(enabled);

-- ============================================================================
-- 7. 模板映射表 (template_mappings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS template_mappings (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    device_type_id INTEGER NOT NULL,
    point_table_id INTEGER NOT NULL,
    asset_tag_name TEXT    NOT NULL,            -- 对应 device_type_tags.tag_name
    point_name     TEXT    NOT NULL,            -- 对应 point_table_points.point_name
    binding_kind   TEXT    NOT NULL,            -- 'DIRECT' | 'BIT' | 'BITMASK_ENUM'
    bit_index      INTEGER,                     -- BIT 用
    bit_mask       INTEGER,                     -- BITMASK_ENUM 用
    bit_shift      INTEGER,                     -- BITMASK_ENUM 用
    enum_json      TEXT    NOT NULL DEFAULT '{}', -- ENUM 值映射
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(device_type_id) REFERENCES device_types(id) ON DELETE CASCADE,
    FOREIGN KEY(point_table_id) REFERENCES point_table_templates(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_template_mappings_unique
ON template_mappings(device_type_id, point_table_id, asset_tag_name);

-- ============================================================================
-- 8. 资产映射表 (asset_mappings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS asset_mappings (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id       INTEGER NOT NULL,
    asset_tag_name TEXT    NOT NULL,            -- 对应 device_type_tags.tag_name
    instance_id    INTEGER NOT NULL,            -- 对应 comm_instances.id
    point_name     TEXT    NOT NULL,            -- 对应 point_table_points.point_name
    binding_kind   TEXT    NOT NULL,            -- 'DIRECT' | 'BIT' | 'BITMASK_ENUM'
    bit_index      INTEGER,
    bit_mask       INTEGER,
    bit_shift      INTEGER,
    enum_json      TEXT    NOT NULL DEFAULT '{}',
    is_overridden  INTEGER NOT NULL DEFAULT 0,  -- 是否覆盖模板映射
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY(instance_id) REFERENCES comm_instances(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_asset_mappings_unique
ON asset_mappings(asset_id, asset_tag_name);

CREATE INDEX IF NOT EXISTS idx_asset_mappings_instance_point
ON asset_mappings(instance_id, point_name);

-- ============================================================================
-- 9. SOE 事件表 (soe_events)
-- ============================================================================
CREATE TABLE IF NOT EXISTS soe_events (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id         INTEGER NOT NULL,
    asset_tag_name   TEXT    NOT NULL,
    event_type       TEXT    NOT NULL,          -- 'ALARM_ON'|'ALARM_OFF'|'STATE_CHANGE'|'CMD_SENT'|'CMD_FAIL'|'PARAM_CHANGE'|'SETPOINT_CHANGE'
    severity         INTEGER NOT NULL,          -- 0~4
    value_num        REAL,
    value_text       TEXT    NOT NULL DEFAULT '',
    source_instance_id INTEGER,
    source_point_name TEXT,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 事件发生时间
    inserted_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 写入 DB 时间
    extra_json       TEXT    NOT NULL DEFAULT '{}',
    FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_soe_asset_time
ON soe_events(asset_id, created_at);

CREATE INDEX IF NOT EXISTS idx_soe_time
ON soe_events(created_at);

CREATE INDEX IF NOT EXISTS idx_soe_event_type
ON soe_events(event_type);

CREATE INDEX IF NOT EXISTS idx_soe_severity
ON soe_events(severity);

-- ============================================================================
-- 触发器：自动更新 updated_at 字段
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS update_device_types_updated_at
AFTER UPDATE ON device_types
FOR EACH ROW
BEGIN
    UPDATE device_types SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_device_type_tags_updated_at
AFTER UPDATE ON device_type_tags
FOR EACH ROW
BEGIN
    UPDATE device_type_tags SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_point_table_templates_updated_at
AFTER UPDATE ON point_table_templates
FOR EACH ROW
BEGIN
    UPDATE point_table_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_point_table_points_updated_at
AFTER UPDATE ON point_table_points
FOR EACH ROW
BEGIN
    UPDATE point_table_points SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_comm_instances_updated_at
AFTER UPDATE ON comm_instances
FOR EACH ROW
BEGIN
    UPDATE comm_instances SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_assets_updated_at
AFTER UPDATE ON assets
FOR EACH ROW
BEGIN
    UPDATE assets SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_template_mappings_updated_at
AFTER UPDATE ON template_mappings
FOR EACH ROW
BEGIN
    UPDATE template_mappings SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_asset_mappings_updated_at
AFTER UPDATE ON asset_mappings
FOR EACH ROW
BEGIN
    UPDATE asset_mappings SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

