-- ============================================================================
-- IIoT 配置示例数据
-- 参考 backend/device.md，包含：
--   * 设备类型 / 业务字段（覆盖 7 大 semantic_type）
--   * 点表模板与子点拆分
--   * 通信实例
--   * 资产、通信绑定以及资产映射
-- 用途：在清理数据库后快速恢复一套演示数据。
-- 使用方法：
--   sqlite3 data/app.db < backend/database/seed_iiot_demo_data.sql
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 兼容旧 schema：部分表的外键依赖 device_types_old
CREATE TABLE IF NOT EXISTS device_types_old (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    model TEXT NOT NULL DEFAULT '',
    manufacturer TEXT NOT NULL DEFAULT ''
);

BEGIN TRANSACTION;

-- 清空相关业务表，顺序：子表 -> 父表
DELETE FROM soe_events;
DELETE FROM template_mappings;
DELETE FROM asset_mappings;
DELETE FROM asset_comm_bindings;
DELETE FROM assets;
DELETE FROM comm_instances;
DELETE FROM point_table_points;
DELETE FROM point_table_templates;
DELETE FROM device_type_tags;
DELETE FROM device_types;
DELETE FROM device_types_old;

-- ============================================================================
-- 1. 设备类型（示例：B 型压缩机）
-- ============================================================================
INSERT INTO device_types (name, display_name, model, manufacturer, description)
VALUES
(
    'B_COMPRESSOR',
    'B型压缩机',
    'BC-500',
    'LCCU 工业控制',
    '示例压缩机设备类型，涵盖测量/状态/写指令/参数字段。'
),
(
    'COOLING_PUMP',
    '冷却循环泵',
    'CP-100',
    'LCCU 流体控制',
    '示例冷却泵设备类型，展示简化字段与共享模板能力。'
),
(
    'AIR_DRYER',
    '热再生干燥机',
    'AD-200',
    'LCCU 干燥',
    '示例压缩空气干燥机，展示 BITMASK 映射与覆盖。'
),
(
    'POWER_METER',
    '厂区电能表',
    'EM-500',
    'LCCU 能耗计量',
    '示例计量设备，补充电参量与设定写回。'
);

-- 同步到 device_types_old 以兼容旧外键
DELETE FROM device_types_old;
INSERT INTO device_types_old (id, name, display_name, description, created_at, updated_at, model, manufacturer)
SELECT id, name, display_name, description, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, model, manufacturer
FROM device_types;

-- ============================================================================
-- 2. 业务字段模板（覆盖 7 种 semantic_type）
-- ============================================================================
WITH comp AS (
    SELECT id FROM device_types WHERE name = 'B_COMPRESSOR'
),
pump AS (
    SELECT id FROM device_types WHERE name = 'COOLING_PUMP'
),
dryer AS (
    SELECT id FROM device_types WHERE name = 'AIR_DRYER'
),
meter AS (
    SELECT id FROM device_types WHERE name = 'POWER_METER'
)
INSERT INTO device_type_tags (
    device_type_id, tag_name, display_name, data_type, semantic_type,
    engineering_unit, group_name, severity, description, enum_json
) VALUES
((SELECT id FROM comp), 'RUN_MODE', '运行模式', 'ENUM', 'STATUS', '', '运行概览', 1,
 '0=停机,1=手动,2=自动', '{"0":"停机","1":"手动","2":"自动"}'),
((SELECT id FROM comp), 'ALM_OVER_TEMP', '超温报警', 'BOOL', 'STATUS', '', '报警', 3,
 '温度超限报警', '{}'),
((SELECT id FROM comp), 'ALM_LOW_PRESS', '低压报警', 'BOOL', 'STATUS', '', '报警', 3,
 '出口压力低报警', '{}'),
((SELECT id FROM comp), 'OUTLET_PRESSURE', '出口压力', 'FLOAT', 'MEASURE', 'bar', '工艺量', 0,
 '实时出口压力', '{}'),
((SELECT id FROM comp), 'MOTOR_CURRENT', '电机电流', 'FLOAT', 'MEASURE', 'A', '工艺量', 0,
 '变频器输出电流', '{}'),
((SELECT id FROM comp), 'VIB_A', 'A相振动', 'FLOAT', 'MEASURE', 'mm/s', '振动', 0,
 '振动传感器采集值', '{}'),
((SELECT id FROM comp), 'ENERGY_TOTAL', '累计产气量', 'FLOAT', 'ACCUM', 'Nm³', '统计', 0,
 '示例累积量字段', '{}'),
((SELECT id FROM comp), 'PROTECT_THRESHOLD', '保护门限', 'FLOAT', 'PARAM', '°C', '参数', 2,
 '设备当前保护门限（只读）', '{}'),
((SELECT id FROM comp), 'FREQ_SETPOINT', '频率设定', 'FLOAT', 'SETPOINT', 'Hz', '设定值', 2,
 '压缩机目标频率', '{}'),
((SELECT id FROM comp), 'CMD_START', '启动命令', 'BOOL', 'COMMAND', '', '命令', 4,
 '下发启动命令', '{}'),
((SELECT id FROM comp), 'CMD_STOP', '停止命令', 'BOOL', 'COMMAND', '', '命令', 4,
 '下发停止命令', '{}'),
((SELECT id FROM comp), 'PARAM_SET_PROTECT_THRESHOLD', '保护门限写入', 'FLOAT', 'PARAM_SET', '°C', '参数', 3,
 '写入新的保护门限', '{}'),
((SELECT id FROM pump), 'PUMP_STATUS', '泵状态', 'ENUM', 'STATUS', '', '运行概览', 1,
 '0=停机,1=运行,2=故障', '{"0":"停机","1":"运行","2":"故障"}'),
((SELECT id FROM pump), 'PUMP_ALARM', '泵故障报警', 'BOOL', 'STATUS', '', '报警', 4,
 '泵检测到故障', '{}'),
((SELECT id FROM pump), 'PUMP_FLOW', '循环流量', 'FLOAT', 'MEASURE', 'm³/h', '工艺量', 0,
 '冷却回路流量', '{}'),
((SELECT id FROM pump), 'PUMP_TEMP', '回水温度', 'FLOAT', 'MEASURE', '°C', '工艺量', 0,
 '回水温度读数', '{}'),
((SELECT id FROM pump), 'PUMP_SETPOINT', '目标流量', 'FLOAT', 'SETPOINT', 'm³/h', '设定值', 2,
 '冷却泵目标流量', '{}'),
((SELECT id FROM pump), 'PUMP_CMD_START', '泵启动命令', 'BOOL', 'COMMAND', '', '命令', 4,
 '启动冷却泵', '{}'),
((SELECT id FROM pump), 'PUMP_CMD_STOP', '泵停止命令', 'BOOL', 'COMMAND', '', '命令', 4,
 '停止冷却泵', '{}'),
((SELECT id FROM dryer), 'DRYER_RUN_MODE', '运行模式', 'ENUM', 'STATUS', '', '运行概览', 1,
 '0=停机,1=自动,2=手动', '{"0":"停机","1":"自动","2":"手动"}'),
((SELECT id FROM dryer), 'DRYER_ALM_DEWPOINT', '露点高报警', 'BOOL', 'STATUS', '', '报警', 3,
 '露点超限报警', '{}'),
((SELECT id FROM dryer), 'DRYER_DEWPOINT', '出口露点', 'FLOAT', 'MEASURE', '°C', '工艺量', 0,
 '出口露点测量', '{}'),
((SELECT id FROM dryer), 'DRYER_RUNTIME_HOURS', '运行小时数', 'FLOAT', 'ACCUM', 'h', '统计', 0,
 '累计运行小时', '{}'),
((SELECT id FROM dryer), 'DRYER_SETPOINT_TEMP', '再生温度设定', 'FLOAT', 'SETPOINT', '°C', '设定值', 2,
 '再生温度目标', '{}'),
((SELECT id FROM dryer), 'DRYER_CMD_RESET', '故障复位命令', 'BOOL', 'COMMAND', '', '命令', 4,
 '远程故障复位', '{}'),
((SELECT id FROM dryer), 'DRYER_PARAM_PRESSURE_LIMIT', '压力保护门限', 'FLOAT', 'PARAM', 'bar', '参数', 2,
 '只读压力保护门限', '{}'),
((SELECT id FROM dryer), 'DRYER_PARAM_SET_PRESSURE_LIMIT', '写入压力保护门限', 'FLOAT', 'PARAM_SET', 'bar', '参数', 3,
 '写入新的压力保护门限', '{}'),
((SELECT id FROM meter), 'MTR_RUN_STATUS', '表计运行状态', 'ENUM', 'STATUS', '', '运行概览', 1,
 '0=正常,1=告警,2=维护', '{"0":"正常","1":"告警","2":"维护"}'),
((SELECT id FROM meter), 'MTR_ACTIVE_POWER', '有功功率', 'FLOAT', 'MEASURE', 'kW', '工艺量', 0,
 '三相总有功', '{}'),
((SELECT id FROM meter), 'MTR_REACTIVE_POWER', '无功功率', 'FLOAT', 'MEASURE', 'kVar', '工艺量', 0,
 '三相总无功', '{}'),
((SELECT id FROM meter), 'MTR_VOLTAGE', '线电压', 'FLOAT', 'MEASURE', 'V', '工艺量', 0,
 '三相平均线电压', '{}'),
((SELECT id FROM meter), 'MTR_CURRENT', '线电流', 'FLOAT', 'MEASURE', 'A', '工艺量', 0,
 '三相平均线电流', '{}'),
((SELECT id FROM meter), 'MTR_ENERGY_TOTAL', '累计电量', 'FLOAT', 'ACCUM', 'kWh', '统计', 0,
 '总电量', '{}'),
((SELECT id FROM meter), 'MTR_PARAM_CT_RATIO', 'CT 变比', 'FLOAT', 'PARAM', '', '参数', 1,
 '当前互感器变比', '{}'),
((SELECT id FROM meter), 'MTR_SET_DEMAND_LIMIT', '需量限值', 'FLOAT', 'SETPOINT', 'kW', '设定值', 2,
 '需量控制限值', '{}'),
((SELECT id FROM meter), 'MTR_CMD_RESET_ALARM', '告警复位', 'BOOL', 'COMMAND', '', '命令', 3,
 '远程复位', '{}'),
((SELECT id FROM meter), 'MTR_PARAM_SET_CT_RATIO', '写入 CT 变比', 'FLOAT', 'PARAM_SET', '', '参数', 3,
 '写入新的互感器变比', '{}');

-- ============================================================================
-- 3. 点表模板
-- ============================================================================
INSERT INTO point_table_templates (name, display_name, protocol_type, description) VALUES
('COMP_MODBUS_V1', '压缩机 PLC 点表 (Modbus TCP)', 'modbus_tcp', '涵盖状态字、压力、命令与参数寄存器'),
('VFD_MODBUS_V1', '变频器点表 (Modbus RTU)', 'modbus_rtu', '提供电机电流测量'),
('VIB_TCP_V1', '振动监测点表 (TCP)', 'tcp_custom', '振动传感器专有协议'),
('PUMP_MODBUS_V1', '冷却泵点表 (Modbus TCP)', 'modbus_tcp', '展示另一套模板'),
('ENV_SENSOR_V1', '换热器环境点表 (Modbus RTU)', 'modbus_rtu', '附加温度/流量读数'),
('DRYER_MODBUS_V1', '干燥机点表 (Modbus TCP)', 'modbus_tcp', '展示 BITMASK 映射'),
('METER_MODBUS_V1', '电能表点表 (Modbus TCP)', 'modbus_tcp', '三相电参数与设定写回');

-- ============================================================================
-- 4. 点表点及子点拆分
-- ============================================================================
WITH comp_tpl AS (SELECT id FROM point_table_templates WHERE name = 'COMP_MODBUS_V1')
INSERT INTO point_table_points (
    point_table_id, point_name, display_name, address, io_type, raw_type,
    byte_order, scale_k, scale_b, parse_rules_json, description
) VALUES
((SELECT id FROM comp_tpl), 'StatusWord4', '状态字4', '40010', 'DI', 'BITFIELD16',
 'BE', 1.0, 0.0,
 '{"sub_points":[{"name":"mode_code","type":"UINT","kind":"BITS_RANGE","bit_from":0,"bit_to":1},{"name":"high_temp_bit","type":"BOOL","kind":"BIT","bit":2},{"name":"low_press_bit","type":"BOOL","kind":"BIT","bit":3}]}',
 '运行模式+报警定义'),
((SELECT id FROM comp_tpl), 'OutletPressure', '出口压力原始值', '40001', 'AI', 'INT16',
 'BE', 0.1, 0.0, '{}', 'kx+b 转 bar'),
((SELECT id FROM comp_tpl), 'EnergyTotal', '累计产气量', '40005', 'AI', 'INT32',
 'BE_SWAP', 1.0, 0.0, '{}', '示例累积量'),
((SELECT id FROM comp_tpl), 'CmdWord', '命令字', '40020', 'DO', 'BITFIELD16',
 'BE', 1.0, 0.0,
 '{"sub_points":[{"name":"cmd_start_bit","type":"BOOL","kind":"BIT","bit":0},{"name":"cmd_stop_bit","type":"BOOL","kind":"BIT","bit":1}]}',
 '启动/停止命令位'),
((SELECT id FROM comp_tpl), 'FreqSetReg', '频率设定寄存器', '40025', 'AO', 'INT16',
 'BE', 0.1, 0.0, '{}', 'Hz 设定写入'),
((SELECT id FROM comp_tpl), 'ParamReadback', '保护门限读数', '40030', 'AI', 'INT16',
 'BE', 1.0, 0.0, '{}', '保护门限只读值'),
((SELECT id FROM comp_tpl), 'ParamSetReg', '保护门限写寄存器', '40031', 'AO', 'INT16',
 'BE', 1.0, 0.0, '{}', '写参数使用');

WITH vfd_tpl AS (SELECT id FROM point_table_templates WHERE name = 'VFD_MODBUS_V1')
INSERT INTO point_table_points (
    point_table_id, point_name, display_name, address, io_type, raw_type,
    byte_order, scale_k, scale_b, parse_rules_json, description
) VALUES
((SELECT id FROM vfd_tpl), 'MotorCurrentRaw', '变频器电流', '30001', 'AI', 'INT16',
 'BE', 0.1, 0.0, '{}', '电流 A');

WITH vib_tpl AS (SELECT id FROM point_table_templates WHERE name = 'VIB_TCP_V1')
INSERT INTO point_table_points (
    point_table_id, point_name, display_name, address, io_type, raw_type,
    byte_order, scale_k, scale_b, parse_rules_json, description
) VALUES
((SELECT id FROM vib_tpl), 'VibA', 'A相振动', '0x01', 'AI', 'FLOAT32',
 'BE', 1.0, 0.0, '{}', '专有协议寄存器');

WITH pump_tpl AS (SELECT id FROM point_table_templates WHERE name = 'PUMP_MODBUS_V1')
INSERT INTO point_table_points (
    point_table_id, point_name, display_name, address, io_type, raw_type,
    byte_order, scale_k, scale_b, parse_rules_json, description
) VALUES
((SELECT id FROM pump_tpl), 'PumpStatusWord', '泵状态字', '41000', 'DI', 'BITFIELD16',
 'BE', 1.0, 0.0,
 '{"sub_points":[{"name":"status_code","type":"UINT","kind":"BITS_RANGE","bit_from":0,"bit_to":1},{"name":"fault_bit","type":"BOOL","kind":"BIT","bit":3}]}',
 '泵运行状态+报警'),
((SELECT id FROM pump_tpl), 'PumpFlow', '泵流量', '41002', 'AI', 'INT16',
 'BE', 0.5, 0.0, '{}', 'm³/h'),
((SELECT id FROM pump_tpl), 'PumpTemp', '回水温度', '41003', 'AI', 'INT16',
 'BE', 0.1, 0.0, '{}', '°C'),
((SELECT id FROM pump_tpl), 'PumpSetpointReg', '泵目标流量寄存器', '41010', 'AO', 'INT16',
 'BE', 0.5, 0.0, '{}', '写入设定'),
((SELECT id FROM pump_tpl), 'PumpCmdWord', '泵命令字', '41015', 'DO', 'BITFIELD16',
 'BE', 1.0, 0.0,
 '{"sub_points":[{"name":"pump_start_bit","type":"BOOL","kind":"BIT","bit":0},{"name":"pump_stop_bit","type":"BOOL","kind":"BIT","bit":1}]}',
 '泵启停命令');

WITH env_tpl AS (SELECT id FROM point_table_templates WHERE name = 'ENV_SENSOR_V1')
INSERT INTO point_table_points (
    point_table_id, point_name, display_name, address, io_type, raw_type,
    byte_order, scale_k, scale_b, parse_rules_json, description
) VALUES
((SELECT id FROM env_tpl), 'ReturnTemp', '回水温度传感器', '50001', 'AI', 'FLOAT32',
 'BE', 1.0, 0.0, '{}', '备用温度'),
((SELECT id FROM env_tpl), 'FlowMeter', '回路流量计', '50005', 'AI', 'FLOAT32',
 'BE', 1.0, 0.0, '{}', '备用流量');

WITH dryer_tpl AS (SELECT id FROM point_table_templates WHERE name = 'DRYER_MODBUS_V1')
INSERT INTO point_table_points (
    point_table_id, point_name, display_name, address, io_type, raw_type,
    byte_order, scale_k, scale_b, parse_rules_json, description
) VALUES
((SELECT id FROM dryer_tpl), 'DryerStatusWord', '干燥机状态字', '42000', 'DI', 'BITFIELD16',
 'BE', 1.0, 0.0,
 '{"sub_points":[{"name":"mode_code","type":"UINT","kind":"BITS_RANGE","bit_from":0,"bit_to":1},{"name":"dewpoint_alarm_bit","type":"BOOL","kind":"BIT","bit":4},{"name":"heater_on_bit","type":"BOOL","kind":"BIT","bit":5}]}',
 '模式/报警/加热状态'),
((SELECT id FROM dryer_tpl), 'DewPoint', '出口露点', '42002', 'AI', 'INT16',
 'BE', 0.1, 0.0, '{}', '露点测量'),
((SELECT id FROM dryer_tpl), 'RunHours', '运行小时数', '42004', 'AI', 'INT32',
 'BE_SWAP', 0.1, 0.0, '{}', '累计运行时间'),
((SELECT id FROM dryer_tpl), 'TempSetReg', '再生温度设定', '42006', 'AO', 'INT16',
 'BE', 0.1, 0.0, '{}', '温度设定写入'),
((SELECT id FROM dryer_tpl), 'PressureLimitRead', '压力门限读数', '42008', 'AI', 'INT16',
 'BE', 0.1, 0.0, '{}', '保护门限只读'),
((SELECT id FROM dryer_tpl), 'PressureLimitSet', '压力门限写入', '42009', 'AO', 'INT16',
 'BE', 0.1, 0.0, '{}', '保护门限写入'),
((SELECT id FROM dryer_tpl), 'CmdWord', '干燥机命令字', '42012', 'DO', 'BITFIELD16',
 'BE', 1.0, 0.0,
 '{"sub_points":[{"name":"reset_cmd_bit","type":"BOOL","kind":"BIT","bit":0},{"name":"bypass_cmd_bit","type":"BOOL","kind":"BIT","bit":1}]}',
 '复位/旁路命令');

WITH meter_tpl AS (SELECT id FROM point_table_templates WHERE name = 'METER_MODBUS_V1')
INSERT INTO point_table_points (
    point_table_id, point_name, display_name, address, io_type, raw_type,
    byte_order, scale_k, scale_b, parse_rules_json, description
) VALUES
((SELECT id FROM meter_tpl), 'StatusWord', '表计状态字', '61000', 'DI', 'BITFIELD16',
 'BE', 1.0, 0.0,
 '{"sub_points":[{"name":"run_code","type":"UINT","kind":"BITS_RANGE","bit_from":0,"bit_to":1},{"name":"alarm_bit","type":"BOOL","kind":"BIT","bit":3}]}',
 '运行/报警状态'),
((SELECT id FROM meter_tpl), 'ActivePower', '有功功率', '61002', 'AI', 'INT32',
 'BE_SWAP', 0.1, 0.0, '{}', 'kW'),
((SELECT id FROM meter_tpl), 'ReactivePower', '无功功率', '61004', 'AI', 'INT32',
 'BE_SWAP', 0.1, 0.0, '{}', 'kVar'),
((SELECT id FROM meter_tpl), 'Voltage', '线电压', '61006', 'AI', 'INT16',
 'BE', 0.1, 0.0, '{}', 'V'),
((SELECT id FROM meter_tpl), 'Current', '线电流', '61008', 'AI', 'INT16',
 'BE', 0.01, 0.0, '{}', 'A'),
((SELECT id FROM meter_tpl), 'EnergyTotal', '累计电量', '61010', 'AI', 'INT32',
 'BE_SWAP', 0.1, 0.0, '{}', 'kWh'),
((SELECT id FROM meter_tpl), 'DemandLimitReg', '需量限值寄存器', '61014', 'AO', 'INT16',
 'BE', 0.1, 0.0, '{}', '需量设定'),
((SELECT id FROM meter_tpl), 'CtRatioRead', 'CT 变比读取', '61018', 'AI', 'INT16',
 'BE', 1.0, 0.0, '{}', 'CT 变比读数'),
((SELECT id FROM meter_tpl), 'CtRatioSet', 'CT 变比写入', '61019', 'AO', 'INT16',
 'BE', 1.0, 0.0, '{}', 'CT 变比写入'),
((SELECT id FROM meter_tpl), 'CtrlCmdWord', '控制命令字', '61025', 'DO', 'BITFIELD16',
 'BE', 1.0, 0.0,
 '{"sub_points":[{"name":"reset_alarm_bit","type":"BOOL","kind":"BIT","bit":0}]}',
 '告警复位命令');

-- ============================================================================
-- 5. 通信实例
-- ============================================================================
INSERT INTO comm_instances (
    name, display_name, enabled, point_table_id, protocol_type,
    protocol_config, polling_interval_ms, timeout_ms, retries
)
SELECT 'PLC-01', '北区 PLC-01', 1, id, 'modbus_tcp',
       '{"ip":"192.168.10.11","port":502,"unit_id":1}', 1000, 500, 2
FROM point_table_templates WHERE name = 'COMP_MODBUS_V1';

INSERT INTO comm_instances (
    name, display_name, enabled, point_table_id, protocol_type,
    protocol_config, polling_interval_ms, timeout_ms, retries
)
SELECT 'PLC-02', '南区 PLC-02', 1, id, 'modbus_tcp',
       '{"ip":"192.168.20.11","port":502,"unit_id":2}', 1200, 600, 2
FROM point_table_templates WHERE name = 'COMP_MODBUS_V1';

INSERT INTO comm_instances (
    name, display_name, enabled, point_table_id, protocol_type,
    protocol_config, polling_interval_ms, timeout_ms, retries
)
SELECT 'VFD-33', '变频器 33 号', 1, id, 'modbus_rtu',
       '{"serial":"/dev/ttyS1","baud":19200,"parity":"N","stop_bits":1,"unit_id":33}', 1000, 600, 2
FROM point_table_templates WHERE name = 'VFD_MODBUS_V1';

INSERT INTO comm_instances (
    name, display_name, enabled, point_table_id, protocol_type,
    protocol_config, polling_interval_ms, timeout_ms, retries
)
SELECT 'VFD-44', '变频器 44 号', 1, id, 'modbus_rtu',
       '{"serial":"/dev/ttyS2","baud":9600,"parity":"E","stop_bits":1,"unit_id":44}', 1500, 800, 3
FROM point_table_templates WHERE name = 'VFD_MODBUS_V1';

INSERT INTO comm_instances (
    name, display_name, enabled, point_table_id, protocol_type,
    protocol_config, polling_interval_ms, timeout_ms, retries
)
SELECT 'VIB-12', '振动传感器 12 号', 1, id, 'tcp_custom',
       '{"ip":"192.168.10.50","port":9000}', 2000, 800, 1
FROM point_table_templates WHERE name = 'VIB_TCP_V1';

INSERT INTO comm_instances (
    name, display_name, enabled, point_table_id, protocol_type,
    protocol_config, polling_interval_ms, timeout_ms, retries
)
SELECT 'VIB-21', '振动传感器 21 号', 1, id, 'tcp_custom',
       '{"ip":"192.168.20.60","port":9100}', 2500, 900, 1
FROM point_table_templates WHERE name = 'VIB_TCP_V1';

INSERT INTO comm_instances (
    name, display_name, enabled, point_table_id, protocol_type,
    protocol_config, polling_interval_ms, timeout_ms, retries
)
SELECT 'PUMP-01', '冷却泵控制器', 1, id, 'modbus_tcp',
       '{"ip":"192.168.30.5","port":502,"unit_id":5}', 1000, 500, 2
FROM point_table_templates WHERE name = 'PUMP_MODBUS_V1';

INSERT INTO comm_instances (
    name, display_name, enabled, point_table_id, protocol_type,
    protocol_config, polling_interval_ms, timeout_ms, retries
)
SELECT 'ENV-01', '换热器监测', 1, id, 'modbus_rtu',
       '{"serial":"/dev/ttyUSB0","baud":19200,"parity":"N","stop_bits":1,"unit_id":60}', 3000, 1000, 1
FROM point_table_templates WHERE name = 'ENV_SENSOR_V1';

INSERT INTO comm_instances (
    name, display_name, enabled, point_table_id, protocol_type,
    protocol_config, polling_interval_ms, timeout_ms, retries
)
SELECT 'PLC-03', '东区 PLC-03', 1, id, 'modbus_tcp',
       '{"ip":"192.168.30.11","port":502,"unit_id":3}', 1400, 600, 2
FROM point_table_templates WHERE name = 'COMP_MODBUS_V1';

INSERT INTO comm_instances (
    name, display_name, enabled, point_table_id, protocol_type,
    protocol_config, polling_interval_ms, timeout_ms, retries
)
SELECT 'VFD-55', '变频器 55 号', 1, id, 'modbus_rtu',
       '{"serial":"/dev/ttyS3","baud":9600,"parity":"N","stop_bits":1,"unit_id":55}', 1600, 700, 2
FROM point_table_templates WHERE name = 'VFD_MODBUS_V1';

INSERT INTO comm_instances (
    name, display_name, enabled, point_table_id, protocol_type,
    protocol_config, polling_interval_ms, timeout_ms, retries
)
SELECT 'VIB-30', '振动传感器 30 号', 1, id, 'tcp_custom',
       '{"ip":"192.168.30.70","port":9200}', 2200, 900, 1
FROM point_table_templates WHERE name = 'VIB_TCP_V1';

INSERT INTO comm_instances (
    name, display_name, enabled, point_table_id, protocol_type,
    protocol_config, polling_interval_ms, timeout_ms, retries
)
SELECT 'PUMP-02', '冷却泵控制器 02', 1, id, 'modbus_tcp',
       '{"ip":"192.168.30.6","port":502,"unit_id":6}', 1100, 600, 2
FROM point_table_templates WHERE name = 'PUMP_MODBUS_V1';

INSERT INTO comm_instances (
    name, display_name, enabled, point_table_id, protocol_type,
    protocol_config, polling_interval_ms, timeout_ms, retries
)
SELECT 'ENV-02', '换热器监测 02', 1, id, 'modbus_rtu',
       '{"serial":"/dev/ttyUSB1","baud":19200,"parity":"N","stop_bits":1,"unit_id":61}', 3200, 1000, 1
FROM point_table_templates WHERE name = 'ENV_SENSOR_V1';

INSERT INTO comm_instances (
    name, display_name, enabled, point_table_id, protocol_type,
    protocol_config, polling_interval_ms, timeout_ms, retries
)
SELECT 'DRYER-01', '主线干燥机', 1, id, 'modbus_tcp',
       '{"ip":"192.168.40.10","port":502,"unit_id":10}', 1500, 700, 2
FROM point_table_templates WHERE name = 'DRYER_MODBUS_V1';

INSERT INTO comm_instances (
    name, display_name, enabled, point_table_id, protocol_type,
    protocol_config, polling_interval_ms, timeout_ms, retries
)
SELECT 'DRYER-02', '备用干燥机', 1, id, 'modbus_tcp',
       '{"ip":"192.168.40.11","port":502,"unit_id":11}', 1600, 700, 2
FROM point_table_templates WHERE name = 'DRYER_MODBUS_V1';

INSERT INTO comm_instances (
    name, display_name, enabled, point_table_id, protocol_type,
    protocol_config, polling_interval_ms, timeout_ms, retries
)
SELECT 'METER-01', '厂区总表', 1, id, 'modbus_tcp',
       '{"ip":"192.168.50.2","port":502,"unit_id":1}', 2000, 800, 2
FROM point_table_templates WHERE name = 'METER_MODBUS_V1';

INSERT INTO comm_instances (
    name, display_name, enabled, point_table_id, protocol_type,
    protocol_config, polling_interval_ms, timeout_ms, retries
)
SELECT 'METER-02', '车间支路表', 1, id, 'modbus_tcp',
       '{"ip":"192.168.50.3","port":502,"unit_id":2}', 2200, 900, 2
FROM point_table_templates WHERE name = 'METER_MODBUS_V1';

-- ============================================================================
-- 6. 资产及通信绑定
-- ============================================================================
INSERT INTO assets (name, display_name, device_type_id, location, enabled, metadata_json)
SELECT 'NORTH_COMP_01', '北区1号压缩机', id, '北区厂房', 1,
       '{"rated_power_kw":500,"notes":"示例资产"}'
FROM device_types WHERE name = 'B_COMPRESSOR';

INSERT INTO assets (name, display_name, device_type_id, location, enabled, metadata_json)
SELECT 'SOUTH_COMP_02', '南区2号压缩机', id, '南区厂房', 1,
       '{"rated_power_kw":450,"notes":"双通信实例示例"}'
FROM device_types WHERE name = 'B_COMPRESSOR';

INSERT INTO assets (name, display_name, device_type_id, location, enabled, metadata_json)
SELECT 'COOL_PUMP_01', '冷却循环泵', id, '冷却水站', 1,
       '{"loop":"HX-01","notes":"泵设备模板示例"}'
FROM device_types WHERE name = 'COOLING_PUMP';

INSERT INTO assets (name, display_name, device_type_id, location, enabled, metadata_json)
SELECT 'EAST_COMP_03', '东区3号压缩机', id, '东区厂房', 1,
       '{"rated_power_kw":420,"notes":"多资产示例"}'
FROM device_types WHERE name = 'B_COMPRESSOR';

INSERT INTO assets (name, display_name, device_type_id, location, enabled, metadata_json)
SELECT 'COOL_PUMP_02', '冷却循环泵 2', id, '冷却水站', 1,
       '{"loop":"HX-02","notes":"第二路冷却"}'
FROM device_types WHERE name = 'COOLING_PUMP';

INSERT INTO assets (name, display_name, device_type_id, location, enabled, metadata_json)
SELECT 'AIR_DRYER_MAIN', '主线干燥机', id, '压缩空气站', 1,
       '{"dewpoint_target":"-20°C","notes":"主干线"}'
FROM device_types WHERE name = 'AIR_DRYER';

INSERT INTO assets (name, display_name, device_type_id, location, enabled, metadata_json)
SELECT 'AIR_DRYER_BACKUP', '备用干燥机', id, '压缩空气站', 1,
       '{"dewpoint_target":"-18°C","notes":"备用"}'
FROM device_types WHERE name = 'AIR_DRYER';

INSERT INTO assets (name, display_name, device_type_id, location, enabled, metadata_json)
SELECT 'PLANT_METER_MAIN', '厂区总电表', id, '高压配电室', 1,
       '{"voltage_level":"10kV","notes":"总计量"}'
FROM device_types WHERE name = 'POWER_METER';

INSERT INTO assets (name, display_name, device_type_id, location, enabled, metadata_json)
SELECT 'PLANT_METER_BRANCH', '车间支路表', id, '生产车间', 1,
       '{"voltage_level":"0.4kV","notes":"支路计量"}'
FROM device_types WHERE name = 'POWER_METER';

WITH asset AS (
    SELECT id FROM assets WHERE name = 'NORTH_COMP_01'
)
INSERT INTO asset_comm_bindings (asset_id, instance_id)
SELECT (SELECT id FROM asset), ci.id
FROM comm_instances ci
WHERE ci.name IN ('PLC-01', 'VFD-33', 'VIB-12');

WITH asset AS (
    SELECT id FROM assets WHERE name = 'SOUTH_COMP_02'
)
INSERT INTO asset_comm_bindings (asset_id, instance_id)
SELECT (SELECT id FROM asset), ci.id
FROM comm_instances ci
WHERE ci.name IN ('PLC-02', 'VFD-44', 'VIB-21');

WITH asset AS (
    SELECT id FROM assets WHERE name = 'COOL_PUMP_01'
)
INSERT INTO asset_comm_bindings (asset_id, instance_id)
SELECT (SELECT id FROM asset), ci.id
FROM comm_instances ci
WHERE ci.name IN ('PUMP-01', 'ENV-01');

WITH asset AS (
    SELECT id FROM assets WHERE name = 'EAST_COMP_03'
)
INSERT INTO asset_comm_bindings (asset_id, instance_id)
SELECT (SELECT id FROM asset), ci.id
FROM comm_instances ci
WHERE ci.name IN ('PLC-03', 'VFD-55', 'VIB-30');

WITH asset AS (
    SELECT id FROM assets WHERE name = 'COOL_PUMP_02'
)
INSERT INTO asset_comm_bindings (asset_id, instance_id)
SELECT (SELECT id FROM asset), ci.id
FROM comm_instances ci
WHERE ci.name IN ('PUMP-02', 'ENV-02');

WITH asset AS (
    SELECT id FROM assets WHERE name = 'AIR_DRYER_MAIN'
)
INSERT INTO asset_comm_bindings (asset_id, instance_id)
SELECT (SELECT id FROM asset), ci.id
FROM comm_instances ci
WHERE ci.name IN ('DRYER-01');

WITH asset AS (
    SELECT id FROM assets WHERE name = 'AIR_DRYER_BACKUP'
)
INSERT INTO asset_comm_bindings (asset_id, instance_id)
SELECT (SELECT id FROM asset), ci.id
FROM comm_instances ci
WHERE ci.name IN ('DRYER-02');

WITH asset AS (
    SELECT id FROM assets WHERE name = 'PLANT_METER_MAIN'
)
INSERT INTO asset_comm_bindings (asset_id, instance_id)
SELECT (SELECT id FROM asset), ci.id
FROM comm_instances ci
WHERE ci.name IN ('METER-01');

WITH asset AS (
    SELECT id FROM assets WHERE name = 'PLANT_METER_BRANCH'
)
INSERT INTO asset_comm_bindings (asset_id, instance_id)
SELECT (SELECT id FROM asset), ci.id
FROM comm_instances ci
WHERE ci.name IN ('METER-02');

-- ============================================================================
-- 7. 模板映射示例（供自动映射使用，可根据实例覆盖）
-- ============================================================================
WITH comp_type AS (SELECT id FROM device_types WHERE name = 'B_COMPRESSOR'),
     comp_tpl   AS (SELECT id FROM point_table_templates WHERE name = 'COMP_MODBUS_V1'),
     vfd_tpl    AS (SELECT id FROM point_table_templates WHERE name = 'VFD_MODBUS_V1')
INSERT INTO template_mappings (
    device_type_id, point_table_id, asset_tag_name, point_name,
    binding_kind, bit_index, bit_mask, bit_shift, enum_json
) VALUES
((SELECT id FROM comp_type), (SELECT id FROM comp_tpl), 'OUTLET_PRESSURE', 'OutletPressure',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM comp_type), (SELECT id FROM comp_tpl), 'RUN_MODE', 'StatusWord4.mode_code',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM comp_type), (SELECT id FROM comp_tpl), 'ALM_OVER_TEMP', 'StatusWord4.high_temp_bit',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM comp_type), (SELECT id FROM comp_tpl), 'ALM_LOW_PRESS', 'StatusWord4.low_press_bit',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM comp_type), (SELECT id FROM comp_tpl), 'CMD_START', 'CmdWord.cmd_start_bit',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM comp_type), (SELECT id FROM comp_tpl), 'CMD_STOP', 'CmdWord.cmd_stop_bit',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM comp_type), (SELECT id FROM comp_tpl), 'FREQ_SETPOINT', 'FreqSetReg',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM comp_type), (SELECT id FROM comp_tpl), 'PROTECT_THRESHOLD', 'ParamReadback',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM comp_type), (SELECT id FROM comp_tpl), 'PARAM_SET_PROTECT_THRESHOLD', 'ParamSetReg',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM comp_type), (SELECT id FROM vfd_tpl), 'MOTOR_CURRENT', 'MotorCurrentRaw',
 'DIRECT', NULL, NULL, NULL, '{}');

WITH pump_type AS (SELECT id FROM device_types WHERE name = 'COOLING_PUMP'),
     pump_tpl   AS (SELECT id FROM point_table_templates WHERE name = 'PUMP_MODBUS_V1'),
     env_tpl    AS (SELECT id FROM point_table_templates WHERE name = 'ENV_SENSOR_V1')
INSERT INTO template_mappings (
    device_type_id, point_table_id, asset_tag_name, point_name,
    binding_kind, bit_index, bit_mask, bit_shift, enum_json
) VALUES
((SELECT id FROM pump_type), (SELECT id FROM pump_tpl), 'PUMP_STATUS', 'PumpStatusWord.status_code',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM pump_type), (SELECT id FROM pump_tpl), 'PUMP_ALARM', 'PumpStatusWord.fault_bit',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM pump_type), (SELECT id FROM pump_tpl), 'PUMP_FLOW', 'PumpFlow',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM pump_type), (SELECT id FROM env_tpl), 'PUMP_TEMP', 'ReturnTemp',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM pump_type), (SELECT id FROM pump_tpl), 'PUMP_SETPOINT', 'PumpSetpointReg',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM pump_type), (SELECT id FROM pump_tpl), 'PUMP_CMD_START', 'PumpCmdWord.pump_start_bit',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM pump_type), (SELECT id FROM pump_tpl), 'PUMP_CMD_STOP', 'PumpCmdWord.pump_stop_bit',
 'DIRECT', NULL, NULL, NULL, '{}');

WITH dryer_type AS (SELECT id FROM device_types WHERE name = 'AIR_DRYER'),
     dryer_tpl   AS (SELECT id FROM point_table_templates WHERE name = 'DRYER_MODBUS_V1')
INSERT INTO template_mappings (
    device_type_id, point_table_id, asset_tag_name, point_name,
    binding_kind, bit_index, bit_mask, bit_shift, enum_json
) VALUES
((SELECT id FROM dryer_type), (SELECT id FROM dryer_tpl), 'DRYER_RUN_MODE', 'DryerStatusWord.mode_code',
 'BITMASK_ENUM', NULL, 3, 0, '{"0":"停机","1":"自动","2":"手动"}'),
((SELECT id FROM dryer_type), (SELECT id FROM dryer_tpl), 'DRYER_ALM_DEWPOINT', 'DryerStatusWord.dewpoint_alarm_bit',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM dryer_type), (SELECT id FROM dryer_tpl), 'DRYER_DEWPOINT', 'DewPoint',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM dryer_type), (SELECT id FROM dryer_tpl), 'DRYER_RUNTIME_HOURS', 'RunHours',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM dryer_type), (SELECT id FROM dryer_tpl), 'DRYER_SETPOINT_TEMP', 'TempSetReg',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM dryer_type), (SELECT id FROM dryer_tpl), 'DRYER_CMD_RESET', 'CmdWord.reset_cmd_bit',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM dryer_type), (SELECT id FROM dryer_tpl), 'DRYER_PARAM_PRESSURE_LIMIT', 'PressureLimitRead',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM dryer_type), (SELECT id FROM dryer_tpl), 'DRYER_PARAM_SET_PRESSURE_LIMIT', 'PressureLimitSet',
 'DIRECT', NULL, NULL, NULL, '{}');

WITH meter_type AS (SELECT id FROM device_types WHERE name = 'POWER_METER'),
     meter_tpl  AS (SELECT id FROM point_table_templates WHERE name = 'METER_MODBUS_V1')
INSERT INTO template_mappings (
    device_type_id, point_table_id, asset_tag_name, point_name,
    binding_kind, bit_index, bit_mask, bit_shift, enum_json
) VALUES
((SELECT id FROM meter_type), (SELECT id FROM meter_tpl), 'MTR_RUN_STATUS', 'StatusWord.run_code',
 'BITMASK_ENUM', NULL, 3, 0, '{"0":"正常","1":"告警","2":"维护"}'),
((SELECT id FROM meter_type), (SELECT id FROM meter_tpl), 'MTR_ACTIVE_POWER', 'ActivePower',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM meter_type), (SELECT id FROM meter_tpl), 'MTR_REACTIVE_POWER', 'ReactivePower',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM meter_type), (SELECT id FROM meter_tpl), 'MTR_VOLTAGE', 'Voltage',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM meter_type), (SELECT id FROM meter_tpl), 'MTR_CURRENT', 'Current',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM meter_type), (SELECT id FROM meter_tpl), 'MTR_ENERGY_TOTAL', 'EnergyTotal',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM meter_type), (SELECT id FROM meter_tpl), 'MTR_PARAM_CT_RATIO', 'CtRatioRead',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM meter_type), (SELECT id FROM meter_tpl), 'MTR_SET_DEMAND_LIMIT', 'DemandLimitReg',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM meter_type), (SELECT id FROM meter_tpl), 'MTR_CMD_RESET_ALARM', 'CtrlCmdWord.reset_alarm_bit',
 'DIRECT', NULL, NULL, NULL, '{}'),
((SELECT id FROM meter_type), (SELECT id FROM meter_tpl), 'MTR_PARAM_SET_CT_RATIO', 'CtRatioSet',
 'DIRECT', NULL, NULL, NULL, '{}');

-- ============================================================================
-- 8. 资产映射（含 DIRECT/BITMASK 覆盖）
-- 兼容当前 schema（asset_mappings 仅包含 asset_id/asset_tag_name/instance_id/point_name/is_overridden）
-- ============================================================================
WITH asset AS (SELECT id FROM assets WHERE name = 'NORTH_COMP_01'),
     plc   AS (SELECT id FROM comm_instances WHERE name = 'PLC-01'),
     vfd   AS (SELECT id FROM comm_instances WHERE name = 'VFD-33'),
     vib   AS (SELECT id FROM comm_instances WHERE name = 'VIB-12')
INSERT INTO asset_mappings (
    asset_id, asset_tag_name, instance_id, point_name, is_overridden
) VALUES
((SELECT id FROM asset), 'OUTLET_PRESSURE', (SELECT id FROM plc), 'OutletPressure', 0),
((SELECT id FROM asset), 'ENERGY_TOTAL', (SELECT id FROM plc), 'EnergyTotal', 0),
((SELECT id FROM asset), 'RUN_MODE', (SELECT id FROM plc), 'StatusWord4.mode_code', 0),
((SELECT id FROM asset), 'ALM_OVER_TEMP', (SELECT id FROM plc), 'StatusWord4.high_temp_bit', 0),
((SELECT id FROM asset), 'ALM_LOW_PRESS', (SELECT id FROM plc), 'StatusWord4.low_press_bit', 0),
((SELECT id FROM asset), 'CMD_START', (SELECT id FROM plc), 'CmdWord.cmd_start_bit', 0),
((SELECT id FROM asset), 'CMD_STOP', (SELECT id FROM plc), 'CmdWord.cmd_stop_bit', 0),
((SELECT id FROM asset), 'FREQ_SETPOINT', (SELECT id FROM plc), 'FreqSetReg', 0),
((SELECT id FROM asset), 'PROTECT_THRESHOLD', (SELECT id FROM plc), 'ParamReadback', 0),
((SELECT id FROM asset), 'PARAM_SET_PROTECT_THRESHOLD', (SELECT id FROM plc), 'ParamSetReg', 0),
((SELECT id FROM asset), 'MOTOR_CURRENT', (SELECT id FROM vfd), 'MotorCurrentRaw', 0),
((SELECT id FROM asset), 'VIB_A', (SELECT id FROM vib), 'VibA', 0);

WITH asset AS (SELECT id FROM assets WHERE name = 'SOUTH_COMP_02'),
     plc   AS (SELECT id FROM comm_instances WHERE name = 'PLC-02'),
     vfd   AS (SELECT id FROM comm_instances WHERE name = 'VFD-44'),
     vib   AS (SELECT id FROM comm_instances WHERE name = 'VIB-21')
INSERT INTO asset_mappings (
    asset_id, asset_tag_name, instance_id, point_name, is_overridden
) VALUES
((SELECT id FROM asset), 'OUTLET_PRESSURE', (SELECT id FROM plc), 'OutletPressure', 0),
((SELECT id FROM asset), 'ENERGY_TOTAL', (SELECT id FROM plc), 'EnergyTotal', 0),
((SELECT id FROM asset), 'RUN_MODE', (SELECT id FROM plc), 'StatusWord4.mode_code', 0),
((SELECT id FROM asset), 'ALM_OVER_TEMP', (SELECT id FROM plc), 'StatusWord4.high_temp_bit', 0),
((SELECT id FROM asset), 'ALM_LOW_PRESS', (SELECT id FROM plc), 'StatusWord4.low_press_bit', 0),
((SELECT id FROM asset), 'CMD_START', (SELECT id FROM plc), 'CmdWord.cmd_start_bit', 0),
((SELECT id FROM asset), 'CMD_STOP', (SELECT id FROM plc), 'CmdWord.cmd_stop_bit', 0),
((SELECT id FROM asset), 'FREQ_SETPOINT', (SELECT id FROM plc), 'FreqSetReg', 0),
((SELECT id FROM asset), 'PROTECT_THRESHOLD', (SELECT id FROM plc), 'ParamReadback', 0),
((SELECT id FROM asset), 'PARAM_SET_PROTECT_THRESHOLD', (SELECT id FROM plc), 'ParamSetReg', 0),
((SELECT id FROM asset), 'MOTOR_CURRENT', (SELECT id FROM vfd), 'MotorCurrentRaw', 0),
((SELECT id FROM asset), 'VIB_A', (SELECT id FROM vib), 'VibA', 0);

WITH asset AS (SELECT id FROM assets WHERE name = 'COOL_PUMP_01'),
     pump_inst AS (SELECT id FROM comm_instances WHERE name = 'PUMP-01'),
     env_inst  AS (SELECT id FROM comm_instances WHERE name = 'ENV-01')
INSERT INTO asset_mappings (
    asset_id, asset_tag_name, instance_id, point_name, is_overridden
) VALUES
((SELECT id FROM asset), 'PUMP_STATUS', (SELECT id FROM pump_inst), 'PumpStatusWord.status_code', 0),
((SELECT id FROM asset), 'PUMP_ALARM', (SELECT id FROM pump_inst), 'PumpStatusWord.fault_bit', 0),
((SELECT id FROM asset), 'PUMP_FLOW', (SELECT id FROM pump_inst), 'PumpFlow', 0),
((SELECT id FROM asset), 'PUMP_TEMP', (SELECT id FROM env_inst), 'ReturnTemp', 0),
((SELECT id FROM asset), 'PUMP_SETPOINT', (SELECT id FROM pump_inst), 'PumpSetpointReg', 0),
((SELECT id FROM asset), 'PUMP_CMD_START', (SELECT id FROM pump_inst), 'PumpCmdWord.pump_start_bit', 0),
((SELECT id FROM asset), 'PUMP_CMD_STOP', (SELECT id FROM pump_inst), 'PumpCmdWord.pump_stop_bit', 0);

WITH asset AS (SELECT id FROM assets WHERE name = 'EAST_COMP_03'),
     plc   AS (SELECT id FROM comm_instances WHERE name = 'PLC-03'),
     vfd   AS (SELECT id FROM comm_instances WHERE name = 'VFD-55'),
     vib   AS (SELECT id FROM comm_instances WHERE name = 'VIB-30')
INSERT INTO asset_mappings (
    asset_id, asset_tag_name, instance_id, point_name, is_overridden
) VALUES
((SELECT id FROM asset), 'OUTLET_PRESSURE', (SELECT id FROM plc), 'OutletPressure', 0),
((SELECT id FROM asset), 'ENERGY_TOTAL', (SELECT id FROM plc), 'EnergyTotal', 0),
((SELECT id FROM asset), 'RUN_MODE', (SELECT id FROM plc), 'StatusWord4.mode_code', 0),
((SELECT id FROM asset), 'ALM_OVER_TEMP', (SELECT id FROM plc), 'StatusWord4.high_temp_bit', 0),
((SELECT id FROM asset), 'ALM_LOW_PRESS', (SELECT id FROM plc), 'StatusWord4.low_press_bit', 0),
((SELECT id FROM asset), 'CMD_START', (SELECT id FROM plc), 'CmdWord.cmd_start_bit', 0),
((SELECT id FROM asset), 'CMD_STOP', (SELECT id FROM plc), 'CmdWord.cmd_stop_bit', 0),
((SELECT id FROM asset), 'FREQ_SETPOINT', (SELECT id FROM plc), 'FreqSetReg', 1),
((SELECT id FROM asset), 'PROTECT_THRESHOLD', (SELECT id FROM plc), 'ParamReadback', 0),
((SELECT id FROM asset), 'PARAM_SET_PROTECT_THRESHOLD', (SELECT id FROM plc), 'ParamSetReg', 0),
((SELECT id FROM asset), 'MOTOR_CURRENT', (SELECT id FROM vfd), 'MotorCurrentRaw', 0),
((SELECT id FROM asset), 'VIB_A', (SELECT id FROM vib), 'VibA', 0);

WITH asset AS (SELECT id FROM assets WHERE name = 'COOL_PUMP_02'),
     pump_inst AS (SELECT id FROM comm_instances WHERE name = 'PUMP-02'),
     env_inst  AS (SELECT id FROM comm_instances WHERE name = 'ENV-02')
INSERT INTO asset_mappings (
    asset_id, asset_tag_name, instance_id, point_name, is_overridden
) VALUES
((SELECT id FROM asset), 'PUMP_STATUS', (SELECT id FROM pump_inst), 'PumpStatusWord.status_code', 0),
((SELECT id FROM asset), 'PUMP_ALARM', (SELECT id FROM pump_inst), 'PumpStatusWord.fault_bit', 0),
((SELECT id FROM asset), 'PUMP_FLOW', (SELECT id FROM pump_inst), 'PumpFlow', 0),
((SELECT id FROM asset), 'PUMP_TEMP', (SELECT id FROM env_inst), 'ReturnTemp', 0),
((SELECT id FROM asset), 'PUMP_SETPOINT', (SELECT id FROM pump_inst), 'PumpSetpointReg', 1),
((SELECT id FROM asset), 'PUMP_CMD_START', (SELECT id FROM pump_inst), 'PumpCmdWord.pump_start_bit', 0),
((SELECT id FROM asset), 'PUMP_CMD_STOP', (SELECT id FROM pump_inst), 'PumpCmdWord.pump_stop_bit', 0);

WITH asset AS (SELECT id FROM assets WHERE name = 'AIR_DRYER_MAIN'),
     dryer AS (SELECT id FROM comm_instances WHERE name = 'DRYER-01')
INSERT INTO asset_mappings (
    asset_id, asset_tag_name, instance_id, point_name, is_overridden
) VALUES
((SELECT id FROM asset), 'DRYER_RUN_MODE', (SELECT id FROM dryer), 'DryerStatusWord.mode_code', 0),
((SELECT id FROM asset), 'DRYER_ALM_DEWPOINT', (SELECT id FROM dryer), 'DryerStatusWord.dewpoint_alarm_bit', 0),
((SELECT id FROM asset), 'DRYER_DEWPOINT', (SELECT id FROM dryer), 'DewPoint', 0),
((SELECT id FROM asset), 'DRYER_RUNTIME_HOURS', (SELECT id FROM dryer), 'RunHours', 0),
((SELECT id FROM asset), 'DRYER_SETPOINT_TEMP', (SELECT id FROM dryer), 'TempSetReg', 0),
((SELECT id FROM asset), 'DRYER_CMD_RESET', (SELECT id FROM dryer), 'CmdWord.reset_cmd_bit', 0),
((SELECT id FROM asset), 'DRYER_PARAM_PRESSURE_LIMIT', (SELECT id FROM dryer), 'PressureLimitRead', 0),
((SELECT id FROM asset), 'DRYER_PARAM_SET_PRESSURE_LIMIT', (SELECT id FROM dryer), 'PressureLimitSet', 0);

WITH asset AS (SELECT id FROM assets WHERE name = 'AIR_DRYER_BACKUP'),
     dryer AS (SELECT id FROM comm_instances WHERE name = 'DRYER-02')
INSERT INTO asset_mappings (
    asset_id, asset_tag_name, instance_id, point_name, is_overridden
) VALUES
((SELECT id FROM asset), 'DRYER_RUN_MODE', (SELECT id FROM dryer), 'DryerStatusWord.mode_code', 1),
((SELECT id FROM asset), 'DRYER_ALM_DEWPOINT', (SELECT id FROM dryer), 'DryerStatusWord.dewpoint_alarm_bit', 0),
((SELECT id FROM asset), 'DRYER_DEWPOINT', (SELECT id FROM dryer), 'DewPoint', 0),
((SELECT id FROM asset), 'DRYER_RUNTIME_HOURS', (SELECT id FROM dryer), 'RunHours', 0),
((SELECT id FROM asset), 'DRYER_SETPOINT_TEMP', (SELECT id FROM dryer), 'TempSetReg', 1),
((SELECT id FROM asset), 'DRYER_CMD_RESET', (SELECT id FROM dryer), 'CmdWord.reset_cmd_bit', 0),
((SELECT id FROM asset), 'DRYER_PARAM_PRESSURE_LIMIT', (SELECT id FROM dryer), 'PressureLimitRead', 0),
((SELECT id FROM asset), 'DRYER_PARAM_SET_PRESSURE_LIMIT', (SELECT id FROM dryer), 'PressureLimitSet', 0);

WITH asset AS (SELECT id FROM assets WHERE name = 'PLANT_METER_MAIN'),
     meter AS (SELECT id FROM comm_instances WHERE name = 'METER-01')
INSERT INTO asset_mappings (
    asset_id, asset_tag_name, instance_id, point_name, is_overridden
) VALUES
((SELECT id FROM asset), 'MTR_RUN_STATUS', (SELECT id FROM meter), 'StatusWord.run_code', 0),
((SELECT id FROM asset), 'MTR_ACTIVE_POWER', (SELECT id FROM meter), 'ActivePower', 0),
((SELECT id FROM asset), 'MTR_REACTIVE_POWER', (SELECT id FROM meter), 'ReactivePower', 0),
((SELECT id FROM asset), 'MTR_VOLTAGE', (SELECT id FROM meter), 'Voltage', 0),
((SELECT id FROM asset), 'MTR_CURRENT', (SELECT id FROM meter), 'Current', 0),
((SELECT id FROM asset), 'MTR_ENERGY_TOTAL', (SELECT id FROM meter), 'EnergyTotal', 0),
((SELECT id FROM asset), 'MTR_PARAM_CT_RATIO', (SELECT id FROM meter), 'CtRatioRead', 0),
((SELECT id FROM asset), 'MTR_SET_DEMAND_LIMIT', (SELECT id FROM meter), 'DemandLimitReg', 0),
((SELECT id FROM asset), 'MTR_CMD_RESET_ALARM', (SELECT id FROM meter), 'CtrlCmdWord.reset_alarm_bit', 0),
((SELECT id FROM asset), 'MTR_PARAM_SET_CT_RATIO', (SELECT id FROM meter), 'CtRatioSet', 0);

WITH asset AS (SELECT id FROM assets WHERE name = 'PLANT_METER_BRANCH'),
     meter AS (SELECT id FROM comm_instances WHERE name = 'METER-02')
INSERT INTO asset_mappings (
    asset_id, asset_tag_name, instance_id, point_name, is_overridden
) VALUES
((SELECT id FROM asset), 'MTR_RUN_STATUS', (SELECT id FROM meter), 'StatusWord.run_code', 1),
((SELECT id FROM asset), 'MTR_ACTIVE_POWER', (SELECT id FROM meter), 'ActivePower', 0),
((SELECT id FROM asset), 'MTR_REACTIVE_POWER', (SELECT id FROM meter), 'ReactivePower', 0),
((SELECT id FROM asset), 'MTR_VOLTAGE', (SELECT id FROM meter), 'Voltage', 0),
((SELECT id FROM asset), 'MTR_CURRENT', (SELECT id FROM meter), 'Current', 0),
((SELECT id FROM asset), 'MTR_ENERGY_TOTAL', (SELECT id FROM meter), 'EnergyTotal', 0),
((SELECT id FROM asset), 'MTR_PARAM_CT_RATIO', (SELECT id FROM meter), 'CtRatioRead', 0),
((SELECT id FROM asset), 'MTR_SET_DEMAND_LIMIT', (SELECT id FROM meter), 'DemandLimitReg', 1),
((SELECT id FROM asset), 'MTR_CMD_RESET_ALARM', (SELECT id FROM meter), 'CtrlCmdWord.reset_alarm_bit', 0),
((SELECT id FROM asset), 'MTR_PARAM_SET_CT_RATIO', (SELECT id FROM meter), 'CtRatioSet', 0);

-- ============================================================================
-- 9. 示例 SOE 数据（覆盖各业务字段）
-- ============================================================================
WITH north AS (SELECT id FROM assets WHERE name = 'NORTH_COMP_01'),
     south AS (SELECT id FROM assets WHERE name = 'SOUTH_COMP_02'),
     pump  AS (SELECT id FROM assets WHERE name = 'COOL_PUMP_01'),
     plc1  AS (SELECT id FROM comm_instances WHERE name = 'PLC-01'),
     plc2  AS (SELECT id FROM comm_instances WHERE name = 'PLC-02'),
     pump_ci AS (SELECT id FROM comm_instances WHERE name = 'PUMP-01'),
     east  AS (SELECT id FROM assets WHERE name = 'EAST_COMP_03'),
     pump2 AS (SELECT id FROM assets WHERE name = 'COOL_PUMP_02'),
     dryer_main AS (SELECT id FROM assets WHERE name = 'AIR_DRYER_MAIN'),
     dryer_backup AS (SELECT id FROM assets WHERE name = 'AIR_DRYER_BACKUP'),
     meter_main AS (SELECT id FROM assets WHERE name = 'PLANT_METER_MAIN'),
     meter_branch AS (SELECT id FROM assets WHERE name = 'PLANT_METER_BRANCH'),
     plc3 AS (SELECT id FROM comm_instances WHERE name = 'PLC-03'),
     pump_ci2 AS (SELECT id FROM comm_instances WHERE name = 'PUMP-02'),
     dryer_ci1 AS (SELECT id FROM comm_instances WHERE name = 'DRYER-01'),
     dryer_ci2 AS (SELECT id FROM comm_instances WHERE name = 'DRYER-02'),
     meter_ci1 AS (SELECT id FROM comm_instances WHERE name = 'METER-01'),
     meter_ci2 AS (SELECT id FROM comm_instances WHERE name = 'METER-02')
INSERT INTO soe_events (
    asset_id, asset_tag_name, event_type, severity,
    value_num, value_text, source_instance_id, source_point_name, extra_json
) VALUES
((SELECT id FROM north), 'RUN_MODE', 'STATE_CHANGE', 1, NULL, '自动 → 手动',
 (SELECT id FROM plc1), 'StatusWord4.mode_code', '{"operator":"demo"}'),
((SELECT id FROM north), 'ALM_OVER_TEMP', 'ALARM_ON', 3, NULL, '出口温度高',
 (SELECT id FROM plc1), 'StatusWord4.high_temp_bit', '{}'),
((SELECT id FROM north), 'ALM_LOW_PRESS', 'ALARM_OFF', 3, NULL, '低压恢复',
 (SELECT id FROM plc1), 'StatusWord4.low_press_bit', '{}'),
((SELECT id FROM north), 'FREQ_SETPOINT', 'SETPOINT_CHANGE', 2, 48.0, '设定 45 → 48 Hz',
 (SELECT id FROM plc1), 'FreqSetReg', '{"operator":"demo"}'),
((SELECT id FROM north), 'CMD_START', 'CMD_SENT', 4, NULL, '发送启动命令',
 (SELECT id FROM plc1), 'CmdWord.cmd_start_bit', '{}'),
((SELECT id FROM north), 'PROTECT_THRESHOLD', 'PARAM_CHANGE', 2, 85.0, '保护门限 80 → 85 °C',
 (SELECT id FROM plc1), 'ParamSetReg', '{}'),
((SELECT id FROM north), 'ENERGY_TOTAL', 'STATE_CHANGE', 0, 123456.0, '累计产气量更新',
 (SELECT id FROM plc1), 'EnergyTotal', '{}'),
((SELECT id FROM north), 'MOTOR_CURRENT', 'STATE_CHANGE', 0, 37.5, '电流 37.5 A',
 (SELECT id FROM comm_instances WHERE name = 'VFD-33'), 'MotorCurrentRaw', '{"unit":"A"}'),
((SELECT id FROM north), 'VIB_A', 'STATE_CHANGE', 0, 6.2, '振动 6.2 mm/s',
 (SELECT id FROM comm_instances WHERE name = 'VIB-12'), 'VibA', '{"unit":"mm/s"}'),
((SELECT id FROM south), 'RUN_MODE', 'STATE_CHANGE', 1, NULL, '停机 → 自动',
 (SELECT id FROM plc2), 'StatusWord4.mode_code', '{}'),
((SELECT id FROM south), 'ALM_OVER_TEMP', 'ALARM_ON', 3, NULL, '南区温度超限',
 (SELECT id FROM plc2), 'StatusWord4.high_temp_bit', '{}'),
((SELECT id FROM south), 'FREQ_SETPOINT', 'SETPOINT_CHANGE', 2, 50.0, '设定 47 → 50 Hz',
 (SELECT id FROM plc2), 'FreqSetReg', '{}'),
((SELECT id FROM south), 'PROTECT_THRESHOLD', 'PARAM_CHANGE', 2, 90.0, '保护门限 88 → 90 °C',
 (SELECT id FROM plc2), 'ParamSetReg', '{}'),
((SELECT id FROM south), 'ENERGY_TOTAL', 'STATE_CHANGE', 0, 98234.0, '累计产气量更新',
 (SELECT id FROM plc2), 'EnergyTotal', '{}'),
((SELECT id FROM south), 'MOTOR_CURRENT', 'STATE_CHANGE', 0, 41.0, '电流 41.0 A',
 (SELECT id FROM comm_instances WHERE name = 'VFD-44'), 'MotorCurrentRaw', '{"unit":"A"}'),
((SELECT id FROM south), 'VIB_A', 'STATE_CHANGE', 0, 5.5, '振动 5.5 mm/s',
 (SELECT id FROM comm_instances WHERE name = 'VIB-21'), 'VibA', '{"unit":"mm/s"}'),
((SELECT id FROM pump), 'PUMP_STATUS', 'STATE_CHANGE', 1, NULL, '停机 → 运行',
 (SELECT id FROM pump_ci), 'PumpStatusWord.status_code', '{}'),
((SELECT id FROM pump), 'PUMP_ALARM', 'ALARM_ON', 4, NULL, '泵低流量报警',
 (SELECT id FROM pump_ci), 'PumpStatusWord.fault_bit', '{}'),
((SELECT id FROM pump), 'PUMP_SETPOINT', 'SETPOINT_CHANGE', 2, 120.0, '设定 100 → 120 m³/h',
 (SELECT id FROM pump_ci), 'PumpSetpointReg', '{}'),
((SELECT id FROM pump), 'PUMP_FLOW', 'STATE_CHANGE', 0, 118.5, '流量 118.5 m³/h',
 (SELECT id FROM pump_ci), 'PumpFlow', '{"unit":"m3/h"}'),
((SELECT id FROM pump), 'PUMP_TEMP', 'STATE_CHANGE', 0, 36.5, '回水温度 36.5 °C',
 (SELECT id FROM comm_instances WHERE name = 'ENV-01'), 'ReturnTemp', '{"unit":"°C"}'),
((SELECT id FROM pump), 'PUMP_CMD_START', 'CMD_SENT', 4, NULL, '下发启动命令',
 (SELECT id FROM pump_ci), 'PumpCmdWord.pump_start_bit', '{}'),
((SELECT id FROM pump), 'PUMP_CMD_STOP', 'CMD_SENT', 4, NULL, '下发停止命令',
 (SELECT id FROM pump_ci), 'PumpCmdWord.pump_stop_bit', '{}'),
((SELECT id FROM east), 'RUN_MODE', 'STATE_CHANGE', 1, NULL, '手动 → 自动',
 (SELECT id FROM plc3), 'StatusWord4.mode_code', '{}'),
((SELECT id FROM east), 'FREQ_SETPOINT', 'SETPOINT_CHANGE', 2, 46.0, '设定 44 → 46 Hz',
 (SELECT id FROM plc3), 'FreqSetReg', '{}'),
((SELECT id FROM east), 'ALM_LOW_PRESS', 'ALARM_ON', 3, NULL, '东区出口压力低',
 (SELECT id FROM plc3), 'StatusWord4.low_press_bit', '{}'),
((SELECT id FROM east), 'MOTOR_CURRENT', 'STATE_CHANGE', 0, 36.2, '电流 36.2 A',
 (SELECT id FROM comm_instances WHERE name = 'VFD-55'), 'MotorCurrentRaw', '{"unit":"A"}'),
((SELECT id FROM east), 'VIB_A', 'STATE_CHANGE', 0, 4.8, '振动 4.8 mm/s',
 (SELECT id FROM comm_instances WHERE name = 'VIB-30'), 'VibA', '{"unit":"mm/s"}'),
((SELECT id FROM pump2), 'PUMP_STATUS', 'STATE_CHANGE', 1, NULL, '运行 → 变频调节',
 (SELECT id FROM pump_ci2), 'PumpStatusWord.status_code', '{}'),
((SELECT id FROM pump2), 'PUMP_SETPOINT', 'SETPOINT_CHANGE', 2, 115.0, '设定 110 → 115 m³/h',
 (SELECT id FROM pump_ci2), 'PumpSetpointReg', '{}'),
((SELECT id FROM pump2), 'PUMP_ALARM', 'ALARM_OFF', 4, NULL, '泵故障解除',
 (SELECT id FROM pump_ci2), 'PumpStatusWord.fault_bit', '{}'),
((SELECT id FROM pump2), 'PUMP_TEMP', 'STATE_CHANGE', 0, 35.2, '回水温度 35.2 °C',
 (SELECT id FROM comm_instances WHERE name = 'ENV-02'), 'ReturnTemp', '{"unit":"°C"}'),
((SELECT id FROM pump2), 'PUMP_CMD_START', 'CMD_SENT', 4, NULL, '发送第二路泵启动',
 (SELECT id FROM pump_ci2), 'PumpCmdWord.pump_start_bit', '{}'),
((SELECT id FROM dryer_main), 'DRYER_RUN_MODE', 'STATE_CHANGE', 1, NULL, '停机 → 自动',
 (SELECT id FROM dryer_ci1), 'DryerStatusWord.mode_code', '{"operator":"demo"}'),
((SELECT id FROM dryer_main), 'DRYER_ALM_DEWPOINT', 'ALARM_ON', 3, NULL, '露点高报警',
 (SELECT id FROM dryer_ci1), 'DryerStatusWord.dewpoint_alarm_bit', '{}'),
((SELECT id FROM dryer_main), 'DRYER_SETPOINT_TEMP', 'SETPOINT_CHANGE', 2, 185.0, '再生温度 180 → 185 °C',
 (SELECT id FROM dryer_ci1), 'TempSetReg', '{}'),
((SELECT id FROM dryer_main), 'DRYER_CMD_RESET', 'CMD_SENT', 4, NULL, '下发干燥机复位',
 (SELECT id FROM dryer_ci1), 'CmdWord.reset_cmd_bit', '{"operator":"demo"}'),
((SELECT id FROM dryer_main), 'DRYER_PARAM_PRESSURE_LIMIT', 'PARAM_CHANGE', 2, 7.5, '压力门限 7.0 → 7.5 bar',
 (SELECT id FROM dryer_ci1), 'PressureLimitSet', '{}'),
((SELECT id FROM dryer_backup), 'DRYER_RUN_MODE', 'STATE_CHANGE', 1, NULL, '手动 → 自动',
 (SELECT id FROM dryer_ci2), 'DryerStatusWord.mode_code', '{}'),
((SELECT id FROM dryer_backup), 'DRYER_DEWPOINT', 'STATE_CHANGE', 0, -19.5, '露点 -19.5 °C',
 (SELECT id FROM dryer_ci2), 'DewPoint', '{}'),
((SELECT id FROM dryer_backup), 'DRYER_SETPOINT_TEMP', 'SETPOINT_CHANGE', 2, 170.0, '再生温度 165 → 170 °C',
 (SELECT id FROM dryer_ci2), 'TempSetReg', '{"operator":"shift_b"}'),
((SELECT id FROM meter_main), 'MTR_RUN_STATUS', 'STATE_CHANGE', 1, NULL, '正常 → 告警',
 (SELECT id FROM meter_ci1), 'StatusWord.run_code', '{}'),
((SELECT id FROM meter_main), 'MTR_ACTIVE_POWER', 'STATE_CHANGE', 0, 820.5, '有功 820.5 kW',
 (SELECT id FROM meter_ci1), 'ActivePower', '{"unit":"kW"}'),
((SELECT id FROM meter_main), 'MTR_SET_DEMAND_LIMIT', 'SETPOINT_CHANGE', 2, 900.0, '需量限值 850 → 900 kW',
 (SELECT id FROM meter_ci1), 'DemandLimitReg', '{}'),
((SELECT id FROM meter_main), 'MTR_CMD_RESET_ALARM', 'CMD_SENT', 3, NULL, '发送电表告警复位',
 (SELECT id FROM meter_ci1), 'CtrlCmdWord.reset_alarm_bit', '{}'),
((SELECT id FROM meter_main), 'MTR_PARAM_CT_RATIO', 'PARAM_CHANGE', 1, 1200.0, 'CT 变比 1000 → 1200',
 (SELECT id FROM meter_ci1), 'CtRatioSet', '{}'),
((SELECT id FROM meter_branch), 'MTR_RUN_STATUS', 'STATE_CHANGE', 1, NULL, '维护 → 正常',
 (SELECT id FROM meter_ci2), 'StatusWord.run_code', '{}'),
((SELECT id FROM meter_branch), 'MTR_ENERGY_TOTAL', 'STATE_CHANGE', 0, 20345.0, '累计电量刷新',
 (SELECT id FROM meter_ci2), 'EnergyTotal', '{"unit":"kWh"}'),
((SELECT id FROM meter_branch), 'MTR_SET_DEMAND_LIMIT', 'SETPOINT_CHANGE', 2, 120.0, '需量限值 100 → 120 kW',
 (SELECT id FROM meter_ci2), 'DemandLimitReg', '{}'),
((SELECT id FROM meter_branch), 'MTR_CMD_RESET_ALARM', 'CMD_SENT', 3, NULL, '支路电表告警复位',
 (SELECT id FROM meter_ci2), 'CtrlCmdWord.reset_alarm_bit', '{}');

COMMIT;

-- 验证输出（可选）
SELECT '设备类型数量:' AS label, COUNT(*) AS value FROM device_types;
SELECT '业务字段数量:' AS label, COUNT(*) AS value FROM device_type_tags;
SELECT '点表模板数量:' AS label, COUNT(*) AS value FROM point_table_templates;
SELECT '通信实例数量:' AS label, COUNT(*) AS value FROM comm_instances;
SELECT '资产数量:' AS label, COUNT(*) AS value FROM assets;
SELECT '资产映射数量:' AS label, COUNT(*) AS value FROM asset_mappings;
SELECT 'SOE 记录数量:' AS label, COUNT(*) AS value FROM soe_events;

