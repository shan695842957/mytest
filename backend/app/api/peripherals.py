"""
外设设备管理 API
权限：只有 OPERATOR 和 DEVELOPER 可以访问
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.peripheral import (
    PeripheralCreate, PeripheralUpdate, PeripheralResponse, PeripheralSimpleResponse
)
from app.schemas.response import ApiResponse, success_response, paginated_response
from app.models.peripheral import Peripheral
from app.models.user import User, UserRole
from app.crud.peripheral import peripheral_crud
from app.core.dependencies import set_audit_target, set_audit_changes
from app.middleware.audit import audit_route
from app.api.deps import get_current_user, get_locale, get_request_id
from app.core.permissions import check_role_permission
from app.i18n import t

router = APIRouter(tags=["外设管理"])


# ============================================================================
# 外设 CRUD
# ============================================================================

@router.get(
    "",
    response_model=ApiResponse[List[PeripheralResponse]],
    summary="获取外设列表",
    description="分页获取外设列表（仅 OPERATOR/DEVELOPER 可见）"
)
async def list_peripherals(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(20, ge=1, le=100, description="每页记录数"),
    peripheral_type: Optional[str] = Query(None, description="外设类型筛选"),
    enabled_only: bool = Query(False, description="只返回启用的外设"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[PeripheralResponse]]:
    """获取外设列表"""
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("peripheral.error.permission_denied", locale)
    )
    
    peripherals, total = await peripheral_crud.get_multi(
        db, skip, limit, peripheral_type, enabled_only
    )
    
    return paginated_response(
        items=[PeripheralResponse.model_validate(p) for p in peripherals],
        skip=skip,
        limit=limit,
        total=total,
        message=t("peripheral.success.list", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/by-type/{peripheral_type}",
    response_model=ApiResponse[List[PeripheralSimpleResponse]],
    summary="根据类型获取外设列表",
    description="根据外设类型获取外设列表（用于下拉框）"
)
async def list_peripherals_by_type(
    peripheral_type: str,
    enabled_only: bool = Query(True, description="只返回启用的外设"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[PeripheralSimpleResponse]]:
    """根据类型获取外设列表"""
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("peripheral.error.permission_denied", locale)
    )
    
    peripherals = await peripheral_crud.get_list_by_type(db, peripheral_type, enabled_only)
    
    # 转换为 SimpleResponse 格式
    items = [
        PeripheralSimpleResponse(
            value=p.device_path,
            label=p.display_name,
            name=p.name
        )
        for p in peripherals
    ]
    
    return success_response(
        data=items,
        message=t("peripheral.success.list_by_type", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/{peripheral_id}",
    response_model=ApiResponse[PeripheralResponse],
    summary="获取外设详情",
    description="获取外设详情"
)
async def get_peripheral(
    peripheral_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[PeripheralResponse]:
    """获取外设详情"""
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("peripheral.error.permission_denied", locale)
    )
    
    peripheral = await peripheral_crud.get_by_id(db, peripheral_id)
    if not peripheral:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("peripheral.error.not_found", locale)
        )
    
    return success_response(
        data=PeripheralResponse.model_validate(peripheral),
        message=t("peripheral.success.detail", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "",
    response_model=ApiResponse[PeripheralResponse],
    summary="创建外设",
    description="创建新外设"
)
@audit_route(
    module="peripheral",
    action="create_peripheral",
    action_key="audit.action.peripheral_created"
)
async def create_peripheral(
    peripheral_in: PeripheralCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[PeripheralResponse]:
    """创建外设"""
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("peripheral.error.permission_denied", locale)
    )
    
    # 检查名称是否已存在
    existing = await peripheral_crud.get_by_name(db, peripheral_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("peripheral.error.name_exists", locale)
        )
    
    # 检查设备路径是否已存在（同一类型下）
    existing_path = await peripheral_crud.get_by_device_path(
        db, peripheral_in.device_path, peripheral_in.peripheral_type
    )
    if existing_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("peripheral.error.device_path_exists", locale)
        )
    
    # 创建外设
    peripheral = await peripheral_crud.create(db, peripheral_in)
    
    # 设置审计目标
    set_audit_target(request, "peripheral", str(peripheral.id), peripheral.name)
    
    return success_response(
        data=PeripheralResponse.model_validate(peripheral),
        message=t("peripheral.success.created", locale),
        locale=locale,
        request_id=request_id
    )


@router.patch(
    "/{peripheral_id}",
    response_model=ApiResponse[PeripheralResponse],
    summary="更新外设",
    description="更新外设信息"
)
@audit_route(
    module="peripheral",
    action="update_peripheral",
    action_key="audit.action.peripheral_updated"
)
async def update_peripheral(
    peripheral_id: int,
    peripheral_in: PeripheralUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[PeripheralResponse]:
    """更新外设"""
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("peripheral.error.permission_denied", locale)
    )
    
    # 获取外设
    peripheral = await peripheral_crud.get_by_id(db, peripheral_id)
    if not peripheral:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("peripheral.error.not_found", locale)
        )
    
    # 记录变更（before）
    from app.schemas.peripheral import PeripheralResponse as PeripheralResponseSchema
    peripheral_before = PeripheralResponseSchema.model_validate(peripheral)
    
    # 更新外设
    peripheral = await peripheral_crud.update(db, peripheral, peripheral_in)
    
    # 设置审计目标和变更
    set_audit_target(request, "peripheral", str(peripheral.id), peripheral.name)
    set_audit_changes(
        request,
        peripheral_before.model_dump(),
        PeripheralResponseSchema.model_validate(peripheral).model_dump()
    )
    
    return success_response(
        data=PeripheralResponse.model_validate(peripheral),
        message=t("peripheral.success.updated", locale),
        locale=locale,
        request_id=request_id
    )


@router.delete(
    "/{peripheral_id}",
    response_model=ApiResponse[None],
    summary="删除外设",
    description="删除外设"
)
@audit_route(
    module="peripheral",
    action="delete_peripheral",
    action_key="audit.action.peripheral_deleted"
)
async def delete_peripheral(
    peripheral_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """删除外设"""
    # 权限检查：只有 OPERATOR 及以上可用
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("peripheral.error.permission_denied", locale)
    )
    
    # 获取外设
    peripheral = await peripheral_crud.get_by_id(db, peripheral_id)
    if not peripheral:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("peripheral.error.not_found", locale)
        )
    
    # 设置审计目标
    set_audit_target(request, "peripheral", str(peripheral.id), peripheral.name)
    
    # 删除外设
    await peripheral_crud.delete(db, peripheral)
    
    return success_response(
        data=None,
        message=t("peripheral.success.deleted", locale),
        locale=locale,
        request_id=request_id
    )

