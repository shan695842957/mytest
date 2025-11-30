"""
通信实例 API 路由
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.comm_instance import (
    CommInstanceCreate,
    CommInstanceUpdate,
    CommInstanceResponse
)
from app.schemas.response import ApiResponse, success_response, paginated_response
from app.models.user import User, UserRole
from app.crud.comm_instance import comm_instance_crud
from app.crud.point_table import point_table_template_crud
from app.core.permissions import check_role_permission
from app.core.dependencies import set_audit_target, set_audit_changes
from app.middleware.audit import audit_route
from app.api.deps import get_current_user, get_locale, get_request_id
from app.i18n import t


router = APIRouter(tags=["通信实例管理"])


@router.get(
    "",
    response_model=ApiResponse[List[CommInstanceResponse]],
    summary="获取通信实例列表",
    description="分页获取通信实例列表"
)
async def list_comm_instances(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(20, ge=1, le=100, description="每页记录数"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    protocol_type: Optional[str] = Query(None, description="协议类型过滤"),
    point_table_id: Optional[int] = Query(None, description="点表模板ID过滤"),
    enabled: Optional[bool] = Query(None, description="是否启用过滤"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[CommInstanceResponse]]:
    """获取通信实例列表"""
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("comm_instance.error.permission_denied", locale)
    )
    instances, total = await comm_instance_crud.get_multi(
        db, skip, limit, search, protocol_type, point_table_id, enabled
    )
    
    # 添加点表信息
    result = []
    for inst in instances:
        inst_dict = CommInstanceResponse.model_validate(inst).model_dump()
        # 获取点表信息
        point_table = await point_table_template_crud.get_by_id(db, inst.point_table_id)
        if point_table:
            inst_dict["point_table_name"] = point_table.name
            inst_dict["point_table_display_name"] = point_table.display_name
        result.append(CommInstanceResponse(**inst_dict))
    
    return paginated_response(
        items=result,
        skip=skip,
        limit=limit,
        total=total,
        message=t("comm_instance.success.list", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/{instance_id}",
    response_model=ApiResponse[CommInstanceResponse],
    summary="获取通信实例详情",
    description="获取通信实例详情"
)
async def get_comm_instance(
    instance_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[CommInstanceResponse]:
    """获取通信实例详情"""
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("comm_instance.error.permission_denied", locale)
    )
    instance = await comm_instance_crud.get_by_id(db, instance_id)
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("comm_instance.error.not_found", locale)
        )
    
    # 获取点表信息
    instance_dict = CommInstanceResponse.model_validate(instance).model_dump()
    point_table = await point_table_template_crud.get_by_id(db, instance.point_table_id)
    if point_table:
        instance_dict["point_table_name"] = point_table.name
        instance_dict["point_table_display_name"] = point_table.display_name
    
    return success_response(
        data=CommInstanceResponse(**instance_dict),
        message=t("comm_instance.success.detail", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "",
    response_model=ApiResponse[CommInstanceResponse],
    status_code=status.HTTP_201_CREATED,
    summary="创建通信实例",
    description="创建新的通信实例（会验证协议配置参数）"
)
@audit_route(
    module="comm_instance",
    action="create_comm_instance",
    action_key="audit.action.comm_instance_created"
)
async def create_comm_instance(
    instance_in: CommInstanceCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[CommInstanceResponse]:
    """创建通信实例"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("comm_instance.error.permission_denied", locale)
    )
    
    # 验证协议配置参数
    from app.core.protocol_validator import ProtocolConfigValidator
    is_valid, error_msg = await ProtocolConfigValidator.validate_config(
        db, instance_in.protocol_type, instance_in.protocol_config
    )
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg or t("comm_instance.error.invalid_protocol_config", locale)
        )
    
    # 检查名称是否已存在
    existing = await comm_instance_crud.get_by_name(db, instance_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("comm_instance.error.name_exists", locale)
        )
    
    # 检查点表模板是否存在
    point_table = await point_table_template_crud.get_by_id(db, instance_in.point_table_id)
    if not point_table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("point_table.error.not_found", locale)
        )
    
    # 创建通信实例
    instance = await comm_instance_crud.create(db, instance_in)
    
    # 设置审计目标
    set_audit_target(request, "comm_instance", str(instance.id), instance.display_name)
    
    return success_response(
        data=CommInstanceResponse.model_validate(instance),
        message=t("comm_instance.success.created", locale),
        locale=locale,
        request_id=request_id
    )


@router.put(
    "/{instance_id}",
    response_model=ApiResponse[CommInstanceResponse],
    summary="更新通信实例",
    description="更新通信实例信息（如果更新协议配置，会验证参数）"
)
@audit_route(
    module="comm_instance",
    action="update_comm_instance",
    action_key="audit.action.comm_instance_updated"
)
async def update_comm_instance(
    instance_id: int,
    instance_in: CommInstanceUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[CommInstanceResponse]:
    """更新通信实例"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("comm_instance.error.permission_denied", locale)
    )
    
    # 获取通信实例
    instance = await comm_instance_crud.get_by_id(db, instance_id)
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("comm_instance.error.not_found", locale)
        )
    
    # 如果更新了协议类型或协议配置，需要验证
    update_data = instance_in.model_dump(exclude_unset=True)
    protocol_type = update_data.get("protocol_type", instance.protocol_type)
    protocol_config = update_data.get("protocol_config")
    
    if protocol_config is not None:
        # 验证协议配置参数
        from app.core.protocol_validator import ProtocolConfigValidator
        is_valid, error_msg = await ProtocolConfigValidator.validate_config(
            db, protocol_type, protocol_config
        )
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg or t("comm_instance.error.invalid_protocol_config", locale)
            )
    
    # 如果更新点表模板，检查是否存在
    if instance_in.point_table_id is not None:
        point_table = await point_table_template_crud.get_by_id(db, instance_in.point_table_id)
        if not point_table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=t("point_table.error.not_found", locale)
            )
    
    # 记录变更
    instance_before = CommInstanceResponse.model_validate(instance)
    
    # 更新
    instance = await comm_instance_crud.update(db, instance, instance_in)
    
    # 设置审计目标和变更
    set_audit_target(request, "comm_instance", str(instance.id), instance.display_name)
    set_audit_changes(
        request,
        instance_before.model_dump(),
        CommInstanceResponse.model_validate(instance).model_dump()
    )
    
    return success_response(
        data=CommInstanceResponse.model_validate(instance),
        message=t("comm_instance.success.updated", locale),
        locale=locale,
        request_id=request_id
    )


@router.delete(
    "/{instance_id}",
    response_model=ApiResponse[None],
    summary="删除通信实例",
    description="删除通信实例"
)
@audit_route(
    module="comm_instance",
    action="delete_comm_instance",
    action_key="audit.action.comm_instance_deleted"
)
async def delete_comm_instance(
    instance_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """删除通信实例"""
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("comm_instance.error.permission_denied", locale)
    )
    
    # 获取通信实例
    instance = await comm_instance_crud.get_by_id(db, instance_id)
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("comm_instance.error.not_found", locale)
        )
    
    # 设置审计目标
    set_audit_target(request, "comm_instance", str(instance.id), instance.display_name)
    
    # 删除
    await comm_instance_crud.delete(db, instance)
    
    return success_response(
        data=None,
        message=t("comm_instance.success.deleted", locale),
        locale=locale,
        request_id=request_id
    )

