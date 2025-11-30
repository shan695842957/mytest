-- ============================================================================
-- 迁移版本: v1.3.0
-- 创建时间: 2025-11-07
-- 说明: 设备管理系统完整实现 - 基于 device.md 需求
--       核心链路：Device Template → Device Instance → Device Points → Mapping to Comm
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- 删除所有旧的设备相关表（开发环境，直接删除）
-- ============================================================================

DROP TABLE IF EXISTS mapping_instance;
DROP TABLE IF EXISTS device_comm_binding;
DROP TABLE IF EXISTS device_point;
DROP TABLE IF EXISTS device;
DROP TABLE IF EXISTS alarm_rule;
DROP TABLE IF EXISTS comm_to_point_map;
DROP TABLE IF EXISTS decoder_output;
DROP TABLE IF EXISTS comm_point;
DROP TABLE IF EXISTS comm_channel;
DROP TABLE IF EXISTS template_mapping;
DROP TABLE IF EXISTS decoder_output_template;
DROP TABLE IF EXISTS comm_point_template;
DROP TABLE IF EXISTS comm_template;
DROP TABLE IF EXISTS template_point;
DROP TABLE IF EXISTS point_template;
DROP TABLE IF EXISTS device_template;
DROP TABLE IF EXISTS device_type;

-- ============================================================================
-- 0) 通用枚举说明（以 CHECK 约束体现）
-- - signal_kind: 语义类别（非"七遥"，使用英文含义）
--   measurement | status | counter | parameter | setpoint | control | param_write
-- - data_type  : 值数据类型：int | float | bool | string
-- - protocol   : 协议：ModbusTCP | ModbusRTU | IEC104 | SNMP | MQTT | Custom
-- - extract    : 解码类型：bit | slice | raw
-- ============================================================================

-- ============================================================================
-- 1) 设备模板（Device Template）
-- 描述某厂商/型号的一类设备的"语义点模型"，
-- 后续设备实例必须从模板派生。
-- ============================================================================

CREATE TABLE IF NOT EXISTS device_template (
  template_id    INTEGER PRIMARY KEY AUTOINCREMENT,     -- 模板主键
  template_code  TEXT NOT NULL UNIQUE,                  -- 模板编码（如 PCS_SG100_v1）
  vendor         TEXT NOT NULL,                         -- 厂商
  model          TEXT NOT NULL,                         -- 型号
  device_class   TEXT NOT NULL,                         -- 设备类别（如 PCS / BMS / Aircon ...）
  version        TEXT NOT NULL DEFAULT 'v1.0',          -- 模板版本
  description    TEXT,                                  -- 说明
  created_by     INTEGER,                               -- 创建者ID
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 更新时间
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 模板下的"语义点定义"（Point Templates）
CREATE TABLE IF NOT EXISTS template_point (
  tpoint_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id    INTEGER NOT NULL,                      -- 所属设备模板
  point_key      TEXT NOT NULL,                         -- 语义点键（模板内唯一，如 "measurement.active_power"）
  display_name   TEXT NOT NULL,                         -- 显示名称（如 有功功率）
  signal_kind    TEXT NOT NULL CHECK (signal_kind IN
                    ('measurement','status','counter','parameter','setpoint','control','param_write')),
                                                                   -- 语义类别（英文）
  data_type      TEXT NOT NULL CHECK (data_type IN ('int','float','bool','string')), -- 数据类型
  unit           TEXT,                                  -- 单位（measurement/counter 时常有）
  writable       INTEGER NOT NULL CHECK (writable IN (0,1)) DEFAULT 0, -- 是否可写（setpoint/control/param_write）
  description    TEXT,
  created_by     INTEGER,                               -- 创建者ID
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 更新时间
  UNIQUE(template_id, point_key),
  FOREIGN KEY (template_id) REFERENCES device_template(template_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- 2) 通信模板（Communication Template）
-- 定义协议、寄存器/报文点、以及"多输出解码"。
-- 在模板层完成"输出键 → 语义点键"的映射。
-- ============================================================================

CREATE TABLE IF NOT EXISTS comm_template (
  ctemplate_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id    INTEGER NOT NULL,                      -- 对应的设备模板（同一厂商/型号）
  protocol       TEXT NOT NULL CHECK (protocol IN ('ModbusTCP','ModbusRTU','IEC104','SNMP','MQTT','Custom')),
  description    TEXT,
  created_by     INTEGER,                               -- 创建者ID
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 更新时间
  FOREIGN KEY (template_id) REFERENCES device_template(template_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(template_id)                                    -- 一个设备模板通常对应一份通信模板
);

-- 通信寄存器/信息点模板（一次读取单元）
CREATE TABLE IF NOT EXISTS comm_point_template (
  cptpl_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  ctemplate_id   INTEGER NOT NULL,                      -- 所属通信模板
  func_code      INTEGER NOT NULL,                      -- 功能码（如 Modbus 3/4/6/16；IEC104 可映射型码）
  base_address   INTEGER NOT NULL,                      -- 基础地址（模板层相对地址）
  quantity       INTEGER NOT NULL DEFAULT 1,            -- 连读数量/长度
  raw_datatype   TEXT NOT NULL CHECK (raw_datatype IN ('u16','i16','u32','i32','f32','raw')),
                                                                   -- 原始数据类型（通信未解码前）
  bit_order      TEXT NOT NULL CHECK (bit_order IN ('LSB0','MSB0')) DEFAULT 'LSB0',
  word_order     TEXT NOT NULL CHECK (word_order IN ('LE','BE')) DEFAULT 'LE',
  poll_group     TEXT NOT NULL CHECK (poll_group IN ('fast','normal','slow')) DEFAULT 'normal',
  note           TEXT,
  created_by     INTEGER,                               -- 创建者ID
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 更新时间
  FOREIGN KEY (ctemplate_id) REFERENCES comm_template(ctemplate_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 多输出解码模板：一个通信点可拆成 N 个输出（按位/位段/整值）
CREATE TABLE IF NOT EXISTS decoder_output_template (
  dout_tpl_id    INTEGER PRIMARY KEY AUTOINCREMENT,
  cptpl_id       INTEGER NOT NULL,                      -- 来源通信点模板
  out_key        TEXT NOT NULL,                         -- 输出键（在该 cptpl 内唯一，如 "B0","N1"）
  extract_type   TEXT NOT NULL CHECK (extract_type IN ('bit','slice','raw')),
  bit_index      INTEGER,                               -- extract_type='bit' 时的位序（0 起）
  start_bit      INTEGER,                               -- extract_type='slice' 起始位
  bit_len        INTEGER,                               -- extract_type='slice' 长度
  signed_flag    INTEGER NOT NULL CHECK (signed_flag IN (0,1)) DEFAULT 0, -- 位段是否有符号
  scale_k        REAL NOT NULL DEFAULT 1.0,             -- 线性换算 kx+b
  scale_b        REAL NOT NULL DEFAULT 0.0,
  out_data_type  TEXT NOT NULL CHECK (out_data_type IN ('int','float','bool','string')) DEFAULT 'float',
  unit           TEXT,
  description    TEXT,
  created_by     INTEGER,                               -- 创建者ID
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 更新时间
  UNIQUE(cptpl_id, out_key),
  FOREIGN KEY (cptpl_id) REFERENCES comm_point_template(cptpl_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 模板级"输出键 → 语义点键"的绑定（模板映射）
CREATE TABLE IF NOT EXISTS template_mapping (
  tmapping_id    INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id    INTEGER NOT NULL,                      -- 设备模板
  dout_tpl_id    INTEGER NOT NULL,                      -- 解码输出模板
  point_key      TEXT NOT NULL,                         -- 语义点键（指向 template_point.point_key）
  direction      TEXT NOT NULL CHECK (direction IN ('read','write','readwrite')) DEFAULT 'read',
  created_by     INTEGER,                               -- 创建者ID
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 更新时间
  UNIQUE(template_id, dout_tpl_id, point_key),
  FOREIGN KEY (template_id) REFERENCES device_template(template_id) ON DELETE CASCADE,
  FOREIGN KEY (dout_tpl_id) REFERENCES decoder_output_template(dout_tpl_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- 3) 通信通道（Channel）
-- 实际现场的物理/网络通道，实例化时要选择其一。
-- ============================================================================

CREATE TABLE IF NOT EXISTS comm_channel (
  channel_id     INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL UNIQUE,                  -- 通道名（如 CH1）
  protocol       TEXT NOT NULL CHECK (protocol IN ('ModbusTCP','ModbusRTU','IEC104','SNMP','MQTT','Custom')),
  ip             TEXT,                                  -- TCP/IEC104/MQTT 等网络地址
  port           INTEGER,
  serial_port    TEXT,                                  -- 串口号（RTU）
  baudrate       INTEGER,
  parity         TEXT CHECK (parity IN ('N','E','O')),
  databits       INTEGER CHECK (databits IN (7,8)),
  stopbits       INTEGER CHECK (stopbits IN (1,2)),
  timeout_ms     INTEGER NOT NULL DEFAULT 2000,
  enabled        INTEGER NOT NULL CHECK (enabled IN (0,1)) DEFAULT 1,
  description    TEXT,
  created_by     INTEGER,                               -- 创建者ID
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 更新时间
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- 4) 设备实例（Device）与设备点（派生）
-- 设备必须引用设备模板；设备点从模板点派生。
-- ============================================================================

CREATE TABLE IF NOT EXISTS device (
  device_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id    INTEGER NOT NULL,                      -- 必须先有模板（外键强制）
  name           TEXT NOT NULL,                         -- 设备显示名（如 "PCS#1"）
  vendor         TEXT NOT NULL,                         -- 冗余保存，便于筛选
  model          TEXT NOT NULL,
  device_class   TEXT NOT NULL,
  description    TEXT,
  enabled        INTEGER NOT NULL CHECK (enabled IN (0,1)) DEFAULT 1,
  created_by     INTEGER,                               -- 创建者ID
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 更新时间
  FOREIGN KEY (template_id) REFERENCES device_template(template_id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 设备点：从 template_point 派生的"实例化语义点"
CREATE TABLE IF NOT EXISTS device_point (
  point_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id      INTEGER NOT NULL,                      -- 所属设备
  point_key      TEXT NOT NULL,                         -- 继承自模板点（用于人类可读）
  display_name   TEXT NOT NULL,
  signal_kind    TEXT NOT NULL CHECK (signal_kind IN
                    ('measurement','status','counter','parameter','setpoint','control','param_write')),
  data_type      TEXT NOT NULL CHECK (data_type IN ('int','float','bool','string')),
  unit           TEXT,
  writable       INTEGER NOT NULL CHECK (writable IN (0,1)) DEFAULT 0,
  source_tpoint  INTEGER NOT NULL,                      -- 源模板点 tpoint_id
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 更新时间
  UNIQUE(device_id, point_key),
  FOREIGN KEY (device_id) REFERENCES device(device_id) ON DELETE CASCADE,
  FOREIGN KEY (source_tpoint) REFERENCES template_point(tpoint_id) ON DELETE RESTRICT
);

-- ============================================================================
-- 5) 设备通信绑定参数（Instance-level binding params）
-- 把"设备实例"与"通信模板 + 通道 + 地址参数"绑定，
-- 作为后续生成"实例映射"的参数来源。
-- ============================================================================

CREATE TABLE IF NOT EXISTS device_comm_binding (
  binding_id     INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id      INTEGER NOT NULL,                      -- 哪台设备
  ctemplate_id   INTEGER NOT NULL,                      -- 使用哪份通信模板（应与 device.template_id 同源）
  channel_id     INTEGER NOT NULL,                      -- 选哪个通信通道
  slave_id       INTEGER,                               -- Modbus 从站/IEC104 信息体地址等
  base_offset    INTEGER NOT NULL DEFAULT 0,            -- 地址基准偏移（用于多台设备按步长分区）
  addr_stride    INTEGER NOT NULL DEFAULT 0,            -- 步长（按模板点分段递增时使用）
  param_json     TEXT,                                  -- 其他解析参数（如端序、缩放全局项）
  created_by     INTEGER,                               -- 创建者ID
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 更新时间
  UNIQUE(device_id),
  FOREIGN KEY (device_id)    REFERENCES device(device_id) ON DELETE CASCADE,
  FOREIGN KEY (ctemplate_id) REFERENCES comm_template(ctemplate_id) ON DELETE RESTRICT,
  FOREIGN KEY (channel_id)   REFERENCES comm_channel(channel_id)  ON DELETE RESTRICT,
  FOREIGN KEY (created_by)   REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- 6) 实例映射（Runtime mapping）
-- 将"设备点"与"具体通信读取输出"一一绑定，供驱动使用。
-- 该表通常由后端服务根据：
--   template_mapping + device_comm_binding + comm_point_template
-- 计算出 **具体 func_code / address / bit 等** 后批量生成。
-- ============================================================================

CREATE TABLE IF NOT EXISTS mapping_instance (
  imap_id        INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id      INTEGER NOT NULL,                      -- 冗余，便于查询
  point_id       INTEGER NOT NULL,                      -- 设备点（目标）
  channel_id     INTEGER NOT NULL,                      -- 具体通道
  slave_id       INTEGER,                               -- 具体从站/信息体地址
  func_code      INTEGER NOT NULL,                      -- 具体功能码
  address        INTEGER NOT NULL,                      -- 具体地址（已结合 base_offset/stride 计算）
  quantity       INTEGER NOT NULL DEFAULT 1,            -- 长度（字/字节）
  extract_type   TEXT NOT NULL CHECK (extract_type IN ('bit','slice','raw')),
  bit_index      INTEGER,                               -- bit
  start_bit      INTEGER,                               -- slice 起始位
  bit_len        INTEGER,                               -- slice 长度
  signed_flag    INTEGER NOT NULL CHECK (signed_flag IN (0,1)) DEFAULT 0,
  scale_k        REAL NOT NULL DEFAULT 1.0,
  scale_b        REAL NOT NULL DEFAULT 0.0,
  out_data_type  TEXT NOT NULL CHECK (out_data_type IN ('int','float','bool','string')) DEFAULT 'float',
  unit           TEXT,
  direction      TEXT NOT NULL CHECK (direction IN ('read','write','readwrite')) DEFAULT 'read',
  source_dout_tpl INTEGER NOT NULL,                     -- 来源的解码输出模板（追溯用）
  created_by     INTEGER,                               -- 创建者ID
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 创建时间
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP,    -- 更新时间
  UNIQUE(point_id, direction),                          -- 每个点在某方向上有唯一来源
  FOREIGN KEY (device_id)      REFERENCES device(device_id) ON DELETE CASCADE,
  FOREIGN KEY (point_id)       REFERENCES device_point(point_id) ON DELETE CASCADE,
  FOREIGN KEY (channel_id)     REFERENCES comm_channel(channel_id) ON DELETE RESTRICT,
  FOREIGN KEY (source_dout_tpl)REFERENCES decoder_output_template(dout_tpl_id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by)     REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- 7) 关键索引（查询与生成效率）
-- ============================================================================

-- 模板点按模板检索
CREATE INDEX IF NOT EXISTS idx_tpoint_template ON template_point(template_id);

-- 解码输出按通信点检索
CREATE INDEX IF NOT EXISTS idx_douttpl_cptpl ON decoder_output_template(cptpl_id);

-- 模板映射按模板检索
CREATE INDEX IF NOT EXISTS idx_tmapping_template ON template_mapping(template_id);

-- 设备点按设备检索
CREATE INDEX IF NOT EXISTS idx_dpoint_device ON device_point(device_id);

-- 实例映射按设备/通道检索
CREATE INDEX IF NOT EXISTS idx_imap_device ON mapping_instance(device_id);
CREATE INDEX IF NOT EXISTS idx_imap_channel ON mapping_instance(channel_id);

-- 设备模板按编码检索
CREATE INDEX IF NOT EXISTS idx_device_template_code ON device_template(template_code);

-- 设备按模板检索
CREATE INDEX IF NOT EXISTS idx_device_template ON device(template_id);

-- 通信模板按模板检索
CREATE INDEX IF NOT EXISTS idx_comm_template_template ON comm_template(template_id);

-- 通信通道按协议检索
CREATE INDEX IF NOT EXISTS idx_comm_channel_protocol ON comm_channel(protocol);

-- 设备通信绑定按设备检索
CREATE INDEX IF NOT EXISTS idx_device_comm_binding_device ON device_comm_binding(device_id);

-- ============================================================================
-- 8) 触发器：自动更新时间戳
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS update_device_template_timestamp 
AFTER UPDATE ON device_template
FOR EACH ROW
BEGIN
    UPDATE device_template SET updated_at = CURRENT_TIMESTAMP WHERE template_id = OLD.template_id;
END;

CREATE TRIGGER IF NOT EXISTS update_template_point_timestamp 
AFTER UPDATE ON template_point
FOR EACH ROW
BEGIN
    UPDATE template_point SET updated_at = CURRENT_TIMESTAMP WHERE tpoint_id = OLD.tpoint_id;
END;

CREATE TRIGGER IF NOT EXISTS update_comm_template_timestamp 
AFTER UPDATE ON comm_template
FOR EACH ROW
BEGIN
    UPDATE comm_template SET updated_at = CURRENT_TIMESTAMP WHERE ctemplate_id = OLD.ctemplate_id;
END;

CREATE TRIGGER IF NOT EXISTS update_comm_point_template_timestamp 
AFTER UPDATE ON comm_point_template
FOR EACH ROW
BEGIN
    UPDATE comm_point_template SET updated_at = CURRENT_TIMESTAMP WHERE cptpl_id = OLD.cptpl_id;
END;

CREATE TRIGGER IF NOT EXISTS update_decoder_output_template_timestamp 
AFTER UPDATE ON decoder_output_template
FOR EACH ROW
BEGIN
    UPDATE decoder_output_template SET updated_at = CURRENT_TIMESTAMP WHERE dout_tpl_id = OLD.dout_tpl_id;
END;

CREATE TRIGGER IF NOT EXISTS update_template_mapping_timestamp 
AFTER UPDATE ON template_mapping
FOR EACH ROW
BEGIN
    UPDATE template_mapping SET updated_at = CURRENT_TIMESTAMP WHERE tmapping_id = OLD.tmapping_id;
END;

CREATE TRIGGER IF NOT EXISTS update_comm_channel_timestamp 
AFTER UPDATE ON comm_channel
FOR EACH ROW
BEGIN
    UPDATE comm_channel SET updated_at = CURRENT_TIMESTAMP WHERE channel_id = OLD.channel_id;
END;

CREATE TRIGGER IF NOT EXISTS update_device_timestamp 
AFTER UPDATE ON device
FOR EACH ROW
BEGIN
    UPDATE device SET updated_at = CURRENT_TIMESTAMP WHERE device_id = OLD.device_id;
END;

CREATE TRIGGER IF NOT EXISTS update_device_point_timestamp 
AFTER UPDATE ON device_point
FOR EACH ROW
BEGIN
    UPDATE device_point SET updated_at = CURRENT_TIMESTAMP WHERE point_id = OLD.point_id;
END;

CREATE TRIGGER IF NOT EXISTS update_device_comm_binding_timestamp 
AFTER UPDATE ON device_comm_binding
FOR EACH ROW
BEGIN
    UPDATE device_comm_binding SET updated_at = CURRENT_TIMESTAMP WHERE binding_id = OLD.binding_id;
END;

CREATE TRIGGER IF NOT EXISTS update_mapping_instance_timestamp 
AFTER UPDATE ON mapping_instance
FOR EACH ROW
BEGIN
    UPDATE mapping_instance SET updated_at = CURRENT_TIMESTAMP WHERE imap_id = OLD.imap_id;
END;

-- ============================================================================
-- 脚本结束
-- ============================================================================

