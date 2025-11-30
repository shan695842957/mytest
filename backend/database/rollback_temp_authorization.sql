-- ============================================
-- 回滚脚本：删除临时授权系统的所有数据库改动
-- 日期：2025-01-13
-- 说明：恢复数据库到临时权限系统添加前的状态
-- ============================================

-- 1. 删除触发器
DROP TRIGGER IF EXISTS audit_temp_auth_activation;
DROP TRIGGER IF EXISTS update_perm_cap_timestamp;
DROP TRIGGER IF EXISTS update_temp_auth_sessions_timestamp;

-- 2. 删除表
DROP TABLE IF EXISTS temp_authorization_sessions;
DROP TABLE IF EXISTS permission_capabilities;

-- 3. 删除 system_metadata 中的临时授权相关记录
DELETE FROM system_metadata WHERE key IN (
    'device_id',
    'device_name',
    'temp_auth_public_key',
    'temp_auth_enabled'
);

-- 4. 删除审计日志中的临时授权相关记录（可选，保留审计追踪）
-- DELETE FROM audit_logs WHERE module = 'temp_authorization';

-- 5. 验证清理结果
SELECT '=== 清理完成 ===' AS status;
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%temp%' OR name LIKE '%perm%';
SELECT key FROM system_metadata WHERE key LIKE '%temp%' OR key LIKE '%device%';

SELECT '✅ 数据库已恢复到临时授权系统添加前的状态' AS result;

