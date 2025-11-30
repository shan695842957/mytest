"""端口转发规则 CRUD 操作"""
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.models.port_forwarding import PortForwardingRule
from app.schemas.port_forwarding import PortForwardingCreate, PortForwardingUpdate


class PortForwardingCRUD:
    """端口转发 CRUD 操作"""
    
    async def get_by_id(self, db: AsyncSession, rule_id: int) -> Optional[PortForwardingRule]:
        """根据 ID 获取规则"""
        result = await db.execute(select(PortForwardingRule).where(PortForwardingRule.id == rule_id))
        return result.scalar_one_or_none()
    
    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[PortForwardingRule]:
        """根据名称获取规则"""
        result = await db.execute(select(PortForwardingRule).where(PortForwardingRule.name == name))
        return result.scalar_one_or_none()
    
    async def get_by_source_port(self, db: AsyncSession, source_port: int, exclude_id: Optional[int] = None) -> Optional[PortForwardingRule]:
        """根据源端口获取运行中的规则"""
        query = select(PortForwardingRule).where(
            PortForwardingRule.source_port == source_port,
            PortForwardingRule.status == "running"
        )
        if exclude_id:
            query = query.where(PortForwardingRule.id != exclude_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_multi(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        keyword: Optional[str] = None,
        protocol: Optional[str] = None,
        status: Optional[str] = None,
        is_enabled: Optional[bool] = None
    ) -> tuple[List[PortForwardingRule], int]:
        """获取规则列表"""
        query = select(PortForwardingRule)
        count_query = select(func.count(PortForwardingRule.id))
        
        # 关键词搜索
        if keyword:
            search_filter = or_(
                PortForwardingRule.name.ilike(f"%{keyword}%"),
                PortForwardingRule.target_host.ilike(f"%{keyword}%")
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)
        
        # 协议筛选
        if protocol:
            query = query.where(PortForwardingRule.protocol == protocol)
            count_query = count_query.where(PortForwardingRule.protocol == protocol)
        
        # 状态筛选
        if status:
            query = query.where(PortForwardingRule.status == status)
            count_query = count_query.where(PortForwardingRule.status == status)
        
        # 启用状态筛选
        if is_enabled is not None:
            query = query.where(PortForwardingRule.is_enabled == is_enabled)
            count_query = count_query.where(PortForwardingRule.is_enabled == is_enabled)
        
        # 获取总数
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # 获取列表
        query = query.offset(skip).limit(limit).order_by(PortForwardingRule.created_at.desc())
        result = await db.execute(query)
        rules = result.scalars().all()
        
        return list(rules), total
    
    async def get_enabled_rules(self, db: AsyncSession) -> List[PortForwardingRule]:
        """获取所有已启用的规则"""
        result = await db.execute(
            select(PortForwardingRule).where(PortForwardingRule.is_enabled == True)
        )
        return list(result.scalars().all())
    
    async def create(
        self,
        db: AsyncSession,
        rule_in: PortForwardingCreate,
        creator_id: int
    ) -> PortForwardingRule:
        """创建规则"""
        rule = PortForwardingRule(
            **rule_in.model_dump(),
            created_by=creator_id
        )
        db.add(rule)
        await db.commit()
        await db.refresh(rule)
        return rule
    
    async def update(
        self,
        db: AsyncSession,
        rule: PortForwardingRule,
        rule_in: PortForwardingUpdate
    ) -> PortForwardingRule:
        """更新规则"""
        update_data = rule_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(rule, field, value)
        await db.commit()
        await db.refresh(rule)
        return rule
    
    async def update_status(
        self,
        db: AsyncSession,
        rule: PortForwardingRule,
        status: str,
        process_id: Optional[int] = None,
        error_message: Optional[str] = None
    ) -> PortForwardingRule:
        """更新规则状态"""
        rule.status = status
        rule.process_id = process_id
        rule.error_message = error_message
        await db.commit()
        await db.refresh(rule)
        return rule
    
    async def delete(self, db: AsyncSession, rule: PortForwardingRule) -> None:
        """删除规则"""
        await db.delete(rule)
        await db.commit()


# 全局实例
port_forwarding_crud = PortForwardingCRUD()

