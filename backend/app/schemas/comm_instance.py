"""
通信实例相关的 Pydantic Schemas
"""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator
import json


class CommInstanceBase(BaseModel):
    """通信实例基础模型"""
    name: str = Field(..., min_length=1, max_length=100, description="内部ID")
    display_name: str = Field(..., min_length=1, max_length=200, description="显示名")
    enabled: bool = Field(default=True, description="是否启用")
    point_table_id: int = Field(..., description="点表模板ID")
    protocol_type: str = Field(..., description="协议类型")
    protocol_config: Dict[str, Any] = Field(..., description="协议配置JSON")
    polling_interval_ms: int = Field(..., gt=0, description="轮询周期(ms)")
    timeout_ms: int = Field(..., gt=0, description="超时(ms)")
    retries: int = Field(..., ge=0, description="重试次数")
    
    @field_validator("protocol_config", mode="before")
    @classmethod
    def parse_protocol_config(cls, v):
        """解析 protocol_config（可能是字符串或字典）"""
        if isinstance(v, str):
            try:
                return json.loads(v) if v else {}
            except json.JSONDecodeError:
                return {}
        return v or {}


class CommInstanceCreate(CommInstanceBase):
    """创建通信实例请求模型"""
    pass


class CommInstanceUpdate(BaseModel):
    """更新通信实例请求模型"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    enabled: Optional[bool] = None
    point_table_id: Optional[int] = None
    protocol_type: Optional[str] = None
    protocol_config: Optional[Dict[str, Any]] = None
    polling_interval_ms: Optional[int] = Field(None, gt=0)
    timeout_ms: Optional[int] = Field(None, gt=0)
    retries: Optional[int] = Field(None, ge=0)
    
    model_config = ConfigDict(extra="forbid")


class CommInstanceResponse(CommInstanceBase):
    """通信实例响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime
    point_table_name: Optional[str] = Field(None, description="点表模板名称")
    point_table_display_name: Optional[str] = Field(None, description="点表模板显示名")
    
    model_config = ConfigDict(from_attributes=True)

