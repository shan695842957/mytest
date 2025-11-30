-- 迁移版本: v1.3.0
-- 创建时间: 2025-11-12
-- 说明: 添加端口转发管理表

-- 1. 创建端口转发规则表
CREATE TABLE IF NOT EXISTS port_forwarding_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    source_host VARCHAR(50) NOT NULL DEFAULT '0.0.0.0',
    source_port INTEGER NOT NULL,
    target_host VARCHAR(255) NOT NULL,
    target_port INTEGER NOT NULL,
    protocol VARCHAR(10) NOT NULL DEFAULT 'tcp',
    is_enabled BOOLEAN NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'stopped',
    process_id INTEGER,
    error_message TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT chk_protocol CHECK (protocol IN ('tcp', 'udp')),
    CONSTRAINT chk_status CHECK (status IN ('stopped', 'running', 'error')),
    CONSTRAINT chk_source_port CHECK (source_port >= 1 AND source_port <= 65535),
    CONSTRAINT chk_target_port CHECK (target_port >= 1 AND target_port <= 65535)
);

-- 2. 创建索引
CREATE INDEX idx_port_forwarding_status ON port_forwarding_rules(status);
CREATE INDEX idx_port_forwarding_is_enabled ON port_forwarding_rules(is_enabled);
CREATE UNIQUE INDEX idx_port_forwarding_source_port ON port_forwarding_rules(source_port) WHERE status = 'running';
CREATE INDEX idx_port_forwarding_created_by ON port_forwarding_rules(created_by);

-- 3. 创建触发器：自动更新 updated_at
CREATE TRIGGER IF NOT EXISTS update_port_forwarding_timestamp 
AFTER UPDATE ON port_forwarding_rules
FOR EACH ROW
BEGIN
    UPDATE port_forwarding_rules SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- 4. 插入示例数据（可选）
-- INSERT INTO port_forwarding_rules (name, source_host, source_port, target_host, target_port, protocol, is_enabled, created_by) 
-- VALUES ('MySQL转发', '0.0.0.0', 3306, '192.168.1.10', 3306, 'tcp', 1, 1);

