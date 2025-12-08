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


class BMSTeleindicationConfigCRUD:
    """BMS遥信量配置CRUD操作"""
    
    async def get_by_instance_and_page_type(
        self,
        db: AsyncSession,
        bms_instance_id: int,
        page_type: str
    ) -> List[BMSTeleindicationConfig]:
        """根据BMS实例ID和页面类型获取遥信量配置列表"""
        result = await db.execute(
            select(BMSTeleindicationConfig)
            .where(
                BMSTeleindicationConfig.bms_instance_id == bms_instance_id,
                BMSTeleindicationConfig.page_type == page_type
            )
            .order_by(BMSTeleindicationConfig.sort_order, BMSTeleindicationConfig.id)
        )
        return list(result.scalars().all())
    
    async def get_by_id(self, db: AsyncSession, config_id: int) -> Optional[BMSTeleindicationConfig]:
        """根据ID获取遥信量配置"""
        result = await db.execute(
            select(BMSTeleindicationConfig).where(BMSTeleindicationConfig.id == config_id)
        )
        return result.scalar_one_or_none()
    
    async def create(
        self,
        db: AsyncSession,
        bms_instance_id: int,
        config_in: BMSTeleindicationConfigCreate
    ) -> BMSTeleindicationConfig:
        """创建遥信量配置"""
        config_data = config_in.model_dump()
        config_data["bms_instance_id"] = bms_instance_id
        db_config = BMSTeleindicationConfig(**config_data)
        db.add(db_config)
        await db.commit()
        await db.refresh(db_config)
        return db_config
    
    async def update(
        self,
        db: AsyncSession,
        config: BMSTeleindicationConfig,
        config_in: BMSTeleindicationConfigUpdate
    ) -> BMSTeleindicationConfig:
        """更新遥信量配置"""
        update_data = config_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(config, field, value)
        
        await db.commit()
        await db.refresh(config)
        return config
    
    async def delete(self, db: AsyncSession, config: BMSTeleindicationConfig) -> None:
        """删除遥信量配置"""
        await db.delete(config)
        await db.commit()


class BMSTopologyConfigCRUD:
    """BMS拓扑配置CRUD操作"""
    
    async def get_by_instance_id(
        self,
        db: AsyncSession,
        bms_instance_id: int
    ) -> Optional[BMSTopologyConfig]:
        """根据BMS实例ID获取拓扑配置"""
        result = await db.execute(
            select(BMSTopologyConfig).where(
                BMSTopologyConfig.bms_instance_id == bms_instance_id
            )
        )
        return result.scalar_one_or_none()
    
    async def create(
        self,
        db: AsyncSession,
        bms_instance_id: int,
        config_in: BMSTopologyConfigCreate
    ) -> BMSTopologyConfig:
        """创建拓扑配置"""
        config_data = config_in.model_dump()
        config_data["bms_instance_id"] = bms_instance_id
        db_config = BMSTopologyConfig(**config_data)
        db.add(db_config)
        await db.commit()
        await db.refresh(db_config)
        return db_config
    
    async def update(
        self,
        db: AsyncSession,
        config: BMSTopologyConfig,
        config_in: BMSTopologyConfigUpdate
    ) -> BMSTopologyConfig:
        """更新拓扑配置"""
        update_data = config_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(config, field, value)
        
        await db.commit()
        await db.refresh(config)
        return config


class BMSTopologyFieldConfigCRUD:
    """BMS拓扑字段配置CRUD操作"""
    
    async def get_by_topology_config_id(
        self,
        db: AsyncSession,
        topology_config_id: int
    ) -> List[BMSTopologyFieldConfig]:
        """根据拓扑配置ID获取字段配置列表"""
        result = await db.execute(
            select(BMSTopologyFieldConfig)
            .where(BMSTopologyFieldConfig.topology_config_id == topology_config_id)
            .order_by(BMSTopologyFieldConfig.display_position, BMSTopologyFieldConfig.sort_order)
        )
        return list(result.scalars().all())
    
    async def get_by_id(self, db: AsyncSession, field_config_id: int) -> Optional[BMSTopologyFieldConfig]:
        """根据ID获取拓扑字段配置"""
        result = await db.execute(
            select(BMSTopologyFieldConfig).where(BMSTopologyFieldConfig.id == field_config_id)
        )
        return result.scalar_one_or_none()
    
    async def create(
        self,
        db: AsyncSession,
        topology_config_id: int,
        field_config_in: BMSTopologyFieldConfigCreate
    ) -> BMSTopologyFieldConfig:
        """创建拓扑字段配置"""
        field_config_data = field_config_in.model_dump()
        field_config_data["topology_config_id"] = topology_config_id
        db_field_config = BMSTopologyFieldConfig(**field_config_data)
        db.add(db_field_config)
        await db.commit()
        await db.refresh(db_field_config)
        return db_field_config
    
    async def update(
        self,
        db: AsyncSession,
        field_config: BMSTopologyFieldConfig,
        field_config_in: BMSTopologyFieldConfigUpdate
    ) -> BMSTopologyFieldConfig:
        """更新拓扑字段配置"""
        update_data = field_config_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(field_config, field, value)
        
        await db.commit()
        await db.refresh(field_config)
        return field_config
    
    async def delete(self, db: AsyncSession, field_config: BMSTopologyFieldConfig) -> None:
        """删除拓扑字段配置"""
        await db.delete(field_config)
        await db.commit()


class BMSBMUConfigCRUD:
    """BMS BMU配置CRUD操作"""
    
    async def get_by_instance_id(
        self,
        db: AsyncSession,
        bms_instance_id: int
    ) -> Optional[BMSBMUConfig]:
        """根据BMS实例ID获取BMU配置"""
        result = await db.execute(
            select(BMSBMUConfig).where(BMSBMUConfig.bms_instance_id == bms_instance_id)
        )
        return result.scalar_one_or_none()
    
    async def create(
        self,
        db: AsyncSession,
        bms_instance_id: int,
        config_in: BMSBMUConfigCreate
    ) -> BMSBMUConfig:
        """创建BMU配置"""
        config_data = config_in.model_dump()
        config_data["bms_instance_id"] = bms_instance_id
        db_config = BMSBMUConfig(**config_data)
        db.add(db_config)
        await db.commit()
        await db.refresh(db_config)
        return db_config
    
    async def update(
        self,
        db: AsyncSession,
        config: BMSBMUConfig,
        config_in: BMSBMUConfigUpdate
    ) -> BMSBMUConfig:
        """更新BMU配置"""
        update_data = config_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(config, field, value)
        
        await db.commit()
        await db.refresh(config)
        return config


class BMSBMUCellFieldConfigCRUD:
    """BMS BMU单体字段配置CRUD操作"""
    
    async def get_by_bmu_config_id(
        self,
        db: AsyncSession,
        bmu_config_id: int
    ) -> List[BMSBMUCellFieldConfig]:
        """根据BMU配置ID获取单体字段配置列表"""
        result = await db.execute(
            select(BMSBMUCellFieldConfig)
            .where(BMSBMUCellFieldConfig.bmu_config_id == bmu_config_id)
            .order_by(BMSBMUCellFieldConfig.sort_order, BMSBMUCellFieldConfig.id)
        )
        return list(result.scalars().all())
    
    async def get_by_id(self, db: AsyncSession, field_config_id: int) -> Optional[BMSBMUCellFieldConfig]:
        """根据ID获取单体字段配置"""
        result = await db.execute(
            select(BMSBMUCellFieldConfig).where(BMSBMUCellFieldConfig.id == field_config_id)
        )
        return result.scalar_one_or_none()
    
    async def create(
        self,
        db: AsyncSession,
        bmu_config_id: int,
        field_config_in: BMSBMUCellFieldConfigCreate
    ) -> BMSBMUCellFieldConfig:
        """创建单体字段配置"""
        field_config_data = field_config_in.model_dump()
        field_config_data["bmu_config_id"] = bmu_config_id
        db_field_config = BMSBMUCellFieldConfig(**field_config_data)
        db.add(db_field_config)
        await db.commit()
        await db.refresh(db_field_config)
        return db_field_config
    
    async def update(
        self,
        db: AsyncSession,
        field_config: BMSBMUCellFieldConfig,
        field_config_in: BMSBMUCellFieldConfigUpdate
    ) -> BMSBMUCellFieldConfig:
        """更新单体字段配置"""
        update_data = field_config_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(field_config, field, value)
        
        await db.commit()
        await db.refresh(field_config)
        return field_config
    
    async def delete(self, db: AsyncSession, field_config: BMSBMUCellFieldConfig) -> None:
        """删除单体字段配置"""
        await db.delete(field_config)
        await db.commit()


class BMSBMUTemperaturePointCRUD:
    """BMS BMU温度测点配置CRUD操作"""
    
    async def get_by_bmu_config_id(
        self,
        db: AsyncSession,
        bmu_config_id: int
    ) -> List[BMSBMUTemperaturePoint]:
        """根据BMU配置ID获取温度测点配置列表"""
        result = await db.execute(
            select(BMSBMUTemperaturePoint)
            .where(BMSBMUTemperaturePoint.bmu_config_id == bmu_config_id)
            .order_by(BMSBMUTemperaturePoint.sort_order, BMSBMUTemperaturePoint.point_number)
        )
        return list(result.scalars().all())
    
    async def get_by_id(self, db: AsyncSession, point_id: int) -> Optional[BMSBMUTemperaturePoint]:
        """根据ID获取温度测点配置"""
        result = await db.execute(
            select(BMSBMUTemperaturePoint).where(BMSBMUTemperaturePoint.id == point_id)
        )
        return result.scalar_one_or_none()
    
    async def create(
        self,
        db: AsyncSession,
        bmu_config_id: int,
        point_in: BMSBMUTemperaturePointCreate
    ) -> BMSBMUTemperaturePoint:
        """创建温度测点配置"""
        point_data = point_in.model_dump()
        point_data["bmu_config_id"] = bmu_config_id
        db_point = BMSBMUTemperaturePoint(**point_data)
        db.add(db_point)
        await db.commit()
        await db.refresh(db_point)
        return db_point
    
    async def update(
        self,
        db: AsyncSession,
        point: BMSBMUTemperaturePoint,
        point_in: BMSBMUTemperaturePointUpdate
    ) -> BMSBMUTemperaturePoint:
        """更新温度测点配置"""
        update_data = point_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(point, field, value)
        
        await db.commit()
        await db.refresh(point)
        return point
    
    async def delete(self, db: AsyncSession, point: BMSBMUTemperaturePoint) -> None:
        """删除温度测点配置"""
        await db.delete(point)
        await db.commit()


class BMSBMUOtherDataConfigCRUD:
    """BMS BMU其它数据配置CRUD操作"""
    
    async def get_by_bmu_config_id(
        self,
        db: AsyncSession,
        bmu_config_id: int
    ) -> List[BMSBMUOtherDataConfig]:
        """根据BMU配置ID获取其它数据配置列表"""
        result = await db.execute(
            select(BMSBMUOtherDataConfig)
            .where(BMSBMUOtherDataConfig.bmu_config_id == bmu_config_id)
            .order_by(BMSBMUOtherDataConfig.sort_order, BMSBMUOtherDataConfig.id)
        )
        return list(result.scalars().all())
    
    async def get_by_id(self, db: AsyncSession, config_id: int) -> Optional[BMSBMUOtherDataConfig]:
        """根据ID获取其它数据配置"""
        result = await db.execute(
            select(BMSBMUOtherDataConfig).where(BMSBMUOtherDataConfig.id == config_id)
        )
        return result.scalar_one_or_none()
    
    async def create(
        self,
        db: AsyncSession,
        bmu_config_id: int,
        config_in: BMSBMUOtherDataConfigCreate
    ) -> BMSBMUOtherDataConfig:
        """创建其它数据配置"""
        config_data = config_in.model_dump()
        config_data["bmu_config_id"] = bmu_config_id
        db_config = BMSBMUOtherDataConfig(**config_data)
        db.add(db_config)
        await db.commit()
        await db.refresh(db_config)
        return db_config
    
    async def update(
        self,
        db: AsyncSession,
        config: BMSBMUOtherDataConfig,
        config_in: BMSBMUOtherDataConfigUpdate
    ) -> BMSBMUOtherDataConfig:
        """更新其它数据配置"""
        update_data = config_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(config, field, value)
        
        await db.commit()
        await db.refresh(config)
        return config
    
    async def delete(self, db: AsyncSession, config: BMSBMUOtherDataConfig) -> None:
        """删除其它数据配置"""
        await db.delete(config)
        await db.commit()


# 创建全局实例
bms_architecture_crud = BMSArchitectureCRUD()
bms_page_config_crud = BMSPageConfigCRUD()
bms_instance_crud = BMSInstanceCRUD()
bms_hierarchy_config_crud = BMSHierarchyConfigCRUD()
bms_field_config_crud = BMSFieldConfigCRUD()
bms_teleindication_config_crud = BMSTeleindicationConfigCRUD()
bms_topology_config_crud = BMSTopologyConfigCRUD()
bms_topology_field_config_crud = BMSTopologyFieldConfigCRUD()
bms_bmu_config_crud = BMSBMUConfigCRUD()
bms_bmu_cell_field_config_crud = BMSBMUCellFieldConfigCRUD()
bms_bmu_temperature_point_crud = BMSBMUTemperaturePointCRUD()
bms_bmu_other_data_config_crud = BMSBMUOtherDataConfigCRUD()
