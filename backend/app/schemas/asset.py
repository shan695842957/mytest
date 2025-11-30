"""
资产和映射相关的 Pydantic Schemas
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator
import json


class AssetBase(BaseModel):
    """资产基础模型"""
    name: str = Field(..., min_length=1, max_length=100, description="内部名")
    display_name: str = Field(..., min_length=1, max_length=200, description="显示名")
    device_type_id: int = Field(..., description="设备类型ID")
    location: str = Field(default="", max_length=200, description="位置")
    enabled: bool = Field(default=True, description="是否启用")
    metadata_json: Dict[str, Any] = Field(default_factory=dict, description="自定义元数据JSON")
    
    @field_validator("metadata_json", mode="before")
    @classmethod
    def parse_metadata_json(cls, v):
        """解析 metadata_json（可能是字符串或字典）"""
        if isinstance(v, str):
            try:
                return json.loads(v) if v else {}
            except json.JSONDecodeError:
                return {}
        return v or {}


class AssetCreate(AssetBase):
    """创建资产请求模型"""
    comm_instance_ids: Optional[List[int]] = Field(default_factory=list, description="关联的通信实例ID列表")


class AssetUpdate(BaseModel):
    """更新资产请求模型"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    device_type_id: Optional[int] = None
    location: Optional[str] = Field(None, max_length=200)
    enabled: Optional[bool] = None
    metadata_json: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(extra="forbid")


class AssetResponse(AssetBase):
    """资产响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime
    device_type_name: Optional[str] = Field(None, description="设备类型名称")
    device_type_display_name: Optional[str] = Field(None, description="设备类型显示名")
    comm_instance_ids: List[int] = Field(default_factory=list, description="已绑定的通信实例ID")
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Asset Mapping Schemas
# ============================================================================

class AssetMappingBase(BaseModel):
    """资产映射基础模型"""
    asset_tag_name: str = Field(..., min_length=1, max_length=100, description="业务字段名")
    instance_id: int = Field(..., description="通信实例ID")
    point_name: Optional[str] = Field(None, min_length=1, max_length=150, description="点名（可包含子点，例如 StatusWord4.mode_code），未映射时为 None")
    is_overridden: bool = Field(default=False, description="是否覆盖自动映射")


class AssetMappingCreate(BaseModel):
    """创建资产映射请求模型"""
    asset_tag_name: str = Field(..., min_length=1, max_length=100, description="业务字段名")
    instance_id: int = Field(..., description="通信实例ID")
    point_name: str = Field(..., min_length=1, max_length=150, description="点名（可包含子点，例如 StatusWord4.mode_code）")
    is_overridden: bool = Field(default=False, description="是否覆盖自动映射")


class AssetMappingUpdate(BaseModel):
    """更新资产映射请求模型"""
    instance_id: Optional[int] = None
    point_name: Optional[str] = Field(None, min_length=1, max_length=150)
    is_overridden: Optional[bool] = None
    
    model_config = ConfigDict(extra="forbid")


class AssetMappingResponse(AssetMappingBase):
    """资产映射响应模型"""
    id: int
    asset_id: int
    created_at: datetime
    updated_at: datetime
    instance_name: Optional[str] = Field(None, description="通信实例名称")
    instance_display_name: Optional[str] = Field(None, description="通信实例显示名")
    tag_display_name: Optional[str] = Field(None, description="业务字段显示名")
    
    model_config = ConfigDict(from_attributes=True)


class AssetMappingDetailResponse(AssetMappingResponse):
    """资产映射详情响应（包含更多信息）"""
    tag_semantic_type: Optional[str] = Field(None, description="业务字段语义类型")
    tag_data_type: Optional[str] = Field(None, description="业务字段数据类型")
    point_address: Optional[str] = Field(None, description="点表地址")
    point_raw_type: Optional[str] = Field(None, description="点表原始类型")
    tag_group_name: Optional[str] = Field(None, description="业务字段分组")


class AssetDetailResponse(AssetResponse):
    """资产详情响应（包含映射列表）"""
    mappings: List[AssetMappingResponse] = Field(default_factory=list)


class AssetBindingSyncRequest(BaseModel):
    """资产通信实例绑定同步请求"""
    comm_instance_ids: List[int] = Field(default_factory=list, description="通信实例ID列表")

