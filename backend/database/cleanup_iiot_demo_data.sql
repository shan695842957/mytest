-- ============================================================================
-- IIoT 配置示例数据清理脚本
-- 作用：在导入新的 demo/seed 数据前，快速删除相关业务表的所有记录
-- 使用方法：
--   sqlite3 data/app.db < backend/database/cleanup_iiot_demo_data.sql
-- ============================================================================

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

DELETE FROM soe_events;
DELETE FROM asset_mappings;
DELETE FROM asset_comm_bindings;
DELETE FROM template_mappings;
DELETE FROM assets;
DELETE FROM comm_instances;
DELETE FROM point_table_points;
DELETE FROM point_table_templates;
DELETE FROM device_type_tags;
DELETE FROM device_types;
DELETE FROM device_types_old;

COMMIT;

SELECT 'IIoT 配置表已清空' AS message;

