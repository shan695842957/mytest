-- ============================================================================
-- 迁移版本: v1.7.0
-- 创建时间: 2025-01-XX
-- 说明: 外设管理系统
--       支持管理可用外设（串口、CAN等），协议参数可以选择从外设表中选择
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- 1. 外设表 (peripherals)
-- 用途：定义系统中可用的外设设备（如串口、CAN总线等）
-- ============================================================================
CREATE TABLE IF NOT EXISTS peripherals (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- 基本信息
    name VARCHAR(100) NOT NULL UNIQUE,              -- 外设名称（唯一，如 'serial_uart0', 'can0'）
    display_name VARCHAR(200) NOT NULL,              -- 显示名称（前端展示，如 '串口 UART0', 'CAN总线 0'）
    peripheral_type VARCHAR(50) NOT NULL,            -- 外设类型（如 'serial', 'can', 'spi', 'i2c'）
    device_path VARCHAR(255) NOT NULL,               -- 设备路径（如 '/dev/ttyS0', '/dev/ttyUSB0', 'can0'）
    enabled BOOLEAN NOT NULL DEFAULT 1,              -- 是否启用（1=启用，0=禁用）
    description TEXT NOT NULL DEFAULT '',            -- 描述信息
    
    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    
    -- 检查约束
    CHECK (enabled IN (0, 1)),
    CHECK (peripheral_type IN ('serial', 'can', 'spi', 'i2c', 'gpio', 'pwm', 'adc', 'dac', 'other'))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_peripherals_name ON peripherals(name);
CREATE INDEX IF NOT EXISTS idx_peripherals_type ON peripherals(peripheral_type);
CREATE INDEX IF NOT EXISTS idx_peripherals_enabled ON peripherals(enabled);
CREATE INDEX IF NOT EXISTS idx_peripherals_type_enabled ON peripherals(peripheral_type, enabled);

-- ============================================================================
-- 2. 修改协议类型参数表 (protocol_type_params)
-- 添加输入类型和外设类型字段
-- ============================================================================

-- 添加 input_type 字段（输入类型：text/number/select/peripheral）
ALTER TABLE protocol_type_params ADD COLUMN input_type VARCHAR(20) NOT NULL DEFAULT 'text';

-- 添加 peripheral_type 字段（外设类型，仅当 input_type='peripheral' 时使用）
ALTER TABLE protocol_type_params ADD COLUMN peripheral_type VARCHAR(50);

-- 添加检查约束（通过触发器实现）
-- SQLite 不支持 ALTER TABLE 添加 CHECK 约束，使用触发器验证

-- ============================================================================
-- 3. 触发器：自动更新 updated_at 字段
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS update_peripherals_timestamp
AFTER UPDATE ON peripherals
FOR EACH ROW
BEGIN
    UPDATE peripherals SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- ============================================================================
-- 4. 初始化默认外设数据（示例）
-- ============================================================================

-- 串口设备示例
INSERT INTO peripherals (name, display_name, peripheral_type, device_path, enabled, description) VALUES
('serial_uart0', '串口 UART0', 'serial', '/dev/ttyS0', 1, '系统串口 UART0'),
('serial_uart1', '串口 UART1', 'serial', '/dev/ttyS1', 1, '系统串口 UART1'),
('serial_usb0', 'USB转串口 0', 'serial', '/dev/ttyUSB0', 1, 'USB转串口设备 0'),
('serial_usb1', 'USB转串口 1', 'serial', '/dev/ttyUSB1', 1, 'USB转串口设备 1');

-- CAN设备示例
INSERT INTO peripherals (name, display_name, peripheral_type, device_path, enabled, description) VALUES
('can0', 'CAN总线 0', 'can', 'can0', 1, 'CAN总线设备 0'),
('can1', 'CAN总线 1', 'can', 'can1', 1, 'CAN总线设备 1');

-- ============================================================================
-- 5. 更新现有协议参数，将串口参数改为外设选择类型
-- ============================================================================

-- 更新 Modbus RTU 和 ASCII 的串口参数为外设选择类型
UPDATE protocol_type_params 
SET input_type = 'peripheral', 
    peripheral_type = 'serial',
    description = '从可用串口设备中选择'
WHERE protocol_type_id IN (
    SELECT id FROM protocol_types WHERE name IN ('modbus_rtu', 'modbus_ascii')
) AND param_name = 'serial';

-- ============================================================================
-- 脚本结束
-- ============================================================================

