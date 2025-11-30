"""
资产和映射模型
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Asset(Base):
    """
    资产表
    """
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True, comment="内部名")
    display_name = Column(String(200), nullable=False, comment="显示名")
    device_type_id = Column(Integer, ForeignKey("device_types.id"), nullable=False, index=True)
    location = Column(String(200), nullable=False, default="", comment="位置")
    enabled = Column(Boolean, nullable=False, default=True, index=True, comment="是否启用")
    metadata_json = Column(Text, nullable=False, default="{}", comment="自定义元数据JSON")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    device_type = relationship("DeviceType", back_populates="assets")
    mappings = relationship("AssetMapping", back_populates="asset", cascade="all, delete-orphan")
    comm_bindings = relationship("AssetCommBinding", back_populates="asset", cascade="all, delete-orphan")
    soe_events = relationship("SOEEvent", back_populates="asset")
    
    def __repr__(self):
        return f"<Asset(id={self.id}, name={self.name}, display_name={self.display_name})>"


class AssetMapping(Base):
    """
    资产映射表
    """
    __tablename__ = "asset_mappings"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    asset_tag_name = Column(String(100), nullable=False, comment="业务字段名")
    instance_id = Column(Integer, ForeignKey("comm_instances.id"), nullable=False, index=True)
    point_name = Column(String(100), nullable=False, comment="点表点名")
    is_overridden = Column(Boolean, nullable=False, default=False, comment="是否覆盖自动映射")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    asset = relationship("Asset", back_populates="mappings")
    comm_instance = relationship("CommInstance", back_populates="asset_mappings")
    
    def __repr__(self):
        return f"<AssetMapping(id={self.id}, asset_id={self.asset_id}, asset_tag_name={self.asset_tag_name})>"


class AssetCommBinding(Base):
    """
    资产与通信实例绑定表
    """
    __tablename__ = "asset_comm_bindings"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    instance_id = Column(Integer, ForeignKey("comm_instances.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    asset = relationship("Asset", back_populates="comm_bindings")
    comm_instance = relationship("CommInstance", back_populates="asset_comm_bindings")
    
    def __repr__(self):
        return f"<AssetCommBinding(id={self.id}, asset_id={self.asset_id}, instance_id={self.instance_id})>"

