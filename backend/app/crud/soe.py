"""
SOE 事件 CRUD 操作
"""

from typing import List, Optional, Tuple
from datetime import datetime
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.soe import SOEEvent
from app.models.asset import Asset
from app.models.device_type import DeviceTypeTag
from app.schemas.soe import SOEEventCreate, SOEEventQueryParams
import json


class SOECRUD:
    """SOE事件数据库操作类"""
    
    async def get_by_id(self, db: AsyncSession, event_id: int) -> Optional[SOEEvent]:
        """根据 ID 获取SOE事件"""
        result = await db.execute(
            select(SOEEvent).where(SOEEvent.id == event_id)
        )
        return result.scalar_one_or_none()
    
    async def get_multi(
        self,
        db: AsyncSession,
        params: SOEEventQueryParams
    ) -> Tuple[List[SOEEvent], int]:
        """
        获取SOE事件列表（带过滤）
        
        Returns:
            (事件列表, 总数)
        """
        query = select(SOEEvent)
        count_query = select(func.count(SOEEvent.id))
        
        # 时间范围过滤
        if params.from_time:
            query = query.where(SOEEvent.created_at >= params.from_time)
            count_query = count_query.where(SOEEvent.created_at >= params.from_time)
        if params.to_time:
            query = query.where(SOEEvent.created_at <= params.to_time)
            count_query = count_query.where(SOEEvent.created_at <= params.to_time)
        
        # 资产ID过滤
        if params.asset_ids:
            query = query.where(SOEEvent.asset_id.in_(params.asset_ids))
            count_query = count_query.where(SOEEvent.asset_id.in_(params.asset_ids))
        
        # 严重性过滤
        if params.severity:
            query = query.where(SOEEvent.severity.in_(params.severity))
            count_query = count_query.where(SOEEvent.severity.in_(params.severity))
        
        # 事件类型过滤
        if params.event_types:
            query = query.where(SOEEvent.event_type.in_(params.event_types))
            count_query = count_query.where(SOEEvent.event_type.in_(params.event_types))
        
        # 关键字搜索（搜索 value_text）
        if params.search:
            search_filter = SOEEvent.value_text.contains(params.search)
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)
        
        # 获取总数
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # 获取列表（按时间倒序）
        query = query.order_by(SOEEvent.created_at.desc()).offset(params.skip).limit(params.limit)
        result = await db.execute(query)
        events = list(result.scalars().all())
        
        return events, total
    
    async def create(
        self,
        db: AsyncSession,
        event_in: SOEEventCreate
    ) -> SOEEvent:
        """创建SOE事件"""
        event_data = event_in.model_dump()
        # 处理 extra_json
        if isinstance(event_data.get("extra_json"), dict):
            event_data["extra_json"] = json.dumps(event_data["extra_json"])
        
        db_event = SOEEvent(**event_data)
        db.add(db_event)
        await db.commit()
        await db.refresh(db_event)
        return db_event


# 全局实例
soe_crud = SOECRUD()

