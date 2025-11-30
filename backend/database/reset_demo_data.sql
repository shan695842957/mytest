-- ============================================================================
-- 重置并导入完整的模拟数据
-- 步骤：清空旧数据 → 插入设备类型 → 插入模板和实例
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- 第1步：清空设备相关数据（保留用户和审计日志）
-- ============================================================================

DELETE FROM mapping_instance;
DELETE FROM device_comm_binding;
DELETE FROM device_point;
DELETE FROM device;
DELETE FROM template_mapping;
DELETE FROM decoder_output_template;
DELETE FROM comm_point_template;
DELETE FROM comm_template;
DELETE FROM comm_channel;
DELETE FROM template_point;
DELETE FROM device_template;
DELETE FROM device_type;

-- ============================================================================
-- 第2步：插入设备类型（8种）
-- ============================================================================

INSERT INTO device_type (type_code, name_zh, name_en, description, is_active, created_by) VALUES
('PCS', '储能变流器', 'Power Conversion System', '双向变流器，实现交直流转换', 1, 1),
('BMS', '电池管理系统', 'Battery Management System', '电池状态监控与保护', 1, 1),
('Battery', '电池簇', 'Battery Cluster', '储能电池组', 1, 1),
('Aircon', '空调', 'Air Conditioner', '温控设备', 1, 1),
('Meter', '电能表', 'Energy Meter', '电能计量设备', 1, 1),
('Transformer', '变压器', 'Transformer', '电压变换设备', 1, 1),
('Inverter', '逆变器', 'Inverter', '直流转交流设备', 1, 1),
('Grid', '电网接入', 'Grid Connection', '电网接入点', 1, 1);

-- ============================================================================
-- 第3步：插入设备模板和点位（使用正确的 type_code）
-- ============================================================================

-- 3.1 PCS 模板
INSERT INTO device_template (template_code, vendor, model, device_class, version, description, created_by)
VALUES ('PCS_SG100_v1', '阳光电源', 'SG100KTL', 'PCS', 'v1.0', '100kW 储能变流器', 1);

-- PCS 模板点位（7种类型共41个点）
INSERT INTO template_point (template_id, point_key, display_name, signal_kind, data_type, unit, writable, description, created_by) VALUES 
-- measurement (9个)
(1, 'measurement.active_power', '有功功率', 'measurement', 'float', 'kW', 0, 'AC侧有功功率', 1),
(1, 'measurement.reactive_power', '无功功率', 'measurement', 'float', 'kVar', 0, 'AC侧无功功率', 1),
(1, 'measurement.dc_voltage', '直流电压', 'measurement', 'float', 'V', 0, 'DC侧电压', 1),
(1, 'measurement.dc_current', '直流电流', 'measurement', 'float', 'A', 0, 'DC侧电流', 1),
(1, 'measurement.ac_voltage', '交流电压', 'measurement', 'float', 'V', 0, 'AC侧电压', 1),
(1, 'measurement.ac_current', '交流电流', 'measurement', 'float', 'A', 0, 'AC侧电流', 1),
(1, 'measurement.frequency', '频率', 'measurement', 'float', 'Hz', 0, '电网频率', 1),
(1, 'measurement.temperature', '温度', 'measurement', 'float', '℃', 0, '设备温度', 1),
(1, 'measurement.efficiency', '转换效率', 'measurement', 'float', '%', 0, '实时效率', 1),
-- status (8个)
(1, 'status.main_breaker', '主断路器', 'status', 'bool', NULL, 0, '主断路器状态', 1),
(1, 'status.dc_breaker', '直流断路器', 'status', 'bool', NULL, 0, 'DC断路器状态', 1),
(1, 'status.ac_breaker', '交流断路器', 'status', 'bool', NULL, 0, 'AC断路器状态', 1),
(1, 'status.fan_running', '风扇运行', 'status', 'bool', NULL, 0, '风扇运行状态', 1),
(1, 'status.alarm_active', '告警激活', 'status', 'bool', NULL, 0, '设备告警状态', 1),
(1, 'status.running_mode', '运行模式', 'status', 'string', NULL, 0, '充电/放电/待机', 1),
(1, 'status.grid_connected', '并网状态', 'status', 'bool', NULL, 0, '电网连接状态', 1),
(1, 'status.emergency_stop', '急停状态', 'status', 'bool', NULL, 0, '紧急停机状态', 1),
-- counter (6个)
(1, 'counter.charge_energy', '累计充电电量', 'counter', 'float', 'kWh', 0, '累计充电总电量', 1),
(1, 'counter.discharge_energy', '累计放电电量', 'counter', 'float', 'kWh', 0, '累计放电总电量', 1),
(1, 'counter.run_hours', '累计运行时长', 'counter', 'float', 'h', 0, '累计运行小时数', 1),
(1, 'counter.start_count', '启动次数', 'counter', 'int', '次', 0, '累计启动次数', 1),
(1, 'counter.fault_count', '故障次数', 'counter', 'int', '次', 0, '累计故障次数', 1),
(1, 'counter.energy_efficiency', '能量效率', 'counter', 'float', '%', 0, '往返能量效率', 1),
-- parameter (5个)
(1, 'parameter.rated_power', '额定功率', 'parameter', 'float', 'kW', 0, '设备额定功率', 1),
(1, 'parameter.rated_voltage', '额定电压', 'parameter', 'float', 'V', 0, '额定电压', 1),
(1, 'parameter.rated_current', '额定电流', 'parameter', 'float', 'A', 0, '额定电流', 1),
(1, 'parameter.max_efficiency', '最大效率', 'parameter', 'float', '%', 0, '最大转换效率', 1),
(1, 'parameter.firmware_version', '固件版本', 'parameter', 'string', NULL, 0, '设备固件版本', 1),
-- setpoint (4个)
(1, 'setpoint.power_setpoint', '功率设定', 'setpoint', 'float', 'kW', 1, '有功功率给定值', 1),
(1, 'setpoint.reactive_setpoint', '无功设定', 'setpoint', 'float', 'kVar', 1, '无功功率给定值', 1),
(1, 'setpoint.voltage_setpoint', '电压设定', 'setpoint', 'float', 'V', 1, '电压给定值', 1),
(1, 'setpoint.power_factor', '功率因数', 'setpoint', 'float', NULL, 1, '功率因数设定', 1),
-- control (5个)
(1, 'control.start_command', '启动命令', 'control', 'bool', NULL, 1, '启动设备', 1),
(1, 'control.stop_command', '停止命令', 'control', 'bool', NULL, 1, '停止设备', 1),
(1, 'control.reset_command', '复位命令', 'control', 'bool', NULL, 1, '设备复位', 1),
(1, 'control.clear_alarm', '清除告警', 'control', 'bool', NULL, 1, '清除当前告警', 1),
(1, 'control.emergency_stop', '紧急停机', 'control', 'bool', NULL, 1, '紧急停机', 1),
-- param_write (4个)
(1, 'param_write.over_voltage_threshold', '过压保护值', 'param_write', 'float', 'V', 1, '过压保护阈值', 1),
(1, 'param_write.under_voltage_threshold', '欠压保护值', 'param_write', 'float', 'V', 1, '欠压保护阈值', 1),
(1, 'param_write.over_current_threshold', '过流保护值', 'param_write', 'float', 'A', 1, '过流保护阈值', 1),
(1, 'param_write.over_temp_threshold', '过温保护值', 'param_write', 'float', '℃', 1, '过温保护阈值', 1);

-- 3.2 BMS 模板
INSERT INTO device_template (template_code, vendor, model, device_class, version, description, created_by)
VALUES ('BMS_CATL500_v1', '宁德时代', 'BMS-500', 'BMS', 'v1.0', '500kWh 电池管理系统', 1);

-- BMS 模板点位（7种类型共38个点）
INSERT INTO template_point (template_id, point_key, display_name, signal_kind, data_type, unit, writable, description, created_by) VALUES 
-- measurement (10个)
(2, 'measurement.total_voltage', '总电压', 'measurement', 'float', 'V', 0, '电池组总电压', 1),
(2, 'measurement.total_current', '总电流', 'measurement', 'float', 'A', 0, '充放电电流', 1),
(2, 'measurement.soc', '荷电状态', 'measurement', 'float', '%', 0, 'SOC状态', 1),
(2, 'measurement.soh', '健康状态', 'measurement', 'float', '%', 0, 'SOH状态', 1),
(2, 'measurement.max_cell_voltage', '最高单体电压', 'measurement', 'float', 'V', 0, '单体最高电压', 1),
(2, 'measurement.min_cell_voltage', '最低单体电压', 'measurement', 'float', 'V', 0, '单体最低电压', 1),
(2, 'measurement.max_temp', '最高温度', 'measurement', 'float', '℃', 0, '电池最高温度', 1),
(2, 'measurement.min_temp', '最低温度', 'measurement', 'float', '℃', 0, '电池最低温度', 1),
(2, 'measurement.avg_temp', '平均温度', 'measurement', 'float', '℃', 0, '电池平均温度', 1),
(2, 'measurement.insulation_resistance', '绝缘阻抗', 'measurement', 'float', 'kΩ', 0, '绝缘电阻', 1),
-- status (10个)
(2, 'status.positive_contactor', '正极接触器', 'status', 'bool', NULL, 0, '正极继电器状态', 1),
(2, 'status.negative_contactor', '负极接触器', 'status', 'bool', NULL, 0, '负极继电器状态', 1),
(2, 'status.precharge_contactor', '预充接触器', 'status', 'bool', NULL, 0, '预充继电器状态', 1),
(2, 'status.charging', '充电状态', 'status', 'bool', NULL, 0, '正在充电', 1),
(2, 'status.discharging', '放电状态', 'status', 'bool', NULL, 0, '正在放电', 1),
(2, 'status.balancing', '均衡状态', 'status', 'bool', NULL, 0, '正在均衡', 1),
(2, 'status.over_voltage_alarm', '过压告警', 'status', 'bool', NULL, 0, '电池过压告警', 1),
(2, 'status.under_voltage_alarm', '欠压告警', 'status', 'bool', NULL, 0, '电池欠压告警', 1),
(2, 'status.over_temp_alarm', '过温告警', 'status', 'bool', NULL, 0, '温度过高告警', 1),
(2, 'status.communication_ok', '通信正常', 'status', 'bool', NULL, 0, '通信状态', 1),
-- counter (5个)
(2, 'counter.total_charge_energy', '累计充电电量', 'counter', 'float', 'kWh', 0, '总充电电量', 1),
(2, 'counter.total_discharge_energy', '累计放电电量', 'counter', 'float', 'kWh', 0, '总放电电量', 1),
(2, 'counter.charge_cycles', '充放电循环次数', 'counter', 'int', '次', 0, '累计循环次数', 1),
(2, 'counter.run_days', '运行天数', 'counter', 'int', '天', 0, '累计运行天数', 1),
(2, 'counter.capacity_loss', '容量衰减', 'counter', 'float', '%', 0, '累计容量衰减', 1),
-- parameter (6个)
(2, 'parameter.rated_capacity', '额定容量', 'parameter', 'float', 'kWh', 0, '电池额定容量', 1),
(2, 'parameter.rated_voltage', '额定电压', 'parameter', 'float', 'V', 0, '电池额定电压', 1),
(2, 'parameter.cell_count', '单体数量', 'parameter', 'int', '节', 0, '电池单体数量', 1),
(2, 'parameter.cluster_count', '簇数量', 'parameter', 'int', '组', 0, '电池簇数量', 1),
(2, 'parameter.battery_type', '电池类型', 'parameter', 'string', NULL, 0, '电池化学类型', 1),
(2, 'parameter.manufacture_date', '生产日期', 'parameter', 'string', NULL, 0, '电池生产日期', 1),
-- setpoint (3个)
(2, 'setpoint.charge_current_limit', '充电电流限制', 'setpoint', 'float', 'A', 1, '最大充电电流', 1),
(2, 'setpoint.discharge_current_limit', '放电电流限制', 'setpoint', 'float', 'A', 1, '最大放电电流', 1),
(2, 'setpoint.soc_upper_limit', 'SOC上限', 'setpoint', 'float', '%', 1, 'SOC上限设定', 1),
-- control (4个)
(2, 'control.close_contactors', '闭合接触器', 'control', 'bool', NULL, 1, '闭合主接触器', 1),
(2, 'control.open_contactors', '断开接触器', 'control', 'bool', NULL, 1, '断开主接触器', 1),
(2, 'control.start_balancing', '启动均衡', 'control', 'bool', NULL, 1, '启动电池均衡', 1),
(2, 'control.reset_system', '系统复位', 'control', 'bool', NULL, 1, 'BMS系统复位', 1),
-- param_write (5个)
(2, 'param_write.cell_overvoltage_threshold', '单体过压阈值', 'param_write', 'float', 'V', 1, '单体过压保护值', 1),
(2, 'param_write.cell_undervoltage_threshold', '单体欠压阈值', 'param_write', 'float', 'V', 1, '单体欠压保护值', 1),
(2, 'param_write.charge_overtemp_threshold', '充电过温阈值', 'param_write', 'float', '℃', 1, '充电过温保护', 1),
(2, 'param_write.discharge_overtemp_threshold', '放电过温阈值', 'param_write', 'float', '℃', 1, '放电过温保护', 1),
(2, 'param_write.soc_lower_limit', 'SOC下限', 'param_write', 'float', '%', 1, 'SOC下限设定', 1);

-- 3.3 空调模板
INSERT INTO device_template (template_code, vendor, model, device_class, version, description, created_by)
VALUES ('AIRCON_MIDEA5HP_v1', '美的', 'AC-5HP', 'Aircon', 'v1.0', '5匹精密空调', 1);

-- 空调模板点位（7种类型共26个点）
INSERT INTO template_point (template_id, point_key, display_name, signal_kind, data_type, unit, writable, description, created_by) VALUES 
-- measurement (6个)
(3, 'measurement.indoor_temp', '室内温度', 'measurement', 'float', '℃', 0, '舱内温度', 1),
(3, 'measurement.outdoor_temp', '室外温度', 'measurement', 'float', '℃', 0, '环境温度', 1),
(3, 'measurement.indoor_humidity', '室内湿度', 'measurement', 'float', '%', 0, '舱内湿度', 1),
(3, 'measurement.supply_air_temp', '送风温度', 'measurement', 'float', '℃', 0, '出风口温度', 1),
(3, 'measurement.return_air_temp', '回风温度', 'measurement', 'float', '℃', 0, '回风口温度', 1),
(3, 'measurement.power_consumption', '功率', 'measurement', 'float', 'kW', 0, '当前功率', 1),
-- status (7个)
(3, 'status.power_on', '电源状态', 'status', 'bool', NULL, 0, '设备上电状态', 1),
(3, 'status.running', '运行状态', 'status', 'bool', NULL, 0, '压缩机运行', 1),
(3, 'status.cooling_mode', '制冷模式', 'status', 'bool', NULL, 0, '制冷模式激活', 1),
(3, 'status.heating_mode', '制热模式', 'status', 'bool', NULL, 0, '制热模式激活', 1),
(3, 'status.fan_running', '风机运行', 'status', 'bool', NULL, 0, '风机状态', 1),
(3, 'status.alarm', '告警', 'status', 'bool', NULL, 0, '设备告警', 1),
(3, 'status.auto_mode', '自动模式', 'status', 'bool', NULL, 0, '自动控制模式', 1),
-- counter (3个)
(3, 'counter.total_energy', '累计用电量', 'counter', 'float', 'kWh', 0, '累计耗电量', 1),
(3, 'counter.run_hours', '累计运行时长', 'counter', 'float', 'h', 0, '累计运行小时', 1),
(3, 'counter.compressor_starts', '压缩机启动次数', 'counter', 'int', '次', 0, '压缩机启停次数', 1),
-- parameter (4个)
(3, 'parameter.rated_cooling_capacity', '额定制冷量', 'parameter', 'float', 'kW', 0, '制冷额定功率', 1),
(3, 'parameter.rated_heating_capacity', '额定制热量', 'parameter', 'float', 'kW', 0, '制热额定功率', 1),
(3, 'parameter.rated_power', '额定功率', 'parameter', 'float', 'kW', 0, '额定电功率', 1),
(3, 'parameter.refrigerant_type', '制冷剂类型', 'parameter', 'string', NULL, 0, '制冷剂型号', 1),
-- setpoint (2个)
(3, 'setpoint.target_temp', '目标温度', 'setpoint', 'float', '℃', 1, '温度设定值', 1),
(3, 'setpoint.fan_speed', '风速设定', 'setpoint', 'int', '%', 1, '风机转速', 1),
-- control (4个)
(3, 'control.power_on', '开机', 'control', 'bool', NULL, 1, '开机命令', 1),
(3, 'control.power_off', '关机', 'control', 'bool', NULL, 1, '关机命令', 1),
(3, 'control.switch_to_cooling', '切换制冷', 'control', 'bool', NULL, 1, '切换到制冷模式', 1),
(3, 'control.switch_to_heating', '切换制热', 'control', 'bool', NULL, 1, '切换到制热模式', 1),
-- param_write (3个)
(3, 'param_write.high_temp_alarm', '高温告警值', 'param_write', 'float', '℃', 1, '高温告警阈值', 1),
(3, 'param_write.low_temp_alarm', '低温告警值', 'param_write', 'float', '℃', 1, '低温告警阈值', 1),
(3, 'param_write.temp_diff_start', '温差启动值', 'param_write', 'float', '℃', 1, '温差启动阈值', 1);

-- 3.4 电表模板
INSERT INTO device_template (template_code, vendor, model, device_class, version, description, created_by)
VALUES ('METER_DTSD1352_v1', '威胜', 'DTSD1352', 'Meter', 'v1.0', '三相智能电表', 1);

-- 电表模板点位（7种类型共24个点，无setpoint/control）
INSERT INTO template_point (template_id, point_key, display_name, signal_kind, data_type, unit, writable, description, created_by) VALUES 
-- measurement (12个)
(4, 'measurement.total_active_power', '总有功功率', 'measurement', 'float', 'kW', 0, '三相总有功', 1),
(4, 'measurement.total_reactive_power', '总无功功率', 'measurement', 'float', 'kVar', 0, '三相总无功', 1),
(4, 'measurement.power_factor', '功率因数', 'measurement', 'float', NULL, 0, '总功率因数', 1),
(4, 'measurement.frequency', '频率', 'measurement', 'float', 'Hz', 0, '电网频率', 1),
(4, 'measurement.voltage_a', 'A相电压', 'measurement', 'float', 'V', 0, 'A相相电压', 1),
(4, 'measurement.voltage_b', 'B相电压', 'measurement', 'float', 'V', 0, 'B相相电压', 1),
(4, 'measurement.voltage_c', 'C相电压', 'measurement', 'float', 'V', 0, 'C相相电压', 1),
(4, 'measurement.current_a', 'A相电流', 'measurement', 'float', 'A', 0, 'A相电流', 1),
(4, 'measurement.current_b', 'B相电流', 'measurement', 'float', 'A', 0, 'B相电流', 1),
(4, 'measurement.current_c', 'C相电流', 'measurement', 'float', 'A', 0, 'C相电流', 1),
(4, 'measurement.line_voltage_ab', 'AB线电压', 'measurement', 'float', 'V', 0, 'AB线电压', 1),
(4, 'measurement.line_voltage_bc', 'BC线电压', 'measurement', 'float', 'V', 0, 'BC线电压', 1),
-- status (3个)
(4, 'status.meter_online', '表计在线', 'status', 'bool', NULL, 0, '电表通信状态', 1),
(4, 'status.reverse_power', '反向功率', 'status', 'bool', NULL, 0, '逆流状态', 1),
(4, 'status.demand_alarm', '需量告警', 'status', 'bool', NULL, 0, '需量超限告警', 1),
-- counter (6个)
(4, 'counter.total_positive_energy', '正向有功总电能', 'counter', 'float', 'kWh', 0, '总购电量', 1),
(4, 'counter.total_negative_energy', '反向有功总电能', 'counter', 'float', 'kWh', 0, '总售电量', 1),
(4, 'counter.peak_energy', '峰时段电量', 'counter', 'float', 'kWh', 0, '峰电量', 1),
(4, 'counter.flat_energy', '平时段电量', 'counter', 'float', 'kWh', 0, '平电量', 1),
(4, 'counter.valley_energy', '谷时段电量', 'counter', 'float', 'kWh', 0, '谷电量', 1),
(4, 'counter.max_demand', '最大需量', 'counter', 'float', 'kW', 0, '本月最大需量', 1),
-- parameter (3个)
(4, 'parameter.meter_address', '表计地址', 'parameter', 'int', NULL, 0, 'Modbus地址', 1),
(4, 'parameter.ct_ratio', '电流互感器变比', 'parameter', 'int', NULL, 0, 'CT变比', 1),
(4, 'parameter.pt_ratio', '电压互感器变比', 'parameter', 'int', NULL, 0, 'PT变比', 1);

-- ============================================================================
-- 第4步：插入通信通道
-- ============================================================================

INSERT INTO comm_channel (name, protocol, ip, port, timeout_ms, enabled, description, created_by) VALUES 
('CH1-PCS', 'ModbusTCP', '192.168.1.100', 502, 2000, 1, 'PCS通信通道', 1),
('CH2-BMS', 'ModbusTCP', '192.168.1.110', 502, 2000, 1, 'BMS通信通道', 1),
('CH3-AUX', 'ModbusTCP', '192.168.1.120', 502, 2000, 1, '辅助设备通道', 1);

-- ============================================================================
-- 第5步：插入设备实例（10台设备）
-- ============================================================================

-- PCS 设备（3台）
INSERT INTO device (template_id, name, vendor, model, device_class, description, enabled, created_by) VALUES 
(1, 'PCS#1', '阳光电源', 'SG100KTL', 'PCS', '1号储能变流器', 1, 1),
(1, 'PCS#2', '阳光电源', 'SG100KTL', 'PCS', '2号储能变流器', 1, 1),
(1, 'PCS#3', '阳光电源', 'SG100KTL', 'PCS', '3号储能变流器', 1, 1);

-- BMS 设备（3台）
INSERT INTO device (template_id, name, vendor, model, device_class, description, enabled, created_by) VALUES 
(2, 'BMS#1', '宁德时代', 'BMS-500', 'BMS', '1号电池管理系统', 1, 1),
(2, 'BMS#2', '宁德时代', 'BMS-500', 'BMS', '2号电池管理系统', 1, 1),
(2, 'BMS#3', '宁德时代', 'BMS-500', 'BMS', '3号电池管理系统', 1, 1);

-- 空调设备（2台）
INSERT INTO device (template_id, name, vendor, model, device_class, description, enabled, created_by) VALUES 
(3, '空调#1', '美的', 'AC-5HP', 'Aircon', '1号精密空调', 1, 1),
(3, '空调#2', '美的', 'AC-5HP', 'Aircon', '2号精密空调', 1, 1);

-- 电表设备（2台）
INSERT INTO device (template_id, name, vendor, model, device_class, description, enabled, created_by) VALUES 
(4, '并网电表', '威胜', 'DTSD1352', 'Meter', '电网关口电表', 1, 1),
(4, '计量电表', '威胜', 'DTSD1352', 'Meter', '内部计量电表', 1, 1);

-- ============================================================================
-- 第6步：自动生成设备点（从模板派生）
-- ============================================================================

-- PCS#1 的点位
INSERT INTO device_point (device_id, point_key, display_name, signal_kind, data_type, unit, writable, source_tpoint)
SELECT 1, point_key, display_name, signal_kind, data_type, unit, writable, tpoint_id
FROM template_point WHERE template_id = 1;

-- PCS#2 的点位
INSERT INTO device_point (device_id, point_key, display_name, signal_kind, data_type, unit, writable, source_tpoint)
SELECT 2, point_key, display_name, signal_kind, data_type, unit, writable, tpoint_id
FROM template_point WHERE template_id = 1;

-- PCS#3 的点位
INSERT INTO device_point (device_id, point_key, display_name, signal_kind, data_type, unit, writable, source_tpoint)
SELECT 3, point_key, display_name, signal_kind, data_type, unit, writable, tpoint_id
FROM template_point WHERE template_id = 1;

-- BMS#1 的点位
INSERT INTO device_point (device_id, point_key, display_name, signal_kind, data_type, unit, writable, source_tpoint)
SELECT 4, point_key, display_name, signal_kind, data_type, unit, writable, tpoint_id
FROM template_point WHERE template_id = 2;

-- BMS#2 的点位
INSERT INTO device_point (device_id, point_key, display_name, signal_kind, data_type, unit, writable, source_tpoint)
SELECT 5, point_key, display_name, signal_kind, data_type, unit, writable, tpoint_id
FROM template_point WHERE template_id = 2;

-- BMS#3 的点位
INSERT INTO device_point (device_id, point_key, display_name, signal_kind, data_type, unit, writable, source_tpoint)
SELECT 6, point_key, display_name, signal_kind, data_type, unit, writable, tpoint_id
FROM template_point WHERE template_id = 2;

-- 空调#1 的点位
INSERT INTO device_point (device_id, point_key, display_name, signal_kind, data_type, unit, writable, source_tpoint)
SELECT 7, point_key, display_name, signal_kind, data_type, unit, writable, tpoint_id
FROM template_point WHERE template_id = 3;

-- 空调#2 的点位
INSERT INTO device_point (device_id, point_key, display_name, signal_kind, data_type, unit, writable, source_tpoint)
SELECT 8, point_key, display_name, signal_kind, data_type, unit, writable, tpoint_id
FROM template_point WHERE template_id = 3;

-- 并网电表 的点位
INSERT INTO device_point (device_id, point_key, display_name, signal_kind, data_type, unit, writable, source_tpoint)
SELECT 9, point_key, display_name, signal_kind, data_type, unit, writable, tpoint_id
FROM template_point WHERE template_id = 4;

-- 计量电表 的点位
INSERT INTO device_point (device_id, point_key, display_name, signal_kind, data_type, unit, writable, source_tpoint)
SELECT 10, point_key, display_name, signal_kind, data_type, unit, writable, tpoint_id
FROM template_point WHERE template_id = 4;

-- ============================================================================
-- 第7步：数据统计
-- ============================================================================

SELECT '=== 数据重置完成 ===' AS info;
SELECT '设备类型: ' || COUNT(*) || ' 种' AS stat FROM device_type;
SELECT '设备模板: ' || COUNT(*) || ' 个' AS stat FROM device_template;
SELECT '模板点位: ' || COUNT(*) || ' 个' AS stat FROM template_point;
SELECT '设备实例: ' || COUNT(*) || ' 台' AS stat FROM device;
SELECT '设备点位: ' || COUNT(*) || ' 个' AS stat FROM device_point;
SELECT '通信通道: ' || COUNT(*) || ' 个' AS stat FROM comm_channel;

SELECT '--- 设备类型列表 ---' AS info;
SELECT type_code, name_zh, name_en FROM device_type ORDER BY id;

SELECT '--- 设备模板列表 ---' AS info;
SELECT template_id, template_code, vendor, model, device_class FROM device_template ORDER BY template_id;

SELECT '--- 设备实例列表 ---' AS info;
SELECT device_id, name, device_class, enabled FROM device ORDER BY device_class, device_id;

-- ============================================================================
-- 脚本结束
-- ============================================================================

