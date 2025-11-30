"""
审计日志相关的 Pydantic Schemas
"""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class AuditLogBase(BaseModel):
    """审计日志基础模型"""
    request_id: Optional[str] = Field(None, description="请求ID")
    method: str = Field(..., description="HTTP方法")
    path: str = Field(..., description="API路径")
    module: str = Field(..., description="模块名称")
    action: str = Field(..., description="操作类型")
    action_key: Optional[str] = Field(None, description="操作国际化键")


class AuditLogResponse(AuditLogBase):
    """审计日志响应模型"""
    id: int = Field(..., description="日志ID")
    
    # 用户信息
    user_id: Optional[int] = Field(None, description="操作者ID")
    username: Optional[str] = Field(None, description="操作者用户名")
    user_role: Optional[str] = Field(None, description="操作者角色")
    
    # 目标信息
    target_type: Optional[str] = Field(None, description="目标类型")
    target_id: Optional[str] = Field(None, description="目标ID")
    target_name: Optional[str] = Field(None, description="目标名称")
    
    # 数据变更
    request_body: Optional[Dict[str, Any]] = Field(None, description="请求体")
    changes: Optional[Dict[str, Any]] = Field(None, description="变更内容")
    
    # 结果信息
    status_code: int = Field(..., description="HTTP状态码")
    success: str = Field(..., description="操作结果")
    error_message: Optional[str] = Field(None, description="错误信息")
    
    # 请求上下文
    ip_address: Optional[str] = Field(None, description="客户端IP")
    user_agent: Optional[str] = Field(None, description="用户代理")
    locale: Optional[str] = Field(None, description="请求语言")
    
    # 时间戳
    created_at: datetime = Field(..., description="操作时间")
    duration_ms: Optional[int] = Field(None, description="执行时长（毫秒）")
    
    # ⭐ 业务操作显示名称（翻译后的）
    action_display: Optional[str] = Field(None, description="操作显示名称（已翻译）")
    module_display: Optional[str] = Field(None, description="模块显示名称（已翻译）")
    target_type_display: Optional[str] = Field(None, description="目标类型显示名称（已翻译）")
    
    model_config = ConfigDict(from_attributes=True)


class AuditLogQueryParams(BaseModel):
    """审计日志查询参数"""
    skip: int = Field(0, ge=0, description="跳过记录数")
    limit: int = Field(100, ge=1, le=1000, description="限制记录数")
    
    # 筛选条件
    user_id: Optional[int] = Field(None, description="按操作者筛选")
    module: Optional[str] = Field(None, description="按模块筛选")
    action: Optional[str] = Field(None, description="按操作类型筛选")
    target_type: Optional[str] = Field(None, description="按目标类型筛选")
    target_id: Optional[str] = Field(None, description="按目标ID筛选")
    success: Optional[str] = Field(None, description="按结果筛选（success/failed）")
    
    # 时间范围
    start_time: Optional[datetime] = Field(None, description="开始时间")
    end_time: Optional[datetime] = Field(None, description="结束时间")

