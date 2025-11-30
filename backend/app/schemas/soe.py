"""
SOE 事件相关的 Pydantic Schemas
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator
import json


class SOEEventBase(BaseModel):
    """SOE事件基础模型"""
    asset_tag_name: str = Field(..., description="业务字段名")
    event_type: str = Field(..., description="事件类型")
    severity: int = Field(..., ge=0, le=5, description="严重性：0~5")
    value_num: Optional[float] = Field(None, description="数值")
    value_text: str = Field(default="", description="文本值")
    source_instance_id: Optional[int] = Field(None, description="源通信实例ID")
    source_point_name: Optional[str] = Field(None, description="源点表点名")
    extra_json: Dict[str, Any] = Field(default_factory=dict, description="扩展信息JSON")
    
    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v: str) -> str:
        """验证事件类型"""
        allowed = ["ALARM_ON", "ALARM_OFF", "STATE_CHANGE", "CMD_SENT", "CMD_FAIL", "PARAM_CHANGE", "SETPOINT_CHANGE"]
        if v not in allowed:
            raise ValueError(f"event_type 必须是 {allowed} 之一")
        return v
    
    @field_validator("extra_json", mode="before")
    @classmethod
    def parse_extra_json(cls, v):
        """解析 extra_json（可能是字符串或字典）"""
        if isinstance(v, str):
            try:
                return json.loads(v) if v else {}
            except json.JSONDecodeError:
                return {}
        return v or {}


class SOEEventCreate(SOEEventBase):
    """创建SOE事件请求模型"""
    asset_id: int = Field(..., description="资产ID")


class SOEEventResponse(SOEEventBase):
    """SOE事件响应模型"""
    id: int
    asset_id: int
    created_at: datetime
    inserted_at: datetime
    asset_name: Optional[str] = Field(None, description="资产名称")
    asset_display_name: Optional[str] = Field(None, description="资产显示名")
    tag_display_name: Optional[str] = Field(None, description="业务字段显示名")
    
    model_config = ConfigDict(from_attributes=True)


class SOEEventQueryParams(BaseModel):
    """SOE事件查询参数"""
    from_time: Optional[datetime] = Field(None, description="开始时间")
    to_time: Optional[datetime] = Field(None, description="结束时间")
    asset_ids: Optional[List[int]] = Field(default_factory=list, description="资产ID列表")
    severity: Optional[List[int]] = Field(default_factory=list, description="严重性列表（0~5）")
    event_types: Optional[List[str]] = Field(default_factory=list, description="事件类型列表")
    search: Optional[str] = Field(None, description="关键字搜索")
    skip: int = Field(0, ge=0, description="跳过记录数")
    limit: int = Field(20, ge=1, le=1000, description="每页记录数")

