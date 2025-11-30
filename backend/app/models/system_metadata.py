"""
系统元数据模型
用于存储数据库指纹信息，验证备份来源
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base


class SystemMetadata(Base):
    """系统元数据表（数据库指纹）"""
    __tablename__ = "system_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)
    description = Column(String(200))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class SystemConfig(Base):
    """系统配置表（可运行时调整的全局配置）"""
    __tablename__ = "system_config"
    
    id = Column(Integer, primary_key=True, index=True)
    module = Column(String(50), nullable=False, index=True, default="default")
    key = Column(String(100), nullable=False, index=True)
    value = Column(Text, nullable=False)
    description = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        UniqueConstraint("module", "key", name="uq_system_config_module_key"),
    )
