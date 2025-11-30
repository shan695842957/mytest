"""
SOE 事件查询 API 路由
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.soe import SOEEventResponse, SOEEventQueryParams
from app.schemas.response import ApiResponse, success_response, paginated_response
from app.models.user import User, UserRole
from app.crud.soe import soe_crud
from app.core.permissions import check_role_permission
from app.crud.asset import asset_crud
from app.crud.device_type import device_type_tag_crud
from app.api.deps import get_current_user, get_locale, get_request_id
from app.i18n import t


router = APIRouter(tags=["SOE事件查询"])


@router.get(
    "",
    response_model=ApiResponse[List[SOEEventResponse]],
    summary="查询SOE事件",
    description="根据条件查询SOE事件列表"
)
async def query_soe_events(
    from_time: Optional[datetime] = Query(None, description="开始时间"),
    to_time: Optional[datetime] = Query(None, description="结束时间"),
    asset_ids: Optional[str] = Query(None, description="资产ID列表（逗号分隔）"),
    severity: Optional[str] = Query(None, description="严重性列表（逗号分隔，0~4）"),
    event_types: Optional[str] = Query(None, description="事件类型列表（逗号分隔）"),
    search: Optional[str] = Query(None, description="关键字搜索"),
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(100, ge=1, le=1000, description="每页记录数"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[SOEEventResponse]]:
    """
    查询SOE事件
    
    支持多种过滤条件：
    - 时间范围（from_time, to_time）
    - 资产ID列表（asset_ids）
    - 严重性列表（severity）
    - 事件类型列表（event_types）
    - 关键字搜索（search，匹配 value_text）
    """
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("soe.error.permission_denied", locale)
    )
    # 解析参数
    params = SOEEventQueryParams(
        from_time=from_time,
        to_time=to_time,
        asset_ids=[int(x) for x in asset_ids.split(",")] if asset_ids else [],
        severity=[int(x) for x in severity.split(",")] if severity else [],
        event_types=event_types.split(",") if event_types else [],
        search=search,
        skip=skip,
        limit=limit
    )
    
    # 查询事件
    events, total = await soe_crud.get_multi(db, params)
    
    # 添加关联信息（资产名称、业务字段显示名等）
    result = []
    for event in events:
        event_dict = SOEEventResponse.model_validate(event).model_dump()
        
        # 获取资产信息
        asset = await asset_crud.get_by_id(db, event.asset_id)
        if asset:
            event_dict["asset_name"] = asset.name
            event_dict["asset_display_name"] = asset.display_name
        
        # 获取业务字段信息
        if asset:
            tag = await device_type_tag_crud.get_by_tag_name(
                db, asset.device_type_id, event.asset_tag_name
            )
            if tag:
                event_dict["tag_display_name"] = tag.display_name
        
        result.append(SOEEventResponse(**event_dict))
    
    return paginated_response(
        items=result,
        skip=skip,
        limit=limit,
        total=total,
        message=t("soe.success.query", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/{event_id}",
    response_model=ApiResponse[SOEEventResponse],
    summary="获取SOE事件详情",
    description="获取单个SOE事件的详细信息"
)
async def get_soe_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[SOEEventResponse]:
    """获取SOE事件详情"""
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("soe.error.permission_denied", locale)
    )
    event = await soe_crud.get_by_id(db, event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("soe.error.not_found", locale)
        )
    
    # 添加关联信息
    event_dict = SOEEventResponse.model_validate(event).model_dump()
    
    # 获取资产信息
    asset = await asset_crud.get_by_id(db, event.asset_id)
    if asset:
        event_dict["asset_name"] = asset.name
        event_dict["asset_display_name"] = asset.display_name
        
        # 获取业务字段信息
        tag = await device_type_tag_crud.get_by_tag_name(
            db, asset.device_type_id, event.asset_tag_name
        )
        if tag:
            event_dict["tag_display_name"] = tag.display_name
    
    return success_response(
        data=SOEEventResponse(**event_dict),
        message=t("soe.success.detail", locale),
        locale=locale,
        request_id=request_id
    )

