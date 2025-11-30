"""
协议类型 CRUD 操作
"""

from typing import List, Optional, Tuple
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.protocol_type import ProtocolType, ProtocolTypeParam
from app.schemas.protocol_type import (
    ProtocolTypeCreate, ProtocolTypeUpdate,
    ProtocolTypeParamCreate, ProtocolTypeParamUpdate
)
import json


class ProtocolTypeCRUD:
    """协议类型数据库操作类"""
    
    async def get_by_id(self, db: AsyncSession, protocol_type_id: int, include_params: bool = False) -> Optional[ProtocolType]:
        """根据 ID 获取协议类型"""
        query = select(ProtocolType).where(ProtocolType.id == protocol_type_id)
        if include_params:
            query = query.options(selectinload(ProtocolType.params))
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_name(self, db: AsyncSession, name: str, include_params: bool = False) -> Optional[ProtocolType]:
        """根据名称获取协议类型"""
        query = select(ProtocolType).where(ProtocolType.name == name)
        if include_params:
            query = query.options(selectinload(ProtocolType.params))
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_multi(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        enabled_only: bool = False,
        include_params: bool = False
    ) -> Tuple[List[ProtocolType], int]:
        """
        获取协议类型列表
        
        Args:
            enabled_only: 是否只返回启用的协议类型
            include_params: 是否包含参数列表
        
        Returns:
            (协议类型列表, 总数)
        """
        query = select(ProtocolType)
        count_query = select(func.count(ProtocolType.id))
        
        # 只返回启用的
        if enabled_only:
            query = query.where(ProtocolType.enabled == True)
            count_query = count_query.where(ProtocolType.enabled == True)
        
        # 搜索过滤
        if search:
            search_filter = or_(
                ProtocolType.name.contains(search),
                ProtocolType.display_name.contains(search),
                ProtocolType.description.contains(search)
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)
        
        # 加载参数
        if include_params:
            query = query.options(selectinload(ProtocolType.params))
        
        # 获取总数
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # 获取列表
        query = query.order_by(ProtocolType.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        protocol_types = list(result.scalars().all())
        
        return protocol_types, total
    
    async def get_enabled_list(self, db: AsyncSession, include_params: bool = False) -> List[ProtocolType]:
        """获取所有启用的协议类型（用于下拉框）"""
        query = select(ProtocolType).where(ProtocolType.enabled == True).order_by(ProtocolType.display_name)
        if include_params:
            query = query.options(selectinload(ProtocolType.params))
        result = await db.execute(query)
        return list(result.scalars().all())
    
    async def create(
        self,
        db: AsyncSession,
        protocol_type_in: ProtocolTypeCreate
    ) -> ProtocolType:
        """创建协议类型（含参数）"""
        type_data = protocol_type_in.model_dump(exclude={"params"})
        params_data = protocol_type_in.params or []
        
        # 处理 constraints_json
        for param_data in params_data:
            if isinstance(param_data.get("constraints_json"), dict):
                param_data["constraints_json"] = json.dumps(param_data["constraints_json"])
        
        # 创建协议类型
        db_protocol_type = ProtocolType(**type_data)
        db.add(db_protocol_type)
        await db.flush()  # 获取 ID
        
        # 创建参数
        for param_data in params_data:
            param_obj = ProtocolTypeParam(
                protocol_type_id=db_protocol_type.id,
                **param_data
            )
            db.add(param_obj)
        
        await db.commit()
        await db.refresh(db_protocol_type)
        
        # 重新查询以加载参数关系
        query = select(ProtocolType).where(ProtocolType.id == db_protocol_type.id).options(selectinload(ProtocolType.params))
        result = await db.execute(query)
        return result.scalar_one()
    
    async def update(
        self,
        db: AsyncSession,
        protocol_type: ProtocolType,
        protocol_type_in: ProtocolTypeUpdate
    ) -> ProtocolType:
        """更新协议类型（不更新参数，参数单独管理）"""
        update_data = protocol_type_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(protocol_type, field, value)
        await db.commit()
        await db.refresh(protocol_type)
        return protocol_type
    
    async def delete(self, db: AsyncSession, protocol_type: ProtocolType) -> bool:
        """删除协议类型（级联删除参数）"""
        await db.delete(protocol_type)
        await db.commit()
        return True


class ProtocolTypeParamCRUD:
    """协议类型参数数据库操作类"""
    
    async def get_by_id(self, db: AsyncSession, param_id: int) -> Optional[ProtocolTypeParam]:
        """根据 ID 获取参数"""
        result = await db.execute(
            select(ProtocolTypeParam).where(ProtocolTypeParam.id == param_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_protocol_type(
        self,
        db: AsyncSession,
        protocol_type_id: int
    ) -> List[ProtocolTypeParam]:
        """获取协议类型的所有参数（按排序索引）"""
        result = await db.execute(
            select(ProtocolTypeParam)
            .where(ProtocolTypeParam.protocol_type_id == protocol_type_id)
            .order_by(ProtocolTypeParam.order_index, ProtocolTypeParam.id)
        )
        return list(result.scalars().all())
    
    async def create(
        self,
        db: AsyncSession,
        protocol_type_id: int,
        param_in: ProtocolTypeParamCreate
    ) -> ProtocolTypeParam:
        """创建参数"""
        param_data = param_in.model_dump()
        
        # 处理 constraints_json
        if isinstance(param_data.get("constraints_json"), dict):
            param_data["constraints_json"] = json.dumps(param_data["constraints_json"])
        
        param_obj = ProtocolTypeParam(
            protocol_type_id=protocol_type_id,
            **param_data
        )
        db.add(param_obj)
        await db.commit()
        await db.refresh(param_obj)
        return param_obj
    
    async def update(
        self,
        db: AsyncSession,
        param: ProtocolTypeParam,
        param_in: ProtocolTypeParamUpdate
    ) -> ProtocolTypeParam:
        """更新参数"""
        update_data = param_in.model_dump(exclude_unset=True)
        
        # 处理 constraints_json
        if "constraints_json" in update_data and isinstance(update_data["constraints_json"], dict):
            update_data["constraints_json"] = json.dumps(update_data["constraints_json"])
        
        for field, value in update_data.items():
            setattr(param, field, value)
        await db.commit()
        await db.refresh(param)
        return param
    
    async def delete(self, db: AsyncSession, param: ProtocolTypeParam) -> bool:
        """删除参数"""
        await db.delete(param)
        await db.commit()
        return True


# 全局实例
protocol_type_crud = ProtocolTypeCRUD()
protocol_type_param_crud = ProtocolTypeParamCRUD()

