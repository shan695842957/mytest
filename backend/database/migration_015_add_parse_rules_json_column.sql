-- ============================================================================
-- 迁移版本: v1.5.0
-- 创建时间: 2025-01-XX
-- 说明: 为 point_table_points 表添加缺失的 parse_rules_json 列
-- ============================================================================

ALTER TABLE point_table_points
ADD COLUMN parse_rules_json TEXT NOT NULL DEFAULT '{}';
