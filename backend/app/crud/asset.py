"""
资产和映射 CRUD 操作
"""

from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy import select, func, or_, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset, AssetMapping, AssetCommBinding
from app.models.comm_instance import CommInstance
from app.models.point_table import PointTablePoint
from app.schemas.asset import AssetCreate, AssetUpdate, AssetMappingCreate, AssetMappingUpdate
import json


class AssetCRUD:
    """资产数据库操作类"""
    
    async def get_by_id(self, db: AsyncSession, asset_id: int) -> Optional[Asset]:
        """根据 ID 获取资产"""
        result = await db.execute(
            select(Asset).where(Asset.id == asset_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[Asset]:
        """根据名称获取资产"""
        result = await db.execute(
            select(Asset).where(Asset.name == name)
        )
        return result.scalar_one_or_none()
    
    async def get_multi(
        self,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        device_type_id: Optional[int] = None,
        enabled: Optional[bool] = None
    ) -> Tuple[List[Asset], int]:
        """获取资产列表"""
        query = select(Asset)
        count_query = select(func.count(Asset.id))
        
        filters = []
        if search:
            filters.append(or_(
                Asset.name.contains(search),
                Asset.display_name.contains(search),
                Asset.location.contains(search)
            ))
        if device_type_id:
            filters.append(Asset.device_type_id == device_type_id)
        if enabled is not None:
            filters.append(Asset.enabled == enabled)
        
        if filters:
            for f in filters:
                query = query.where(f)
                count_query = count_query.where(f)
        
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        query = query.order_by(Asset.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        assets = list(result.scalars().all())
        
        return assets, total
    
    async def create(
        self,
        db: AsyncSession,
        asset_in: AssetCreate
    ) -> Asset:
        """创建资产"""
        asset_data = asset_in.model_dump(exclude={"comm_instance_ids"})
        # 处理 metadata_json
        if isinstance(asset_data.get("metadata_json"), dict):
            asset_data["metadata_json"] = json.dumps(asset_data["metadata_json"])
        
        db_asset = Asset(**asset_data)
        db.add(db_asset)
        await db.commit()
        await db.refresh(db_asset)
        return db_asset
    
    async def update(
        self,
        db: AsyncSession,
        asset: Asset,
        asset_in: AssetUpdate
    ) -> Asset:
        """更新资产"""
        update_data = asset_in.model_dump(exclude_unset=True)
        
        # 处理 metadata_json
        if "metadata_json" in update_data and isinstance(update_data["metadata_json"], dict):
            update_data["metadata_json"] = json.dumps(update_data["metadata_json"])
        
        for field, value in update_data.items():
            setattr(asset, field, value)
        await db.commit()
        await db.refresh(asset)
        return asset
    
    async def delete(self, db: AsyncSession, asset: Asset) -> bool:
        """删除资产"""
        await db.delete(asset)
        await db.commit()
        return True


class AssetMappingCRUD:
    """资产映射数据库操作类"""
    
    async def get_by_id(self, db: AsyncSession, mapping_id: int) -> Optional[AssetMapping]:
        """根据 ID 获取资产映射"""
        result = await db.execute(
            select(AssetMapping).where(AssetMapping.id == mapping_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_asset_tag(
        self,
        db: AsyncSession,
        asset_id: int,
        asset_tag_name: str
    ) -> Optional[AssetMapping]:
        """根据资产ID和业务字段名获取映射"""
        result = await db.execute(
            select(AssetMapping).where(
                AssetMapping.asset_id == asset_id,
                AssetMapping.asset_tag_name == asset_tag_name
            )
        )
        return result.scalar_one_or_none()
    
    async def get_multi(
        self,
        db: AsyncSession,
        asset_id: int
    ) -> List[AssetMapping]:
        """获取资产的所有映射"""
        result = await db.execute(
            select(AssetMapping)
            .where(AssetMapping.asset_id == asset_id)
            .order_by(AssetMapping.asset_tag_name)
        )
        return list(result.scalars().all())
    
    async def get_mappings_with_details(
        self,
        db: AsyncSession,
        asset_id: int
    ) -> List[Dict[str, Any]]:
        """
        获取资产映射详情（包含关联信息）
        
        返回格式：
        [
            {
                "mapping": AssetMapping,
                "tag": DeviceTypeTag,
                "instance": CommInstance,
                "point": PointTablePoint (可选)
            },
            ...
        ]
        """
        # 获取资产
        asset = await AssetCRUD().get_by_id(db, asset_id)
        if not asset:
            return []
        
        # 获取设备类型的所有业务字段
        from app.crud.device_type import device_type_tag_crud
        tags = await device_type_tag_crud.get_multi(db, asset.device_type_id)
        # 获取所有映射
        mappings = await self.get_multi(db, asset_id)
        mapping_dict = {m.asset_tag_name: m for m in mappings}
        
        # 获取通信实例
        instance_ids = list(set(m.instance_id for m in mappings))
        instances = []
        if instance_ids:
            result = await db.execute(
                select(CommInstance).where(CommInstance.id.in_(instance_ids))
            )
            instances = list(result.scalars().all())
        instance_dict = {inst.id: inst for inst in instances}
        
        # 获取点表点
        points = []
        if instances:
            point_table_ids = list(set(inst.point_table_id for inst in instances))
            if point_table_ids:
                result = await db.execute(
                    select(PointTablePoint).where(PointTablePoint.point_table_id.in_(point_table_ids))
                )
                points = list(result.scalars().all())
        point_dict = {}
        for p in points:
            key = (p.point_table_id, p.point_name)
            point_dict[key] = p
        
        # 组装结果
        results = []
        for tag in tags:
            mapping = mapping_dict.get(tag.tag_name)
            if mapping:
                instance = instance_dict.get(mapping.instance_id)
                point = None
                if instance:
                    base_point_name = mapping.point_name.split(".")[0]
                    point = point_dict.get((instance.point_table_id, base_point_name))
                results.append({
                    "mapping": mapping,
                    "tag": tag,
                    "instance": instance,
                    "point": point
                })
            else:
                # 未映射的字段
                results.append({
                    "mapping": None,
                    "tag": tag,
                    "instance": None,
                    "point": None
                })
        
        return results
    
    async def create(
        self,
        db: AsyncSession,
        asset_id: int,
        mapping_in: AssetMappingCreate
    ) -> AssetMapping:
        """创建资产映射"""
        mapping_data = mapping_in.model_dump()
        db_mapping = AssetMapping(
            asset_id=asset_id,
            **mapping_data
        )
        db.add(db_mapping)
        await db.commit()
        await db.refresh(db_mapping)
        return db_mapping
    
    async def update(
        self,
        db: AsyncSession,
        mapping: AssetMapping,
        mapping_in: AssetMappingUpdate
    ) -> AssetMapping:
        """更新资产映射"""
        update_data = mapping_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(mapping, field, value)
        await db.commit()
        await db.refresh(mapping)
        return mapping
    
    async def delete(self, db: AsyncSession, mapping: AssetMapping) -> bool:
        """删除资产映射"""
        await db.delete(mapping)
        await db.commit()
        return True
    
    async def remove_by_instance_ids(
        self,
        db: AsyncSession,
        asset_id: int,
        instance_ids: List[int]
    ) -> None:
        """删除指定通信实例下的映射"""
        if not instance_ids:
            return
        await db.execute(
            delete(AssetMapping).where(
                AssetMapping.asset_id == asset_id,
                AssetMapping.instance_id.in_(instance_ids)
            )
        )
        await db.commit()


class AssetCommBindingCRUD:
    """资产通信绑定数据库操作类"""
    
    async def get_instance_ids(self, db: AsyncSession, asset_id: int) -> List[int]:
        result = await db.execute(
            select(AssetCommBinding.instance_id)
            .where(AssetCommBinding.asset_id == asset_id)
            .order_by(AssetCommBinding.id)
            )
        return [row[0] for row in result.all()]
    
    async def set_bindings(
        self,
        db: AsyncSession,
        asset_id: int,
        instance_ids: List[int]
    ) -> int:
        """重置资产绑定的通信实例列表"""
        await db.execute(
            delete(AssetCommBinding).where(AssetCommBinding.asset_id == asset_id)
        )
        created = 0
        for instance_id in sorted(set(instance_ids)):
            db.add(AssetCommBinding(asset_id=asset_id, instance_id=instance_id))
            created += 1
        await db.commit()
        return created


# 全局实例
asset_crud = AssetCRUD()
asset_mapping_crud = AssetMappingCRUD()
asset_comm_binding_crud = AssetCommBindingCRUD()

