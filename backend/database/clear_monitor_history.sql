-- ============================================================================
-- 清理监控历史数据
-- 用途：删除所有旧的监控数据，释放空间
-- ============================================================================

-- 删除所有监控历史记录
DELETE FROM monitor_history;

-- 重置自增ID（SQLite特有）
DELETE FROM sqlite_sequence WHERE name='monitor_history';

-- 清理数据库（回收空间）
VACUUM;

-- 查看结果
SELECT COUNT(*) as remaining_records FROM monitor_history;

-- 说明：
-- - 此脚本会删除所有监控历史数据
-- - VACUUM 会回收已删除数据占用的空间
-- - 建议在数据库迁移后执行，确保新数据采用新结构

