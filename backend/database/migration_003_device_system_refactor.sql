-- 迁移版本: v1.2.0
-- 创建时间: 2025-11-07
-- 说明: 设备管理系统重构 - 增加设备模板层，实现自动派生逻辑
--       核心变化：device_type → device_template → device（自动生成点）

PRAGMA foreign_keys = ON;

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS comm_to_point_map;
DROP TABLE IF EXISTS decoder_output;
DROP TABLE IF EXISTS comm_point;
DROP TABLE IF EXISTS comm_channel;
DROP TABLE IF EXISTS alarm_rule;
DROP TABLE IF EXISTS device_point;
DROP TABLE IF EXISTS device;
DROP TABLE IF EXISTS point_template;
DROP TABLE IF EXISTS device_type;

-- ============================================================
-- 1) 设备模板层（类型 → 模板 → 点模板）
-- ============================================================

-- 设备类型（大类）
CREATE TABLE device_type (
  type_id     INTEGER PRIMARY KEY AUTOINCREMENT,
  type_code   VARCHAR(50) NOT NULL UNIQUE,      -- 例: 'PCS', 'Battery'
  name_zh     VARCHAR(100) NOT NULL,
  name_en     VARCHAR(100) NOT NULL,
  description TEXT,
  created_by  INTEGER,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 设备模板（具体型号：厂商+型号+版本）
CREATE TABLE device_template (
  tpl_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  type_id     INTEGER NOT NULL,                 -- 所属设备类型
  tpl_code    VARCHAR(100) NOT NULL UNIQUE,     -- 例: 'PCS_Sungrow_100kW_v1'
  vendor      VARCHAR(100) NOT NULL,            -- 厂商: 'Sungrow'
  model       VARCHAR(100) NOT NULL,            -- 型号: 'PCS-100kW'
  version     VARCHAR(50) NOT NULL DEFAULT 'v1',-- 模板版本
  name_zh     VARCHAR(200) NOT NULL,            -- 例: '阳光电源100kW变流器v1'
  name_en     VARCHAR(200) NOT NULL,
  description TEXT,
  is_active   INTEGER NOT NULL CHECK (is_active IN (0,1)) DEFAULT 1,
  created_by  INTEGER,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(type_id, vendor, model, version),
  FOREIGN KEY (type_id) REFERENCES device_type(type_id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 点模板（属于设备模板，不是设备类型！）
CREATE TABLE point_template (
  ptpl_id     INTEGER PRIMARY KEY AUTOINCREMENT,
  tpl_id      INTEGER NOT NULL,                 -- 所属设备模板
  point_key   VARCHAR(100) NOT NULL,            -- 例: 'YC.ActivePower'
  name_zh     VARCHAR(100) NOT NULL,
  name_en     VARCHAR(100) NOT NULL,
  category    VARCHAR(20) NOT NULL CHECK (category IN ('YC','YX','YM','YS','YT','YK','YSH')),
  datatype    VARCHAR(20) NOT NULL CHECK (datatype IN ('float','int','bool','string')),
  unit        VARCHAR(20),
  writable    INTEGER NOT NULL CHECK (writable IN (0,1)) DEFAULT 0,
  description TEXT,
  created_by  INTEGER,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tpl_id, point_key),
  FOREIGN KEY (tpl_id) REFERENCES device_template(tpl_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================
-- 2) 通信配置（与模板/实例解耦）
-- ============================================================

-- 通信通道
CREATE TABLE comm_channel (
  channel_id  INTEGER PRIMARY KEY AUTOINCREMENT,
  name        VARCHAR(100) NOT NULL UNIQUE,
  protocol    VARCHAR(50) NOT NULL CHECK (protocol IN ('ModbusTCP','ModbusRTU','IEC104','MQTT','SNMP')),
  role        VARCHAR(20) NOT NULL CHECK (role IN ('Active','Passive')),
  ip          VARCHAR(50),
  port        INTEGER,
  serial_port VARCHAR(50),
  baudrate    INTEGER,
  parity      VARCHAR(1) CHECK (parity IN ('N','E','O')),
  databits    INTEGER CHECK (databits IN (7,8)),
  stopbits    INTEGER CHECK (stopbits IN (1,2)),
  timeout_ms  INTEGER NOT NULL DEFAULT 2000,
  enabled     INTEGER NOT NULL CHECK (enabled IN (0,1)) DEFAULT 1,
  description TEXT,
  created_by  INTEGER,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 通信原始点
CREATE TABLE comm_point (
  cpt_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id  INTEGER NOT NULL,
  slave_id    INTEGER NOT NULL,
  func_code   INTEGER NOT NULL,
  address     INTEGER NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  datatype    VARCHAR(20) NOT NULL CHECK (datatype IN ('u16','i16','u32','i32','f32','raw')),
  bit_order   VARCHAR(10) NOT NULL CHECK (bit_order IN ('LSB0','MSB0')) DEFAULT 'LSB0',
  word_order  VARCHAR(10) NOT NULL CHECK (word_order IN ('LE','BE')) DEFAULT 'LE',
  poll_group  VARCHAR(20) NOT NULL CHECK (poll_group IN ('fast','normal','slow')) DEFAULT 'normal',
  description TEXT,
  created_by  INTEGER,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(channel_id, slave_id, func_code, address),
  FOREIGN KEY (channel_id) REFERENCES comm_channel(channel_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 解码输出
CREATE TABLE decoder_output (
  dout_id     INTEGER PRIMARY KEY AUTOINCREMENT,
  cpt_id      INTEGER NOT NULL,
  out_key     VARCHAR(50) NOT NULL,
  category    VARCHAR(20) NOT NULL CHECK (category IN ('YC','YX','YM','YS','YT','YK','YSH')),
  extract_type VARCHAR(20) NOT NULL CHECK (extract_type IN ('bit','slice','raw')),
  bit_index   INTEGER,
  start_bit   INTEGER,
  bit_len     INTEGER,
  signed      INTEGER NOT NULL CHECK (signed IN (0,1)) DEFAULT 0,
  scale_k     REAL NOT NULL DEFAULT 1.0,
  scale_b     REAL NOT NULL DEFAULT 0.0,
  out_datatype VARCHAR(20) NOT NULL CHECK (out_datatype IN ('float','int','bool','string')) DEFAULT 'float',
  unit        VARCHAR(20),
  description TEXT,
  created_by  INTEGER,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(cpt_id, out_key),
  FOREIGN KEY (cpt_id) REFERENCES comm_point(cpt_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================
-- 3) 设备实例（严格从模板派生）
-- ============================================================

-- 设备实例：必须基于模板创建
CREATE TABLE device (
  device_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  tpl_id      INTEGER NOT NULL,                 -- 必须基于模板
  name        VARCHAR(100) NOT NULL UNIQUE,     -- 例: '1#PCS'
  address     VARCHAR(100) NOT NULL,            -- 站内地址/从站号
  channel_id  INTEGER NOT NULL,                 -- 绑定通信通道
  enabled     INTEGER NOT NULL CHECK (enabled IN (0,1)) DEFAULT 1,
  note        TEXT,
  created_by  INTEGER,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tpl_id) REFERENCES device_template(tpl_id) ON DELETE RESTRICT,
  FOREIGN KEY (channel_id) REFERENCES comm_channel(channel_id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 设备点：只读，由触发器自动生成
CREATE TABLE device_point (
  point_id    INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id   INTEGER NOT NULL,
  ptpl_id     INTEGER NOT NULL,                 -- 源自哪个点模板
  alias       VARCHAR(100),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(device_id, ptpl_id),
  FOREIGN KEY (device_id) REFERENCES device(device_id) ON DELETE CASCADE,
  FOREIGN KEY (ptpl_id) REFERENCES point_template(ptpl_id) ON DELETE RESTRICT
);

-- ============================================================
-- 4) 映射和告警
-- ============================================================

-- 通信到点的映射
CREATE TABLE comm_to_point_map (
  map_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  dout_id     INTEGER NOT NULL,
  point_id    INTEGER NOT NULL,
  direction   VARCHAR(20) NOT NULL CHECK (direction IN ('read','write','readwrite')) DEFAULT 'read',
  priority    INTEGER NOT NULL DEFAULT 1,
  created_by  INTEGER,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(dout_id, point_id, direction),
  FOREIGN KEY (dout_id) REFERENCES decoder_output(dout_id) ON DELETE CASCADE,
  FOREIGN KEY (point_id) REFERENCES device_point(point_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 告警规则
CREATE TABLE alarm_rule (
  rule_id     INTEGER PRIMARY KEY AUTOINCREMENT,
  point_id    INTEGER NOT NULL,
  rule_type   VARCHAR(20) NOT NULL CHECK (rule_type IN ('threshold','range','rate','boolean')),
  severity    INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
  param_json  TEXT NOT NULL,
  enabled     INTEGER NOT NULL CHECK (enabled IN (0,1)) DEFAULT 1,
  description TEXT,
  created_by  INTEGER,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(point_id, rule_type),
  FOREIGN KEY (point_id) REFERENCES device_point(point_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================================================
-- 触发器：自动派生设备点（核心业务逻辑）
-- ============================================================

-- 创建设备时，自动为该设备生成所有点（基于其模板的点模板）
CREATE TRIGGER trg_device_create_points
AFTER INSERT ON device
FOR EACH ROW
BEGIN
  -- 插入设备点：从 point_template 派生
  INSERT INTO device_point (device_id, ptpl_id)
  SELECT NEW.device_id, ptpl_id
  FROM point_template
  WHERE tpl_id = NEW.tpl_id;
END;

-- ============================================================
-- 索引
-- ============================================================

CREATE INDEX idx_device_type_code ON device_type(type_code);
CREATE INDEX idx_device_template_type ON device_template(type_id);
CREATE INDEX idx_device_template_code ON device_template(tpl_code);
CREATE INDEX idx_device_template_active ON device_template(is_active);
CREATE INDEX idx_point_template_tpl ON point_template(tpl_id);
CREATE INDEX idx_point_template_category ON point_template(category);
CREATE INDEX idx_device_tpl ON device(tpl_id);
CREATE INDEX idx_device_channel ON device(channel_id);
CREATE INDEX idx_device_enabled ON device(enabled);
CREATE INDEX idx_device_point_device ON device_point(device_id);
CREATE INDEX idx_device_point_ptpl ON device_point(ptpl_id);
CREATE INDEX idx_comm_channel_protocol ON comm_channel(protocol);
CREATE INDEX idx_comm_channel_enabled ON comm_channel(enabled);
CREATE INDEX idx_comm_point_channel ON comm_point(channel_id);
CREATE INDEX idx_comm_point_addr ON comm_point(channel_id, slave_id, address);
CREATE INDEX idx_decoder_output_cpt ON decoder_output(cpt_id);
CREATE INDEX idx_map_dout ON comm_to_point_map(dout_id);
CREATE INDEX idx_map_point ON comm_to_point_map(point_id);
CREATE INDEX idx_alarm_rule_point ON alarm_rule(point_id);
CREATE INDEX idx_alarm_rule_enabled ON alarm_rule(enabled);

-- ============================================================
-- 触发器：自动更新时间戳
-- ============================================================

CREATE TRIGGER update_device_type_timestamp 
AFTER UPDATE ON device_type
FOR EACH ROW
BEGIN
    UPDATE device_type SET updated_at = CURRENT_TIMESTAMP WHERE type_id = OLD.type_id;
END;

CREATE TRIGGER update_device_template_timestamp 
AFTER UPDATE ON device_template
FOR EACH ROW
BEGIN
    UPDATE device_template SET updated_at = CURRENT_TIMESTAMP WHERE tpl_id = OLD.tpl_id;
END;

CREATE TRIGGER update_point_template_timestamp 
AFTER UPDATE ON point_template
FOR EACH ROW
BEGIN
    UPDATE point_template SET updated_at = CURRENT_TIMESTAMP WHERE ptpl_id = OLD.ptpl_id;
END;

CREATE TRIGGER update_device_timestamp 
AFTER UPDATE ON device
FOR EACH ROW
BEGIN
    UPDATE device SET updated_at = CURRENT_TIMESTAMP WHERE device_id = OLD.device_id;
END;

CREATE TRIGGER update_device_point_timestamp 
AFTER UPDATE ON device_point
FOR EACH ROW
BEGIN
    UPDATE device_point SET updated_at = CURRENT_TIMESTAMP WHERE point_id = OLD.point_id;
END;

CREATE TRIGGER update_comm_channel_timestamp 
AFTER UPDATE ON comm_channel
FOR EACH ROW
BEGIN
    UPDATE comm_channel SET updated_at = CURRENT_TIMESTAMP WHERE channel_id = OLD.channel_id;
END;

CREATE TRIGGER update_comm_point_timestamp 
AFTER UPDATE ON comm_point
FOR EACH ROW
BEGIN
    UPDATE comm_point SET updated_at = CURRENT_TIMESTAMP WHERE cpt_id = OLD.cpt_id;
END;

CREATE TRIGGER update_decoder_output_timestamp 
AFTER UPDATE ON decoder_output
FOR EACH ROW
BEGIN
    UPDATE decoder_output SET updated_at = CURRENT_TIMESTAMP WHERE dout_id = OLD.dout_id;
END;

CREATE TRIGGER update_comm_to_point_map_timestamp 
AFTER UPDATE ON comm_to_point_map
FOR EACH ROW
BEGIN
    UPDATE comm_to_point_map SET updated_at = CURRENT_TIMESTAMP WHERE map_id = OLD.map_id;
END;

CREATE TRIGGER update_alarm_rule_timestamp 
AFTER UPDATE ON alarm_rule
FOR EACH ROW
BEGIN
    UPDATE alarm_rule SET updated_at = CURRENT_TIMESTAMP WHERE rule_id = OLD.rule_id;
END;

-- ============================================================
-- 初始数据
-- ============================================================

-- 插入默认设备类型
INSERT INTO device_type (type_id, type_code, name_zh, name_en, created_by) VALUES
(1, 'PCS', '储能变流器', 'Power Conversion System', 1),
(2, 'Battery', '电池簇', 'Battery Cluster', 1),
(3, 'Aircon', '空调', 'Air Conditioner', 1),
(4, 'Meter', '电能表', 'Energy Meter', 1);

-- 插入示例设备模板
INSERT INTO device_template (tpl_id, type_id, tpl_code, vendor, model, version, name_zh, name_en, created_by) VALUES
(1, 1, 'PCS_Sungrow_100kW_v1', 'Sungrow', 'PCS-100kW', 'v1', '阳光电源100kW变流器v1', 'Sungrow PCS 100kW v1', 1),
(2, 1, 'PCS_Huawei_200kW_v1', 'Huawei', 'UPS2000-G-200kVA', 'v1', '华为200kW变流器v1', 'Huawei PCS 200kW v1', 1);

-- 为示例模板插入点模板
INSERT INTO point_template (tpl_id, point_key, name_zh, name_en, category, datatype, unit, writable, created_by) VALUES
-- PCS_Sungrow_100kW_v1 的点模板
(1, 'YC.ActivePower', '有功功率', 'Active Power', 'YC', 'float', 'kW', 0, 1),
(1, 'YC.ReactivePower', '无功功率', 'Reactive Power', 'YC', 'float', 'kVar', 0, 1),
(1, 'YC.Voltage', '电压', 'Voltage', 'YC', 'float', 'V', 0, 1),
(1, 'YC.Current', '电流', 'Current', 'YC', 'float', 'A', 0, 1),
(1, 'YX.RunStatus', '运行状态', 'Run Status', 'YX', 'bool', NULL, 0, 1),
(1, 'YX.FaultStatus', '故障状态', 'Fault Status', 'YX', 'bool', NULL, 0, 1),
(1, 'YM.TotalEnergy', '累计电量', 'Total Energy', 'YM', 'float', 'kWh', 0, 1),
(1, 'YT.PowerSetpoint', '功率设定', 'Power Setpoint', 'YT', 'float', 'kW', 1, 1),
(1, 'YK.Start', '启动命令', 'Start Command', 'YK', 'bool', NULL, 1, 1),
(1, 'YK.Stop', '停止命令', 'Stop Command', 'YK', 'bool', NULL, 1, 1);

