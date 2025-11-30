"""
资产 API 路由
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.asset import (
    AssetCreate,
    AssetUpdate,
    AssetResponse,
    AssetDetailResponse,
    AssetMappingCreate,
    AssetMappingResponse,
    AssetMappingUpdate,
    AssetMappingDetailResponse,
    AssetBindingSyncRequest,
)
from app.schemas.response import ApiResponse, success_response, paginated_response
from app.models.user import User, UserRole
from app.crud.asset import asset_crud, asset_mapping_crud, asset_comm_binding_crud
from app.crud.comm_instance import comm_instance_crud
from app.crud.device_type import device_type_crud
from app.core.permissions import check_role_permission
from app.core.dependencies import set_audit_target, set_audit_changes
from app.middleware.audit import audit_route
from app.api.deps import get_current_user, get_locale, get_request_id
from app.i18n import t


router = APIRouter(tags=["资产管理"])


# ============================================================================
# Asset APIs
# ============================================================================

@router.get(
    "",
    response_model=ApiResponse[List[AssetResponse]],
    summary="获取资产列表",
    description="分页获取资产列表"
)
async def list_assets(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(20, ge=1, le=100, description="每页记录数"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    device_type_id: Optional[int] = Query(None, description="设备类型ID过滤"),
    enabled: Optional[bool] = Query(None, description="是否启用过滤"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[AssetResponse]]:
    """获取资产列表"""
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("asset.error.permission_denied", locale)
    )
    assets, total = await asset_crud.get_multi(
        db, skip, limit, search, device_type_id, enabled
    )
    
    # 添加设备类型信息
    result = []
    for asset in assets:
        asset_dict = AssetResponse.model_validate(asset).model_dump()
        device_type = await device_type_crud.get_by_id(db, asset.device_type_id)
        if device_type:
            asset_dict["device_type_name"] = device_type.name
            asset_dict["device_type_display_name"] = device_type.display_name
        asset_dict["comm_instance_ids"] = await asset_comm_binding_crud.get_instance_ids(db, asset.id)
        result.append(AssetResponse(**asset_dict))
    
    return paginated_response(
        items=result,
        skip=skip,
        limit=limit,
        total=total,
        message=t("asset.success.list", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/{asset_id}",
    response_model=ApiResponse[AssetDetailResponse],
    summary="获取资产详情",
    description="获取资产详情（包含映射列表）"
)
async def get_asset(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[AssetDetailResponse]:
    """获取资产详情"""
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("asset.error.permission_denied", locale)
    )
    asset = await asset_crud.get_by_id(db, asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("asset.error.not_found", locale)
        )
    
    # 获取设备类型信息
    asset_dict = AssetResponse.model_validate(asset).model_dump()
    device_type = await device_type_crud.get_by_id(db, asset.device_type_id)
    if device_type:
        asset_dict["device_type_name"] = device_type.name
        asset_dict["device_type_display_name"] = device_type.display_name
    asset_dict["comm_instance_ids"] = await asset_comm_binding_crud.get_instance_ids(db, asset.id)
    
    # 获取映射列表
    mappings = await asset_mapping_crud.get_multi(db, asset_id)
    
    return success_response(
        data=AssetDetailResponse(
            **asset_dict,
            mappings=[AssetMappingResponse.model_validate(m) for m in mappings]
        ),
        message=t("asset.success.detail", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "",
    response_model=ApiResponse[AssetResponse],
    status_code=status.HTTP_201_CREATED,
    summary="创建资产",
    description="创建新的资产（可选择自动生成映射）"
)
@audit_route(
    module="asset",
    action="create_asset",
    action_key="audit.action.asset_created"
)
async def create_asset(
    asset_in: AssetCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[AssetResponse]:
    """创建资产"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("asset.error.permission_denied", locale)
    )
    
    # 检查名称是否已存在
    existing = await asset_crud.get_by_name(db, asset_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("asset.error.name_exists", locale)
        )
    
    # 检查设备类型是否存在
    device_type = await device_type_crud.get_by_id(db, asset_in.device_type_id)
    if not device_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("device_type.error.not_found", locale)
        )
    
    # 创建资产
    asset = await asset_crud.create(db, asset_in)
    
    # 绑定通信实例
    if asset_in.comm_instance_ids:
        for instance_id in asset_in.comm_instance_ids:
            instance = await comm_instance_crud.get_by_id(db, instance_id)
            if not instance:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=t("comm_instance.error.not_found", locale)
                )
        await asset_comm_binding_crud.set_bindings(db, asset.id, asset_in.comm_instance_ids)
    
    # 设置审计目标
    set_audit_target(request, "asset", str(asset.id), asset.display_name)
    
    asset_dict = AssetResponse.model_validate(asset).model_dump()
    asset_dict["comm_instance_ids"] = await asset_comm_binding_crud.get_instance_ids(db, asset.id)
    
    return success_response(
        data=AssetResponse(**asset_dict),
        message=t("asset.success.created", locale),
        locale=locale,
        request_id=request_id
    )


@router.put(
    "/{asset_id}",
    response_model=ApiResponse[AssetResponse],
    summary="更新资产",
    description="更新资产信息"
)
@audit_route(
    module="asset",
    action="update_asset",
    action_key="audit.action.asset_updated"
)
async def update_asset(
    asset_id: int,
    asset_in: AssetUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[AssetResponse]:
    """更新资产"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("asset.error.permission_denied", locale)
    )
    
    # 获取资产
    asset = await asset_crud.get_by_id(db, asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("asset.error.not_found", locale)
        )
    
    # 如果更新设备类型，检查是否存在
    if asset_in.device_type_id is not None:
        device_type = await device_type_crud.get_by_id(db, asset_in.device_type_id)
        if not device_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=t("device_type.error.not_found", locale)
            )
    
    # 记录变更
    asset_before = AssetResponse.model_validate(asset)
    
    # 更新
    asset = await asset_crud.update(db, asset, asset_in)
    
    # 设置审计目标和变更
    set_audit_target(request, "asset", str(asset.id), asset.display_name)
    set_audit_changes(
        request,
        asset_before.model_dump(),
        AssetResponse.model_validate(asset).model_dump()
    )
    
    asset_dict = AssetResponse.model_validate(asset).model_dump()
    asset_dict["comm_instance_ids"] = await asset_comm_binding_crud.get_instance_ids(db, asset.id)
    
    return success_response(
        data=AssetResponse(**asset_dict),
        message=t("asset.success.updated", locale),
        locale=locale,
        request_id=request_id
    )


@router.delete(
    "/{asset_id}",
    response_model=ApiResponse[None],
    summary="删除资产",
    description="删除资产"
)
@audit_route(
    module="asset",
    action="delete_asset",
    action_key="audit.action.asset_deleted"
)
async def delete_asset(
    asset_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """删除资产"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("asset.error.permission_denied", locale)
    )
    
    # 获取资产
    asset = await asset_crud.get_by_id(db, asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("asset.error.not_found", locale)
        )
    
    # 设置审计目标
    set_audit_target(request, "asset", str(asset.id), asset.display_name)
    
    # 删除
    await asset_crud.delete(db, asset)
    
    return success_response(
        data=None,
        message=t("asset.success.deleted", locale),
        locale=locale,
        request_id=request_id
    )


# ============================================================================
# Asset Mapping APIs
# ============================================================================

@router.get(
    "/{asset_id}/mappings",
    response_model=ApiResponse[List[AssetMappingDetailResponse]],
    summary="获取资产映射列表",
    description="获取资产的所有映射（包含详细信息）"
)
async def list_asset_mappings(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[AssetMappingDetailResponse]]:
    """获取资产映射列表（包含详细信息）"""
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("asset_mapping.error.permission_denied", locale)
    )
    # 检查资产是否存在
    asset = await asset_crud.get_by_id(db, asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("asset.error.not_found", locale)
        )
    
    # 获取映射详情
    mappings_details = await asset_mapping_crud.get_mappings_with_details(db, asset_id)
    
    # 转换为响应格式
    result = []
    for detail in mappings_details:
        if detail["mapping"]:
            mapping_dict = AssetMappingResponse.model_validate(detail["mapping"]).model_dump()
            # 添加详细信息
            if detail["instance"]:
                mapping_dict["instance_name"] = detail["instance"].name
                mapping_dict["instance_display_name"] = detail["instance"].display_name
            if detail["tag"]:
                mapping_dict["tag_display_name"] = detail["tag"].display_name
                mapping_dict["tag_group_name"] = detail["tag"].group_name
            if detail["point"]:
                mapping_dict["point_address"] = detail["point"].address
                mapping_dict["point_raw_type"] = detail["point"].raw_type
            
            # 添加业务字段信息
            if detail["tag"]:
                mapping_dict["tag_semantic_type"] = detail["tag"].semantic_type
                mapping_dict["tag_data_type"] = detail["tag"].data_type
            
            result.append(AssetMappingDetailResponse(**mapping_dict))
        else:
            # 未映射的字段
            if detail["tag"]:
                result.append(AssetMappingDetailResponse(
                    id=0,
                    asset_id=asset_id,
                    asset_tag_name=detail["tag"].tag_name,
                    instance_id=0,
                    point_name=None,  # 未映射时使用 None 而不是空字符串
                    is_overridden=False,
                    created_at=asset.created_at,
                    updated_at=asset.updated_at,
                    tag_display_name=detail["tag"].display_name,
                    tag_semantic_type=detail["tag"].semantic_type,
                    tag_data_type=detail["tag"].data_type,
                    tag_group_name=detail["tag"].group_name
                ))
    
    return success_response(
        data=result,
        message=t("asset_mapping.success.list", locale),
        locale=locale,
        request_id=request_id
    )


@router.put(
    "/mappings/{mapping_id}",
    response_model=ApiResponse[AssetMappingResponse],
    summary="更新资产映射",
    description="更新资产映射信息"
)
@audit_route(
    module="asset_mapping",
    action="update_asset_mapping",
    action_key="audit.action.asset_mapping_updated"
)
async def update_asset_mapping(
    mapping_id: int,
    mapping_in: AssetMappingUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[AssetMappingResponse]:
    """更新资产映射"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("asset_mapping.error.permission_denied", locale)
    )
    
    # 获取映射
    mapping = await asset_mapping_crud.get_by_id(db, mapping_id)
    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("asset_mapping.error.not_found", locale)
        )
    
    # 记录变更
    mapping_before = AssetMappingResponse.model_validate(mapping)
    
    # 更新
    mapping = await asset_mapping_crud.update(db, mapping, mapping_in)
    
    # 设置审计目标和变更
    asset = await asset_crud.get_by_id(db, mapping.asset_id)
    set_audit_target(
        request,
        "asset_mapping",
        str(mapping.id),
        f"{asset.display_name}.{mapping.asset_tag_name}" if asset else mapping.asset_tag_name
    )
    set_audit_changes(
        request,
        mapping_before.model_dump(),
        AssetMappingResponse.model_validate(mapping).model_dump()
    )
    
    return success_response(
        data=AssetMappingResponse.model_validate(mapping),
        message=t("asset_mapping.success.updated", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/{asset_id}/mappings",
    response_model=ApiResponse[AssetMappingResponse],
    status_code=status.HTTP_201_CREATED,
    summary="创建资产映射",
    description="为资产创建新的映射"
)
@audit_route(
    module="asset_mapping",
    action="create_asset_mapping",
    action_key="audit.action.asset_mapping_created"
)
async def create_asset_mapping(
    asset_id: int,
    mapping_in: AssetMappingCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[AssetMappingResponse]:
    """创建资产映射"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("asset_mapping.error.permission_denied", locale)
    )
    
    # 检查资产是否存在
    asset = await asset_crud.get_by_id(db, asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("asset.error.not_found", locale)
        )
    
    # 检查映射是否已存在
    existing = await asset_mapping_crud.get_by_asset_tag(db, asset_id, mapping_in.asset_tag_name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("asset_mapping.error.already_exists", locale)
        )
    
    # 创建映射
    mapping = await asset_mapping_crud.create(db, asset_id, mapping_in)
    
    # 设置审计目标
    set_audit_target(
        request,
        "asset_mapping",
        str(mapping.id),
        f"{asset.display_name}.{mapping.asset_tag_name}"
    )
    
    return success_response(
        data=AssetMappingResponse.model_validate(mapping),
        message=t("asset_mapping.success.created", locale),
        locale=locale,
        request_id=request_id
    )


@router.delete(
    "/mappings/{mapping_id}",
    response_model=ApiResponse[None],
    summary="删除资产映射",
    description="删除资产映射"
)
@audit_route(
    module="asset_mapping",
    action="delete_asset_mapping",
    action_key="audit.action.asset_mapping_deleted"
)
async def delete_asset_mapping(
    mapping_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """删除资产映射"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("asset_mapping.error.permission_denied", locale)
    )
    
    # 获取映射
    mapping = await asset_mapping_crud.get_by_id(db, mapping_id)
    if not mapping:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("asset_mapping.error.not_found", locale)
        )
    
    # 设置审计目标
    asset = await asset_crud.get_by_id(db, mapping.asset_id)
    set_audit_target(
        request,
        "asset_mapping",
        str(mapping.id),
        f"{asset.display_name}.{mapping.asset_tag_name}" if asset else mapping.asset_tag_name
    )
    
    # 删除
    await asset_mapping_crud.delete(db, mapping)
    
    return success_response(
        data=None,
        message=t("asset_mapping.success.deleted", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/{asset_id}/mappings/auto-generate",
    response_model=ApiResponse[dict],
    summary="同步资产通信实例",
    description="根据提交的通信实例列表同步资产绑定，并移除已解绑实例的映射"
)
@audit_route(
    module="asset_mapping",
    action="auto_generate_asset_mappings",
    action_key="audit.action.asset_mappings_auto_generated"
)
async def sync_asset_comm_instances(
    asset_id: int,
    request_body: AssetBindingSyncRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[dict]:
    """同步资产绑定的通信实例列表，并清理已解绑实例的映射"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("asset_mapping.error.permission_denied", locale)
    )
    
    asset = await asset_crud.get_by_id(db, asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("asset.error.not_found", locale)
        )
    
    new_instance_ids = request_body.comm_instance_ids or []
    existing_ids = await asset_comm_binding_crud.get_instance_ids(db, asset_id)
    
    for instance_id in new_instance_ids:
        instance = await comm_instance_crud.get_by_id(db, instance_id)
        if not instance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=t("comm_instance.error.not_found", locale)
            )
    
    await asset_comm_binding_crud.set_bindings(db, asset_id, new_instance_ids)
    
    removed_instance_ids = list(set(existing_ids) - set(new_instance_ids))
    if removed_instance_ids:
        await asset_mapping_crud.remove_by_instance_ids(db, asset_id, removed_instance_ids)
    
    set_audit_target(request, "asset", str(asset.id), asset.display_name)
    
    return success_response(
        data={
            "created_count": len(set(new_instance_ids)),
            "comm_instance_ids": await asset_comm_binding_crud.get_instance_ids(db, asset_id),
        },
        message=t("asset_mapping.success.auto_generated", locale),
        locale=locale,
        request_id=request_id
    )

