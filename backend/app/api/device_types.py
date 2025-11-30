"""
设备类型 API 路由
"""

import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.device_type import (
    DeviceTypeCreate,
    DeviceTypeUpdate,
    DeviceTypeResponse,
    DeviceTypeDetailResponse,
    DeviceTypeTagCreate,
    DeviceTypeTagUpdate,
    DeviceTypeTagResponse,
    DeviceTypeCloneRequest,
    DeviceTypeTagCloneRequest,
)
from app.schemas.response import ApiResponse, success_response, paginated_response
from app.models.user import User, UserRole
from app.crud.device_type import device_type_crud, device_type_tag_crud
from app.core.permissions import check_role_permission
from app.core.dependencies import set_audit_target, set_audit_changes
from app.middleware.audit import audit_route
from app.api.deps import get_current_user, get_locale, get_request_id
from app.i18n import t


router = APIRouter(tags=["设备类型管理"])


# ============================================================================
# Device Type APIs
# ============================================================================

@router.get(
    "",
    response_model=ApiResponse[List[DeviceTypeResponse]],
    summary="获取设备类型列表",
    description="分页获取设备类型列表"
)
async def list_device_types(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(20, ge=1, le=100, description="每页记录数"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[DeviceTypeResponse]]:
    """获取设备类型列表"""
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("device_type.error.permission_denied", locale)
    )
    device_types, total = await device_type_crud.get_multi(db, skip, limit, search)
    
    # 添加 tags_count
    result = []
    for dt in device_types:
        dt_dict = DeviceTypeResponse.model_validate(dt).model_dump()
        # 查询业务字段数量
        tags = await device_type_tag_crud.get_multi(db, dt.id)
        dt_dict["tags_count"] = len(tags)
        result.append(DeviceTypeResponse(**dt_dict))
    
    return paginated_response(
        items=result,
        skip=skip,
        limit=limit,
        total=total,
        message=t("device_type.success.list", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/{device_type_id}",
    response_model=ApiResponse[DeviceTypeDetailResponse],
    summary="获取设备类型详情",
    description="获取设备类型详情（包含业务字段列表）"
)
async def get_device_type(
    device_type_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[DeviceTypeDetailResponse]:
    """获取设备类型详情"""
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("device_type.error.permission_denied", locale)
    )
    device_type = await device_type_crud.get_by_id(db, device_type_id)
    if not device_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("device_type.error.not_found", locale)
        )
    
    # 获取业务字段列表
    tags = await device_type_tag_crud.get_multi(db, device_type_id)
    
    return success_response(
        data=DeviceTypeDetailResponse(
            **DeviceTypeResponse.model_validate(device_type).model_dump(),
            tags=[DeviceTypeTagResponse.model_validate(tag) for tag in tags]
        ),
        message=t("device_type.success.detail", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "",
    response_model=ApiResponse[DeviceTypeResponse],
    status_code=status.HTTP_201_CREATED,
    summary="创建设备类型",
    description="创建新的设备类型"
)
@audit_route(
    module="device_type",
    action="create_device_type",
    action_key="audit.action.device_type_created"
)
async def create_device_type(
    device_type_in: DeviceTypeCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[DeviceTypeResponse]:
    """创建设备类型"""
    # 权限检查：需要 OPERATOR 及以上权限
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("device_type.error.permission_denied", locale)
    )
    
    # 检查名称是否已存在
    existing = await device_type_crud.get_by_name(db, device_type_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("device_type.error.name_exists", locale)
        )
    
    # 创建设备类型
    device_type = await device_type_crud.create(db, device_type_in)
    
    # 设置审计目标
    set_audit_target(request, "device_type", str(device_type.id), device_type.display_name)
    
    return success_response(
        data=DeviceTypeResponse.model_validate(device_type),
        message=t("device_type.success.created", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/{device_type_id}/clone",
    response_model=ApiResponse[DeviceTypeDetailResponse],
    summary="复制设备类型",
    description="复制现有设备类型及其业务字段"
)
@audit_route(
    module="device_type",
    action="clone_device_type",
    action_key="audit.action.device_type_cloned"
)
async def clone_device_type(
    device_type_id: int,
    clone_in: DeviceTypeCloneRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[DeviceTypeDetailResponse]:
    """复制设备类型"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("device_type.error.permission_denied", locale)
    )
    source = await device_type_crud.get_by_id(db, device_type_id)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("device_type.error.not_found", locale)
        )
    
    # 确保新名称唯一
    existing = await device_type_crud.get_by_name(db, clone_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("device_type.error.name_exists", locale)
        )
    
    # 创建复制的设备类型
    clone_data = DeviceTypeCreate(
        name=clone_in.name,
        display_name=clone_in.display_name,
        model=clone_in.model if clone_in.model is not None else source.model,
        manufacturer=clone_in.manufacturer if clone_in.manufacturer is not None else source.manufacturer,
        description=clone_in.description if clone_in.description is not None else source.description,
    )
    new_device_type = await device_type_crud.create(db, clone_data)
    
    # 复制业务字段
    source_tags = await device_type_tag_crud.get_multi(db, device_type_id)
    for tag in source_tags:
        enum_data = tag.enum_json
        if isinstance(enum_data, str):
            try:
                enum_data = json.loads(enum_data) if enum_data else {}
            except json.JSONDecodeError:
                enum_data = {}
        tag_create = DeviceTypeTagCreate(
            tag_name=tag.tag_name,
            display_name=tag.display_name,
            data_type=tag.data_type,
            semantic_type=tag.semantic_type,
            engineering_unit=tag.engineering_unit,
            group_name=tag.group_name,
            severity=tag.severity,
            description=tag.description,
            enum_json=enum_data,
        )
        await device_type_tag_crud.create(db, new_device_type.id, tag_create)
    
    cloned_tags = await device_type_tag_crud.get_multi(db, new_device_type.id)
    
    # 设置审计目标
    set_audit_target(request, "device_type", str(new_device_type.id), new_device_type.display_name)
    
    return success_response(
        data=DeviceTypeDetailResponse(
            **DeviceTypeResponse.model_validate(new_device_type).model_dump(),
            tags=[DeviceTypeTagResponse.model_validate(tag) for tag in cloned_tags]
        ),
        message=t("device_type.success.cloned", locale),
        locale=locale,
        request_id=request_id
    )


@router.put(
    "/{device_type_id}",
    response_model=ApiResponse[DeviceTypeResponse],
    summary="更新设备类型",
    description="更新设备类型信息"
)
@audit_route(
    module="device_type",
    action="update_device_type",
    action_key="audit.action.device_type_updated"
)
async def update_device_type(
    device_type_id: int,
    device_type_in: DeviceTypeUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[DeviceTypeResponse]:
    """更新设备类型"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("device_type.error.permission_denied", locale)
    )
    
    # 获取设备类型
    device_type = await device_type_crud.get_by_id(db, device_type_id)
    if not device_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("device_type.error.not_found", locale)
        )
    
    # 记录变更
    device_type_before = DeviceTypeResponse.model_validate(device_type)
    
    # 更新
    device_type = await device_type_crud.update(db, device_type, device_type_in)
    
    # 设置审计目标和变更
    set_audit_target(request, "device_type", str(device_type.id), device_type.display_name)
    set_audit_changes(
        request,
        device_type_before.model_dump(),
        DeviceTypeResponse.model_validate(device_type).model_dump()
    )
    
    return success_response(
        data=DeviceTypeResponse.model_validate(device_type),
        message=t("device_type.success.updated", locale),
        locale=locale,
        request_id=request_id
    )


@router.delete(
    "/{device_type_id}",
    response_model=ApiResponse[None],
    summary="删除设备类型",
    description="删除设备类型"
)
@audit_route(
    module="device_type",
    action="delete_device_type",
    action_key="audit.action.device_type_deleted"
)
async def delete_device_type(
    device_type_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """删除设备类型"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("device_type.error.permission_denied", locale)
    )
    
    # 获取设备类型
    device_type = await device_type_crud.get_by_id(db, device_type_id)
    if not device_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("device_type.error.not_found", locale)
        )
    
    # 设置审计目标
    set_audit_target(request, "device_type", str(device_type.id), device_type.display_name)
    
    # 删除
    await device_type_crud.delete(db, device_type)
    
    return success_response(
        data=None,
        message=t("device_type.success.deleted", locale),
        locale=locale,
        request_id=request_id
    )


# ============================================================================
# Device Type Tag APIs
# ============================================================================

@router.get(
    "/{device_type_id}/tags",
    response_model=ApiResponse[List[DeviceTypeTagResponse]],
    summary="获取业务字段列表",
    description="获取设备类型的业务字段列表"
)
async def list_device_type_tags(
    device_type_id: int,
    semantic_type: Optional[str] = Query(None, description="按语义类型过滤"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[DeviceTypeTagResponse]]:
    """获取业务字段列表"""
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("device_type_tag.error.permission_denied", locale)
    )
    # 检查设备类型是否存在
    device_type = await device_type_crud.get_by_id(db, device_type_id)
    if not device_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("device_type.error.not_found", locale)
        )
    
    tags = await device_type_tag_crud.get_multi(db, device_type_id, semantic_type)
    
    return success_response(
        data=[DeviceTypeTagResponse.model_validate(tag) for tag in tags],
        message=t("device_type_tag.success.list", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/{device_type_id}/tags",
    response_model=ApiResponse[DeviceTypeTagResponse],
    status_code=status.HTTP_201_CREATED,
    summary="创建业务字段",
    description="为设备类型创建新的业务字段"
)
@audit_route(
    module="device_type_tag",
    action="create_device_type_tag",
    action_key="audit.action.device_type_tag_created"
)
async def create_device_type_tag(
    device_type_id: int,
    tag_in: DeviceTypeTagCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[DeviceTypeTagResponse]:
    """创建业务字段"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("device_type_tag.error.permission_denied", locale)
    )
    
    # 检查设备类型是否存在
    device_type = await device_type_crud.get_by_id(db, device_type_id)
    if not device_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("device_type.error.not_found", locale)
        )
    
    # 检查字段名是否已存在
    existing = await device_type_tag_crud.get_by_tag_name(db, device_type_id, tag_in.tag_name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("device_type_tag.error.tag_name_exists", locale)
        )
    
    # 创建业务字段
    tag = await device_type_tag_crud.create(db, device_type_id, tag_in)
    
    # 设置审计目标
    set_audit_target(
        request,
        "device_type_tag",
        str(tag.id),
        f"{device_type.display_name}.{tag.display_name}"
    )
    
    return success_response(
        data=DeviceTypeTagResponse.model_validate(tag),
        message=t("device_type_tag.success.created", locale),
        locale=locale,
        request_id=request_id
    )


@router.put(
    "/tags/{tag_id}",
    response_model=ApiResponse[DeviceTypeTagResponse],
    summary="更新业务字段",
    description="更新业务字段信息"
)
@audit_route(
    module="device_type_tag",
    action="update_device_type_tag",
    action_key="audit.action.device_type_tag_updated"
)
async def update_device_type_tag(
    tag_id: int,
    tag_in: DeviceTypeTagUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[DeviceTypeTagResponse]:
    """更新业务字段"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("device_type_tag.error.permission_denied", locale)
    )
    
    # 获取业务字段
    tag = await device_type_tag_crud.get_by_id(db, tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("device_type_tag.error.not_found", locale)
        )
    
    # 记录变更
    tag_before = DeviceTypeTagResponse.model_validate(tag)
    
    # 更新
    tag = await device_type_tag_crud.update(db, tag, tag_in)
    
    # 设置审计目标和变更
    device_type = await device_type_crud.get_by_id(db, tag.device_type_id)
    set_audit_target(
        request,
        "device_type_tag",
        str(tag.id),
        f"{device_type.display_name}.{tag.display_name}" if device_type else tag.display_name
    )
    set_audit_changes(
        request,
        tag_before.model_dump(),
        DeviceTypeTagResponse.model_validate(tag).model_dump()
    )
    
    return success_response(
        data=DeviceTypeTagResponse.model_validate(tag),
        message=t("device_type_tag.success.updated", locale),
        locale=locale,
        request_id=request_id
    )


@router.delete(
    "/tags/{tag_id}",
    response_model=ApiResponse[None],
    summary="删除业务字段",
    description="删除业务字段"
)
@audit_route(
    module="device_type_tag",
    action="delete_device_type_tag",
    action_key="audit.action.device_type_tag_deleted"
)
async def delete_device_type_tag(
    tag_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """删除业务字段"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("device_type_tag.error.permission_denied", locale)
    )
    
    # 获取业务字段
    tag = await device_type_tag_crud.get_by_id(db, tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("device_type_tag.error.not_found", locale)
        )
    
    # 设置审计目标
    device_type = await device_type_crud.get_by_id(db, tag.device_type_id)
    set_audit_target(
        request,
        "device_type_tag",
        str(tag.id),
        f"{device_type.display_name}.{tag.display_name}" if device_type else tag.display_name
    )
    
    # 删除
    await device_type_tag_crud.delete(db, tag)
    
    return success_response(
        data=None,
        message=t("device_type_tag.success.deleted", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/tags/{tag_id}/clone",
    response_model=ApiResponse[DeviceTypeTagResponse],
    summary="复制业务字段",
    description="复制现有业务字段到同一设备类型"
)
@audit_route(
    module="device_type_tag",
    action="clone_device_type_tag",
    action_key="audit.action.device_type_tag_cloned"
)
async def clone_device_type_tag(
    tag_id: int,
    clone_in: DeviceTypeTagCloneRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[DeviceTypeTagResponse]:
    """复制业务字段"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("device_type_tag.error.permission_denied", locale)
    )
    tag = await device_type_tag_crud.get_by_id(db, tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("device_type_tag.error.not_found", locale)
        )
    
    # 名称必须唯一
    existing = await device_type_tag_crud.get_by_tag_name(db, tag.device_type_id, clone_in.tag_name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("device_type_tag.error.tag_name_exists", locale)
        )
    
    enum_data = tag.enum_json
    if isinstance(enum_data, str):
        try:
            enum_data = json.loads(enum_data) if enum_data else {}
        except json.JSONDecodeError:
            enum_data = {}
    
    clone_data = DeviceTypeTagCreate(
        tag_name=clone_in.tag_name,
        display_name=clone_in.display_name or tag.display_name,
        data_type=clone_in.data_type or tag.data_type,
        semantic_type=clone_in.semantic_type or tag.semantic_type,
        engineering_unit=clone_in.engineering_unit if clone_in.engineering_unit is not None else tag.engineering_unit,
        group_name=clone_in.group_name if clone_in.group_name is not None else tag.group_name,
        severity=clone_in.severity if clone_in.severity is not None else tag.severity,
        description=clone_in.description if clone_in.description is not None else tag.description,
        enum_json=clone_in.enum_json if clone_in.enum_json is not None else enum_data,
    )
    
    new_tag = await device_type_tag_crud.create(db, tag.device_type_id, clone_data)
    
    set_audit_target(request, "device_type_tag", str(new_tag.id), new_tag.display_name)
    
    return success_response(
        data=DeviceTypeTagResponse.model_validate(new_tag),
        message=t("device_type_tag.success.cloned", locale),
        locale=locale,
        request_id=request_id
    )

