-- ============================================================================
-- 迁移版本: v1.6.0
-- 创建时间: 2025-01-XX
-- 说明: 协议类型管理系统
--       支持通过数据库配置协议类型及其参数，替代硬编码
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. 协议类型表 (protocol_types)
-- 用途：定义支持的通信协议类型（如 Modbus TCP、OPC UA 等）
-- ============================================================================
CREATE TABLE IF NOT EXISTS protocol_types (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 基本信息
    name VARCHAR(50) NOT NULL UNIQUE,              -- 协议内部名称（唯一，如 'modbus_tcp', 'opcua'）
    display_name VARCHAR(200) NOT NULL,            -- 显示名称（前端展示，如 'Modbus TCP', 'OPC UA'）
    enabled BOOLEAN NOT NULL DEFAULT 1,            -- 是否启用（1=启用，0=禁用）
    description TEXT NOT NULL DEFAULT '',          -- 描述信息
    
    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    
    -- 检查约束
    CHECK (enabled IN (0, 1))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_protocol_types_name ON protocol_types(name);
CREATE INDEX IF NOT EXISTS idx_protocol_types_enabled ON protocol_types(enabled);

-- ============================================================================
-- 2. 协议类型参数表 (protocol_type_params)
-- 用途：定义每个协议类型需要的配置参数（如 Modbus TCP 需要 ip、port、unit_id）
-- ============================================================================
CREATE TABLE IF NOT EXISTS protocol_type_params (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 关联信息
    protocol_type_id INTEGER NOT NULL,             -- 协议类型ID（外键关联 protocol_types.id）
    
    -- 参数基本信息
    param_name VARCHAR(100) NOT NULL,              -- 参数名称（如 'ip', 'port', 'unit_id'）
    display_name VARCHAR(200) NOT NULL,            -- 参数显示名称（前端展示，如 'IP地址', '端口', '站号'）
    data_type VARCHAR(20) NOT NULL,                -- 参数数据类型：string/integer/float/boolean/enum
    required BOOLEAN NOT NULL DEFAULT 1,           -- 是否必填（1=必填，0=可选）
    default_value TEXT,                            -- 默认值（JSON字符串或普通字符串）
    description TEXT NOT NULL DEFAULT '',          -- 参数描述
    
    -- 参数约束（JSON格式存储）
    constraints_json TEXT NOT NULL DEFAULT '{}',   -- 约束信息JSON（如枚举值、最小值、最大值、正则表达式等）
    
    -- 排序和显示
    order_index INTEGER NOT NULL DEFAULT 0,        -- 排序索引（用于前端表单排序）
    placeholder TEXT,                              -- 占位符文本（前端输入框提示）
    
    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    
    -- 外键约束
    FOREIGN KEY(protocol_type_id) REFERENCES protocol_types(id) ON DELETE CASCADE,
    
    -- 检查约束
    CHECK (data_type IN ('string', 'integer', 'float', 'boolean', 'enum')),
    CHECK (required IN (0, 1)),
    
    -- 唯一约束：同一协议类型下参数名唯一
    UNIQUE(protocol_type_id, param_name)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_protocol_type_params_protocol_type ON protocol_type_params(protocol_type_id);
CREATE INDEX IF NOT EXISTS idx_protocol_type_params_order ON protocol_type_params(protocol_type_id, order_index);

-- ============================================================================
-- 触发器：自动更新 updated_at 字段
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS update_protocol_types_timestamp
AFTER UPDATE ON protocol_types
FOR EACH ROW
BEGIN
    UPDATE protocol_types SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS update_protocol_type_params_timestamp
AFTER UPDATE ON protocol_type_params
FOR EACH ROW
BEGIN
    UPDATE protocol_type_params SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- ============================================================================
-- 3. 初始化默认协议类型数据
-- ============================================================================

-- Modbus TCP
INSERT INTO protocol_types (name, display_name, enabled, description) VALUES
('modbus_tcp', 'Modbus TCP', 1, 'Modbus TCP/IP 协议');

INSERT INTO protocol_type_params (protocol_type_id, param_name, display_name, data_type, required, default_value, description, constraints_json, order_index, placeholder) VALUES
((SELECT id FROM protocol_types WHERE name = 'modbus_tcp'), 'ip', 'IP地址', 'string', 1, '', '目标设备IP地址', '{"pattern": "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"}', 1, '例如：192.168.1.100'),
((SELECT id FROM protocol_types WHERE name = 'modbus_tcp'), 'port', '端口', 'integer', 1, '502', 'Modbus TCP端口，默认502', '{"min": 1, "max": 65535}', 2, '例如：502'),
((SELECT id FROM protocol_types WHERE name = 'modbus_tcp'), 'unit_id', '站号', 'integer', 1, '1', 'Modbus设备站号', '{"min": 0, "max": 255}', 3, '例如：1');

-- Modbus RTU
INSERT INTO protocol_types (name, display_name, enabled, description) VALUES
('modbus_rtu', 'Modbus RTU', 1, 'Modbus RTU 串口协议');

INSERT INTO protocol_type_params (protocol_type_id, param_name, display_name, data_type, required, default_value, description, constraints_json, order_index, placeholder) VALUES
((SELECT id FROM protocol_types WHERE name = 'modbus_rtu'), 'serial', '串口设备', 'string', 1, '', '串口设备路径（如 /dev/ttyS0, /dev/ttyUSB0）', '{}', 1, '例如：/dev/ttyS0'),
((SELECT id FROM protocol_types WHERE name = 'modbus_rtu'), 'baud', '波特率', 'integer', 1, '9600', '串口波特率', '{"enum": [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200]}', 2, '例如：9600'),
((SELECT id FROM protocol_types WHERE name = 'modbus_rtu'), 'parity', '校验位', 'string', 1, 'N', '奇偶校验（N/E/O）', '{"enum": ["N", "E", "O"]}', 3, 'N/E/O'),
((SELECT id FROM protocol_types WHERE name = 'modbus_rtu'), 'stop_bits', '停止位', 'integer', 1, '1', '停止位数', '{"enum": [1, 2]}', 4, '1或2'),
((SELECT id FROM protocol_types WHERE name = 'modbus_rtu'), 'unit_id', '站号', 'integer', 1, '1', 'Modbus设备站号', '{"min": 0, "max": 255}', 5, '例如：1');

-- Modbus ASCII
INSERT INTO protocol_types (name, display_name, enabled, description) VALUES
('modbus_ascii', 'Modbus ASCII', 1, 'Modbus ASCII 串口协议');

INSERT INTO protocol_type_params (protocol_type_id, param_name, display_name, data_type, required, default_value, description, constraints_json, order_index, placeholder) VALUES
((SELECT id FROM protocol_types WHERE name = 'modbus_ascii'), 'serial', '串口设备', 'string', 1, '', '串口设备路径', '{}', 1, '例如：/dev/ttyS0'),
((SELECT id FROM protocol_types WHERE name = 'modbus_ascii'), 'baud', '波特率', 'integer', 1, '9600', '串口波特率', '{"enum": [1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200]}', 2, '例如：9600'),
((SELECT id FROM protocol_types WHERE name = 'modbus_ascii'), 'parity', '校验位', 'string', 1, 'E', '奇偶校验（必须是E）', '{"enum": ["E"]}', 3, 'E'),
((SELECT id FROM protocol_types WHERE name = 'modbus_ascii'), 'stop_bits', '停止位', 'integer', 1, '1', '停止位数', '{"enum": [1]}', 4, '1'),
((SELECT id FROM protocol_types WHERE name = 'modbus_ascii'), 'unit_id', '站号', 'integer', 1, '1', 'Modbus设备站号', '{"min": 0, "max": 255}', 5, '例如：1');

-- OPC UA
INSERT INTO protocol_types (name, display_name, enabled, description) VALUES
('opcua', 'OPC UA', 1, 'OPC Unified Architecture 协议');

INSERT INTO protocol_type_params (protocol_type_id, param_name, display_name, data_type, required, default_value, description, constraints_json, order_index, placeholder) VALUES
((SELECT id FROM protocol_types WHERE name = 'opcua'), 'endpoint_url', '端点URL', 'string', 1, '', 'OPC UA服务器端点URL', '{"pattern": "^opc\\.tcp://.*"}', 1, '例如：opc.tcp://192.168.1.100:4840'),
((SELECT id FROM protocol_types WHERE name = 'opcua'), 'security_mode', '安全模式', 'string', 1, 'None', '安全模式', '{"enum": ["None", "Sign", "SignAndEncrypt"]}', 2, 'None/Sign/SignAndEncrypt'),
((SELECT id FROM protocol_types WHERE name = 'opcua'), 'security_policy', '安全策略', 'string', 1, 'None', '安全策略', '{"enum": ["None", "Basic128Rsa15", "Basic256", "Basic256Sha256"]}', 3, 'None/Basic128Rsa15/Basic256/Basic256Sha256');

-- MQTT
INSERT INTO protocol_types (name, display_name, enabled, description) VALUES
('mqtt', 'MQTT', 1, 'Message Queuing Telemetry Transport 协议');

INSERT INTO protocol_type_params (protocol_type_id, param_name, display_name, data_type, required, default_value, description, constraints_json, order_index, placeholder) VALUES
((SELECT id FROM protocol_types WHERE name = 'mqtt'), 'broker_host', 'Broker地址', 'string', 1, '', 'MQTT Broker主机地址', '{}', 1, '例如：192.168.1.100'),
((SELECT id FROM protocol_types WHERE name = 'mqtt'), 'broker_port', 'Broker端口', 'integer', 1, '1883', 'MQTT Broker端口，默认1883', '{"min": 1, "max": 65535}', 2, '例如：1883'),
((SELECT id FROM protocol_types WHERE name = 'mqtt'), 'topic', '主题', 'string', 1, '', '订阅/发布的主题（支持通配符）', '{}', 3, '例如：sensors/+/data'),
((SELECT id FROM protocol_types WHERE name = 'mqtt'), 'client_id', '客户端ID', 'string', 0, '', 'MQTT客户端ID（可选）', '{}', 4, '例如：gateway_01'),
((SELECT id FROM protocol_types WHERE name = 'mqtt'), 'username', '用户名', 'string', 0, '', 'MQTT认证用户名（可选）', '{}', 5, '例如：mqtt_user'),
((SELECT id FROM protocol_types WHERE name = 'mqtt'), 'password', '密码', 'string', 0, '', 'MQTT认证密码（可选）', '{}', 6, '例如：password123');

-- BACnet
INSERT INTO protocol_types (name, display_name, enabled, description) VALUES
('bacnet', 'BACnet', 1, 'Building Automation and Control Networks 协议');

INSERT INTO protocol_type_params (protocol_type_id, param_name, display_name, data_type, required, default_value, description, constraints_json, order_index, placeholder) VALUES
((SELECT id FROM protocol_types WHERE name = 'bacnet'), 'device_id', '设备ID', 'integer', 1, '', 'BACnet设备ID', '{"min": 0, "max": 4194303}', 1, '例如：1001'),
((SELECT id FROM protocol_types WHERE name = 'bacnet'), 'network_number', '网络号', 'integer', 1, '0', 'BACnet网络号', '{"min": 0, "max": 65535}', 2, '例如：0'),
((SELECT id FROM protocol_types WHERE name = 'bacnet'), 'mac_address', 'MAC地址', 'string', 1, '', '设备MAC地址或IP地址', '{}', 3, '例如：192.168.1.100');

-- DNP3
INSERT INTO protocol_types (name, display_name, enabled, description) VALUES
('dnp3', 'DNP3', 1, 'Distributed Network Protocol 3 协议');

INSERT INTO protocol_type_params (protocol_type_id, param_name, display_name, data_type, required, default_value, description, constraints_json, order_index, placeholder) VALUES
((SELECT id FROM protocol_types WHERE name = 'dnp3'), 'ip', 'IP地址', 'string', 1, '', '目标设备IP地址', '{"pattern": "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"}', 1, '例如：192.168.1.100'),
((SELECT id FROM protocol_types WHERE name = 'dnp3'), 'port', '端口', 'integer', 1, '20000', 'DNP3端口，默认20000', '{"min": 1, "max": 65535}', 2, '例如：20000'),
((SELECT id FROM protocol_types WHERE name = 'dnp3'), 'master_id', '主站ID', 'integer', 1, '1', 'DNP3主站ID', '{"min": 0, "max": 65535}', 3, '例如：1'),
((SELECT id FROM protocol_types WHERE name = 'dnp3'), 'outstation_id', '从站ID', 'integer', 1, '10', 'DNP3从站ID', '{"min": 0, "max": 65535}', 4, '例如：10');

-- IEC 104
INSERT INTO protocol_types (name, display_name, enabled, description) VALUES
('iec104', 'IEC 104', 1, 'IEC 60870-5-104 协议');

INSERT INTO protocol_type_params (protocol_type_id, param_name, display_name, data_type, required, default_value, description, constraints_json, order_index, placeholder) VALUES
((SELECT id FROM protocol_types WHERE name = 'iec104'), 'ip', 'IP地址', 'string', 1, '', '目标设备IP地址', '{"pattern": "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"}', 1, '例如：192.168.1.100'),
((SELECT id FROM protocol_types WHERE name = 'iec104'), 'port', '端口', 'integer', 1, '2404', 'IEC 104端口，默认2404', '{"min": 1, "max": 65535}', 2, '例如：2404'),
((SELECT id FROM protocol_types WHERE name = 'iec104'), 'common_address', '公共地址', 'integer', 1, '1', 'IEC 104公共地址（站地址）', '{"min": 1, "max": 65535}', 3, '例如：1'),
((SELECT id FROM protocol_types WHERE name = 'iec104'), 'ioa_start', '信息对象起始地址', 'integer', 1, '1', '信息对象起始地址', '{"min": 1, "max": 16777215}', 4, '例如：1');

-- ============================================================================
-- 脚本结束
-- ============================================================================

