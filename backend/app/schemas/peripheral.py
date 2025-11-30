"""
外设设备相关的 Pydantic Schemas
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class PeripheralBase(BaseModel):
    """外设基础模型"""
    name: str = Field(..., min_length=1, max_length=100, description="外设名称（唯一）")
    display_name: str = Field(..., min_length=1, max_length=200, description="显示名称")
    peripheral_type: str = Field(..., description="外设类型：serial/can/spi/i2c/gpio/pwm/adc/dac/other")
    device_path: str = Field(..., min_length=1, max_length=255, description="设备路径（如 /dev/ttyS0, can0）")
    enabled: bool = Field(default=True, description="是否启用")
    description: str = Field(default="", description="描述信息")


class PeripheralCreate(PeripheralBase):
    """创建外设请求模型"""
    pass


class PeripheralUpdate(BaseModel):
    """更新外设请求模型"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    peripheral_type: Optional[str] = None
    device_path: Optional[str] = Field(None, min_length=1, max_length=255)
    enabled: Optional[bool] = None
    description: Optional[str] = None
    
    model_config = ConfigDict(extra="forbid")


class PeripheralResponse(PeripheralBase):
    """外设响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PeripheralSimpleResponse(BaseModel):
    """外设简单响应模型（用于下拉框）"""
    value: str = Field(..., description="外设设备路径（用于选择）")
    label: str = Field(..., description="显示标签")
    name: str = Field(..., description="外设名称")
    
    model_config = ConfigDict(from_attributes=True)

