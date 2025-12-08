"""
BMS（电池管理系统）API
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, UploadFile, File
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


@router.post(
    "/instances/{instance_id}/field-configs",
    response_model=ApiResponse[BMSFieldConfigResponse],
    summary="创建BMS字段配置",
    description="为BMS实例创建字段配置"
)
@audit_route(
    module="bms",
    action="create_field_config",
    action_key="audit.action.bms_field_config_created"
)
async def create_field_config(
    instance_id: int,
    field_config_in: BMSFieldConfigCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[BMSFieldConfigResponse]:
    """创建BMS字段配置"""
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
    
    # 创建字段配置
    field_config = await bms_field_config_crud.create(db, instance_id, field_config_in)
    
    # 设置审计目标
    set_audit_target(request, "bms_field_config", str(field_config.id), field_config.field_key)
    
    return success_response(
        data=BMSFieldConfigResponse.model_validate(field_config),
        message=t("bms.success.field_config_created", locale),
        locale=locale,
        request_id=request_id
    )


@router.patch(
    "/instances/{instance_id}/field-configs/{field_config_id}",
    response_model=ApiResponse[BMSFieldConfigResponse],
    summary="更新BMS字段配置",
    description="更新BMS字段配置"
)
@audit_route(
    module="bms",
    action="update_field_config",
    action_key="audit.action.bms_field_config_updated"
)
async def update_field_config(
    instance_id: int,
    field_config_id: int,
    field_config_in: BMSFieldConfigUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[BMSFieldConfigResponse]:
    """更新BMS字段配置"""
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
    
    # 获取字段配置
    field_config = await bms_field_config_crud.get_by_id(db, field_config_id)
    if not field_config or field_config.bms_instance_id != instance_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("bms.error.field_config_not_found", locale)
        )
    
    # 记录变更
    field_config_before = BMSFieldConfigResponse.model_validate(field_config)
    
    # 更新
    field_config = await bms_field_config_crud.update(db, field_config, field_config_in)
    
    # 设置审计目标和变更
    set_audit_target(request, "bms_field_config", str(field_config.id), field_config.field_key)
    set_audit_changes(
        request,
        field_config_before.model_dump(),
        BMSFieldConfigResponse.model_validate(field_config).model_dump()
    )
    
    return success_response(
        data=BMSFieldConfigResponse.model_validate(field_config),
        message=t("bms.success.field_config_updated", locale),
        locale=locale,
        request_id=request_id
    )


@router.delete(
    "/instances/{instance_id}/field-configs/{field_config_id}",
    response_model=ApiResponse[None],
    summary="删除BMS字段配置",
    description="删除BMS字段配置"
)
@audit_route(
    module="bms",
    action="delete_field_config",
    action_key="audit.action.bms_field_config_deleted"
)
async def delete_field_config(
    instance_id: int,
    field_config_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """删除BMS字段配置"""
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
    
    # 获取字段配置
    field_config = await bms_field_config_crud.get_by_id(db, field_config_id)
    if not field_config or field_config.bms_instance_id != instance_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("bms.error.field_config_not_found", locale)
        )
    
    # 设置审计目标
    set_audit_target(request, "bms_field_config", str(field_config.id), field_config.field_key)
    
    # 删除
    await bms_field_config_crud.delete(db, field_config)
    
    return success_response(
        data=None,
        message=t("bms.success.field_config_deleted", locale),
        locale=locale,
        request_id=request_id
    )


# ============================================================================
# BMS 批量导入导出
# ============================================================================

@router.get(
    "/instances/{instance_id}/field-configs/export",
    summary="导出BMS字段配置",
    description="导出BMS字段配置为CSV格式（支持批量导出）"
)
async def export_field_configs(
    instance_id: int,
    page_type: str = Query(..., description="页面类型：'SYS' | 'BCU' | 'BAU' | 'BMU'"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
):
    """导出BMS字段配置为CSV"""
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
    
    # 获取字段配置列表
    field_configs = await bms_field_config_crud.get_by_instance_and_page_type(
        db, instance_id, page_type
    )
    
    # 生成CSV内容
    import csv
    import io
    from datetime import datetime
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # 写入表头
    writer.writerow([
        "page_type", "field_key", "display_name_zh", "display_name_en",
        "field_type", "data_type", "unit_zh", "unit_en",
        "is_required", "is_readable", "is_writable", "source_type",
        "read_device_type_tag_id", "write_device_type_tag_id",
        "read_comm_instance_id", "read_point_id",
        "write_comm_instance_id", "write_point_id",
        "sort_order", "description_zh", "description_en"
    ])
    
    # 写入数据
    for fc in field_configs:
        writer.writerow([
            fc.page_type, fc.field_key, fc.display_name_zh, fc.display_name_en,
            fc.field_type, fc.data_type, fc.unit_zh, fc.unit_en,
            "1" if fc.is_required else "0",
            "1" if fc.is_readable else "0",
            "1" if fc.is_writable else "0",
            fc.source_type,
            str(fc.read_device_type_tag_id) if fc.read_device_type_tag_id else "",
            str(fc.write_device_type_tag_id) if fc.write_device_type_tag_id else "",
            str(fc.read_comm_instance_id) if fc.read_comm_instance_id else "",
            str(fc.read_point_id) if fc.read_point_id else "",
            str(fc.write_comm_instance_id) if fc.write_comm_instance_id else "",
            str(fc.write_point_id) if fc.write_point_id else "",
            str(fc.sort_order), fc.description_zh, fc.description_en
        ])
    
    # 返回CSV文件
    from fastapi.responses import StreamingResponse
    from datetime import datetime
    
    filename = f"bms_field_configs_{instance_id}_{page_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue().encode('utf-8-sig')]),  # 使用utf-8-sig支持Excel打开中文
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@router.post(
    "/instances/{instance_id}/field-configs/import",
    response_model=ApiResponse[Dict[str, Any]],
    summary="导入BMS字段配置",
    description="从CSV文件批量导入BMS字段配置（支持追加和更新模式）"
)
@audit_route(
    module="bms",
    action="import_field_configs",
    action_key="audit.action.bms_field_configs_imported"
)
async def import_field_configs(
    instance_id: int,
    page_type: str = Query(..., description="页面类型：'SYS' | 'BCU' | 'BAU' | 'BMU'"),
    import_mode: str = Query("append", description="导入模式：'append'（追加）| 'update'（更新）"),
    file: UploadFile = File(..., description="CSV文件"),
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[Dict[str, Any]]:
    """导入BMS字段配置"""
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
    
    # 验证导入模式
    if import_mode not in ["append", "update"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("bms.error.invalid_import_mode", locale)
        )
    
    # 读取CSV文件
    import csv
    import io
    
    content = await file.read()
    try:
        text_content = content.decode('utf-8-sig')  # 支持Excel导出的CSV
    except UnicodeDecodeError:
        text_content = content.decode('utf-8')
    
    csv_reader = csv.DictReader(io.StringIO(text_content))
    
    success_count = 0
    failed_count = 0
    errors = []
    
    # 如果是更新模式，先删除现有配置
    if import_mode == "update":
        existing_configs = await bms_field_config_crud.get_by_instance_and_page_type(
            db, instance_id, page_type
        )
        for config in existing_configs:
            await bms_field_config_crud.delete(db, config)
    
    # 导入数据
    for row_idx, row in enumerate(csv_reader, start=2):  # 从第2行开始（第1行是表头）
        try:
            # 创建字段配置
            field_config_in = BMSFieldConfigCreate(
                page_type=row.get("page_type", page_type),
                field_key=row.get("field_key", "").strip(),
                display_name_zh=row.get("display_name_zh", "").strip(),
                display_name_en=row.get("display_name_en", "").strip(),
                field_type=row.get("field_type", "dynamic").strip(),
                data_type=row.get("data_type", "number").strip(),
                unit_zh=row.get("unit_zh", "").strip(),
                unit_en=row.get("unit_en", "").strip(),
                is_required=row.get("is_required", "0").strip() == "1",
                is_readable=row.get("is_readable", "1").strip() == "1",
                is_writable=row.get("is_writable", "0").strip() == "1",
                source_type=row.get("source_type", "asset_field").strip(),
                read_device_type_tag_id=int(row["read_device_type_tag_id"]) if row.get("read_device_type_tag_id") else None,
                write_device_type_tag_id=int(row["write_device_type_tag_id"]) if row.get("write_device_type_tag_id") else None,
                read_comm_instance_id=int(row["read_comm_instance_id"]) if row.get("read_comm_instance_id") else None,
                read_point_id=int(row["read_point_id"]) if row.get("read_point_id") else None,
                write_comm_instance_id=int(row["write_comm_instance_id"]) if row.get("write_comm_instance_id") else None,
                write_point_id=int(row["write_point_id"]) if row.get("write_point_id") else None,
                sort_order=int(row.get("sort_order", "0") or "0"),
                description_zh=row.get("description_zh", "").strip(),
                description_en=row.get("description_en", "").strip()
            )
            
            # 创建字段配置
            await bms_field_config_crud.create(db, instance_id, field_config_in)
            success_count += 1
            
        except Exception as e:
            failed_count += 1
            errors.append({
                "row": row_idx,
                "field_key": row.get("field_key", ""),
                "error": str(e)
            })
    
    # 设置审计目标
    if request:
        set_audit_target(request, "bms_field_configs", f"Instance {instance_id}", f"Import {page_type}")
    
    return success_response(
        data={
            "success_count": success_count,
            "failed_count": failed_count,
            "errors": errors
        },
        message=t("bms.success.field_configs_imported", locale),
        locale=locale,
        request_id=request_id
    )


# ============================================================================
# BMS 实时数据查询API
# ============================================================================

@router.get(
    "/instances/{instance_id}/realtime/sys",
    response_model=ApiResponse[Dict[str, Any]],
    summary="获取BMS SYS页面实时数据",
    description="根据BMS实例配置获取SYS页面的实时数据（固定字段+动态字段+拓扑数据）"
)
async def get_bms_sys_realtime_data(
    instance_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[Dict[str, Any]]:
    """获取BMS SYS页面实时数据"""
    # 验证实例是否存在
    instance = await bms_instance_crud.get_by_id(db, instance_id)
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("bms.error.instance_not_found", locale)
        )
    
    # 获取字段配置
    field_configs = await bms_field_config_crud.get_by_instance_and_page_type(
        db, instance_id, 'SYS'
    )
    
    # 获取层级配置（用于拓扑图）
    hierarchy_config = await bms_hierarchy_config_crud.get_by_instance_id(db, instance_id)
    
    # 构建固定字段数据
    fixed_fields = {}
    dynamic_fields = []
    
    for fc in field_configs:
        # TODO: 从asset_state或DI点获取实时值
        # 目前返回模拟数据，后续接入真实的asset_state
        value = None
        if fc.source_type == 'asset_field' and fc.read_device_type_tag_id:
            # 从资产字段获取（通过asset_mappings找到对应的点，然后从asset_state获取）
            # value = await get_asset_field_value(instance.asset_id, fc.read_device_type_tag_id)
            value = None  # TODO: 实现真实数据获取
        elif fc.source_type == 'di_point' and fc.read_comm_instance_id and fc.read_point_id:
            # 从DI点获取
            # value = await get_di_point_value(fc.read_comm_instance_id, fc.read_point_id)
            value = None  # TODO: 实现真实数据获取
        
        field_value = {
            "field_key": fc.field_key,
            "display_name_zh": fc.display_name_zh,
            "display_name_en": fc.display_name_en,
            "value": value,
            "unit_zh": fc.unit_zh,
            "unit_en": fc.unit_en,
            "data_type": fc.data_type,
            "is_writable": fc.is_writable,
        }
        
        if fc.field_type == 'fixed':
            fixed_fields[fc.field_key] = field_value
        else:
            dynamic_fields.append(field_value)
    
    # 构建拓扑数据（根据架构类型）
    topology_data = None
    if hierarchy_config:
        if instance.architecture.name == 'level2':
            # 二级架构：显示包列表
            pack_count = hierarchy_config.pack_count_per_cluster
            packs = []
            for i in range(1, pack_count + 1):
                # TODO: 获取每个包的实时数据
                packs.append({
                    "pack_number": i,
                    "voltage": None,  # TODO: 从配置获取
                    "current": None,
                    "soc": None,
                    "temperature": None,
                    "fault": False,
                })
            topology_data = {"packs": packs}
        elif instance.architecture.name == 'level3':
            # 三级架构：显示簇列表
            cluster_count = hierarchy_config.cluster_count
            clusters = []
            for i in range(1, cluster_count + 1):
                # TODO: 获取每个簇的实时数据
                clusters.append({
                    "cluster_number": i,
                    "voltage": None,  # TODO: 从配置获取
                    "current": None,
                    "soc": None,
                    "power": None,
                    "fault": False,
                    "breaker_closed": False,
                })
            topology_data = {"clusters": clusters}
    
    return success_response(
        data={
            "fixed_fields": fixed_fields,
            "dynamic_fields": dynamic_fields,
            "topology_data": topology_data,
        },
        message=t("bms.success.realtime_data_retrieved", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/instances/{instance_id}/realtime/bcu",
    response_model=ApiResponse[Dict[str, Any]],
    summary="获取BMS BCU页面实时数据",
    description="根据BMS实例配置获取BCU页面的实时数据（遥测+遥信）"
)
async def get_bms_bcu_realtime_data(
    instance_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[Dict[str, Any]]:
    """获取BMS BCU页面实时数据"""
    # 验证实例是否存在
    instance = await bms_instance_crud.get_by_id(db, instance_id)
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("bms.error.instance_not_found", locale)
        )
    
    # 获取字段配置（遥测数据）
    field_configs = await bms_field_config_crud.get_by_instance_and_page_type(
        db, instance_id, 'BCU'
    )
    
    # 获取遥信量配置
    from app.crud.bms import bms_teleindication_config_crud
    teleindication_configs = await bms_teleindication_config_crud.get_by_instance_and_page_type(
        db, instance_id, 'BCU'
    )
    
    # 构建遥测数据
    telemetry_data = []
    for fc in field_configs:
        # TODO: 从asset_state或DI点获取实时值
        value = None
        
        telemetry_data.append({
            "field_key": fc.field_key,
            "display_name_zh": fc.display_name_zh,
            "display_name_en": fc.display_name_en,
            "value": value,
            "unit_zh": fc.unit_zh,
            "unit_en": fc.unit_en,
        })
    
    # 构建遥信数据
    telecontrol_data = []
    for tc in teleindication_configs:
        # TODO: 从asset_state或DI点获取实时值
        value = None
        fault_level = None
        enum_values = None
        bitfield_data = None
        
        # 如果是枚举类型，需要获取枚举值定义
        if tc.teleindication_type == 'enum' and tc.device_type_tag_id:
            from app.crud.device_type import device_type_tag_crud
            tag = await device_type_tag_crud.get_by_id(db, tc.device_type_tag_id)
            if tag and tag.enum_json:
                import json
                enum_json = json.loads(tag.enum_json) if isinstance(tag.enum_json, str) else tag.enum_json
                enum_values = [{"value": k, "label_zh": v.get("label_zh", ""), "label_en": v.get("label_en", "")} 
                              for k, v in enum_json.items()]
        
        telecontrol_data.append({
            "teleindication_key": tc.teleindication_key,
            "display_name_zh": tc.display_name_zh,
            "display_name_en": tc.display_name_en,
            "teleindication_type": tc.teleindication_type,
            "value": value,
            "fault_level": fault_level,
            "enum_values": enum_values,
            "bitfield_data": bitfield_data,
        })
    
    return success_response(
        data={
            "telemetry_data": telemetry_data,
            "telecontrol_data": telecontrol_data,
        },
        message=t("bms.success.realtime_data_retrieved", locale),
        locale=locale,
        request_id=request_id
    )


# 注意：BAU、BMU页面的实时数据API类似，后续可以继续实现
