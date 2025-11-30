-- ============================================================================
-- 清理遗留设备业务表
-- 创建时间: 2025-11-16
-- 说明: 清理与 device.md 文档业务相关的遗留表
--       保留重要表：users, audit_logs, port_forwarding_rules, capture_tasks,
--                  monitor_config, monitor_history, system_config, system_metadata
-- ============================================================================

PRAGMA foreign_keys = OFF;

-- ============================================================================
-- 删除遗留的设备业务相关表
-- ============================================================================

-- 删除映射和绑定表
DROP TABLE IF EXISTS mapping_instance;
DROP TABLE IF EXISTS device_comm_binding;
DROP TABLE IF EXISTS template_mapping;

-- 删除设备相关表
DROP TABLE IF EXISTS device;
DROP TABLE IF EXISTS device_point;
DROP TABLE IF EXISTS device_template;
DROP TABLE IF EXISTS device_type;

-- 删除通信相关表
DROP TABLE IF EXISTS comm_channel;
DROP TABLE IF EXISTS comm_point_template;
DROP TABLE IF EXISTS comm_template;

-- 删除解码器相关表
DROP TABLE IF EXISTS decoder_output_template;

-- 删除模板点表
DROP TABLE IF EXISTS template_point;

-- ============================================================================
-- 清理完成
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 显示剩余的表（确认重要表都还在）
SELECT '清理完成！剩余表：' AS message;
SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;

