"""
点表模板相关的 Pydantic Schemas
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator
import json


class PointTableTemplateBase(BaseModel):
    """点表模板基础模型"""
    name: str = Field(..., min_length=1, max_length=100, description="内部名")
    display_name: str = Field(..., min_length=1, max_length=200, description="显示名")
    protocol_type: str = Field(..., description="协议类型")
    description: str = Field(default="", description="描述")


class PointTableTemplateCreate(PointTableTemplateBase):
    """创建点表模板请求模型"""
    pass


class PointTableTemplateUpdate(BaseModel):
    """更新点表模板请求模型"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    protocol_type: Optional[str] = None
    description: Optional[str] = None
    
    model_config = ConfigDict(extra="forbid")


class PointTableTemplateCloneRequest(BaseModel):
    """复制点表模板请求模型"""
    name: str = Field(..., min_length=1, max_length=100, description="新内部名称")
    display_name: str = Field(..., min_length=1, max_length=200, description="新显示名称")
    protocol_type: Optional[str] = Field(None, description="覆盖协议类型")
    description: Optional[str] = Field(None, description="覆盖描述")


class PointTableTemplateResponse(PointTableTemplateBase):
    """点表模板响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime
    points_count: Optional[int] = Field(None, description="点数量")
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Point Table Point Schemas
# ============================================================================

class PointTablePointBase(BaseModel):
    """点表点基础模型"""
    point_name: str = Field(..., min_length=1, max_length=100, description="内部点名")
    display_name: str = Field(..., min_length=1, max_length=200, description="显示名")
    address: str = Field(..., min_length=1, max_length=50, description="寄存器/地址")
    io_type: str = Field(..., description="IO类型：AI/AO/DI/DO/STRING")
    raw_type: str = Field(..., description="原始数据类型")
    byte_order: str = Field(..., description="字节序")
    scale_k: float = Field(default=1.0, description="缩放系数k")
    scale_b: float = Field(default=0.0, description="缩放系数b")
    parse_rules_json: Dict[str, Any] = Field(default_factory=dict, description="解析规则JSON")
    description: str = Field(default="", description="描述")
    is_active: bool = Field(default=True, description="是否启用")
    
    @field_validator("io_type")
    @classmethod
    def validate_io_type(cls, v: str) -> str:
        """验证IO类型"""
        allowed = ["AI", "AO", "DI", "DO", "STRING"]
        if v not in allowed:
            raise ValueError(f"io_type 必须是 {allowed} 之一")
        return v
    
    @field_validator("byte_order")
    @classmethod
    def validate_byte_order(cls, v: str) -> str:
        """验证字节序"""
        allowed = ["BE", "LE", "BE_SWAP", "LE_SWAP"]
        if v not in allowed:
            raise ValueError(f"byte_order 必须是 {allowed} 之一")
        return v
    
    @field_validator("parse_rules_json", mode="before")
    @classmethod
    def parse_json(cls, v):
        """解析 parse_rules_json（可能是字符串或字典）"""
        if isinstance(v, str):
            try:
                return json.loads(v) if v else {}
            except json.JSONDecodeError:
                return {}
        return v or {}


class PointTablePointCreate(PointTablePointBase):
    """创建点表点请求模型"""
    pass


class PointTablePointUpdate(BaseModel):
    """更新点表点请求模型"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    address: Optional[str] = Field(None, min_length=1, max_length=50)
    io_type: Optional[str] = None
    raw_type: Optional[str] = None
    byte_order: Optional[str] = None
    scale_k: Optional[float] = None
    scale_b: Optional[float] = None
    parse_rules_json: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    
    model_config = ConfigDict(extra="forbid")


class PointTablePointCloneRequest(BaseModel):
    """复制点表点请求模型"""
    point_name: str = Field(..., min_length=1, max_length=100, description="新点名")
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    address: Optional[str] = Field(None, min_length=1, max_length=50)
    io_type: Optional[str] = None
    raw_type: Optional[str] = None
    byte_order: Optional[str] = None
    scale_k: Optional[float] = None
    scale_b: Optional[float] = None
    parse_rules_json: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    
    model_config = ConfigDict(extra="forbid")
    
    @field_validator("io_type")
    @classmethod
    def validate_io_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed = ["AI", "AO", "DI", "DO", "STRING"]
        if v not in allowed:
            raise ValueError(f"io_type 必须是 {allowed} 之一")
        return v
    
    @field_validator("byte_order")
    @classmethod
    def validate_byte_order(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed = ["BE", "LE", "BE_SWAP", "LE_SWAP"]
        if v not in allowed:
            raise ValueError(f"byte_order 必须是 {allowed} 之一")
        return v


class PointTablePointResponse(PointTablePointBase):
    """点表点响应模型"""
    id: int
    point_table_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class PointTableTemplateDetailResponse(PointTableTemplateResponse):
    """点表模板详情响应（包含点列表）"""
    points: List[PointTablePointResponse] = Field(default_factory=list)

