"""
协议类型管理 API
权限：只有 OPERATOR 和 DEVELOPER 可以访问
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.protocol_type import (
    ProtocolTypeCreate, ProtocolTypeUpdate, ProtocolTypeResponse, ProtocolTypeDetailResponse,
    ProtocolTypeParamCreate, ProtocolTypeParamUpdate, ProtocolTypeParamResponse
)
from app.schemas.response import ApiResponse, success_response, paginated_response
from app.models.protocol_type import ProtocolType, ProtocolTypeParam
from app.models.user import User, UserRole
from app.crud.protocol_type import protocol_type_crud, protocol_type_param_crud
from app.core.dependencies import set_audit_target, set_audit_changes
from app.middleware.audit import audit_route
from app.api.deps import get_current_user, get_locale, get_request_id
from app.core.permissions import check_role_permission
from app.i18n import t

router = APIRouter(tags=["协议类型管理"])


# ============================================================================
# 协议类型 CRUD
# ============================================================================

@router.get(
    "",
    response_model=ApiResponse[List[ProtocolTypeResponse]],
    summary="获取协议类型列表",
    description="分页获取协议类型列表（仅 OPERATOR/DEVELOPER 可见）"
)
async def list_protocol_types(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(20, ge=1, le=100, description="每页记录数"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    enabled_only: bool = Query(False, description="只返回启用的协议类型"),
    include_params: bool = Query(False, description="是否包含参数列表"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[ProtocolTypeResponse]]:
    """获取协议类型列表"""
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("protocol_type.error.permission_denied", locale)
    )
    
    protocol_types, total = await protocol_type_crud.get_multi(
        db, skip, limit, search, enabled_only, include_params
    )
    
    return paginated_response(
        items=[ProtocolTypeDetailResponse.model_validate(pt) if include_params else ProtocolTypeResponse.model_validate(pt) for pt in protocol_types],
        skip=skip,
        limit=limit,
        total=total,
        message=t("protocol_type.success.list", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/{protocol_type_id}",
    response_model=ApiResponse[ProtocolTypeDetailResponse],
    summary="获取协议类型详情",
    description="获取协议类型详情（包含参数列表）"
)
async def get_protocol_type(
    protocol_type_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[ProtocolTypeDetailResponse]:
    """获取协议类型详情"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("protocol_type.error.permission_denied", locale)
    )
    
    protocol_type = await protocol_type_crud.get_by_id(db, protocol_type_id, include_params=True)
    if not protocol_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("protocol_type.error.not_found", locale)
        )
    
    return success_response(
        data=ProtocolTypeDetailResponse.model_validate(protocol_type),
        message=t("protocol_type.success.detail", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "",
    response_model=ApiResponse[ProtocolTypeDetailResponse],
    summary="创建协议类型",
    description="创建新的协议类型（包含参数定义）"
)
@audit_route(
    module="protocol_type",
    action="create_protocol_type",
    action_key="audit.action.protocol_type_created"
)
async def create_protocol_type(
    protocol_type_in: ProtocolTypeCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[ProtocolTypeDetailResponse]:
    """创建协议类型"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("protocol_type.error.permission_denied", locale)
    )
    
    # 检查名称是否已存在
    existing = await protocol_type_crud.get_by_name(db, protocol_type_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("protocol_type.error.name_exists", locale)
        )
    
    # 创建协议类型（create 方法会加载参数）
    protocol_type = await protocol_type_crud.create(db, protocol_type_in)
    
    # 设置审计目标
    set_audit_target(request, "protocol_type", str(protocol_type.id), protocol_type.display_name)
    
    return success_response(
        data=ProtocolTypeDetailResponse.model_validate(protocol_type),
        message=t("protocol_type.success.created", locale),
        locale=locale,
        request_id=request_id
    )


@router.patch(
    "/{protocol_type_id}",
    response_model=ApiResponse[ProtocolTypeDetailResponse],
    summary="更新协议类型",
    description="更新协议类型信息（不更新参数）"
)
@audit_route(
    module="protocol_type",
    action="update_protocol_type",
    action_key="audit.action.protocol_type_updated"
)
async def update_protocol_type(
    protocol_type_id: int,
    protocol_type_in: ProtocolTypeUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[ProtocolTypeDetailResponse]:
    """更新协议类型"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("protocol_type.error.permission_denied", locale)
    )
    
    # 获取协议类型（包含参数用于审计和返回）
    protocol_type = await protocol_type_crud.get_by_id(db, protocol_type_id, include_params=True)
    if not protocol_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("protocol_type.error.not_found", locale)
        )
    
    # 记录变更（before）
    from app.schemas.protocol_type import ProtocolTypeDetailResponse
    protocol_type_before = ProtocolTypeDetailResponse.model_validate(protocol_type)
    
    # 更新
    protocol_type = await protocol_type_crud.update(db, protocol_type, protocol_type_in)
    
    # 重新加载以获取最新数据（包含参数）
    protocol_type = await protocol_type_crud.get_by_id(db, protocol_type_id, include_params=True)
    
    # 设置审计目标和变更
    set_audit_target(request, "protocol_type", str(protocol_type.id), protocol_type.display_name)
    set_audit_changes(
        request,
        protocol_type_before.model_dump(),
        ProtocolTypeDetailResponse.model_validate(protocol_type).model_dump()
    )
    
    return success_response(
        data=ProtocolTypeDetailResponse.model_validate(protocol_type),
        message=t("protocol_type.success.updated", locale),
        locale=locale,
        request_id=request_id
    )


@router.delete(
    "/{protocol_type_id}",
    response_model=ApiResponse[None],
    summary="删除协议类型",
    description="删除协议类型（级联删除参数）"
)
@audit_route(
    module="protocol_type",
    action="delete_protocol_type",
    action_key="audit.action.protocol_type_deleted"
)
async def delete_protocol_type(
    protocol_type_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """删除协议类型"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("protocol_type.error.permission_denied", locale)
    )
    
    protocol_type = await protocol_type_crud.get_by_id(db, protocol_type_id)
    if not protocol_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("protocol_type.error.not_found", locale)
        )
    
    # TODO: 检查是否有通信实例在使用此协议类型
    
    # 设置审计目标
    set_audit_target(request, "protocol_type", str(protocol_type.id), protocol_type.display_name)
    
    # 删除
    await protocol_type_crud.delete(db, protocol_type)
    
    return success_response(
        data=None,
        message=t("protocol_type.success.deleted", locale),
        locale=locale,
        request_id=request_id
    )


# ============================================================================
# 协议参数 CRUD
# ============================================================================

@router.get(
    "/{protocol_type_id}/params",
    response_model=ApiResponse[List[ProtocolTypeParamResponse]],
    summary="获取协议类型参数列表",
    description="获取指定协议类型的所有参数"
)
async def list_protocol_type_params(
    protocol_type_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[ProtocolTypeParamResponse]]:
    """获取协议类型参数列表"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("protocol_type.error.permission_denied", locale)
    )
    
    # 检查协议类型是否存在
    protocol_type = await protocol_type_crud.get_by_id(db, protocol_type_id)
    if not protocol_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("protocol_type.error.not_found", locale)
        )
    
    params = await protocol_type_param_crud.get_by_protocol_type(db, protocol_type_id)
    
    return success_response(
        data=[ProtocolTypeParamResponse.model_validate(p) for p in params],
        message=t("protocol_type.success.params_list", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/{protocol_type_id}/params",
    response_model=ApiResponse[ProtocolTypeParamResponse],
    summary="创建协议参数",
    description="为协议类型添加参数定义"
)
@audit_route(
    module="protocol_type",
    action="create_protocol_param",
    action_key="audit.action.protocol_param_created"
)
async def create_protocol_type_param(
    protocol_type_id: int,
    param_in: ProtocolTypeParamCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[ProtocolTypeParamResponse]:
    """创建协议参数"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("protocol_type.error.permission_denied", locale)
    )
    
    # 检查协议类型是否存在
    protocol_type = await protocol_type_crud.get_by_id(db, protocol_type_id)
    if not protocol_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("protocol_type.error.not_found", locale)
        )
    
    # 检查参数名是否已存在
    existing_params = await protocol_type_param_crud.get_by_protocol_type(db, protocol_type_id)
    if any(p.param_name == param_in.param_name for p in existing_params):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("protocol_type.error.param_name_exists", locale)
        )
    
    # 创建参数
    param = await protocol_type_param_crud.create(db, protocol_type_id, param_in)
    
    # 设置审计目标
    set_audit_target(request, "protocol_type", str(protocol_type_id), f"{protocol_type.display_name} - {param.display_name}")
    
    return success_response(
        data=ProtocolTypeParamResponse.model_validate(param),
        message=t("protocol_type.success.param_created", locale),
        locale=locale,
        request_id=request_id
    )


@router.patch(
    "/params/{param_id}",
    response_model=ApiResponse[ProtocolTypeParamResponse],
    summary="更新协议参数",
    description="更新协议参数定义"
)
@audit_route(
    module="protocol_type",
    action="update_protocol_param",
    action_key="audit.action.protocol_param_updated"
)
async def update_protocol_type_param(
    param_id: int,
    param_in: ProtocolTypeParamUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[ProtocolTypeParamResponse]:
    """更新协议参数"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("protocol_type.error.permission_denied", locale)
    )
    
    param = await protocol_type_param_crud.get_by_id(db, param_id)
    if not param:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("protocol_type.error.param_not_found", locale)
        )
    
    # 记录变更
    param_before = ProtocolTypeParamResponse.model_validate(param)
    
    # 更新
    param = await protocol_type_param_crud.update(db, param, param_in)
    
    # 获取协议类型信息
    protocol_type = await protocol_type_crud.get_by_id(db, param.protocol_type_id)
    
    # 设置审计目标和变更
    set_audit_target(request, "protocol_type", str(param.protocol_type_id), f"{protocol_type.display_name if protocol_type else ''} - {param.display_name}")
    set_audit_changes(
        request,
        param_before.model_dump(),
        ProtocolTypeParamResponse.model_validate(param).model_dump()
    )
    
    return success_response(
        data=ProtocolTypeParamResponse.model_validate(param),
        message=t("protocol_type.success.param_updated", locale),
        locale=locale,
        request_id=request_id
    )


@router.delete(
    "/params/{param_id}",
    response_model=ApiResponse[None],
    summary="删除协议参数",
    description="删除协议参数定义"
)
@audit_route(
    module="protocol_type",
    action="delete_protocol_param",
    action_key="audit.action.protocol_param_deleted"
)
async def delete_protocol_type_param(
    param_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """删除协议参数"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("protocol_type.error.permission_denied", locale)
    )
    
    param = await protocol_type_param_crud.get_by_id(db, param_id)
    if not param:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("protocol_type.error.param_not_found", locale)
        )
    
    # 获取协议类型信息
    protocol_type = await protocol_type_crud.get_by_id(db, param.protocol_type_id)
    
    # 设置审计目标
    set_audit_target(request, "protocol_type", str(param.protocol_type_id), f"{protocol_type.display_name if protocol_type else ''} - {param.display_name}")
    
    # 删除
    await protocol_type_param_crud.delete(db, param)
    
    return success_response(
        data=None,
        message=t("protocol_type.success.param_deleted", locale),
        locale=locale,
        request_id=request_id
    )


# ============================================================================
# 特殊接口：获取协议类型参数定义（用于前端表单生成）
# ============================================================================

@router.get(
    "/{protocol_type_name}/params-definition",
    response_model=ApiResponse[dict],
    summary="获取协议类型参数定义",
    description="获取协议类型的参数定义（用于前端动态生成表单），普通用户也可访问"
)
async def get_protocol_type_params_definition(
    protocol_type_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[dict]:
    """获取协议类型参数定义（用于前端表单生成）"""
    from app.core.protocol_validator import ProtocolConfigValidator
    
    params = await ProtocolConfigValidator.get_protocol_type_params(db, protocol_type_name)
    if params is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("protocol_type.error.not_found", locale)
        )
    
    return success_response(
        data={"params": params},
        message=t("protocol_type.success.params_definition", locale),
        locale=locale,
        request_id=request_id
    )

