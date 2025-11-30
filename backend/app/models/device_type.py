"""
设备类型和业务字段模型
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, REAL
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class DeviceType(Base):
    """
    设备类型表
    """
    __tablename__ = "device_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True, comment="内部名称")
    display_name = Column(String(200), nullable=False, comment="显示名称")
    model = Column(String(100), nullable=False, default="", comment="型号")
    manufacturer = Column(String(100), nullable=False, default="", comment="厂家")
    description = Column(Text, nullable=False, default="", comment="描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    tags = relationship("DeviceTypeTag", back_populates="device_type", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="device_type")
    
    def __repr__(self):
        return f"<DeviceType(id={self.id}, name={self.name}, display_name={self.display_name})>"


class DeviceTypeTag(Base):
    """
    业务字段模板表
    """
    __tablename__ = "device_type_tags"
    
    id = Column(Integer, primary_key=True, index=True)
    device_type_id = Column(Integer, ForeignKey("device_types.id", ondelete="CASCADE"), nullable=False)
    tag_name = Column(String(100), nullable=False, comment="内部字段名")
    display_name = Column(String(200), nullable=False, comment="显示名")
    data_type = Column(String(20), nullable=False, comment="数据类型：BOOL/INT/FLOAT/ENUM")
    semantic_type = Column(String(20), nullable=False, index=True, comment="语义类型")
    engineering_unit = Column(String(50), nullable=False, default="", comment="工程单位")
    group_name = Column(String(100), nullable=False, default="", comment="UI分组")
    severity = Column(Integer, nullable=False, default=0, comment="严重性：0~5")
    description = Column(Text, nullable=False, default="", comment="描述")
    enum_json = Column(Text, nullable=False, default="{}", comment="ENUM值映射JSON")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    device_type = relationship("DeviceType", back_populates="tags")
    
    def __repr__(self):
        return f"<DeviceTypeTag(id={self.id}, tag_name={self.tag_name}, semantic_type={self.semantic_type})>"

