-- ============================================================================
-- 迁移脚本：创建系统配置表并迁移监控配置
-- 版本：v0.3.1
-- 创建时间：2025-11-12
-- 说明：将监控采集相关配置迁移到通用 system_config 表
-- ============================================================================

-- 1. 创建系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module VARCHAR(50) NOT NULL DEFAULT 'default',
    key VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    description VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module, key)
);

-- 2. 迁移 monitor_config 中的数据
INSERT INTO system_config (module, key, value, description)
SELECT 'monitor', key, value, description
FROM monitor_config
ON CONFLICT(module, key) DO UPDATE SET
    value = excluded.value,
    description = COALESCE(excluded.description, system_config.description);

-- 3. 插入默认配置（若不存在）
INSERT INTO system_config (module, key, value, description) VALUES
('monitor', 'collection_interval', '10', '数据采集间隔（秒）'),
('monitor', 'retention_days', '7', '数据保留天数'),
('monitor', 'collection_enabled', 'true', '是否启用数据采集'),
('monitor', 'collect_network', 'true', '是否采集网络流量'),
('monitor', 'collect_process', 'true', '是否采集进程资源'),
('monitor', 'auto_cleanup', 'true', '是否自动清理过期数据')
ON CONFLICT(module, key) DO NOTHING;
INSERT INTO system_config (module, key, value, description) VALUES
('rathole', 'config_path', '/etc/rathole/client.toml', 'Rathole 客户端配置文件路径'),
('rathole', 'data_directory', '/var/lib/lccu-v', 'Rathole 数据目录'),
('rathole', 'backup_keep_count', '7', '保留备份文件数量')
ON CONFLICT(module, key) DO NOTHING;

-- 4. 更新时间戳触发器
DROP TRIGGER IF EXISTS update_system_config_timestamp;
CREATE TRIGGER IF NOT EXISTS update_system_config_timestamp
AFTER UPDATE ON system_config
FOR EACH ROW
BEGIN
    UPDATE system_config
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
END;

-- 5. 删除旧的 monitor_config 表
DROP TABLE IF EXISTS monitor_config;
