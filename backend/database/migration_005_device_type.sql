-- ============================================================================
-- 迁移版本: v1.4.0
-- 创建时间: 2025-11-10
-- 说明: 设备类型管理表 - 预定义设备类型，禁止设备模板自由输入
--       设备类型与设备模板是 1:N 关系
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ============================================================================
-- 设备类型表（Device Type）
-- 预定义的设备大类，设备模板必须引用此表
-- ============================================================================

CREATE TABLE IF NOT EXISTS device_type (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,       -- 设备类型ID（自增主键）
    
    -- 基础信息
    type_code VARCHAR(50) NOT NULL UNIQUE,      -- 类型编码（唯一，如 PCS, BMS, Battery）
    name_zh VARCHAR(100) NOT NULL,              -- 中文名称（如 储能变流器）
    name_en VARCHAR(100) NOT NULL,              -- 英文名称（如 Power Conversion System）
    description TEXT,                           -- 类型描述
    
    -- 状态标记
    is_active BOOLEAN NOT NULL DEFAULT 1,       -- 是否启用（1=启用，0=禁用）
    
    -- 审计字段
    created_by INTEGER,                         -- 创建者ID（外键关联 users.id）
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    
    -- 外键约束
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- 检查约束
    CHECK (is_active IN (0, 1)),
    CHECK (length(type_code) >= 2 AND length(type_code) <= 50),
    CHECK (length(name_zh) >= 2 AND length(name_zh) <= 100),
    CHECK (length(name_en) >= 2 AND length(name_en) <= 100)
);

-- ============================================================================
-- 索引
-- ============================================================================

-- 类型编码唯一索引（已在字段定义中通过 UNIQUE 创建）
CREATE INDEX IF NOT EXISTS idx_device_type_code ON device_type(type_code);

-- 启用状态索引（用于过滤启用/禁用的设备类型）
CREATE INDEX IF NOT EXISTS idx_device_type_is_active ON device_type(is_active);

-- 创建者索引（用于查询某用户创建的所有设备类型）
CREATE INDEX IF NOT EXISTS idx_device_type_created_by ON device_type(created_by);

-- ============================================================================
-- 触发器：自动更新 updated_at 字段
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS update_device_type_timestamp
AFTER UPDATE ON device_type
FOR EACH ROW
BEGIN
    UPDATE device_type SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- ============================================================================
-- 初始化预定义设备类型
-- ============================================================================

-- 插入默认设备类型（常见储能系统设备）
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
-- 更新 device_template 表，添加外键约束
-- ============================================================================

-- 注意：由于 SQLite 不支持直接 ALTER TABLE ADD FOREIGN KEY，
-- 需要在新建 device_template 表时就添加外键，或者使用迁移脚本重建表。
-- 这里假设 device_template 表的 device_class 字段将被改为 type_id INTEGER。

-- ============================================================================
-- 数据库版本信息
-- ============================================================================

INSERT INTO schema_version (version, description)
VALUES ('1.4.0', '添加设备类型管理表，预定义8种常用设备类型');

-- ============================================================================
-- 脚本结束
-- ============================================================================

