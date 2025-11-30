-- 迁移版本: v1.3.0
-- 创建时间: 2025-01-XX
-- 说明: 为 device_types 表添加 model（型号）和 manufacturer（厂家）字段

-- 添加字段
ALTER TABLE device_types ADD COLUMN model TEXT DEFAULT '';  -- 型号
ALTER TABLE device_types ADD COLUMN manufacturer TEXT DEFAULT '';  -- 厂家

-- 更新现有记录的默认值（如果需要）
-- UPDATE device_types SET model = '', manufacturer = '' WHERE model IS NULL OR manufacturer IS NULL;

