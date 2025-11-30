"""
点表模板和点表点模型
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, REAL, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class PointTableTemplate(Base):
    """
    点表模板表
    """
    __tablename__ = "point_table_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True, comment="内部名")
    display_name = Column(String(200), nullable=False, comment="显示名")
    protocol_type = Column(String(50), nullable=False, index=True, comment="协议类型")
    description = Column(Text, nullable=False, default="", comment="描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    points = relationship("PointTablePoint", back_populates="point_table", cascade="all, delete-orphan")
    comm_instances = relationship("CommInstance", back_populates="point_table")
    
    def __repr__(self):
        return f"<PointTableTemplate(id={self.id}, name={self.name}, protocol_type={self.protocol_type})>"


class PointTablePoint(Base):
    """
    点表点表
    """
    __tablename__ = "point_table_points"
    
    id = Column(Integer, primary_key=True, index=True)
    point_table_id = Column(Integer, ForeignKey("point_table_templates.id", ondelete="CASCADE"), nullable=False)
    point_name = Column(String(100), nullable=False, comment="内部点名")
    display_name = Column(String(200), nullable=False, comment="显示名")
    address = Column(String(50), nullable=False, index=True, comment="寄存器/地址")
    io_type = Column(String(20), nullable=False, comment="IO类型：AI/AO/DI/DO/STRING")
    raw_type = Column(String(20), nullable=False, comment="原始数据类型")
    byte_order = Column(String(20), nullable=False, comment="字节序")
    scale_k = Column(REAL, nullable=False, default=1.0, comment="缩放系数k")
    scale_b = Column(REAL, nullable=False, default=0.0, comment="缩放系数b")
    parse_rules_json = Column(Text, nullable=False, default="{}", comment="解析规则JSON")
    description = Column(Text, nullable=False, default="", comment="描述")
    is_active = Column(Boolean, nullable=False, default=True, comment="是否启用")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    point_table = relationship("PointTableTemplate", back_populates="points")
    
    def __repr__(self):
        return f"<PointTablePoint(id={self.id}, point_name={self.point_name}, address={self.address})>"

