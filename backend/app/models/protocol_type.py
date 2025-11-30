"""
协议类型和参数数据库模型
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class ProtocolType(Base):
    """
    协议类型表
    """
    __tablename__ = "protocol_types"
    
    id = Column(Integer, primary_key=True, index=True, comment="协议类型ID")
    name = Column(String(50), unique=True, nullable=False, index=True, comment="协议内部名称（唯一）")
    display_name = Column(String(200), nullable=False, comment="显示名称（前端展示）")
    enabled = Column(Boolean, nullable=False, default=True, index=True, comment="是否启用")
    description = Column(Text, nullable=False, default="", comment="描述信息")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False, comment="更新时间")
    
    # 关系
    params = relationship("ProtocolTypeParam", back_populates="protocol_type", cascade="all, delete-orphan", order_by="ProtocolTypeParam.order_index")
    
    def __repr__(self):
        return f"<ProtocolType(id={self.id}, name={self.name}, display_name={self.display_name})>"


class ProtocolTypeParam(Base):
    """
    协议类型参数表
    """
    __tablename__ = "protocol_type_params"
    
    id = Column(Integer, primary_key=True, index=True, comment="参数ID")
    protocol_type_id = Column(Integer, ForeignKey("protocol_types.id", ondelete="CASCADE"), nullable=False, index=True, comment="协议类型ID")
    param_name = Column(String(100), nullable=False, comment="参数名称")
    display_name = Column(String(200), nullable=False, comment="参数显示名称")
    data_type = Column(String(20), nullable=False, comment="参数数据类型：string/integer/float/boolean/enum")
    required = Column(Boolean, nullable=False, default=True, comment="是否必填")
    default_value = Column(Text, nullable=True, comment="默认值")
    description = Column(Text, nullable=False, default="", comment="参数描述")
    constraints_json = Column(Text, nullable=False, default="{}", comment="约束信息JSON（枚举值、最小值、最大值、正则表达式等）")
    order_index = Column(Integer, nullable=False, default=0, comment="排序索引")
    placeholder = Column(Text, nullable=True, comment="占位符文本")
    input_type = Column(String(20), nullable=False, default="text", comment="输入类型：text/number/select/peripheral")
    peripheral_type = Column(String(50), nullable=True, comment="外设类型（仅当 input_type='peripheral' 时使用）：serial/can/spi/i2c等")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False, comment="更新时间")
    
    # 关系
    protocol_type = relationship("ProtocolType", back_populates="params")
    
    def __repr__(self):
        return f"<ProtocolTypeParam(id={self.id}, protocol_type_id={self.protocol_type_id}, param_name={self.param_name})>"

