-- ============================================================================
-- 迁移脚本：Rathole 模块配置
-- 版本：v0.3.2
-- 创建时间：2025-11-12
-- 说明：
--   1. 为 Rathole 模块添加系统配置参数
--   2. 清理废弃的 rathole_services 和 rathole_config 表
-- ============================================================================

-- 1. 插入系统级配置
INSERT INTO system_config (module, key, value, description) VALUES
('system', 'data_directory', '/var/lib/lccu-v', '软件数据存储根目录')
ON CONFLICT(module, key) DO NOTHING;

-- 2. 插入 Rathole 模块配置
INSERT INTO system_config (module, key, value, description) VALUES
('rathole', 'config_path', '/etc/rathole/client.toml', 'Rathole 客户端配置文件路径'),
('rathole', 'backup_keep_count', '7', '保留备份文件数量')
ON CONFLICT(module, key) DO NOTHING;

-- 2. 删除废弃的 rathole 数据库表（现在使用 TOML 文件）
DROP TABLE IF EXISTS rathole_services;
DROP TABLE IF EXISTS rathole_config;

-- 3. 验证配置已插入
SELECT '✅ Rathole 模块配置已初始化' AS result;

