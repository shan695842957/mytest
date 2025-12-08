"""
BMS（电池管理系统）API
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.bms import (
    BMSArchitectureResponse,
    BMSPageConfigResponse,
    BMSInstanceCreate,
    BMSInstanceUpdate,
    BMSInstanceResponse,
    BMSHierarchyConfigCreate,
    BMSHierarchyConfigUpdate,
    BMSHierarchyConfigResponse,
    BMSFieldConfigCreate,
    BMSFieldConfigUpdate,
    BMSFieldConfigResponse,
)
from app.schemas.response import ApiResponse, success_response, paginated_response
from app.models.user import User
from app.models.bms import BMSInstance, BMSArchitecture, BMSHierarchyConfig, BMSFieldConfig
from app.crud.bms import (
    bms_architecture_crud,
    bms_page_config_crud,
    bms_instance_crud,
    bms_hierarchy_config_crud,
    bms_field_config_crud,
)
from app.crud.asset import asset_crud
from app.core.permissions import check_role_permission
from app.core.dependencies import set_audit_target, set_audit_changes
from app.middleware.audit import audit_route
from app.api.deps import get_current_user, get_locale, get_request_id
from app.i18n import t
from app.models.user import UserRole

router = APIRouter(tags=["BMS管理"])


# ============================================================================
# BMS 架构查询（只读，无需权限检查）
# ============================================================================

@router.get(
    "/architectures",
    response_model=ApiResponse[List[BMSArchitectureResponse]],
    summary="获取BMS架构列表",
    description="获取所有BMS架构类型（二级架构、三级架构）"
)
async def list_architectures(
    db: AsyncSession = Depends(get_db),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[BMSArchitectureResponse]]:
    """获取BMS架构列表"""
    architectures = await bms_architecture_crud.get_all(db)
    
    return success_response(
        data=[BMSArchitectureResponse.model_validate(a) for a in architectures],
        message=t("bms.success.architectures_listed", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/architectures/{architecture_id}/page-configs",
    response_model=ApiResponse[List[BMSPageConfigResponse]],
    summary="获取架构页面配置列表",
    description="根据架构ID获取该架构下的所有页面配置（SYS/BCU/BAU/BMU）"
)
async def list_page_configs(
    architecture_id: int,
    db: AsyncSession = Depends(get_db),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[BMSPageConfigResponse]]:
    """获取架构页面配置列表"""
    # 验证架构是否存在
    architecture = await bms_architecture_crud.get_by_id(db, architecture_id)
    if not architecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("bms.error.architecture_not_found", locale)
        )
    
    page_configs = await bms_page_config_crud.get_by_architecture(db, architecture_id)
    
    return success_response(
        data=[BMSPageConfigResponse.model_validate(pc) for pc in page_configs],
        message=t("bms.success.page_configs_listed", locale),
        locale=locale,
        request_id=request_id
    )


# ============================================================================
# BMS 实例管理
# ============================================================================

@router.get(
    "/instances",
    response_model=ApiResponse[List[BMSInstanceResponse]],
    summary="获取BMS实例列表",
    description="分页获取BMS实例列表，支持搜索和筛选"
)
async def list_instances(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(20, ge=1, le=100, description="每页记录数"),
    search: Optional[str] = Query(None, description="搜索关键词（实例名称、显示名）"),
    architecture_id: Optional[int] = Query(None, description="架构ID筛选"),
    enabled: Optional[bool] = Query(None, description="是否启用筛选"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[BMSInstanceResponse]]:
    """获取BMS实例列表"""
    instances, total = await bms_instance_crud.get_multi(
        db, skip, limit, search, architecture_id, enabled
    )
    
    # 构建响应数据（包含关联信息）
    response_data = []
    for instance in instances:
        instance_dict = BMSInstanceResponse.model_validate(instance).model_dump()
        if instance.asset:
            instance_dict["asset_name"] = instance.asset.name
            instance_dict["asset_display_name"] = instance.asset.display_name
        if instance.architecture:
            instance_dict["architecture_name"] = instance.architecture.name
        response_data.append(BMSInstanceResponse(**instance_dict))
    
    return paginated_response(
        items=response_data,
        skip=skip,
        limit=limit,
        total=total,
        message=t("bms.success.instances_listed", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/instances/{instance_id}",
    response_model=ApiResponse[BMSInstanceResponse],
    summary="获取BMS实例详情",
    description="根据ID获取BMS实例的详细信息"
)
async def get_instance(
    instance_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[BMSInstanceResponse]:
    """获取BMS实例详情"""
    instance = await bms_instance_crud.get_by_id(db, instance_id)
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("bms.error.instance_not_found", locale)
        )
    
    instance_dict = BMSInstanceResponse.model_validate(instance).model_dump()
    if instance.asset:
        instance_dict["asset_name"] = instance.asset.name
        instance_dict["asset_display_name"] = instance.asset.display_name
    if instance.architecture:
        instance_dict["architecture_name"] = instance.architecture.name
    
    return success_response(
        data=BMSInstanceResponse(**instance_dict),
        message=t("bms.success.instance_retrieved", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/instances",
    response_model=ApiResponse[BMSInstanceResponse],
    summary="创建BMS实例",
    description="创建新的BMS实例"
)
@audit_route(
    module="bms",
    action="create_instance",
    action_key="audit.action.bms_instance_created"
)
async def create_instance(
    instance_in: BMSInstanceCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[BMSInstanceResponse]:
    """创建BMS实例"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("bms.error.permission_denied", locale)
    )
    
    # 验证资产是否存在
    asset = await asset_crud.get_by_id(db, instance_in.asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("bms.error.asset_not_found", locale)
        )
    
    # 验证架构是否存在
    architecture = await bms_architecture_crud.get_by_id(db, instance_in.architecture_id)
    if not architecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("bms.error.architecture_not_found", locale)
        )
    
    # 检查资产是否已经被关联为BMS实例
    existing = await bms_instance_crud.get_by_asset_id(db, instance_in.asset_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("bms.error.asset_already_bms", locale)
        )
    
    # 创建BMS实例
    instance = await bms_instance_crud.create(db, instance_in)
    
    # 设置审计目标
    set_audit_target(request, "bms_instance", str(instance.id), instance.instance_name)
    
    instance_dict = BMSInstanceResponse.model_validate(instance).model_dump()
    if instance.asset:
        instance_dict["asset_name"] = instance.asset.name
        instance_dict["asset_display_name"] = instance.asset.display_name
    if instance.architecture:
        instance_dict["architecture_name"] = instance.architecture.name
    
    return success_response(
        data=BMSInstanceResponse(**instance_dict),
        message=t("bms.success.instance_created", locale),
        locale=locale,
        request_id=request_id
    )


@router.patch(
    "/instances/{instance_id}",
    response_model=ApiResponse[BMSInstanceResponse],
    summary="更新BMS实例",
    description="更新BMS实例信息"
)
@audit_route(
    module="bms",
    action="update_instance",
    action_key="audit.action.bms_instance_updated"
)
async def update_instance(
    instance_id: int,
    instance_in: BMSInstanceUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[BMSInstanceResponse]:
    """更新BMS实例"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("bms.error.permission_denied", locale)
    )
    
    # 获取BMS实例
    instance = await bms_instance_crud.get_by_id(db, instance_id)
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("bms.error.instance_not_found", locale)
        )
    
    # 记录变更
    instance_before = BMSInstanceResponse.model_validate(instance)
    
    # 更新
    instance = await bms_instance_crud.update(db, instance, instance_in)
    
    # 设置审计目标和变更
    set_audit_target(request, "bms_instance", str(instance.id), instance.instance_name)
    set_audit_changes(
        request,
        instance_before.model_dump(),
        BMSInstanceResponse.model_validate(instance).model_dump()
    )
    
    instance_dict = BMSInstanceResponse.model_validate(instance).model_dump()
    if instance.asset:
        instance_dict["asset_name"] = instance.asset.name
        instance_dict["asset_display_name"] = instance.asset.display_name
    if instance.architecture:
        instance_dict["architecture_name"] = instance.architecture.name
    
    return success_response(
        data=BMSInstanceResponse(**instance_dict),
        message=t("bms.success.instance_updated", locale),
        locale=locale,
        request_id=request_id
    )


@router.delete(
    "/instances/{instance_id}",
    response_model=ApiResponse[None],
    summary="删除BMS实例",
    description="删除BMS实例（级联删除所有相关配置）"
)
@audit_route(
    module="bms",
    action="delete_instance",
    action_key="audit.action.bms_instance_deleted"
)
async def delete_instance(
    instance_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """删除BMS实例"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("bms.error.permission_denied", locale)
    )
    
    # 获取BMS实例
    instance = await bms_instance_crud.get_by_id(db, instance_id)
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("bms.error.instance_not_found", locale)
        )
    
    # 设置审计目标
    set_audit_target(request, "bms_instance", str(instance.id), instance.instance_name)
    
    # 删除（级联删除所有相关配置）
    await bms_instance_crud.delete(db, instance)
    
    return success_response(
        data=None,
        message=t("bms.success.instance_deleted", locale),
        locale=locale,
        request_id=request_id
    )


# ============================================================================
# BMS 层级配置管理
# ============================================================================

@router.get(
    "/instances/{instance_id}/hierarchy-config",
    response_model=ApiResponse[BMSHierarchyConfigResponse],
    summary="获取BMS层级配置",
    description="获取BMS实例的层级配置（簇数、包数、串并数等）"
)
async def get_hierarchy_config(
    instance_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[BMSHierarchyConfigResponse]:
    """获取BMS层级配置"""
    # 验证实例是否存在
    instance = await bms_instance_crud.get_by_id(db, instance_id)
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("bms.error.instance_not_found", locale)
        )
    
    config = await bms_hierarchy_config_crud.get_by_instance_id(db, instance_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("bms.error.hierarchy_config_not_found", locale)
        )
    
    return success_response(
        data=BMSHierarchyConfigResponse.model_validate(config),
        message=t("bms.success.hierarchy_config_retrieved", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/instances/{instance_id}/hierarchy-config",
    response_model=ApiResponse[BMSHierarchyConfigResponse],
    summary="创建BMS层级配置",
    description="为BMS实例创建层级配置"
)
@audit_route(
    module="bms",
    action="create_hierarchy_config",
    action_key="audit.action.bms_hierarchy_config_created"
)
async def create_hierarchy_config(
    instance_id: int,
    config_in: BMSHierarchyConfigCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[BMSHierarchyConfigResponse]:
    """创建BMS层级配置"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("bms.error.permission_denied", locale)
    )
    
    # 验证实例是否存在
    instance = await bms_instance_crud.get_by_id(db, instance_id)
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("bms.error.instance_not_found", locale)
        )
    
    # 检查是否已存在配置
    existing = await bms_hierarchy_config_crud.get_by_instance_id(db, instance_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("bms.error.hierarchy_config_already_exists", locale)
        )
    
    # 创建配置
    config = await bms_hierarchy_config_crud.create(db, instance_id, config_in)
    
    # 设置审计目标
    set_audit_target(request, "bms_hierarchy_config", str(config.id), f"Instance {instance_id}")
    
    return success_response(
        data=BMSHierarchyConfigResponse.model_validate(config),
        message=t("bms.success.hierarchy_config_created", locale),
        locale=locale,
        request_id=request_id
    )


@router.patch(
    "/instances/{instance_id}/hierarchy-config",
    response_model=ApiResponse[BMSHierarchyConfigResponse],
    summary="更新BMS层级配置",
    description="更新BMS实例的层级配置"
)
@audit_route(
    module="bms",
    action="update_hierarchy_config",
    action_key="audit.action.bms_hierarchy_config_updated"
)
async def update_hierarchy_config(
    instance_id: int,
    config_in: BMSHierarchyConfigUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[BMSHierarchyConfigResponse]:
    """更新BMS层级配置"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("bms.error.permission_denied", locale)
    )
    
    # 验证实例是否存在
    instance = await bms_instance_crud.get_by_id(db, instance_id)
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("bms.error.instance_not_found", locale)
        )
    
    # 获取配置
    config = await bms_hierarchy_config_crud.get_by_instance_id(db, instance_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("bms.error.hierarchy_config_not_found", locale)
        )
    
    # 记录变更
    config_before = BMSHierarchyConfigResponse.model_validate(config)
    
    # 更新
    config = await bms_hierarchy_config_crud.update(db, config, config_in)
    
    # 设置审计目标和变更
    set_audit_target(request, "bms_hierarchy_config", str(config.id), f"Instance {instance_id}")
    set_audit_changes(
        request,
        config_before.model_dump(),
        BMSHierarchyConfigResponse.model_validate(config).model_dump()
    )
    
    return success_response(
        data=BMSHierarchyConfigResponse.model_validate(config),
        message=t("bms.success.hierarchy_config_updated", locale),
        locale=locale,
        request_id=request_id
    )


# ============================================================================
# BMS 字段配置管理（后续会继续添加其他配置管理API）
# ============================================================================

@router.get(
    "/instances/{instance_id}/field-configs",
    response_model=ApiResponse[List[BMSFieldConfigResponse]],
    summary="获取BMS字段配置列表",
    description="根据BMS实例ID和页面类型获取字段配置列表"
)
async def list_field_configs(
    instance_id: int,
    page_type: str = Query(..., description="页面类型：'SYS' | 'BCU' | 'BAU' | 'BMU'"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[BMSFieldConfigResponse]]:
    """获取BMS字段配置列表"""
    # 验证实例是否存在
    instance = await bms_instance_crud.get_by_id(db, instance_id)
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("bms.error.instance_not_found", locale)
        )
    
    field_configs = await bms_field_config_crud.get_by_instance_and_page_type(
        db, instance_id, page_type
    )
    
    return success_response(
        data=[BMSFieldConfigResponse.model_validate(fc) for fc in field_configs],
        message=t("bms.success.field_configs_listed", locale),
        locale=locale,
        request_id=request_id
    )


# 注意：字段配置的创建、更新、删除API会在后续实现
# 批量导入导出功能也会在后续实现
