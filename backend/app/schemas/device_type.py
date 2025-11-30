"""
设备类型相关的 Pydantic Schemas
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator
import json


class DeviceTypeBase(BaseModel):
    """设备类型基础模型"""
    name: str = Field(..., min_length=1, max_length=100, description="内部名称")
    display_name: str = Field(..., min_length=1, max_length=200, description="显示名称")
    model: str = Field(default="", max_length=100, description="型号")
    manufacturer: str = Field(default="", max_length=100, description="厂家")
    description: str = Field(default="", description="描述")


class DeviceTypeCreate(DeviceTypeBase):
    """创建设备类型请求模型"""
    pass


class DeviceTypeUpdate(BaseModel):
    """更新设备类型请求模型"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    model: Optional[str] = Field(None, max_length=100)
    manufacturer: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    
    model_config = ConfigDict(extra="forbid")


class DeviceTypeCloneRequest(BaseModel):
    """复制设备类型请求模型"""
    name: str = Field(..., min_length=1, max_length=100, description="新内部名称")
    display_name: str = Field(..., min_length=1, max_length=200, description="新显示名称")
    model: Optional[str] = Field(None, max_length=100, description="覆盖型号")
    manufacturer: Optional[str] = Field(None, max_length=100, description="覆盖厂家")
    description: Optional[str] = Field(None, description="覆盖描述")


class DeviceTypeResponse(DeviceTypeBase):
    """设备类型响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime
    tags_count: Optional[int] = Field(None, description="业务字段数量")
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Device Type Tag Schemas
# ============================================================================

class DeviceTypeTagBase(BaseModel):
    """业务字段基础模型"""
    tag_name: str = Field(..., min_length=1, max_length=100, description="内部字段名")
    display_name: str = Field(..., min_length=1, max_length=200, description="显示名")
    data_type: str = Field(..., description="数据类型：BOOL/INT/FLOAT/ENUM")
    semantic_type: str = Field(..., description="语义类型")
    engineering_unit: str = Field(default="", max_length=50, description="工程单位")
    group_name: str = Field(default="", max_length=100, description="UI分组")
    severity: int = Field(default=0, ge=0, le=5, description="严重性：0~5")
    description: str = Field(default="", description="描述")
    enum_json: Dict[str, Any] = Field(default_factory=dict, description="ENUM值映射")
    
    @field_validator("data_type")
    @classmethod
    def validate_data_type(cls, v: str) -> str:
        """验证数据类型"""
        allowed = ["BOOL", "INT", "FLOAT", "ENUM"]
        if v not in allowed:
            raise ValueError(f"data_type 必须是 {allowed} 之一")
        return v
    
    @field_validator("semantic_type")
    @classmethod
    def validate_semantic_type(cls, v: str) -> str:
        """验证语义类型"""
        allowed = ["MEASURE", "STATUS", "ACCUM", "PARAM", "SETPOINT", "COMMAND", "PARAM_SET"]
        if v not in allowed:
            raise ValueError(f"semantic_type 必须是 {allowed} 之一")
        return v
    
    @field_validator("enum_json", mode="before")
    @classmethod
    def parse_enum_json(cls, v):
        """解析 enum_json（可能是字符串或字典）"""
        if isinstance(v, str):
            try:
                return json.loads(v) if v else {}
            except json.JSONDecodeError:
                return {}
        return v or {}


class DeviceTypeTagCreate(DeviceTypeTagBase):
    """创建业务字段请求模型"""
    pass


class DeviceTypeTagUpdate(BaseModel):
    """更新业务字段请求模型"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    data_type: Optional[str] = None
    semantic_type: Optional[str] = None
    engineering_unit: Optional[str] = Field(None, max_length=50)
    group_name: Optional[str] = Field(None, max_length=100)
    severity: Optional[int] = Field(None, ge=0, le=5)
    description: Optional[str] = None
    enum_json: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(extra="forbid")


class DeviceTypeTagCloneRequest(BaseModel):
    """复制业务字段请求模型"""
    tag_name: str = Field(..., min_length=1, max_length=100, description="新字段名")
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    data_type: Optional[str] = None
    semantic_type: Optional[str] = None
    engineering_unit: Optional[str] = Field(None, max_length=50)
    group_name: Optional[str] = Field(None, max_length=100)
    severity: Optional[int] = Field(None, ge=0, le=5)
    description: Optional[str] = None
    enum_json: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(extra="forbid")
    
    @field_validator("data_type")
    @classmethod
    def validate_data_type(cls, v: Optional[str]) -> Optional[str]:
        """验证数据类型"""
        if v is None:
            return v
        allowed = ["BOOL", "INT", "FLOAT", "ENUM"]
        if v not in allowed:
            raise ValueError(f"data_type 必须是 {allowed} 之一")
        return v
    
    @field_validator("semantic_type")
    @classmethod
    def validate_semantic_type(cls, v: Optional[str]) -> Optional[str]:
        """验证语义类型"""
        if v is None:
            return v
        allowed = ["MEASURE", "STATUS", "ACCUM", "PARAM", "SETPOINT", "COMMAND", "PARAM_SET"]
        if v not in allowed:
            raise ValueError(f"semantic_type 必须是 {allowed} 之一")
        return v


class DeviceTypeTagResponse(DeviceTypeTagBase):
    """业务字段响应模型"""
    id: int
    device_type_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class DeviceTypeDetailResponse(DeviceTypeResponse):
    """设备类型详情响应（包含业务字段列表）"""
    tags: List[DeviceTypeTagResponse] = Field(default_factory=list)

