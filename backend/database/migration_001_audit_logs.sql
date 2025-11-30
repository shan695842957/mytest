-- ============================================================================
-- 审计日志表迁移脚本
-- 版本: 1.1.0
-- 创建日期: 2024-01-01
-- ============================================================================

-- ============================================================================
-- 审计日志表 (audit_logs)
-- 记录所有 POST/PUT/PATCH/DELETE 操作的详细信息
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    -- 主键
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 日志ID（自增主键）
    
    -- 请求信息
    request_id VARCHAR(36),                -- 请求ID（UUID，用于追踪）
    method VARCHAR(10) NOT NULL,           -- HTTP方法（POST/PUT/PATCH/DELETE）
    path VARCHAR(255) NOT NULL,            -- API路径
    
    -- 操作信息
    module VARCHAR(50) NOT NULL,           -- 模块名称（auth/user/item等）
    action VARCHAR(50) NOT NULL,           -- 操作类型（create/update/delete/login等）
    action_key VARCHAR(100),               -- 操作国际化键（用于i18n）
    
    -- 用户信息
    user_id INTEGER,                       -- 操作者ID（外键关联 users.id）
    username VARCHAR(50),                  -- 操作者用户名（冗余字段）
    user_role VARCHAR(20),                 -- 操作者角色
    
    -- 目标信息
    target_type VARCHAR(50),               -- 目标类型（user/item等）
    target_id VARCHAR(50),                 -- 目标ID
    target_name VARCHAR(255),              -- 目标名称
    
    -- 数据变更
    request_body TEXT,                     -- 请求体（JSON格式）
    changes TEXT,                          -- 变更内容（JSON格式，before/after对比）
    
    -- 结果信息
    status_code INTEGER NOT NULL,          -- HTTP状态码
    success VARCHAR(10) NOT NULL DEFAULT 'success',  -- 操作结果（success/failed）
    error_message TEXT,                    -- 错误信息（如果失败）
    
    -- 请求上下文
    ip_address VARCHAR(45),                -- 客户端IP地址（支持IPv6）
    user_agent VARCHAR(500),               -- 用户代理字符串
    locale VARCHAR(10),                    -- 请求语言
    
    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 操作时间
    
    -- 执行时长
    duration_ms INTEGER,                   -- 执行时长（毫秒）
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- 检查约束
    CHECK (method IN ('POST', 'PUT', 'PATCH', 'DELETE')),
    CHECK (success IN ('success', 'failed'))
);

-- ============================================================================
-- 索引
-- ============================================================================

-- 请求ID索引（用于追踪请求链路）
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);

-- HTTP方法索引（按方法筛选）
CREATE INDEX IF NOT EXISTS idx_audit_logs_method ON audit_logs(method);

-- API路径索引（按路径筛选）
CREATE INDEX IF NOT EXISTS idx_audit_logs_path ON audit_logs(path);

-- 模块名称索引（按模块筛选）
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);

-- 操作类型索引（按操作筛选）
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- 操作者索引（按用户筛选）
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- 目标ID索引（查询某个对象的所有操作历史）
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON audit_logs(target_id);

-- 操作结果索引（筛选成功/失败的操作）
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);

-- 操作时间索引（按时间范围查询，最常用）
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 组合索引：用户+时间（查询某用户的操作历史）
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON audit_logs(user_id, created_at);

-- 组合索引：模块+操作+时间（查询某模块的操作历史）
CREATE INDEX IF NOT EXISTS idx_audit_logs_module_action_time ON audit_logs(module, action, created_at);

-- ============================================================================
-- 更新数据库版本信息
-- ============================================================================

INSERT INTO schema_version (version, description)
VALUES ('1.1.0', '添加审计日志表（audit_logs）');

-- ============================================================================
-- 脚本结束
-- ============================================================================

-- 使用说明：
-- 1. 该表会自动记录所有 POST/PUT/PATCH/DELETE 操作
-- 2. 通过 request_id 可以追踪完整的请求链路
-- 3. 通过 action_key 支持国际化的操作描述
-- 4. 通过 changes 字段记录数据变更的前后对比
-- 5. 支持按用户、模块、时间等多维度查询

