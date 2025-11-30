"""
通信实例 CRUD 操作
"""

from typing import List, Optional, Tuple
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comm_instance import CommInstance
from app.schemas.comm_instance import CommInstanceCreate, CommInstanceUpdate
import json


class CommInstanceCRUD:
    """通信实例数据库操作类"""
    
    async def get_by_id(self, db: AsyncSession, instance_id: int) -> Optional[CommInstance]:
        """根据 ID 获取通信实例"""
        result = await db.execute(
            select(CommInstance).where(CommInstance.id == instance_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[CommInstance]:
        """根据名称获取通信实例"""
        result = await db.execute(
            select(CommInstance).where(CommInstance.name == name)
        )
        return result.scalar_one_or_none()
    
    async def get_multi(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        protocol_type: Optional[str] = None,
        point_table_id: Optional[int] = None,
        enabled: Optional[bool] = None
    ) -> Tuple[List[CommInstance], int]:
        """获取通信实例列表"""
        query = select(CommInstance)
        count_query = select(func.count(CommInstance.id))
        
        filters = []
        if search:
            filters.append(or_(
                CommInstance.name.contains(search),
                CommInstance.display_name.contains(search)
            ))
        if protocol_type:
            filters.append(CommInstance.protocol_type == protocol_type)
        if point_table_id:
            filters.append(CommInstance.point_table_id == point_table_id)
        if enabled is not None:
            filters.append(CommInstance.enabled == enabled)
        
        if filters:
            for f in filters:
                query = query.where(f)
                count_query = count_query.where(f)
        
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        query = query.order_by(CommInstance.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        instances = list(result.scalars().all())
        
        return instances, total
    
    async def create(
        self,
        db: AsyncSession,
        instance_in: CommInstanceCreate
    ) -> CommInstance:
        """创建通信实例"""
        instance_data = instance_in.model_dump()
        # 处理 protocol_config
        if isinstance(instance_data.get("protocol_config"), dict):
            instance_data["protocol_config"] = json.dumps(instance_data["protocol_config"])
        
        db_instance = CommInstance(**instance_data)
        db.add(db_instance)
        await db.commit()
        await db.refresh(db_instance)
        return db_instance
    
    async def update(
        self,
        db: AsyncSession,
        instance: CommInstance,
        instance_in: CommInstanceUpdate
    ) -> CommInstance:
        """更新通信实例"""
        update_data = instance_in.model_dump(exclude_unset=True)
        
        # 处理 protocol_config
        if "protocol_config" in update_data and isinstance(update_data["protocol_config"], dict):
            update_data["protocol_config"] = json.dumps(update_data["protocol_config"])
        
        for field, value in update_data.items():
            setattr(instance, field, value)
        await db.commit()
        await db.refresh(instance)
        return instance
    
    async def delete(self, db: AsyncSession, instance: CommInstance) -> bool:
        """删除通信实例"""
        await db.delete(instance)
        await db.commit()
        return True


# 全局实例
comm_instance_crud = CommInstanceCRUD()

