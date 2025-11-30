"""
用户相关的 Pydantic Schemas
用于请求验证和响应序列化
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.models.user import UserRole as UserRoleEnum


# 重新导出枚举供外部使用
UserRole = UserRoleEnum


class UserBase(BaseModel):
    """用户基础模型"""
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    role: UserRole = Field(..., description="角色：developer/operator/user")
    is_active: bool = Field(True, description="是否激活")


class UserCreate(BaseModel):
    """创建用户请求模型"""
    username: str = Field(..., min_length=3, max_length=50, description="用户名")
    password: str = Field(..., min_length=6, max_length=50, description="密码")
    role: UserRole = Field(..., description="角色：developer/operator/user")
    
    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        """验证用户名只包含字母、数字、下划线"""
        if not v.replace("_", "").isalnum():
            raise ValueError("用户名只能包含字母、数字和下划线")
        return v
    
    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """验证密码强度"""
        if len(v) < 6:
            raise ValueError("密码长度至少6位")
        # 生产环境可以添加更复杂的密码策略
        return v


class UserUpdate(BaseModel):
    """更新用户请求模型"""
    is_active: Optional[bool] = Field(None, description="是否激活")
    
    model_config = ConfigDict(extra="forbid")  # 禁止额外字段


class UserInDB(UserBase):
    """数据库中的用户模型（内部使用）"""
    id: int
    hashed_password: str
    is_builtin: bool
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserBase):
    """用户响应模型（API 返回）"""
    id: int = Field(..., description="用户ID")
    is_builtin: bool = Field(..., description="是否为内置账号")
    created_by: Optional[int] = Field(None, description="创建者ID")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")
    
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """JWT Token 响应模型"""
    access_token: str = Field(..., description="访问令牌")
    token_type: str = Field("bearer", description="令牌类型")
    expires_in: int = Field(..., description="过期时间（秒）")
    user: "UserResponse" = Field(..., description="用户信息（包含 role）")


class TokenData(BaseModel):
    """Token 解码后的数据"""
    user_id: int
    username: str
    role: UserRole


class LoginRequest(BaseModel):
    """登录请求模型"""
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class ChangePasswordRequest(BaseModel):
    """修改密码请求模型"""
    old_password: str = Field(..., description="旧密码")
    new_password: str = Field(..., min_length=6, max_length=50, description="新密码")
    
    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """验证密码强度"""
        if len(v) < 6:
            raise ValueError("密码长度至少6位")
        return v

