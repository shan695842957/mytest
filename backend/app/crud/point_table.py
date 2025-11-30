"""
点表模板 CRUD 操作
"""

from typing import List, Optional, Tuple
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.point_table import PointTableTemplate, PointTablePoint
from app.schemas.point_table import PointTableTemplateCreate, PointTableTemplateUpdate, PointTablePointCreate, PointTablePointUpdate
import json


class PointTableTemplateCRUD:
    """点表模板数据库操作类"""
    
    async def get_by_id(self, db: AsyncSession, template_id: int) -> Optional[PointTableTemplate]:
        """根据 ID 获取点表模板"""
        result = await db.execute(
            select(PointTableTemplate).where(PointTableTemplate.id == template_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[PointTableTemplate]:
        """根据名称获取点表模板"""
        result = await db.execute(
            select(PointTableTemplate).where(PointTableTemplate.name == name)
        )
        return result.scalar_one_or_none()
    
    async def get_multi(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        protocol_type: Optional[str] = None
    ) -> Tuple[List[PointTableTemplate], int]:
        """获取点表模板列表"""
        query = select(PointTableTemplate)
        count_query = select(func.count(PointTableTemplate.id))
        
        filters = []
        if search:
            filters.append(or_(
                PointTableTemplate.name.contains(search),
                PointTableTemplate.display_name.contains(search)
            ))
        if protocol_type:
            filters.append(PointTableTemplate.protocol_type == protocol_type)
        
        if filters:
            for f in filters:
                query = query.where(f)
                count_query = count_query.where(f)
        
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        query = query.order_by(PointTableTemplate.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        templates = list(result.scalars().all())
        
        return templates, total
    
    async def create(
        self,
        db: AsyncSession,
        template_in: PointTableTemplateCreate
    ) -> PointTableTemplate:
        """创建点表模板"""
        db_template = PointTableTemplate(**template_in.model_dump())
        db.add(db_template)
        await db.commit()
        await db.refresh(db_template)
        return db_template
    
    async def update(
        self,
        db: AsyncSession,
        template: PointTableTemplate,
        template_in: PointTableTemplateUpdate
    ) -> PointTableTemplate:
        """更新点表模板"""
        update_data = template_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(template, field, value)
        await db.commit()
        await db.refresh(template)
        return template
    
    async def delete(self, db: AsyncSession, template: PointTableTemplate) -> bool:
        """删除点表模板"""
        await db.delete(template)
        await db.commit()
        return True


class PointTablePointCRUD:
    """点表点数据库操作类"""
    
    async def get_by_id(self, db: AsyncSession, point_id: int) -> Optional[PointTablePoint]:
        """根据 ID 获取点表点"""
        result = await db.execute(
            select(PointTablePoint).where(PointTablePoint.id == point_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_point_name(
        self,
        db: AsyncSession,
        point_table_id: int,
        point_name: str
    ) -> Optional[PointTablePoint]:
        """根据点表ID和点名获取点表点"""
        result = await db.execute(
            select(PointTablePoint).where(
                PointTablePoint.point_table_id == point_table_id,
                PointTablePoint.point_name == point_name
            )
        )
        return result.scalar_one_or_none()
    
    async def get_multi(
        self,
        db: AsyncSession,
        point_table_id: int,
        search: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> List[PointTablePoint]:
        """获取点表点列表"""
        query = select(PointTablePoint).where(PointTablePoint.point_table_id == point_table_id)
        
        if search:
            query = query.where(or_(
                PointTablePoint.point_name.contains(search),
                PointTablePoint.display_name.contains(search),
                PointTablePoint.address.contains(search)
            ))
        
        if is_active is not None:
            query = query.where(PointTablePoint.is_active == is_active)
        
        query = query.order_by(PointTablePoint.point_name)
        result = await db.execute(query)
        return list(result.scalars().all())
    
    async def create(
        self,
        db: AsyncSession,
        point_table_id: int,
        point_in: PointTablePointCreate
    ) -> PointTablePoint:
        """创建点表点"""
        point_data = point_in.model_dump()
        # 处理 parse_rules_json
        if isinstance(point_data.get("parse_rules_json"), dict):
            point_data["parse_rules_json"] = json.dumps(point_data["parse_rules_json"])
        
        db_point = PointTablePoint(
            point_table_id=point_table_id,
            **point_data
        )
        db.add(db_point)
        await db.commit()
        await db.refresh(db_point)
        return db_point
    
    async def update(
        self,
        db: AsyncSession,
        point: PointTablePoint,
        point_in: PointTablePointUpdate
    ) -> PointTablePoint:
        """更新点表点"""
        update_data = point_in.model_dump(exclude_unset=True)
        
        # 处理 parse_rules_json
        if "parse_rules_json" in update_data and isinstance(update_data["parse_rules_json"], dict):
            update_data["parse_rules_json"] = json.dumps(update_data["parse_rules_json"])
        
        for field, value in update_data.items():
            setattr(point, field, value)
        await db.commit()
        await db.refresh(point)
        return point
    
    async def delete(self, db: AsyncSession, point: PointTablePoint) -> bool:
        """删除点表点"""
        await db.delete(point)
        await db.commit()
        return True


# 全局实例
point_table_template_crud = PointTableTemplateCRUD()
point_table_point_crud = PointTablePointCRUD()

