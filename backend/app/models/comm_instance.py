"""
通信实例模型
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class CommInstance(Base):
    """
    通信实例表
    """
    __tablename__ = "comm_instances"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True, comment="内部ID")
    display_name = Column(String(200), nullable=False, comment="显示名")
    enabled = Column(Boolean, nullable=False, default=True, index=True, comment="是否启用")
    point_table_id = Column(Integer, ForeignKey("point_table_templates.id"), nullable=False)
    protocol_type = Column(String(50), nullable=False, comment="协议类型")
    protocol_config = Column(Text, nullable=False, comment="协议配置JSON")
    polling_interval_ms = Column(Integer, nullable=False, comment="轮询周期(ms)")
    timeout_ms = Column(Integer, nullable=False, comment="超时(ms)")
    retries = Column(Integer, nullable=False, comment="重试次数")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    point_table = relationship("PointTableTemplate", back_populates="comm_instances")
    asset_mappings = relationship("AssetMapping", back_populates="comm_instance")
    asset_comm_bindings = relationship("AssetCommBinding", back_populates="comm_instance")
    
    def __repr__(self):
        return f"<CommInstance(id={self.id}, name={self.name}, protocol_type={self.protocol_type})>"

