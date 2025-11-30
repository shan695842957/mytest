-- ============================================================================
-- 补充设备类型数据
-- 确保 device_type 表与 device_template.device_class 匹配
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 删除旧数据
DELETE FROM device_type;

-- 插入完整的设备类型（8种）
INSERT INTO device_type (type_code, name_zh, name_en, description, is_active, created_by) VALUES
('PCS', '储能变流器', 'Power Conversion System', '双向变流器，实现交直流转换', 1, 1),
('BMS', '电池管理系统', 'Battery Management System', '电池状态监控与保护', 1, 1),
('Battery', '电池簇', 'Battery Cluster', '储能电池组', 1, 1),
('Aircon', '空调', 'Air Conditioner', '温控设备', 1, 1),
('Meter', '电能表', 'Energy Meter', '电能计量设备', 1, 1),
('Transformer', '变压器', 'Transformer', '电压变换设备', 1, 1),
('Inverter', '逆变器', 'Inverter', '直流转交流设备', 1, 1),
('Grid', '电网接入', 'Grid Connection', '电网接入点', 1, 1);

-- 统计
SELECT '设备类型数量: ' || COUNT(*) FROM device_type;
SELECT type_code, name_zh, name_en FROM device_type ORDER BY id;

