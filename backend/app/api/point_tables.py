"""
点表模板 API 路由
"""

import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.point_table import (
    PointTableTemplateCreate,
    PointTableTemplateUpdate,
    PointTableTemplateResponse,
    PointTableTemplateDetailResponse,
    PointTableTemplateCloneRequest,
    PointTablePointCreate,
    PointTablePointUpdate,
    PointTablePointCloneRequest,
    PointTablePointResponse,
)
from app.schemas.response import ApiResponse, success_response, paginated_response
from app.models.user import User, UserRole
from app.crud.point_table import point_table_template_crud, point_table_point_crud
from app.core.permissions import check_role_permission
from app.core.dependencies import set_audit_target, set_audit_changes
from app.middleware.audit import audit_route
from app.api.deps import get_current_user, get_locale, get_request_id
from app.i18n import t


router = APIRouter(tags=["点表模板管理"])


# ============================================================================
# Point Table Template APIs
# ============================================================================

@router.get(
    "",
    response_model=ApiResponse[List[PointTableTemplateResponse]],
    summary="获取点表模板列表",
    description="分页获取点表模板列表"
)
async def list_point_table_templates(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(20, ge=1, le=100, description="每页记录数"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    protocol_type: Optional[str] = Query(None, description="协议类型过滤"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[PointTableTemplateResponse]]:
    """获取点表模板列表"""
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("point_table.error.permission_denied", locale)
    )
    templates, total = await point_table_template_crud.get_multi(
        db, skip, limit, search, protocol_type
    )
    
    # 添加 points_count
    result = []
    for tmpl in templates:
        tmpl_dict = PointTableTemplateResponse.model_validate(tmpl).model_dump()
        points = await point_table_point_crud.get_multi(db, tmpl.id)
        tmpl_dict["points_count"] = len(points)
        result.append(PointTableTemplateResponse(**tmpl_dict))
    
    return paginated_response(
        items=result,
        skip=skip,
        limit=limit,
        total=total,
        message=t("point_table.success.list", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/{template_id}",
    response_model=ApiResponse[PointTableTemplateDetailResponse],
    summary="获取点表模板详情",
    description="获取点表模板详情（包含点列表）"
)
async def get_point_table_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[PointTableTemplateDetailResponse]:
    """获取点表模板详情"""
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("point_table.error.permission_denied", locale)
    )
    template = await point_table_template_crud.get_by_id(db, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("point_table.error.not_found", locale)
        )
    
    # 获取点列表
    points = await point_table_point_crud.get_multi(db, template_id)
    
    return success_response(
        data=PointTableTemplateDetailResponse(
            **PointTableTemplateResponse.model_validate(template).model_dump(),
            points=[PointTablePointResponse.model_validate(p) for p in points]
        ),
        message=t("point_table.success.detail", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "",
    response_model=ApiResponse[PointTableTemplateResponse],
    status_code=status.HTTP_201_CREATED,
    summary="创建点表模板",
    description="创建新的点表模板"
)
@audit_route(
    module="point_table",
    action="create_point_table_template",
    action_key="audit.action.point_table_template_created"
)
async def create_point_table_template(
    template_in: PointTableTemplateCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[PointTableTemplateResponse]:
    """创建点表模板"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("point_table.error.permission_denied", locale)
    )
    
    # 检查名称是否已存在
    existing = await point_table_template_crud.get_by_name(db, template_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("point_table.error.name_exists", locale)
        )
    
    # 创建点表模板
    template = await point_table_template_crud.create(db, template_in)
    
    # 设置审计目标
    set_audit_target(request, "point_table_template", str(template.id), template.display_name)
    
    return success_response(
        data=PointTableTemplateResponse.model_validate(template),
        message=t("point_table.success.created", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/{template_id}/clone",
    response_model=ApiResponse[PointTableTemplateDetailResponse],
    summary="复制点表模板",
    description="复制现有点表模板及其点表点"
)
@audit_route(
    module="point_table",
    action="clone_point_table_template",
    action_key="audit.action.point_table_template_cloned"
)
async def clone_point_table_template(
    template_id: int,
    clone_in: PointTableTemplateCloneRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[PointTableTemplateDetailResponse]:
    """复制点表模板"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("point_table.error.permission_denied", locale)
    )
    source = await point_table_template_crud.get_by_id(db, template_id)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("point_table.error.not_found", locale)
        )
    
    existing = await point_table_template_crud.get_by_name(db, clone_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("point_table.error.name_exists", locale)
        )
    
    clone_data = PointTableTemplateCreate(
        name=clone_in.name,
        display_name=clone_in.display_name,
        protocol_type=clone_in.protocol_type if clone_in.protocol_type is not None else source.protocol_type,
        description=clone_in.description if clone_in.description is not None else source.description,
    )
    new_template = await point_table_template_crud.create(db, clone_data)
    
    source_points = await point_table_point_crud.get_multi(db, template_id)
    for point in source_points:
        parse_rules = point.parse_rules_json
        if isinstance(parse_rules, str):
            try:
                parse_rules = json.loads(parse_rules) if parse_rules else {}
            except json.JSONDecodeError:
                parse_rules = {}
        point_create = PointTablePointCreate(
            point_name=point.point_name,
            display_name=point.display_name,
            address=point.address,
            io_type=point.io_type,
            raw_type=point.raw_type,
            byte_order=point.byte_order,
            scale_k=point.scale_k,
            scale_b=point.scale_b,
            parse_rules_json=parse_rules,
            description=point.description,
            is_active=point.is_active,
        )
        await point_table_point_crud.create(db, new_template.id, point_create)
    
    cloned_points = await point_table_point_crud.get_multi(db, new_template.id)
    
    set_audit_target(request, "point_table_template", str(new_template.id), new_template.display_name)
    
    return success_response(
        data=PointTableTemplateDetailResponse(
            **PointTableTemplateResponse.model_validate(new_template).model_dump(),
            points=[PointTablePointResponse.model_validate(p) for p in cloned_points]
        ),
        message=t("point_table.success.cloned", locale),
        locale=locale,
        request_id=request_id
    )


@router.put(
    "/{template_id}",
    response_model=ApiResponse[PointTableTemplateResponse],
    summary="更新点表模板",
    description="更新点表模板信息"
)
@audit_route(
    module="point_table",
    action="update_point_table_template",
    action_key="audit.action.point_table_template_updated"
)
async def update_point_table_template(
    template_id: int,
    template_in: PointTableTemplateUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[PointTableTemplateResponse]:
    """更新点表模板"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("point_table.error.permission_denied", locale)
    )
    
    # 获取点表模板
    template = await point_table_template_crud.get_by_id(db, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("point_table.error.not_found", locale)
        )
    
    # 记录变更
    template_before = PointTableTemplateResponse.model_validate(template)
    
    # 更新
    template = await point_table_template_crud.update(db, template, template_in)
    
    # 设置审计目标和变更
    set_audit_target(request, "point_table_template", str(template.id), template.display_name)
    set_audit_changes(
        request,
        template_before.model_dump(),
        PointTableTemplateResponse.model_validate(template).model_dump()
    )
    
    return success_response(
        data=PointTableTemplateResponse.model_validate(template),
        message=t("point_table.success.updated", locale),
        locale=locale,
        request_id=request_id
    )


@router.delete(
    "/{template_id}",
    response_model=ApiResponse[None],
    summary="删除点表模板",
    description="删除点表模板"
)
@audit_route(
    module="point_table",
    action="delete_point_table_template",
    action_key="audit.action.point_table_template_deleted"
)
async def delete_point_table_template(
    template_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """删除点表模板"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("point_table.error.permission_denied", locale)
    )
    
    # 获取点表模板
    template = await point_table_template_crud.get_by_id(db, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("point_table.error.not_found", locale)
        )
    
    # 设置审计目标
    set_audit_target(request, "point_table_template", str(template.id), template.display_name)
    
    # 删除
    await point_table_template_crud.delete(db, template)
    
    return success_response(
        data=None,
        message=t("point_table.success.deleted", locale),
        locale=locale,
        request_id=request_id
    )


# ============================================================================
# Point Table Point APIs
# ============================================================================

@router.get(
    "/{template_id}/points",
    response_model=ApiResponse[List[PointTablePointResponse]],
    summary="获取点表点列表",
    description="获取点表模板的点列表"
)
async def list_point_table_points(
    template_id: int,
    search: Optional[str] = Query(None, description="搜索关键词"),
    is_active: Optional[bool] = Query(None, description="是否启用过滤"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[PointTablePointResponse]]:
    """获取点表点列表"""
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("point_table_point.error.permission_denied", locale)
    )
    # 检查点表模板是否存在
    template = await point_table_template_crud.get_by_id(db, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("point_table.error.not_found", locale)
        )
    
    points = await point_table_point_crud.get_multi(db, template_id, search, is_active)
    
    return success_response(
        data=[PointTablePointResponse.model_validate(p) for p in points],
        message=t("point_table_point.success.list", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/points/{point_id}/clone",
    response_model=ApiResponse[PointTablePointResponse],
    summary="复制点表点",
    description="复制现有点表点"
)
@audit_route(
    module="point_table_point",
    action="clone_point_table_point",
    action_key="audit.action.point_table_point_cloned"
)
async def clone_point_table_point(
    point_id: int,
    clone_in: PointTablePointCloneRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[PointTablePointResponse]:
    """复制点表点"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("point_table_point.error.permission_denied", locale)
    )
    point = await point_table_point_crud.get_by_id(db, point_id)
    if not point:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("point_table_point.error.not_found", locale)
        )
    
    # 名称需唯一
    existing = await point_table_point_crud.get_by_point_name(db, point.point_table_id, clone_in.point_name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("point_table_point.error.point_name_exists", locale)
        )
    
    parse_rules = point.parse_rules_json
    if isinstance(parse_rules, str):
        try:
            parse_rules = json.loads(parse_rules) if parse_rules else {}
        except json.JSONDecodeError:
            parse_rules = {}
    
    point_create = PointTablePointCreate(
        point_name=clone_in.point_name,
        display_name=clone_in.display_name or point.display_name,
        address=clone_in.address or point.address,
        io_type=clone_in.io_type or point.io_type,
        raw_type=clone_in.raw_type or point.raw_type,
        byte_order=clone_in.byte_order or point.byte_order,
        scale_k=clone_in.scale_k if clone_in.scale_k is not None else point.scale_k,
        scale_b=clone_in.scale_b if clone_in.scale_b is not None else point.scale_b,
        parse_rules_json=clone_in.parse_rules_json if clone_in.parse_rules_json is not None else parse_rules,
        description=clone_in.description if clone_in.description is not None else point.description,
        is_active=clone_in.is_active if clone_in.is_active is not None else point.is_active,
    )
    
    new_point = await point_table_point_crud.create(db, point.point_table_id, point_create)
    
    set_audit_target(request, "point_table_point", str(new_point.id), new_point.display_name)
    
    return success_response(
        data=PointTablePointResponse.model_validate(new_point),
        message=t("point_table_point.success.cloned", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/{template_id}/points",
    response_model=ApiResponse[PointTablePointResponse],
    status_code=status.HTTP_201_CREATED,
    summary="创建点表点",
    description="为点表模板创建新的点"
)
@audit_route(
    module="point_table_point",
    action="create_point_table_point",
    action_key="audit.action.point_table_point_created"
)
async def create_point_table_point(
    template_id: int,
    point_in: PointTablePointCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[PointTablePointResponse]:
    """创建点表点"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("point_table_point.error.permission_denied", locale)
    )
    
    # 检查点表模板是否存在
    template = await point_table_template_crud.get_by_id(db, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("point_table.error.not_found", locale)
        )
    
    # 检查点名是否已存在
    existing = await point_table_point_crud.get_by_point_name(db, template_id, point_in.point_name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("point_table_point.error.point_name_exists", locale)
        )
    
    # 创建点表点
    point = await point_table_point_crud.create(db, template_id, point_in)
    
    # 设置审计目标
    set_audit_target(
        request,
        "point_table_point",
        str(point.id),
        f"{template.display_name}.{point.display_name}"
    )
    
    return success_response(
        data=PointTablePointResponse.model_validate(point),
        message=t("point_table_point.success.created", locale),
        locale=locale,
        request_id=request_id
    )


@router.put(
    "/points/{point_id}",
    response_model=ApiResponse[PointTablePointResponse],
    summary="更新点表点",
    description="更新点表点信息"
)
@audit_route(
    module="point_table_point",
    action="update_point_table_point",
    action_key="audit.action.point_table_point_updated"
)
async def update_point_table_point(
    point_id: int,
    point_in: PointTablePointUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[PointTablePointResponse]:
    """更新点表点"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("point_table_point.error.permission_denied", locale)
    )
    
    # 获取点表点
    point = await point_table_point_crud.get_by_id(db, point_id)
    if not point:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("point_table_point.error.not_found", locale)
        )
    
    # 记录变更
    point_before = PointTablePointResponse.model_validate(point)
    
    # 更新
    point = await point_table_point_crud.update(db, point, point_in)
    
    # 设置审计目标和变更
    template = await point_table_template_crud.get_by_id(db, point.point_table_id)
    set_audit_target(
        request,
        "point_table_point",
        str(point.id),
        f"{template.display_name}.{point.display_name}" if template else point.display_name
    )
    set_audit_changes(
        request,
        point_before.model_dump(),
        PointTablePointResponse.model_validate(point).model_dump()
    )
    
    return success_response(
        data=PointTablePointResponse.model_validate(point),
        message=t("point_table_point.success.updated", locale),
        locale=locale,
        request_id=request_id
    )


@router.delete(
    "/points/{point_id}",
    response_model=ApiResponse[None],
    summary="删除点表点",
    description="删除点表点"
)
@audit_route(
    module="point_table_point",
    action="delete_point_table_point",
    action_key="audit.action.point_table_point_deleted"
)
async def delete_point_table_point(
    point_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """删除点表点"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("point_table_point.error.permission_denied", locale)
    )
    
    # 获取点表点
    point = await point_table_point_crud.get_by_id(db, point_id)
    if not point:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("point_table_point.error.not_found", locale)
        )
    
    # 设置审计目标
    template = await point_table_template_crud.get_by_id(db, point.point_table_id)
    set_audit_target(
        request,
        "point_table_point",
        str(point.id),
        f"{template.display_name}.{point.display_name}" if template else point.display_name
    )
    
    # 删除
    await point_table_point_crud.delete(db, point)
    
    return success_response(
        data=None,
        message=t("point_table_point.success.deleted", locale),
        locale=locale,
        request_id=request_id
    )

