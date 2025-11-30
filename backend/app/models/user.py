"""
用户数据库模型
"""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func

from app.database import Base


class UserRole(str, enum.Enum):
    """
    用户角色枚举（权限级别从高到低）
    """
    DEVELOPER = "developer"  # 开发者（最高权限）
    OPERATOR = "operator"    # 运维者（中等权限）
    USER = "user"            # 用户（基础权限）
    
    @property
    def level(self) -> int:
        """
        获取角色权限级别（数字越大权限越高）
        用于权限比较：developer(3) > operator(2) > user(1)
        """
        levels = {
            UserRole.DEVELOPER: 3,
            UserRole.OPERATOR: 2,
            UserRole.USER: 1
        }
        return levels[self]
    
    def can_manage(self, other: "UserRole") -> bool:
        """判断当前角色是否可以管理目标角色"""
        return self.level > other.level


class User(Base):
    """
    用户表
    """
    __tablename__ = "users"
    
    # 主键
    id = Column(Integer, primary_key=True, index=True, comment="用户ID")
    
    # 基础信息
    username = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
        comment="用户名（唯一）"
    )
    hashed_password = Column(
        String(255),
        nullable=False,
        comment="密码哈希值"
    )
    role = Column(
        Enum(UserRole, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
        comment="角色：developer/operator/user"
    )
    
    # 特殊标记
    is_builtin = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="是否为内置账号（内置账号不可删除）"
    )
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        comment="是否激活"
    )
    
    # 审计字段
    created_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="创建者ID（内置账号为NULL）"
    )
    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
        comment="创建时间"
    )
    updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="更新时间"
    )
    
    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, role={self.role})>"

