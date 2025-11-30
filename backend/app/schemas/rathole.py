"""Rathole 配置 Schema"""
from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime


class RatholeGlobalConfig(BaseModel):
    """Rathole 全局配置"""
    remote_addr: str = Field(..., description="远程服务器地址", example="mg.relectric.cn:26667")
    config_path: str = Field(default="/etc/rathole/client.toml", description="配置文件路径")


class RatholeService(BaseModel):
    """Rathole 服务配置"""
    service_name: str
    token: str
    local_addr: str
    description: Optional[str] = None


class RatholeServiceCreate(BaseModel):
    """创建 Rathole 服务"""
    service_name: str = Field(..., min_length=1, max_length=100, description="服务名称")
    token: str = Field(..., min_length=1, description="认证 Token")
    local_addr: str = Field(..., description="本地地址", example="127.0.0.1:22")
    description: Optional[str] = Field(None, description="服务描述")


class RatholeServiceUpdate(BaseModel):
    """更新 Rathole 服务"""
    service_name: Optional[str] = Field(None, min_length=1, max_length=100)
    token: Optional[str] = None
    local_addr: Optional[str] = None
    description: Optional[str] = None


class RatholeConfigResponse(BaseModel):
    """Rathole 配置响应"""
    remote_addr: str
    config_path: str
    services: Dict[str, RatholeService]
    service_count: int


class RatholeServiceResponse(RatholeService):
    """Rathole 服务响应（包含服务名称）"""
    pass


class RatholeBackupInfo(BaseModel):
    """备份文件信息"""
    filename: str
    timestamp: str
    size: int
    created_at: datetime


class RatholeServiceStatus(BaseModel):
    """Rathole 服务状态"""
    status: str  # active/inactive/failed/unknown
    is_active: bool
    pid: Optional[int]
    uptime: Optional[str]
    memory_usage: Optional[str]

