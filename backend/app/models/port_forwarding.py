"""端口转发规则数据模型"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.database import Base


class PortForwardingRule(Base):
    """端口转发规则模型"""
    __tablename__ = "port_forwarding_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    source_host = Column(String(50), nullable=False, default="0.0.0.0")
    source_port = Column(Integer, nullable=False, index=True)
    target_host = Column(String(255), nullable=False)
    target_port = Column(Integer, nullable=False)
    protocol = Column(String(10), nullable=False, default="tcp")
    is_enabled = Column(Boolean, nullable=False, default=True, index=True)
    status = Column(String(20), nullable=False, default="stopped", index=True)
    process_id = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

