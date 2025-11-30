"""
外设设备数据库模型
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func

from app.database import Base


class Peripheral(Base):
    """
    外设设备表
    """
    __tablename__ = "peripherals"
    
    id = Column(Integer, primary_key=True, index=True, comment="外设ID")
    name = Column(String(100), unique=True, nullable=False, index=True, comment="外设名称（唯一）")
    display_name = Column(String(200), nullable=False, comment="显示名称（前端展示）")
    peripheral_type = Column(String(50), nullable=False, index=True, comment="外设类型：serial/can/spi/i2c/gpio/pwm/adc/dac/other")
    device_path = Column(String(255), nullable=False, comment="设备路径（如 /dev/ttyS0, can0）")
    enabled = Column(Boolean, nullable=False, default=True, index=True, comment="是否启用")
    description = Column(Text, nullable=False, default="", comment="描述信息")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False, comment="更新时间")
    
    def __repr__(self):
        return f"<Peripheral(id={self.id}, name={self.name}, peripheral_type={self.peripheral_type}, device_path={self.device_path})>"

