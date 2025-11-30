"""
光字牌 API 路由
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.light_panel import (
    AssetTreeNode,
    LightPanelStatusResponse,
    LightPanelGroup,
    LightPanelTagValue,
    LightPanelPointCard,
)
from app.schemas.response import ApiResponse, success_response
from app.models.user import User, UserRole
from app.crud.asset import asset_crud, asset_mapping_crud
from app.crud.device_type import device_type_crud, device_type_tag_crud
from app.crud.comm_instance import comm_instance_crud
from app.crud.point_table import point_table_point_crud
from app.core.permissions import check_role_permission
from app.api.deps import get_current_user, get_locale, get_request_id
from app.i18n import t
import json


router = APIRouter(tags=["光字牌"])


@router.get(
    "/assets/tree",
    response_model=ApiResponse[List[AssetTreeNode]],
    summary="获取资产树",
    description="获取所有资产，用于构建设备树"
)
async def get_asset_tree(
    enabled: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[AssetTreeNode]]:
    """获取资产树"""
    # 权限检查：所有用户都可以查看
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.USER,
        error_message=t("light_panel.error.permission_denied", locale)
    )
    
    # 获取所有资产
    assets, total = await asset_crud.get_multi(
        db, skip=0, limit=1000, enabled=enabled
    )
    
    # 构建树节点
    tree_nodes = []
    for asset in assets:
        device_type = await device_type_crud.get_by_id(db, asset.device_type_id)
        
        node = AssetTreeNode(
            id=asset.id,
            name=asset.name,
            display_name=asset.display_name,
            device_type_id=asset.device_type_id,
            device_type_name=device_type.name if device_type else None,
            device_type_display_name=device_type.display_name if device_type else None,
            location=asset.location,
            enabled=asset.enabled,
            children=[]  # 预留，未来可以支持树形结构
        )
        tree_nodes.append(node)
    
    return success_response(
        data=tree_nodes,
        message=t("light_panel.success.tree_loaded", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/assets/{asset_id}/status",
    response_model=ApiResponse[LightPanelStatusResponse],
    summary="获取光字牌状态",
    description="获取指定资产的光字牌数据，按group_name分组"
)
async def get_light_panel_status(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[LightPanelStatusResponse]:
    """获取光字牌状态"""
    # 权限检查：所有用户都可以查看
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.USER,
        error_message=t("light_panel.error.permission_denied", locale)
    )
    
    # 获取资产
    asset = await asset_crud.get_by_id(db, asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("light_panel.error.asset_not_found", locale)
        )
    
    # 获取设备类型
    device_type = await device_type_crud.get_by_id(db, asset.device_type_id)
    if not device_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("light_panel.error.device_type_not_found", locale)
        )
    
    # 获取所有映射
    mappings = await asset_mapping_crud.get_multi(db, asset_id)
    
    # 获取设备类型的所有字段
    tags = await device_type_tag_crud.get_multi(db, device_type.id)
    
    # 构建字段映射字典（tag_name -> tag对象）
    tag_map = {tag.tag_name: tag for tag in tags}
    
    # 构建映射字典（tag_name -> mapping对象）
    mapping_map = {m.asset_tag_name: m for m in mappings}
    
    # 辅助函数：提取基础point_name（去掉子点后缀）
    def extract_base_point_name(full_point_name: Optional[str]) -> Optional[str]:
        """从完整点名提取基础点名
        例如：StatusWord4.mode_code -> StatusWord4
             OutletPressure -> OutletPressure
        """
        if not full_point_name:
            return None
        if "." in full_point_name:
            return full_point_name.split(".")[0]
        return full_point_name
    
    # 第一步：按基础point_name分组所有tag_value
    point_cards_dict: Dict[str, Dict[str, Any]] = {}  # key: base_point_name
    
    for tag in tags:
        mapping = mapping_map.get(tag.tag_name)
        
        # 跳过未映射的字段
        if not mapping or not mapping.point_name:
            continue
        
        # 提取基础point_name
        base_point_name = extract_base_point_name(mapping.point_name)
        if not base_point_name:
            continue
        
        # 解析枚举JSON
        enum_json = {}
        if tag.data_type == "ENUM" and tag.enum_json:
            try:
                enum_json = json.loads(tag.enum_json) if isinstance(tag.enum_json, str) else tag.enum_json
            except:
                enum_json = {}
        
        # 获取通信实例信息
        instance = await comm_instance_crud.get_by_id(db, mapping.instance_id)
        instance_name = instance.name if instance else None
        instance_display_name = instance.display_name if instance else None
        
        # 获取点表点信息（用于显示名和raw_value）
        point_display_name = base_point_name  # 默认使用基础点名
        point_raw_value = None
        
        if instance and instance.point_table_id:
            # 尝试从点表获取基础点的信息
            base_point = await point_table_point_crud.get_by_point_name(
                db, instance.point_table_id, base_point_name
            )
            if base_point:
                point_display_name = base_point.display_name or base_point_name
                # 如果是BITFIELD16类型，可以获取raw_value
                if base_point.raw_type == "BITFIELD16":
                    point_raw_value = 0  # TODO: 从asset_state获取真实值
        
        # 构建字段值对象
        # TODO: 这里应该从真实的asset_state内存结构获取值
        tag_value = LightPanelTagValue(
            tag_name=tag.tag_name,
            display_name=tag.display_name,
            data_type=tag.data_type,
            semantic_type=tag.semantic_type,
            group_name=tag.group_name or "",
            engineering_unit=tag.engineering_unit or "",
            severity=tag.severity,
            value=_get_simulated_value(tag.data_type, tag.semantic_type),  # 模拟值
            enum_json=enum_json,
            bits=_get_simulated_bits(tag.data_type),  # 如果是BITFIELD16，生成模拟bits
            raw_value=_get_simulated_raw_value(tag.data_type),  # 如果是BITFIELD16，生成模拟raw_value
            instance_name=instance_name,
            point_name=mapping.point_name,  # 完整点名（包含子点）
        )
        
        # 初始化或获取point_card
        if base_point_name not in point_cards_dict:
            point_cards_dict[base_point_name] = {
                "point_name": base_point_name,
                "point_display_name": point_display_name,
                "instance_name": instance_name,
                "instance_display_name": instance_display_name,
                "raw_value": point_raw_value,
                "tags": []  # 该点下的所有tag_value
            }
        
        point_cards_dict[base_point_name]["tags"].append(tag_value)
    
    # 第二步：为每个point_card按group_name分组
    point_cards = []
    for base_point_name, card_data in point_cards_dict.items():
        tags_list = card_data["tags"]
        
        # 按group_name分组
        groups_dict: Dict[str, List[LightPanelTagValue]] = {}
        ungrouped_tags: List[LightPanelTagValue] = []
        
        for tag_value in tags_list:
            if tag_value.group_name:
                if tag_value.group_name not in groups_dict:
                    groups_dict[tag_value.group_name] = []
                groups_dict[tag_value.group_name].append(tag_value)
            else:
                ungrouped_tags.append(tag_value)
        
        # 构建分组列表（按group_name排序，组内tags按tag_name排序）
        groups = [
            LightPanelGroup(
                group_name=group_name,
                tags=sorted(tags_list, key=lambda t: t.tag_name)
            )
            for group_name, tags_list in sorted(groups_dict.items())
        ]
        
        # 构建点卡片
        point_card = LightPanelPointCard(
            point_name=card_data["point_name"],
            point_display_name=card_data["point_display_name"],
            instance_name=card_data["instance_name"],
            instance_display_name=card_data["instance_display_name"],
            raw_value=card_data["raw_value"],
            groups=groups,
            ungrouped_tags=ungrouped_tags,
        )
        point_cards.append(point_card)
    
    # 按point_name排序
    point_cards.sort(key=lambda x: x.point_name)
    
    response = LightPanelStatusResponse(
        asset_id=asset.id,
        asset_name=asset.name,
        asset_display_name=asset.display_name,
        device_type_name=device_type.name,
        point_cards=point_cards,
    )
    
    return success_response(
        data=response,
        message=t("light_panel.success.status_loaded", locale),
        locale=locale,
        request_id=request_id
    )


def _get_simulated_value(data_type: str, semantic_type: str) -> Any:
    """获取模拟值（TODO: 应该从真实的asset_state获取）"""
    if data_type == "BOOL":
        return False
    elif data_type == "ENUM":
        return "0"  # 默认枚举值
    elif data_type == "INT":
        return 0
    elif data_type == "FLOAT":
        return 0.0
    elif data_type == "BITFIELD16":
        return None  # BITFIELD16使用bits和raw_value
    else:
        return None


def _get_simulated_bits(data_type: str) -> Optional[List[int]]:
    """获取模拟bits（仅BITFIELD16）"""
    if data_type == "BITFIELD16":
        return [0] * 16  # 16个bit，默认全0
    return None


def _get_simulated_raw_value(data_type: str) -> Optional[int]:
    """获取模拟raw_value（仅BITFIELD16）"""
    if data_type == "BITFIELD16":
        return 0
    return None

