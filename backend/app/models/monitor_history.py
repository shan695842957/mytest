"""
监控历史数据模型
用于存储系统资源使用历史（CPU、内存、磁盘、网络）
"""
from sqlalchemy import Column, Integer, DateTime, Float, Text
from sqlalchemy.sql import func
from app.database import Base


class MonitorHistory(Base):
    """
    监控历史数据表（精简版）
    
    只保留前端实际使用的字段，减少存储和查询开销
    - CPU: 只保留 cpu_percent（用于画曲线）
    - Memory: 只保留 memory_percent（用于画曲线）
    - Disk: 只保留 disk_percent（用于画曲线）
    - Network: 保留全部（用于多网卡曲线）
    """
    __tablename__ = "monitor_history"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # CPU数据（只保留使用率）
    cpu_percent = Column(Float, nullable=False)
    
    # 内存数据（只保留使用率）
    memory_percent = Column(Float, nullable=False)
    
    # 磁盘数据（只保留使用率）
    disk_percent = Column(Float, nullable=False)
    
    # 网络数据（保留全部，用于多网卡展示）
    network_interfaces = Column(Text)  # JSON对象
    network_total_recv_rate = Column(Float)
    network_total_sent_rate = Column(Float)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
