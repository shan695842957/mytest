"""
抓包任务模型
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class CaptureTask(Base):
    """抓包任务模型"""
    __tablename__ = "capture_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, comment="任务名称")
    interface = Column(String(50), nullable=False, comment="网络接口")
    filter_expression = Column(Text, comment="过滤表达式")
    duration = Column(Integer, nullable=False, comment="持续时间（秒）")
    packet_count = Column(Integer, comment="最大抓包数量")
    status = Column(String(20), nullable=False, default="pending", index=True, comment="任务状态")
    pid = Column(Integer, comment="进程ID")
    file_path = Column(Text, comment="文件路径")
    file_size = Column(Integer, default=0, comment="文件大小（字节）")
    actual_duration = Column(Integer, default=0, comment="实际运行时长（秒）")
    error_message = Column(Text, comment="错误信息")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="创建者ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True, comment="创建时间")
    started_at = Column(DateTime(timezone=True), comment="开始时间")
    completed_at = Column(DateTime(timezone=True), comment="完成时间")
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True, comment="过期时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

