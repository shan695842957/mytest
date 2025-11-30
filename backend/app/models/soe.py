"""
SOE 事件模型
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, REAL
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class SOEEvent(Base):
    """
    SOE 事件表
    """
    __tablename__ = "soe_events"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_tag_name = Column(String(100), nullable=False, comment="业务字段名")
    event_type = Column(String(20), nullable=False, index=True, comment="事件类型")
    severity = Column(Integer, nullable=False, index=True, comment="严重性：0~5")
    value_num = Column(REAL, nullable=True, comment="数值")
    value_text = Column(Text, nullable=False, default="", comment="文本值")
    source_instance_id = Column(Integer, nullable=True, comment="源通信实例ID")
    source_point_name = Column(String(100), nullable=True, comment="源点表点名")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True, comment="事件发生时间")
    inserted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="写入DB时间")
    extra_json = Column(Text, nullable=False, default="{}", comment="扩展信息JSON")
    
    # 关系
    asset = relationship("Asset", back_populates="soe_events")
    
    def __repr__(self):
        return f"<SOEEvent(id={self.id}, asset_id={self.asset_id}, event_type={self.event_type}, created_at={self.created_at})>"

