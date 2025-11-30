"""
审计日志数据库模型
记录所有 POST/PUT/PATCH/DELETE 操作
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func

from app.database import Base


class AuditLog(Base):
    """
    审计日志表
    记录所有修改操作的详细信息
    """
    __tablename__ = "audit_logs"
    
    # 主键
    id = Column(Integer, primary_key=True, index=True, comment="日志ID")
    
    # 请求信息
    request_id = Column(
        String(36),
        nullable=True,
        index=True,
        comment="请求ID（UUID，用于追踪）"
    )
    method = Column(
        String(10),
        nullable=False,
        index=True,
        comment="HTTP方法（POST/PUT/PATCH/DELETE）"
    )
    path = Column(
        String(255),
        nullable=False,
        index=True,
        comment="API路径"
    )
    
    # 操作信息
    module = Column(
        String(50),
        nullable=False,
        index=True,
        comment="模块名称（auth/user/item等）"
    )
    action = Column(
        String(50),
        nullable=False,
        index=True,
        comment="操作类型（create/update/delete/login等）"
    )
    action_key = Column(
        String(100),
        nullable=True,
        comment="操作国际化键（用于i18n）"
    )
    
    # 用户信息
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="操作者ID"
    )
    username = Column(
        String(50),
        nullable=True,
        comment="操作者用户名（冗余字段，防止用户删除后无法追溯）"
    )
    user_role = Column(
        String(20),
        nullable=True,
        comment="操作者角色"
    )
    
    # 目标信息
    target_type = Column(
        String(50),
        nullable=True,
        comment="目标类型（user/item等）"
    )
    target_id = Column(
        String(50),
        nullable=True,
        index=True,
        comment="目标ID"
    )
    target_name = Column(
        String(255),
        nullable=True,
        comment="目标名称（便于查看）"
    )
    
    # 数据变更
    request_body = Column(
        JSON,
        nullable=True,
        comment="请求体（JSON格式）"
    )
    changes = Column(
        JSON,
        nullable=True,
        comment="变更内容（before/after对比）"
    )
    
    # 结果信息
    status_code = Column(
        Integer,
        nullable=False,
        comment="HTTP状态码"
    )
    success = Column(
        String(10),
        nullable=False,
        default="success",
        index=True,
        comment="操作结果（success/failed）"
    )
    error_message = Column(
        Text,
        nullable=True,
        comment="错误信息（如果失败）"
    )
    
    # 请求上下文
    ip_address = Column(
        String(45),
        nullable=True,
        comment="客户端IP地址（支持IPv6）"
    )
    user_agent = Column(
        String(500),
        nullable=True,
        comment="用户代理字符串"
    )
    locale = Column(
        String(10),
        nullable=True,
        comment="请求语言"
    )
    
    # 时间戳
    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
        index=True,
        comment="操作时间"
    )
    
    # 执行时长
    duration_ms = Column(
        Integer,
        nullable=True,
        comment="执行时长（毫秒）"
    )
    
    def __repr__(self):
        return (
            f"<AuditLog(id={self.id}, user={self.username}, "
            f"action={self.action}, target={self.target_type}:{self.target_id})>"
        )

