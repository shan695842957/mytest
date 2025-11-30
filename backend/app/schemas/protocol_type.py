"""
协议类型相关的 Pydantic Schemas
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict, field_validator
import json


class ProtocolTypeParamBase(BaseModel):
    """协议参数基础模型"""
    param_name: str = Field(..., min_length=1, max_length=100, description="参数名称")
    display_name: str = Field(..., min_length=1, max_length=200, description="显示名称")
    data_type: str = Field(..., description="参数数据类型：string/integer/float/boolean/enum")
    required: bool = Field(default=True, description="是否必填")
    default_value: Optional[str] = Field(None, description="默认值")
    description: str = Field(default="", description="参数描述")
    constraints_json: Dict[str, Any] = Field(default_factory=dict, description="约束信息JSON")
    order_index: int = Field(default=0, ge=0, description="排序索引")
    placeholder: Optional[str] = Field(None, description="占位符文本")
    input_type: str = Field(default="text", description="输入类型：text/number/select/peripheral")
    peripheral_type: Optional[str] = Field(None, description="外设类型（仅当 input_type='peripheral' 时使用）：serial/can/spi/i2c等")
    
    @field_validator("constraints_json", mode="before")
    @classmethod
    def parse_constraints_json(cls, v):
        """解析 constraints_json（可能是字符串或字典）"""
        if isinstance(v, str):
            try:
                return json.loads(v) if v else {}
            except json.JSONDecodeError:
                return {}
        return v or {}


class ProtocolTypeParamCreate(ProtocolTypeParamBase):
    """创建协议参数请求模型"""
    pass


class ProtocolTypeParamUpdate(BaseModel):
    """更新协议参数请求模型"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    data_type: Optional[str] = None
    required: Optional[bool] = None
    default_value: Optional[str] = None
    description: Optional[str] = None
    constraints_json: Optional[Dict[str, Any]] = None
    order_index: Optional[int] = Field(None, ge=0)
    placeholder: Optional[str] = None
    input_type: Optional[str] = None
    peripheral_type: Optional[str] = None
    
    model_config = ConfigDict(extra="forbid")


class ProtocolTypeParamResponse(ProtocolTypeParamBase):
    """协议参数响应模型"""
    id: int
    protocol_type_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ProtocolTypeBase(BaseModel):
    """协议类型基础模型"""
    name: str = Field(..., min_length=1, max_length=50, description="协议内部名称（唯一）")
    display_name: str = Field(..., min_length=1, max_length=200, description="显示名称")
    enabled: bool = Field(default=True, description="是否启用")
    description: str = Field(default="", description="描述信息")


class ProtocolTypeCreate(ProtocolTypeBase):
    """创建协议类型请求模型"""
    params: Optional[List[ProtocolTypeParamCreate]] = Field(default_factory=list, description="协议参数列表")


class ProtocolTypeUpdate(BaseModel):
    """更新协议类型请求模型"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    enabled: Optional[bool] = None
    description: Optional[str] = None
    
    model_config = ConfigDict(extra="forbid")


class ProtocolTypeResponse(ProtocolTypeBase):
    """协议类型响应模型（不包含参数列表）"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ProtocolTypeDetailResponse(ProtocolTypeBase):
    """协议类型详情响应模型（包含参数列表）"""
    id: int
    created_at: datetime
    updated_at: datetime
    params: List[ProtocolTypeParamResponse] = Field(default_factory=list, description="协议参数列表")
    
    model_config = ConfigDict(from_attributes=True)


class ProtocolTypeSimpleResponse(BaseModel):
    """协议类型简单响应模型（用于下拉框）"""
    value: str = Field(..., description="协议类型名称（用于选择）")
    label: str = Field(..., description="显示标签")
    
    model_config = ConfigDict(from_attributes=True)


class ProtocolTypeWithParamsResponse(BaseModel):
    """协议类型及参数响应模型（用于创建通信实例）"""
    value: str = Field(..., description="协议类型名称")
    label: str = Field(..., description="显示标签")
    params: List[Dict[str, Any]] = Field(default_factory=list, description="参数定义列表")
    
    model_config = ConfigDict(from_attributes=True)

