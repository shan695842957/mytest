"""端口转发规则 Schema"""
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, Literal
import ipaddress


class PortForwardingBase(BaseModel):
    """端口转发基础 Schema"""
    name: str = Field(..., min_length=1, max_length=100, description="规则名称")
    source_host: str = Field(default="0.0.0.0", description="源主机地址")
    source_port: int = Field(..., ge=1, le=65535, description="源端口")
    target_host: str = Field(..., min_length=1, max_length=255, description="目标主机地址")
    target_port: int = Field(..., ge=1, le=65535, description="目标端口")
    protocol: Literal["tcp", "udp"] = Field(default="tcp", description="协议类型")
    is_enabled: bool = Field(default=True, description="是否启用")

    @field_validator('source_host', 'target_host')
    @classmethod
    def validate_host(cls, v: str) -> str:
        """验证主机地址"""
        if v == "0.0.0.0" or v == "localhost":
            return v
        try:
            # 验证是否为合法 IP 地址
            ipaddress.ip_address(v)
        except ValueError:
            # 允许域名
            if not v.replace('.', '').replace('-', '').replace('_', '').isalnum():
                raise ValueError("Invalid host address")
        return v


class PortForwardingCreate(PortForwardingBase):
    """创建端口转发 Schema"""
    pass


class PortForwardingUpdate(BaseModel):
    """更新端口转发 Schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    source_host: Optional[str] = None
    source_port: Optional[int] = Field(None, ge=1, le=65535)
    target_host: Optional[str] = Field(None, min_length=1, max_length=255)
    target_port: Optional[int] = Field(None, ge=1, le=65535)
    protocol: Optional[Literal["tcp", "udp"]] = None
    is_enabled: Optional[bool] = None


class PortForwardingResponse(PortForwardingBase):
    """端口转发响应 Schema"""
    id: int
    status: str
    process_id: Optional[int]
    error_message: Optional[str]
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class BatchOperationRequest(BaseModel):
    """批量操作请求 Schema"""
    ids: list[int] = Field(..., min_length=1, description="规则 ID 列表")

