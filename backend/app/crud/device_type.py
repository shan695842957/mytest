"""
设备类型 CRUD 操作
"""

from typing import List, Optional, Tuple
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.device_type import DeviceType, DeviceTypeTag
from app.schemas.device_type import DeviceTypeCreate, DeviceTypeUpdate, DeviceTypeTagCreate, DeviceTypeTagUpdate
import json


class DeviceTypeCRUD:
    """设备类型数据库操作类"""
    
    async def get_by_id(self, db: AsyncSession, device_type_id: int) -> Optional[DeviceType]:
        """根据 ID 获取设备类型"""
        result = await db.execute(
            select(DeviceType).where(DeviceType.id == device_type_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[DeviceType]:
        """根据名称获取设备类型"""
        result = await db.execute(
            select(DeviceType).where(DeviceType.name == name)
        )
        return result.scalar_one_or_none()
    
    async def get_multi(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None
    ) -> Tuple[List[DeviceType], int]:
        """
        获取设备类型列表
        
        Returns:
            (设备类型列表, 总数)
        """
        # 构建查询
        query = select(DeviceType)
        count_query = select(func.count(DeviceType.id))
        
        # 搜索过滤
        if search:
            search_filter = or_(
                DeviceType.name.contains(search),
                DeviceType.display_name.contains(search),
                DeviceType.description.contains(search)
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)
        
        # 获取总数
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # 获取列表
        query = query.order_by(DeviceType.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        device_types = list(result.scalars().all())
        
        return device_types, total
    
    async def create(
        self,
        db: AsyncSession,
        device_type_in: DeviceTypeCreate
    ) -> DeviceType:
        """创建设备类型"""
        db_device_type = DeviceType(**device_type_in.model_dump())
        db.add(db_device_type)
        await db.commit()
        await db.refresh(db_device_type)
        return db_device_type
    
    async def update(
        self,
        db: AsyncSession,
        device_type: DeviceType,
        device_type_in: DeviceTypeUpdate
    ) -> DeviceType:
        """更新设备类型"""
        update_data = device_type_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(device_type, field, value)
        await db.commit()
        await db.refresh(device_type)
        return device_type
    
    async def delete(self, db: AsyncSession, device_type: DeviceType) -> bool:
        """删除设备类型"""
        await db.delete(device_type)
        await db.commit()
        return True


class DeviceTypeTagCRUD:
    """业务字段数据库操作类"""
    
    async def get_by_id(self, db: AsyncSession, tag_id: int) -> Optional[DeviceTypeTag]:
        """根据 ID 获取业务字段"""
        result = await db.execute(
            select(DeviceTypeTag).where(DeviceTypeTag.id == tag_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_tag_name(
        self,
        db: AsyncSession,
        device_type_id: int,
        tag_name: str
    ) -> Optional[DeviceTypeTag]:
        """根据设备类型ID和字段名获取业务字段"""
        result = await db.execute(
            select(DeviceTypeTag).where(
                DeviceTypeTag.device_type_id == device_type_id,
                DeviceTypeTag.tag_name == tag_name
            )
        )
        return result.scalar_one_or_none()
    
    async def get_multi(
        self,
        db: AsyncSession,
        device_type_id: int,
        semantic_type: Optional[str] = None
    ) -> List[DeviceTypeTag]:
        """获取业务字段列表"""
        query = select(DeviceTypeTag).where(DeviceTypeTag.device_type_id == device_type_id)
        
        if semantic_type:
            query = query.where(DeviceTypeTag.semantic_type == semantic_type)
        
        query = query.order_by(DeviceTypeTag.group_name, DeviceTypeTag.tag_name)
        result = await db.execute(query)
        return list(result.scalars().all())
    
    async def create(
        self,
        db: AsyncSession,
        device_type_id: int,
        tag_in: DeviceTypeTagCreate
    ) -> DeviceTypeTag:
        """创建业务字段"""
        tag_data = tag_in.model_dump()
        # 处理 enum_json
        if isinstance(tag_data.get("enum_json"), dict):
            tag_data["enum_json"] = json.dumps(tag_data["enum_json"])
        
        db_tag = DeviceTypeTag(
            device_type_id=device_type_id,
            **tag_data
        )
        db.add(db_tag)
        await db.commit()
        await db.refresh(db_tag)
        return db_tag
    
    async def update(
        self,
        db: AsyncSession,
        tag: DeviceTypeTag,
        tag_in: DeviceTypeTagUpdate
    ) -> DeviceTypeTag:
        """更新业务字段"""
        update_data = tag_in.model_dump(exclude_unset=True)
        
        # 处理 enum_json
        if "enum_json" in update_data and isinstance(update_data["enum_json"], dict):
            update_data["enum_json"] = json.dumps(update_data["enum_json"])
        
        for field, value in update_data.items():
            setattr(tag, field, value)
        await db.commit()
        await db.refresh(tag)
        return tag
    
    async def delete(self, db: AsyncSession, tag: DeviceTypeTag) -> bool:
        """删除业务字段"""
        await db.delete(tag)
        await db.commit()
        return True


# 全局实例
device_type_crud = DeviceTypeCRUD()
device_type_tag_crud = DeviceTypeTagCRUD()

