-- 迁移版本: v0.2.0
-- 创建时间: 2025-11-11
-- 说明: 添加网络抓包任务管理表

-- 创建抓包任务表
CREATE TABLE IF NOT EXISTS capture_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    interface VARCHAR(50) NOT NULL,
    filter_expression TEXT,
    duration INTEGER NOT NULL,
    packet_count INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    pid INTEGER,
    file_path TEXT,
    file_size INTEGER DEFAULT 0,
    actual_duration INTEGER DEFAULT 0,
    error_message TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    expires_at DATETIME NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX idx_capture_tasks_status ON capture_tasks(status);
CREATE INDEX idx_capture_tasks_created_by ON capture_tasks(created_by);
CREATE INDEX idx_capture_tasks_created_at ON capture_tasks(created_at DESC);
CREATE INDEX idx_capture_tasks_expires_at ON capture_tasks(expires_at);

-- 创建更新时间触发器
CREATE TRIGGER IF NOT EXISTS update_capture_tasks_timestamp 
AFTER UPDATE ON capture_tasks
FOR EACH ROW
BEGIN
    UPDATE capture_tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

