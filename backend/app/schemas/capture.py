"""
抓包任务Schema
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class CaptureTaskCreate(BaseModel):
    """创建抓包任务Schema"""
    name: str = Field(..., min_length=1, max_length=100, description="任务名称")
    interface: str = Field(..., min_length=1, max_length=50, description="网络接口")
    filter_expression: Optional[str] = Field(None, description="过滤表达式 (e.g. 'port 80')")
    duration: int = Field(..., ge=10, le=3600, description="持续时间（秒，10-3600）")
    packet_count: Optional[int] = Field(None, ge=1, le=1000000, description="最大抓包数量")


class CaptureTaskUpdate(BaseModel):
    """更新抓包任务Schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)


class CaptureTaskResponse(BaseModel):
    """抓包任务响应Schema"""
    id: int
    name: str
    interface: str
    filter_expression: Optional[str]
    duration: int
    packet_count: Optional[int]
    status: str
    pid: Optional[int]
    file_path: Optional[str]
    file_size: int
    actual_duration: int
    error_message: Optional[str]
    created_by: int
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    expires_at: datetime
    updated_at: datetime
    
    # 计算字段
    progress: Optional[int] = Field(None, description="进度百分比")
    can_download: bool = Field(False, description="是否可下载")
    can_stop: bool = Field(False, description="是否可停止")
    can_delete: bool = Field(True, description="是否可删除")
    
    model_config = {"from_attributes": True}


class CaptureTaskList(BaseModel):
    """抓包任务列表响应"""
    items: list[CaptureTaskResponse]
    total: int
    running_count: int = Field(0, description="运行中的任务数")

