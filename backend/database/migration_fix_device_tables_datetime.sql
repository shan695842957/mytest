-- ============================================================================
-- 修复 device 相关表的时间字段类型
-- 创建时间: 2025-01-XX
-- 说明: 将所有 device 相关表的 created_at_utc/updated_at_utc (INTEGER)
--       改为 created_at/updated_at (DATETIME)，与 users 表保持一致
-- ============================================================================

PRAGMA foreign_keys = OFF;

-- ============================================================================
-- 1. device_types 表
-- ============================================================================
-- 创建新表
CREATE TABLE device_types_new (
  id           INTEGER PRIMARY KEY,
  name         VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 迁移数据（将 INTEGER 时间戳转换为 DATETIME）
INSERT INTO device_types_new (id, name, display_name, description, created_at, updated_at)
SELECT 
  id,
  name,
  display_name,
  description,
  datetime(created_at_utc / 1000, 'unixepoch') as created_at,
  datetime(updated_at_utc / 1000, 'unixepoch') as updated_at
FROM device_types;

-- 删除旧表
DROP TABLE device_types;

-- 重命名新表
ALTER TABLE device_types_new RENAME TO device_types;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_device_types_name ON device_types(name);

-- ============================================================================
-- 2. device_type_tags 表
-- ============================================================================
CREATE TABLE device_type_tags_new (
  id             INTEGER PRIMARY KEY,
  device_type_id INTEGER NOT NULL,
  tag_name       VARCHAR(100) NOT NULL,
  display_name   VARCHAR(200) NOT NULL,
  data_type      VARCHAR(20) NOT NULL,
  semantic_type  VARCHAR(20) NOT NULL,
  engineering_unit VARCHAR(50) NOT NULL DEFAULT '',
  group_name     VARCHAR(100) NOT NULL DEFAULT '',
  severity       INTEGER NOT NULL DEFAULT 0,
  description    TEXT NOT NULL DEFAULT '',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(device_type_id) REFERENCES device_types(id) ON DELETE CASCADE
);

INSERT INTO device_type_tags_new (
  id, device_type_id, tag_name, display_name, data_type, semantic_type,
  engineering_unit, group_name, severity, description, created_at, updated_at
)
SELECT 
  id, device_type_id, tag_name, display_name, data_type, semantic_type,
  engineering_unit, group_name, severity, description,
  datetime(created_at_utc / 1000, 'unixepoch') as created_at,
  datetime(updated_at_utc / 1000, 'unixepoch') as updated_at
FROM device_type_tags;

DROP TABLE device_type_tags;
ALTER TABLE device_type_tags_new RENAME TO device_type_tags;

CREATE UNIQUE INDEX IF NOT EXISTS idx_device_type_tags_unique
ON device_type_tags(device_type_id, tag_name);

-- ============================================================================
-- 3. assets 表
-- ============================================================================
CREATE TABLE assets_new (
  id             INTEGER PRIMARY KEY,
  name           VARCHAR(100) NOT NULL UNIQUE,
  display_name   VARCHAR(200) NOT NULL,
  device_type_id INTEGER NOT NULL,
  location       VARCHAR(200) NOT NULL DEFAULT '',
  enabled        INTEGER NOT NULL DEFAULT 1,
  metadata_json  TEXT NOT NULL DEFAULT '{}',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(device_type_id) REFERENCES device_types(id) ON DELETE RESTRICT,
  CHECK(enabled IN (0, 1))
);

INSERT INTO assets_new (
  id, name, display_name, device_type_id, location, enabled, metadata_json,
  created_at, updated_at
)
SELECT 
  id, name, display_name, device_type_id, location, enabled, metadata_json,
  datetime(created_at_utc / 1000, 'unixepoch') as created_at,
  datetime(updated_at_utc / 1000, 'unixepoch') as updated_at
FROM assets;

DROP TABLE assets;
ALTER TABLE assets_new RENAME TO assets;

CREATE INDEX IF NOT EXISTS idx_assets_name ON assets(name);
CREATE INDEX IF NOT EXISTS idx_assets_device_type_id ON assets(device_type_id);
CREATE INDEX IF NOT EXISTS idx_assets_enabled ON assets(enabled);

-- ============================================================================
-- 4. comm_instances 表
-- ============================================================================
CREATE TABLE comm_instances_new (
  id             INTEGER PRIMARY KEY,
  name           VARCHAR(100) NOT NULL UNIQUE,
  display_name   VARCHAR(200) NOT NULL,
  enabled        INTEGER NOT NULL DEFAULT 1,
  point_table_id INTEGER NOT NULL,
  protocol_type  VARCHAR(50) NOT NULL,
  protocol_config TEXT NOT NULL,
  polling_interval_ms INTEGER NOT NULL,
  timeout_ms     INTEGER NOT NULL,
  retries        INTEGER NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(point_table_id) REFERENCES point_table_templates(id) ON DELETE RESTRICT,
  CHECK(enabled IN (0, 1))
);

INSERT INTO comm_instances_new (
  id, name, display_name, enabled, point_table_id, protocol_type, protocol_config,
  polling_interval_ms, timeout_ms, retries, created_at, updated_at
)
SELECT 
  id, name, display_name, enabled, point_table_id, protocol_type, protocol_config,
  polling_interval_ms, timeout_ms, retries,
  datetime(created_at_utc / 1000, 'unixepoch') as created_at,
  datetime(updated_at_utc / 1000, 'unixepoch') as updated_at
FROM comm_instances;

DROP TABLE comm_instances;
ALTER TABLE comm_instances_new RENAME TO comm_instances;

CREATE INDEX IF NOT EXISTS idx_comm_instances_name ON comm_instances(name);
CREATE INDEX IF NOT EXISTS idx_comm_instances_point_table_id ON comm_instances(point_table_id);
CREATE INDEX IF NOT EXISTS idx_comm_instances_enabled ON comm_instances(enabled);

-- ============================================================================
-- 5. point_table_templates 表
-- ============================================================================
CREATE TABLE point_table_templates_new (
  id           INTEGER PRIMARY KEY,
  name         VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  protocol_type VARCHAR(50) NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO point_table_templates_new (
  id, name, display_name, protocol_type, description, created_at, updated_at
)
SELECT 
  id, name, display_name, protocol_type, description,
  datetime(created_at_utc / 1000, 'unixepoch') as created_at,
  datetime(updated_at_utc / 1000, 'unixepoch') as updated_at
FROM point_table_templates;

DROP TABLE point_table_templates;
ALTER TABLE point_table_templates_new RENAME TO point_table_templates;

CREATE INDEX IF NOT EXISTS idx_point_table_templates_name ON point_table_templates(name);
CREATE INDEX IF NOT EXISTS idx_point_table_templates_protocol_type ON point_table_templates(protocol_type);

-- ============================================================================
-- 6. point_table_points 表
-- ============================================================================
CREATE TABLE point_table_points_new (
  id             INTEGER PRIMARY KEY,
  point_table_id INTEGER NOT NULL,
  point_name     VARCHAR(100) NOT NULL,
  display_name   VARCHAR(200) NOT NULL,
  address        VARCHAR(50) NOT NULL,
  io_type        VARCHAR(20) NOT NULL,
  raw_type       VARCHAR(20) NOT NULL,
  byte_order     VARCHAR(20) NOT NULL,
  scale_k        REAL NOT NULL DEFAULT 1.0,
  scale_b        REAL NOT NULL DEFAULT 0.0,
  description    TEXT NOT NULL DEFAULT '',
  is_active      INTEGER NOT NULL DEFAULT 1,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(point_table_id) REFERENCES point_table_templates(id) ON DELETE CASCADE,
  CHECK(io_type IN ('AI', 'AO', 'DI', 'DO', 'STRING')),
  CHECK(raw_type IN ('INT16', 'UINT16', 'INT32', 'UINT32', 'FLOAT32', 'FLOAT64', 'BITFIELD16')),
  CHECK(byte_order IN ('BE', 'LE', 'BE_SWAP', 'LE_SWAP')),
  CHECK(is_active IN (0, 1))
);

INSERT INTO point_table_points_new (
  id, point_table_id, point_name, display_name, address, io_type, raw_type,
  byte_order, scale_k, scale_b, description, is_active, created_at, updated_at
)
SELECT 
  id, point_table_id, point_name, display_name, address, io_type, raw_type,
  byte_order, scale_k, scale_b, description, is_active,
  datetime(created_at_utc / 1000, 'unixepoch') as created_at,
  datetime(updated_at_utc / 1000, 'unixepoch') as updated_at
FROM point_table_points;

DROP TABLE point_table_points;
ALTER TABLE point_table_points_new RENAME TO point_table_points;

CREATE UNIQUE INDEX IF NOT EXISTS idx_points_unique
ON point_table_points(point_table_id, point_name);
CREATE INDEX IF NOT EXISTS idx_point_table_points_point_table_id ON point_table_points(point_table_id);

-- ============================================================================
-- 7. template_mappings 表
-- ============================================================================
CREATE TABLE template_mappings_new (
  id             INTEGER PRIMARY KEY,
  device_type_id INTEGER NOT NULL,
  point_table_id INTEGER NOT NULL,
  asset_tag_name VARCHAR(100) NOT NULL,
  point_name     VARCHAR(100) NOT NULL,
  binding_kind   VARCHAR(20) NOT NULL,
  bit_index      INTEGER,
  bit_mask       INTEGER,
  bit_shift      INTEGER,
  enum_json      TEXT NOT NULL DEFAULT '{}',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(device_type_id) REFERENCES device_types(id) ON DELETE CASCADE,
  FOREIGN KEY(point_table_id) REFERENCES point_table_templates(id) ON DELETE CASCADE,
  CHECK(binding_kind IN ('DIRECT', 'BIT', 'BITMASK_ENUM'))
);

INSERT INTO template_mappings_new (
  id, device_type_id, point_table_id, asset_tag_name, point_name,
  binding_kind, bit_index, bit_mask, bit_shift, enum_json, created_at, updated_at
)
SELECT 
  id, device_type_id, point_table_id, asset_tag_name, point_name,
  binding_kind, bit_index, bit_mask, bit_shift, enum_json,
  datetime(created_at_utc / 1000, 'unixepoch') as created_at,
  datetime(updated_at_utc / 1000, 'unixepoch') as updated_at
FROM template_mappings;

DROP TABLE template_mappings;
ALTER TABLE template_mappings_new RENAME TO template_mappings;

CREATE UNIQUE INDEX IF NOT EXISTS idx_template_mappings_unique
ON template_mappings(device_type_id, point_table_id, asset_tag_name);
CREATE INDEX IF NOT EXISTS idx_template_mappings_device_type_id ON template_mappings(device_type_id);
CREATE INDEX IF NOT EXISTS idx_template_mappings_point_table_id ON template_mappings(point_table_id);

-- ============================================================================
-- 8. asset_mappings 表
-- ============================================================================
CREATE TABLE asset_mappings_new (
  id             INTEGER PRIMARY KEY,
  asset_id       INTEGER NOT NULL,
  asset_tag_name VARCHAR(100) NOT NULL,
  instance_id    INTEGER NOT NULL,
  point_name     VARCHAR(100) NOT NULL,
  binding_kind   VARCHAR(20) NOT NULL,
  bit_index      INTEGER,
  bit_mask       INTEGER,
  bit_shift      INTEGER,
  enum_json      TEXT NOT NULL DEFAULT '{}',
  is_overridden  INTEGER NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY(instance_id) REFERENCES comm_instances(id) ON DELETE RESTRICT,
  CHECK(binding_kind IN ('DIRECT', 'BIT', 'BITMASK_ENUM')),
  CHECK(is_overridden IN (0, 1))
);

INSERT INTO asset_mappings_new (
  id, asset_id, asset_tag_name, instance_id, point_name,
  binding_kind, bit_index, bit_mask, bit_shift, enum_json, is_overridden,
  created_at, updated_at
)
SELECT 
  id, asset_id, asset_tag_name, instance_id, point_name,
  binding_kind, bit_index, bit_mask, bit_shift, enum_json, is_overridden,
  datetime(created_at_utc / 1000, 'unixepoch') as created_at,
  datetime(updated_at_utc / 1000, 'unixepoch') as updated_at
FROM asset_mappings;

DROP TABLE asset_mappings;
ALTER TABLE asset_mappings_new RENAME TO asset_mappings;

CREATE UNIQUE INDEX IF NOT EXISTS idx_asset_mappings_unique
ON asset_mappings(asset_id, asset_tag_name);
CREATE INDEX IF NOT EXISTS idx_asset_mappings_instance_point
ON asset_mappings(instance_id, point_name);
CREATE INDEX IF NOT EXISTS idx_asset_mappings_asset_id ON asset_mappings(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_mappings_is_overridden ON asset_mappings(is_overridden);

-- ============================================================================
-- 9. soe_events 表（注意：这个表有 created_at_utc 和 inserted_at_utc，需要保留 inserted_at_utc）
-- ============================================================================
-- soe_events 表比较特殊，有 created_at_utc（事件发生时间）和 inserted_at_utc（插入时间）
-- 根据 device.md，created_at 是事件发生时间，inserted_at 是插入时间
-- 但为了与 users 表保持一致，我们保留 created_at 作为事件发生时间，inserted_at 作为插入时间
-- 如果表中有 inserted_at_utc，我们保留它；如果没有，我们只改 created_at_utc

-- 先检查表结构
-- 如果表存在 inserted_at_utc，则保留；否则只改 created_at_utc
-- 这里假设表结构是：created_at_utc（事件发生时间），inserted_at_utc（插入时间）

CREATE TABLE soe_events_new (
  id               INTEGER PRIMARY KEY,
  asset_id         INTEGER NOT NULL,
  asset_tag_name   VARCHAR(100) NOT NULL,
  event_type       VARCHAR(20) NOT NULL,
  severity         INTEGER NOT NULL,
  value_num        REAL,
  value_text       TEXT NOT NULL DEFAULT '',
  source_instance_id INTEGER,
  source_point_name VARCHAR(100),
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  inserted_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  extra_json       TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY(asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY(source_instance_id) REFERENCES comm_instances(id) ON DELETE SET NULL,
  CHECK(event_type IN ('ALARM_ON', 'ALARM_OFF', 'STATE_CHANGE', 'CMD_SENT', 'CMD_FAIL', 'PARAM_CHANGE', 'SETPOINT_CHANGE')),
  CHECK(severity BETWEEN 0 AND 4)
);

-- 迁移数据
INSERT INTO soe_events_new (
  id, asset_id, asset_tag_name, event_type, severity, value_num, value_text,
  source_instance_id, source_point_name, created_at, inserted_at, extra_json
)
SELECT 
  id, asset_id, asset_tag_name, event_type, severity, value_num, value_text,
  source_instance_id, source_point_name,
  datetime(created_at_utc / 1000, 'unixepoch') as created_at,
  datetime(COALESCE(inserted_at_utc, created_at_utc) / 1000, 'unixepoch') as inserted_at,
  extra_json
FROM soe_events;

DROP TABLE soe_events;
ALTER TABLE soe_events_new RENAME TO soe_events;

CREATE INDEX IF NOT EXISTS idx_soe_events_asset_id ON soe_events(asset_id);
CREATE INDEX IF NOT EXISTS idx_soe_events_asset_tag_name ON soe_events(asset_tag_name);
CREATE INDEX IF NOT EXISTS idx_soe_events_event_type ON soe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_soe_events_created_at ON soe_events(created_at);

-- ============================================================================
-- 创建 updated_at 自动更新触发器（为所有表）
-- ============================================================================

-- device_types
CREATE TRIGGER IF NOT EXISTS update_device_types_timestamp 
AFTER UPDATE ON device_types
FOR EACH ROW
BEGIN
    UPDATE device_types SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- device_type_tags
CREATE TRIGGER IF NOT EXISTS update_device_type_tags_timestamp 
AFTER UPDATE ON device_type_tags
FOR EACH ROW
BEGIN
    UPDATE device_type_tags SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- assets
CREATE TRIGGER IF NOT EXISTS update_assets_timestamp 
AFTER UPDATE ON assets
FOR EACH ROW
BEGIN
    UPDATE assets SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- comm_instances
CREATE TRIGGER IF NOT EXISTS update_comm_instances_timestamp 
AFTER UPDATE ON comm_instances
FOR EACH ROW
BEGIN
    UPDATE comm_instances SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- point_table_templates
CREATE TRIGGER IF NOT EXISTS update_point_table_templates_timestamp 
AFTER UPDATE ON point_table_templates
FOR EACH ROW
BEGIN
    UPDATE point_table_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- point_table_points
CREATE TRIGGER IF NOT EXISTS update_point_table_points_timestamp 
AFTER UPDATE ON point_table_points
FOR EACH ROW
BEGIN
    UPDATE point_table_points SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- template_mappings
CREATE TRIGGER IF NOT EXISTS update_template_mappings_timestamp 
AFTER UPDATE ON template_mappings
FOR EACH ROW
BEGIN
    UPDATE template_mappings SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- asset_mappings
CREATE TRIGGER IF NOT EXISTS update_asset_mappings_timestamp 
AFTER UPDATE ON asset_mappings
FOR EACH ROW
BEGIN
    UPDATE asset_mappings SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

PRAGMA foreign_keys = ON;

-- ============================================================================
-- 清理完成
-- ============================================================================
SELECT '迁移完成！所有 device 相关表的时间字段已统一为 DATETIME 类型' AS message;

