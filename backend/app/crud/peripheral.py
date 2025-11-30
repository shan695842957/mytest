"""
外设设备 CRUD 操作
"""

from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.peripheral import Peripheral
from app.schemas.peripheral import PeripheralCreate, PeripheralUpdate


class PeripheralCRUD:
    """外设 CRUD 操作"""
    
    async def get_by_id(self, db: AsyncSession, peripheral_id: int) -> Optional[Peripheral]:
        """根据 ID 获取外设"""
        result = await db.execute(select(Peripheral).where(Peripheral.id == peripheral_id))
        return result.scalar_one_or_none()
    
    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[Peripheral]:
        """根据名称获取外设"""
        result = await db.execute(select(Peripheral).where(Peripheral.name == name))
        return result.scalar_one_or_none()
    
    async def get_by_device_path(
        self, 
        db: AsyncSession, 
        device_path: str, 
        peripheral_type: Optional[str] = None
    ) -> Optional[Peripheral]:
        """根据设备路径获取外设"""
        query = select(Peripheral).where(Peripheral.device_path == device_path)
        if peripheral_type:
            query = query.where(Peripheral.peripheral_type == peripheral_type)
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_multi(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        peripheral_type: Optional[str] = None,
        enabled_only: bool = False
    ) -> Tuple[List[Peripheral], int]:
        """获取外设列表"""
        query = select(Peripheral)
        count_query = select(func.count(Peripheral.id))
        
        if peripheral_type:
            query = query.where(Peripheral.peripheral_type == peripheral_type)
            count_query = count_query.where(Peripheral.peripheral_type == peripheral_type)
        
        if enabled_only:
            query = query.where(Peripheral.enabled == True)
            count_query = count_query.where(Peripheral.enabled == True)
        
        # 获取总数
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # 获取列表（按名称排序）
        query = query.order_by(Peripheral.peripheral_type, Peripheral.name).offset(skip).limit(limit)
        result = await db.execute(query)
        peripherals = result.scalars().all()
        
        return list(peripherals), total
    
    async def get_list_by_type(
        self,
        db: AsyncSession,
        peripheral_type: str,
        enabled_only: bool = True
    ) -> List[Peripheral]:
        """根据类型获取外设列表（用于下拉框）"""
        query = select(Peripheral).where(Peripheral.peripheral_type == peripheral_type)
        if enabled_only:
            query = query.where(Peripheral.enabled == True)
        query = query.order_by(Peripheral.name)
        result = await db.execute(query)
        return list(result.scalars().all())
    
    async def create(
        self,
        db: AsyncSession,
        peripheral_in: PeripheralCreate
    ) -> Peripheral:
        """创建外设"""
        peripheral = Peripheral(**peripheral_in.model_dump())
        db.add(peripheral)
        await db.commit()
        await db.refresh(peripheral)
        return peripheral
    
    async def update(
        self,
        db: AsyncSession,
        peripheral: Peripheral,
        peripheral_in: PeripheralUpdate
    ) -> Peripheral:
        """更新外设"""
        update_data = peripheral_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(peripheral, field, value)
        await db.commit()
        await db.refresh(peripheral)
        return peripheral
    
    async def delete(self, db: AsyncSession, peripheral: Peripheral) -> None:
        """删除外设"""
        await db.delete(peripheral)
        await db.commit()


# 全局实例
peripheral_crud = PeripheralCRUD()

