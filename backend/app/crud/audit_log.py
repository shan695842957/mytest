"""
审计日志 CRUD 操作
"""

from typing import List, Optional
from datetime import datetime
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditLogCRUD:
    """审计日志数据库操作类"""
    
    async def get_by_id(self, db: AsyncSession, log_id: int) -> Optional[AuditLog]:
        """根据 ID 获取审计日志"""
        result = await db.execute(
            select(AuditLog).where(AuditLog.id == log_id)
        )
        return result.scalar_one_or_none()
    
    async def get_multi(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[int] = None,
        module: Optional[str] = None,
        action: Optional[str] = None,
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        success: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        allowed_roles: Optional[List[str]] = None
    ) -> List[AuditLog]:
        """
        获取审计日志列表
        
        Args:
            db: 数据库会话
            skip: 跳过记录数
            limit: 限制记录数
            user_id: 按操作者筛选
            module: 按模块筛选
            action: 按操作类型筛选
            target_type: 按目标类型筛选
            target_id: 按目标ID筛选
            success: 按结果筛选
            start_time: 开始时间
            end_time: 结束时间
            allowed_roles: 允许查看的角色列表（用于权限控制）
        """
        query = select(AuditLog)
        
        # 构建筛选条件
        conditions = []
        
        if user_id is not None:
            conditions.append(AuditLog.user_id == user_id)
        if module:
            conditions.append(AuditLog.module == module)
        if action:
            conditions.append(AuditLog.action == action)
        if target_type:
            conditions.append(AuditLog.target_type == target_type)
        if target_id:
            conditions.append(AuditLog.target_id == target_id)
        if success:
            conditions.append(AuditLog.success == success)
        if start_time:
            conditions.append(AuditLog.created_at >= start_time)
        if end_time:
            conditions.append(AuditLog.created_at <= end_time)
        
        # ⭐ 角色权限过滤：只能查看允许的角色的审计日志
        # 注意：user_role 为 NULL 的记录（如登录操作）暂时允许所有角色查看
        # TODO: 后续应该修复审计日志记录方式，让登录操作也记录正确的 user_role
        if allowed_roles:
            from sqlalchemy import or_
            conditions.append(
                or_(
                    AuditLog.user_role.in_(allowed_roles),
                    AuditLog.user_role.is_(None)  # 所有角色都能看到 NULL 记录
                )
            )
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # 按时间倒序排列
        query = query.order_by(AuditLog.created_at.desc())
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    async def count(
        self,
        db: AsyncSession,
        user_id: Optional[int] = None,
        module: Optional[str] = None,
        action: Optional[str] = None,
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        success: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        allowed_roles: Optional[List[str]] = None
    ) -> int:
        """
        统计审计日志数量
        
        Args:
            allowed_roles: 允许查看的角色列表（用于权限控制）
        """
        query = select(func.count(AuditLog.id))
        
        # 构建筛选条件
        conditions = []
        
        if user_id is not None:
            conditions.append(AuditLog.user_id == user_id)
        if module:
            conditions.append(AuditLog.module == module)
        if action:
            conditions.append(AuditLog.action == action)
        if target_type:
            conditions.append(AuditLog.target_type == target_type)
        if target_id:
            conditions.append(AuditLog.target_id == target_id)
        if success:
            conditions.append(AuditLog.success == success)
        if start_time:
            conditions.append(AuditLog.created_at >= start_time)
        if end_time:
            conditions.append(AuditLog.created_at <= end_time)
        
        # ⭐ 角色权限过滤：只能查看允许的角色的审计日志
        # 注意：user_role 为 NULL 的记录（如登录操作）暂时允许所有角色查看
        # TODO: 后续应该修复审计日志记录方式，让登录操作也记录正确的 user_role
        if allowed_roles:
            from sqlalchemy import or_
            conditions.append(
                or_(
                    AuditLog.user_role.in_(allowed_roles),
                    AuditLog.user_role.is_(None)  # 所有角色都能看到 NULL 记录
                )
            )
        
        if conditions:
            query = query.where(and_(*conditions))
        
        result = await db.execute(query)
        return result.scalar_one()
    
    async def get_by_target(
        self,
        db: AsyncSession,
        target_type: str,
        target_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[AuditLog]:
        """
        获取指定目标的所有操作历史
        
        Args:
            db: 数据库会话
            target_type: 目标类型
            target_id: 目标ID
            skip: 跳过记录数
            limit: 限制记录数
        """
        result = await db.execute(
            select(AuditLog)
            .where(
                and_(
                    AuditLog.target_type == target_type,
                    AuditLog.target_id == target_id
                )
            )
            .order_by(AuditLog.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())


# 全局实例
audit_log_crud = AuditLogCRUD()

