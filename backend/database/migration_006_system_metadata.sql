-- ============================================================================
-- 迁移脚本：添加系统元数据表（数据库指纹）
-- 版本：v0.3.0
-- 创建时间：2025-11-10
-- 说明：用于验证数据库来源，防止跨项目/跨机器导入错误备份
-- ============================================================================

-- 创建系统元数据表
CREATE TABLE IF NOT EXISTS system_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key VARCHAR(50) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description VARCHAR(200),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_system_metadata_key ON system_metadata(key);

-- 自动更新 updated_at 触发器
CREATE TRIGGER IF NOT EXISTS update_system_metadata_timestamp 
AFTER UPDATE ON system_metadata
FOR EACH ROW
BEGIN
    UPDATE system_metadata SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- 插入默认元数据（数据库指纹）
-- 注意：machine_uuid 需要在应用启动时动态生成并更新
INSERT INTO system_metadata (key, value, description) VALUES
('project_id', 'LCCU-V', '项目标识符'),
('db_version', '1.0.0', '数据库版本'),
('app_version', '0.3.0', '应用版本'),
('machine_uuid', 'UNINITIALIZED', '主机唯一标识（首次启动时生成）'),
('created_at', datetime('now'), '数据库创建时间'),
('backup_enabled', 'true', '是否启用备份功能');

-- 说明：
-- 1. machine_uuid 会在应用首次启动时使用 Python uuid 库生成并更新
-- 2. 还原备份时会验证 project_id 和 machine_uuid
-- 3. 不匹配时会显示警告，要求用户确认

