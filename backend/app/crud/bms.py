"""
BMS（电池管理系统）CRUD 操作
"""

from typing import List, Optional, Tuple
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.bms import (
    BMSArchitecture,
    BMSPageConfig,
    BMSInstance,
    BMSHierarchyConfig,
    BMSFieldConfig,
    BMSTeleindicationConfig,
    BMSTopologyConfig,
    BMSTopologyFieldConfig,
    BMSBMUConfig,
    BMSBMUCellFieldConfig,
    BMSBMUTemperaturePoint,
    BMSBMUOtherDataConfig,
)
from app.schemas.bms import (
    BMSInstanceCreate,
    BMSInstanceUpdate,
    BMSHierarchyConfigCreate,
    BMSHierarchyConfigUpdate,
    BMSFieldConfigCreate,
    BMSFieldConfigUpdate,
    BMSTeleindicationConfigCreate,
    BMSTeleindicationConfigUpdate,
    BMSTopologyConfigCreate,
    BMSTopologyConfigUpdate,
    BMSTopologyFieldConfigCreate,
    BMSTopologyFieldConfigUpdate,
    BMSBMUConfigCreate,
    BMSBMUConfigUpdate,
    BMSBMUCellFieldConfigCreate,
    BMSBMUCellFieldConfigUpdate,
    BMSBMUTemperaturePointCreate,
    BMSBMUTemperaturePointUpdate,
    BMSBMUOtherDataConfigCreate,
    BMSBMUOtherDataConfigUpdate,
)
import json


class BMSArchitectureCRUD:
    """BMS架构CRUD操作"""
    
    async def get_by_id(self, db: AsyncSession, architecture_id: int) -> Optional[BMSArchitecture]:
        """根据ID获取架构"""
        result = await db.execute(
            select(BMSArchitecture).where(BMSArchitecture.id == architecture_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[BMSArchitecture]:
        """根据名称获取架构"""
        result = await db.execute(
            select(BMSArchitecture).where(BMSArchitecture.name == name)
        )
        return result.scalar_one_or_none()
    
    async def get_all(self, db: AsyncSession) -> List[BMSArchitecture]:
        """获取所有架构"""
        result = await db.execute(
            select(BMSArchitecture).order_by(BMSArchitecture.id)
        )
        return list(result.scalars().all())


class BMSPageConfigCRUD:
    """BMS页面配置CRUD操作"""
    
    async def get_by_architecture_and_page_type(
        self,
        db: AsyncSession,
        architecture_id: int,
        page_type: str
    ) -> Optional[BMSPageConfig]:
        """根据架构ID和页面类型获取页面配置"""
        result = await db.execute(
            select(BMSPageConfig).where(
                BMSPageConfig.architecture_id == architecture_id,
                BMSPageConfig.page_type == page_type
            )
        )
        return result.scalar_one_or_none()
    
    async def get_by_architecture(
        self,
        db: AsyncSession,
        architecture_id: int
    ) -> List[BMSPageConfig]:
        """根据架构ID获取所有页面配置"""
        result = await db.execute(
            select(BMSPageConfig)
            .where(BMSPageConfig.architecture_id == architecture_id)
            .order_by(BMSPageConfig.page_type)
        )
        return list(result.scalars().all())


class BMSInstanceCRUD:
    """BMS实例CRUD操作"""
    
    async def get_by_id(self, db: AsyncSession, instance_id: int) -> Optional[BMSInstance]:
        """根据ID获取BMS实例"""
        result = await db.execute(
            select(BMSInstance)
            .where(BMSInstance.id == instance_id)
            .options(
                selectinload(BMSInstance.asset),
                selectinload(BMSInstance.architecture)
            )
        )
        return result.scalar_one_or_none()
    
    async def get_by_asset_id(self, db: AsyncSession, asset_id: int) -> Optional[BMSInstance]:
        """根据资产ID获取BMS实例"""
        result = await db.execute(
            select(BMSInstance)
            .where(BMSInstance.asset_id == asset_id)
            .options(
                selectinload(BMSInstance.asset),
                selectinload(BMSInstance.architecture)
            )
        )
        return result.scalar_one_or_none()
    
    async def get_multi(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        architecture_id: Optional[int] = None,
        enabled: Optional[bool] = None
    ) -> Tuple[List[BMSInstance], int]:
        """获取BMS实例列表"""
        query = select(BMSInstance)
        count_query = select(func.count(BMSInstance.id))
        
        filters = []
        if search:
            filters.append(or_(
                BMSInstance.instance_name.contains(search),
                BMSInstance.display_name_zh.contains(search),
                BMSInstance.display_name_en.contains(search)
            ))
        if architecture_id:
            filters.append(BMSInstance.architecture_id == architecture_id)
        if enabled is not None:
            filters.append(BMSInstance.enabled == enabled)
        
        if filters:
            for f in filters:
                query = query.where(f)
                count_query = count_query.where(f)
        
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        query = query.options(
            selectinload(BMSInstance.asset),
            selectinload(BMSInstance.architecture)
        ).order_by(BMSInstance.created_at.desc()).offset(skip).limit(limit)
        
        result = await db.execute(query)
        instances = list(result.scalars().all())
        
        return instances, total
    
    async def create(
        self,
        db: AsyncSession,
        instance_in: BMSInstanceCreate
    ) -> BMSInstance:
        """创建BMS实例"""
        instance_data = instance_in.model_dump()
        # 处理 metadata_json
        if isinstance(instance_data.get("metadata_json"), dict):
            instance_data["metadata_json"] = json.dumps(instance_data["metadata_json"])
        
        db_instance = BMSInstance(**instance_data)
        db.add(db_instance)
        await db.commit()
        await db.refresh(db_instance)
        return db_instance
    
    async def update(
        self,
        db: AsyncSession,
        instance: BMSInstance,
        instance_in: BMSInstanceUpdate
    ) -> BMSInstance:
        """更新BMS实例"""
        update_data = instance_in.model_dump(exclude_unset=True)
        
        # 处理 metadata_json
        if "metadata_json" in update_data and isinstance(update_data["metadata_json"], dict):
            update_data["metadata_json"] = json.dumps(update_data["metadata_json"])
        
        for field, value in update_data.items():
            setattr(instance, field, value)
        
        await db.commit()
        await db.refresh(instance)
        return instance
    
    async def delete(self, db: AsyncSession, instance: BMSInstance) -> None:
        """删除BMS实例"""
        await db.delete(instance)
        await db.commit()


class BMSHierarchyConfigCRUD:
    """BMS层级配置CRUD操作"""
    
    async def get_by_instance_id(
        self,
        db: AsyncSession,
        bms_instance_id: int
    ) -> Optional[BMSHierarchyConfig]:
        """根据BMS实例ID获取层级配置"""
        result = await db.execute(
            select(BMSHierarchyConfig).where(
                BMSHierarchyConfig.bms_instance_id == bms_instance_id
            )
        )
        return result.scalar_one_or_none()
    
    async def create(
        self,
        db: AsyncSession,
        bms_instance_id: int,
        config_in: BMSHierarchyConfigCreate
    ) -> BMSHierarchyConfig:
        """创建层级配置"""
        config_data = config_in.model_dump()
        # 处理 metadata_json
        if isinstance(config_data.get("metadata_json"), dict):
            config_data["metadata_json"] = json.dumps(config_data["metadata_json"])
        
        config_data["bms_instance_id"] = bms_instance_id
        db_config = BMSHierarchyConfig(**config_data)
        db.add(db_config)
        await db.commit()
        await db.refresh(db_config)
        return db_config
    
    async def update(
        self,
        db: AsyncSession,
        config: BMSHierarchyConfig,
        config_in: BMSHierarchyConfigUpdate
    ) -> BMSHierarchyConfig:
        """更新层级配置"""
        update_data = config_in.model_dump(exclude_unset=True)
        
        # 处理 metadata_json
        if "metadata_json" in update_data and isinstance(update_data["metadata_json"], dict):
            update_data["metadata_json"] = json.dumps(update_data["metadata_json"])
        
        for field, value in update_data.items():
            setattr(config, field, value)
        
        await db.commit()
        await db.refresh(config)
        return config


class BMSFieldConfigCRUD:
    """BMS字段配置CRUD操作"""
    
    async def get_by_instance_and_page_type(
        self,
        db: AsyncSession,
        bms_instance_id: int,
        page_type: str
    ) -> List[BMSFieldConfig]:
        """根据BMS实例ID和页面类型获取字段配置列表"""
        result = await db.execute(
            select(BMSFieldConfig)
            .where(
                BMSFieldConfig.bms_instance_id == bms_instance_id,
                BMSFieldConfig.page_type == page_type
            )
            .order_by(BMSFieldConfig.sort_order, BMSFieldConfig.id)
        )
        return list(result.scalars().all())
    
    async def get_by_id(self, db: AsyncSession, field_config_id: int) -> Optional[BMSFieldConfig]:
        """根据ID获取字段配置"""
        result = await db.execute(
            select(BMSFieldConfig).where(BMSFieldConfig.id == field_config_id)
        )
        return result.scalar_one_or_none()
    
    async def create(
        self,
        db: AsyncSession,
        bms_instance_id: int,
        field_config_in: BMSFieldConfigCreate
    ) -> BMSFieldConfig:
        """创建字段配置"""
        field_config_data = field_config_in.model_dump()
        field_config_data["bms_instance_id"] = bms_instance_id
        db_field_config = BMSFieldConfig(**field_config_data)
        db.add(db_field_config)
        await db.commit()
        await db.refresh(db_field_config)
        return db_field_config
    
    async def update(
        self,
        db: AsyncSession,
        field_config: BMSFieldConfig,
        field_config_in: BMSFieldConfigUpdate
    ) -> BMSFieldConfig:
        """更新字段配置"""
        update_data = field_config_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(field_config, field, value)
        
        await db.commit()
        await db.refresh(field_config)
        return field_config
    
    async def delete(self, db: AsyncSession, field_config: BMSFieldConfig) -> None:
        """删除字段配置"""
        await db.delete(field_config)
        await db.commit()
    
    async def delete_by_instance_and_page_type(
        self,
        db: AsyncSession,
        bms_instance_id: int,
        page_type: str
    ) -> None:
        """根据BMS实例ID和页面类型删除所有字段配置"""
        await db.execute(
            select(BMSFieldConfig).where(
                BMSFieldConfig.bms_instance_id == bms_instance_id,
                BMSFieldConfig.page_type == page_type
            )
        )
        # 注意：这里需要先查询再删除，SQLAlchemy 2.0 的 delete 语法不同
        result = await db.execute(
            select(BMSFieldConfig).where(
                BMSFieldConfig.bms_instance_id == bms_instance_id,
                BMSFieldConfig.page_type == page_type
            )
        )
        field_configs = result.scalars().all()
        for fc in field_configs:
            await db.delete(fc)
        await db.commit()


# 创建全局实例
bms_architecture_crud = BMSArchitectureCRUD()
bms_page_config_crud = BMSPageConfigCRUD()
bms_instance_crud = BMSInstanceCRUD()
bms_hierarchy_config_crud = BMSHierarchyConfigCRUD()
bms_field_config_crud = BMSFieldConfigCRUD()
