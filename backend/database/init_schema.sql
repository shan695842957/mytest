-- ============================================================================
-- LCCU-V 数据库初始化脚本
-- 数据库类型: SQLite
-- 创建日期: 2024-01-01
-- ============================================================================

-- ============================================================================
-- 用户表 (users)
-- 用于存储系统用户信息、角色和权限
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 用户ID（自增主键）
    
    -- 基础信息
    username VARCHAR(50) NOT NULL UNIQUE,  -- 用户名（唯一索引）
    hashed_password VARCHAR(255) NOT NULL, -- 密码哈希值（bcrypt）
    role VARCHAR(20) NOT NULL,             -- 角色：developer/operator/user
    
    -- 特殊标记
    is_builtin BOOLEAN NOT NULL DEFAULT 0, -- 是否为内置账号（1=是，0=否）
    is_active BOOLEAN NOT NULL DEFAULT 1,  -- 是否激活（1=激活，0=禁用）
    
    -- 审计字段
    created_by INTEGER,                    -- 创建者ID（外键关联 users.id）
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 创建时间
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 更新时间
    
    -- 外键约束
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- 检查约束
    CHECK (role IN ('developer', 'operator', 'user')),
    CHECK (is_builtin IN (0, 1)),
    CHECK (is_active IN (0, 1))
);

-- ============================================================================
-- 索引
-- ============================================================================

-- 用户名唯一索引（已在字段定义中通过 UNIQUE 创建）
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 角色索引（用于按角色查询）
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 激活状态索引（用于过滤激活/禁用用户）
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- 创建者索引（用于查询某用户创建的所有账号）
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);

-- ============================================================================
-- 初始化内置账号
-- 密码均为：Admin@123（生产环境请立即修改！）
-- 密码哈希使用 bcrypt 算法
-- ============================================================================

-- 内置开发者账号
INSERT INTO users (username, hashed_password, role, is_builtin, is_active, created_by)
VALUES (
    'admin_developer',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqYH3P5.KO',  -- Admin@123
    'developer',
    1,
    1,
    NULL
);

-- 内置运维者账号
INSERT INTO users (username, hashed_password, role, is_builtin, is_active, created_by)
VALUES (
    'admin_operator',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqYH3P5.KO',  -- Admin@123
    'operator',
    1,
    1,
    NULL
);

-- 内置用户账号
INSERT INTO users (username, hashed_password, role, is_builtin, is_active, created_by)
VALUES (
    'admin_user',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqYH3P5.KO',  -- Admin@123
    'user',
    1,
    1,
    NULL
);

-- ============================================================================
-- 触发器：自动更新 updated_at 字段
-- SQLite 不支持自动更新触发器，需要在应用层处理或使用触发器
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS update_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- 数据库版本信息
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(20) PRIMARY KEY,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

INSERT INTO schema_version (version, description)
VALUES ('1.0.0', '初始化用户表和内置账号');

-- ============================================================================
-- 脚本结束
-- ============================================================================

