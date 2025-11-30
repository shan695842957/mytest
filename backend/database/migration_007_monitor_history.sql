-- ============================================================================
-- 迁移脚本：添加监控历史数据表
-- 版本：v0.3.0
-- 创建时间：2025-11-10
-- 说明：保存系统资源使用历史数据，支持多核心CPU和多网卡
-- ============================================================================

-- 创建监控历史表
CREATE TABLE IF NOT EXISTS monitor_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    
    -- CPU数据
    cpu_percent REAL NOT NULL,                    -- CPU总使用率（0-100）
    cpu_per_core TEXT,                            -- 每个核心使用率（JSON数组，如 "[10.5, 25.3, 15.8, 20.1]"）
    cpu_count INTEGER,                            -- CPU核心数
    load_avg_1 REAL,                              -- 1分钟负载平均
    load_avg_5 REAL,                              -- 5分钟负载平均
    load_avg_15 REAL,                             -- 15分钟负载平均
    
    -- 内存数据
    memory_percent REAL NOT NULL,                 -- 内存使用率（0-100）
    memory_used_mb INTEGER,                       -- 已用内存（MB）
    memory_total_mb INTEGER,                      -- 总内存（MB）
    memory_available_mb INTEGER,                  -- 可用内存（MB）
    
    -- 磁盘数据
    disk_percent REAL NOT NULL,                   -- 磁盘使用率（0-100）
    disk_used_gb INTEGER,                         -- 已用空间（GB）
    disk_total_gb INTEGER,                        -- 总空间（GB）
    disk_free_gb INTEGER,                         -- 可用空间（GB）
    
    -- 网络数据（JSON格式，支持多网卡）
    network_interfaces TEXT,                      -- 网卡流量数据（JSON对象）
    -- 格式：{"eth0": {"recv_rate": 1024.5, "sent_rate": 512.3}, "eth1": {...}}
    network_total_recv_rate REAL,                -- 总接收速率（KB/s）
    network_total_sent_rate REAL,                -- 总发送速率（KB/s）
    
    -- 进程数据（FastAPI应用）
    process_cpu_percent REAL,                     -- 进程CPU使用率
    process_memory_percent REAL,                  -- 进程内存使用率
    process_memory_mb INTEGER,                    -- 进程内存（MB）
    process_threads INTEGER,                      -- 线程数
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引（时间范围查询优化）
CREATE INDEX IF NOT EXISTS idx_monitor_history_timestamp 
    ON monitor_history(timestamp DESC);

-- 创建索引（清理任务优化）
CREATE INDEX IF NOT EXISTS idx_monitor_history_created_at 
    ON monitor_history(created_at);

-- 创建监控配置表
CREATE TABLE IF NOT EXISTS monitor_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key VARCHAR(50) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description VARCHAR(200),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认配置
INSERT INTO monitor_config (key, value, description) VALUES
('collection_interval', '10', '数据采集间隔（秒）'),
('retention_days', '7', '数据保留天数'),
('collection_enabled', 'true', '是否启用数据采集'),
('collect_network', 'true', '是否采集网络流量'),
('collect_process', 'true', '是否采集进程资源'),
('auto_cleanup', 'true', '是否自动清理过期数据');

-- 自动更新 updated_at 触发器
CREATE TRIGGER IF NOT EXISTS update_monitor_config_timestamp 
AFTER UPDATE ON monitor_config
FOR EACH ROW
BEGIN
    UPDATE monitor_config SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_monitor_config_key ON monitor_config(key);

-- 说明：
-- 1. monitor_history 表使用 JSON 字段存储多核心CPU和多网卡数据
-- 2. 每10秒插入一条记录，7天后自动清理
-- 3. 索引优化时间范围查询性能
-- 4. monitor_config 表存储采集配置，可在软件设置中修改

