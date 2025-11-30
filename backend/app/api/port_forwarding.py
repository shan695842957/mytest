"""端口转发 API 路由"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.port_forwarding import (
    PortForwardingCreate,
    PortForwardingUpdate,
    PortForwardingResponse,
    BatchOperationRequest
)
from app.schemas.response import ApiResponse, success_response, paginated_response
from app.models.port_forwarding import PortForwardingRule
from app.models.user import User, UserRole
from app.crud.port_forwarding import port_forwarding_crud
from app.services.port_forwarding import port_forwarding_service
from app.core.dependencies import set_audit_target, set_audit_changes
from app.core.permissions import check_role_permission
from app.middleware.audit import audit_route
from app.api.deps import get_current_user, get_locale, get_request_id
from app.i18n import t

router = APIRouter(tags=["端口转发"])


@router.post(
    "",
    response_model=ApiResponse[PortForwardingResponse],
    summary="创建端口转发规则",
    description="创建新的端口转发规则"
)
@audit_route(
    module="port_forwarding",
    action="create_rule",
    action_key="audit.action.port_forwarding_created"
)
async def create_rule(
    rule_in: PortForwardingCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[PortForwardingResponse]:
    """创建端口转发规则"""
    
    # 权限检查：只有 Developer 和 Operator 可以创建
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("port_forwarding.error.permission_denied", locale)
    )
    
    # 检查名称是否已存在
    existing = await port_forwarding_crud.get_by_name(db, rule_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("port_forwarding.error.name_exists", locale)
        )
    
    # 创建规则
    rule = await port_forwarding_crud.create(db, rule_in, current_user.id)
    
    # 设置审计目标
    set_audit_target(request, "port_forwarding_rule", str(rule.id), rule.name)
    
    return success_response(
        data=PortForwardingResponse.model_validate(rule),
        message=t("port_forwarding.success.created", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "",
    response_model=ApiResponse[List[PortForwardingResponse]],
    summary="获取端口转发规则列表",
    description="分页获取端口转发规则列表"
)
async def list_rules(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(20, ge=1, le=100, description="每页记录数"),
    keyword: Optional[str] = Query(None, description="关键词搜索"),
    protocol: Optional[str] = Query(None, description="协议筛选"),
    status: Optional[str] = Query(None, description="状态筛选"),
    is_enabled: Optional[bool] = Query(None, description="启用状态筛选"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[PortForwardingResponse]]:
    """获取端口转发规则列表"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("port_forwarding.error.permission_denied", locale)
    )
    
    rules, total = await port_forwarding_crud.get_multi(
        db, skip, limit, keyword, protocol, status, is_enabled
    )
    
    return paginated_response(
        items=[PortForwardingResponse.model_validate(r) for r in rules],
        skip=skip,
        limit=limit,
        total=total,
        message=t("port_forwarding.success.list", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/{rule_id}",
    response_model=ApiResponse[PortForwardingResponse],
    summary="获取端口转发规则详情",
    description="根据 ID 获取端口转发规则详情"
)
async def get_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[PortForwardingResponse]:
    """获取端口转发规则详情"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("port_forwarding.error.permission_denied", locale)
    )
    
    rule = await port_forwarding_crud.get_by_id(db, rule_id)
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("port_forwarding.error.not_found", locale)
        )
    
    return success_response(
        data=PortForwardingResponse.model_validate(rule),
        message=t("port_forwarding.success.get", locale),
        locale=locale,
        request_id=request_id
    )


@router.patch(
    "/{rule_id}",
    response_model=ApiResponse[PortForwardingResponse],
    summary="更新端口转发规则",
    description="更新端口转发规则信息"
)
@audit_route(
    module="port_forwarding",
    action="update_rule",
    action_key="audit.action.port_forwarding_updated"
)
async def update_rule(
    rule_id: int,
    rule_in: PortForwardingUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[PortForwardingResponse]:
    """更新端口转发规则"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("port_forwarding.error.permission_denied", locale)
    )
    
    # 获取规则
    rule = await port_forwarding_crud.get_by_id(db, rule_id)
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("port_forwarding.error.not_found", locale)
        )
    
    # 不允许修改运行中的规则
    if rule.status == "running":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("port_forwarding.error.cannot_update_running", locale)
        )
    
    # 记录变更前
    rule_before = PortForwardingResponse.model_validate(rule)
    
    # 更新规则
    rule = await port_forwarding_crud.update(db, rule, rule_in)
    
    # 设置审计目标和变更
    set_audit_target(request, "port_forwarding_rule", str(rule.id), rule.name)
    set_audit_changes(
        request,
        rule_before.model_dump(),
        PortForwardingResponse.model_validate(rule).model_dump()
    )
    
    return success_response(
        data=PortForwardingResponse.model_validate(rule),
        message=t("port_forwarding.success.updated", locale),
        locale=locale,
        request_id=request_id
    )


@router.delete(
    "/{rule_id}",
    response_model=ApiResponse[None],
    summary="删除端口转发规则",
    description="删除端口转发规则"
)
@audit_route(
    module="port_forwarding",
    action="delete_rule",
    action_key="audit.action.port_forwarding_deleted"
)
async def delete_rule(
    rule_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """删除端口转发规则"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("port_forwarding.error.permission_denied", locale)
    )
    
    # 获取规则
    rule = await port_forwarding_crud.get_by_id(db, rule_id)
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("port_forwarding.error.not_found", locale)
        )
    
    # 如果正在运行，先停止
    if rule.status == "running":
        try:
            await port_forwarding_service.stop_forwarding(db, rule_id)
        except Exception:
            pass  # 忽略停止失败
    
    # 设置审计目标
    set_audit_target(request, "port_forwarding_rule", str(rule.id), rule.name)
    
    # 删除规则
    await port_forwarding_crud.delete(db, rule)
    
    return success_response(
        data=None,
        message=t("port_forwarding.success.deleted", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/{rule_id}/start",
    response_model=ApiResponse[PortForwardingResponse],
    summary="启动端口转发",
    description="启动指定的端口转发规则"
)
@audit_route(
    module="port_forwarding",
    action="start_rule",
    action_key="audit.action.port_forwarding_started"
)
async def start_rule(
    rule_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[PortForwardingResponse]:
    """启动端口转发"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("port_forwarding.error.permission_denied", locale)
    )
    
    # 启动转发
    rule = await port_forwarding_service.start_forwarding(db, rule_id)
    
    # 设置审计目标
    set_audit_target(request, "port_forwarding_rule", str(rule.id), rule.name)
    
    return success_response(
        data=PortForwardingResponse.model_validate(rule),
        message=t("port_forwarding.success.started", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/{rule_id}/stop",
    response_model=ApiResponse[PortForwardingResponse],
    summary="停止端口转发",
    description="停止指定的端口转发规则"
)
@audit_route(
    module="port_forwarding",
    action="stop_rule",
    action_key="audit.action.port_forwarding_stopped"
)
async def stop_rule(
    rule_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[PortForwardingResponse]:
    """停止端口转发"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("port_forwarding.error.permission_denied", locale)
    )
    
    # 停止转发
    rule = await port_forwarding_service.stop_forwarding(db, rule_id)
    
    # 设置审计目标
    set_audit_target(request, "port_forwarding_rule", str(rule.id), rule.name)
    
    return success_response(
        data=PortForwardingResponse.model_validate(rule),
        message=t("port_forwarding.success.stopped", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/{rule_id}/restart",
    response_model=ApiResponse[PortForwardingResponse],
    summary="重启端口转发",
    description="重启指定的端口转发规则"
)
@audit_route(
    module="port_forwarding",
    action="restart_rule",
    action_key="audit.action.port_forwarding_restarted"
)
async def restart_rule(
    rule_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[PortForwardingResponse]:
    """重启端口转发"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("port_forwarding.error.permission_denied", locale)
    )
    
    # 重启转发
    rule = await port_forwarding_service.restart_forwarding(db, rule_id)
    
    # 设置审计目标
    set_audit_target(request, "port_forwarding_rule", str(rule.id), rule.name)
    
    return success_response(
        data=PortForwardingResponse.model_validate(rule),
        message=t("port_forwarding.success.restarted", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/{rule_id}/check",
    response_model=ApiResponse[PortForwardingResponse],
    summary="检查端口转发状态",
    description="检查指定端口转发规则的运行状态"
)
async def check_rule_status(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[PortForwardingResponse]:
    """检查端口转发状态"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("port_forwarding.error.permission_denied", locale)
    )
    
    # 检查状态
    rule = await port_forwarding_service.check_status(db, rule_id)
    
    return success_response(
        data=PortForwardingResponse.model_validate(rule),
        message=t("port_forwarding.success.checked", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/batch-start",
    response_model=ApiResponse[dict],
    summary="批量启动端口转发",
    description="批量启动多个端口转发规则"
)
@audit_route(
    module="port_forwarding",
    action="batch_start",
    action_key="audit.action.port_forwarding_batch_started"
)
async def batch_start_rules(
    batch_in: BatchOperationRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[dict]:
    """批量启动端口转发"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("port_forwarding.error.permission_denied", locale)
    )
    
    # 批量启动
    result = await port_forwarding_service.batch_start(db, batch_in.ids)
    
    # 设置审计目标
    set_audit_target(request, "port_forwarding_rule", "batch", f"{len(batch_in.ids)} rules")
    
    return success_response(
        data=result,
        message=t("port_forwarding.success.batch_started", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/batch-stop",
    response_model=ApiResponse[dict],
    summary="批量停止端口转发",
    description="批量停止多个端口转发规则"
)
@audit_route(
    module="port_forwarding",
    action="batch_stop",
    action_key="audit.action.port_forwarding_batch_stopped"
)
async def batch_stop_rules(
    batch_in: BatchOperationRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[dict]:
    """批量停止端口转发"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("port_forwarding.error.permission_denied", locale)
    )
    
    # 批量停止
    result = await port_forwarding_service.batch_stop(db, batch_in.ids)
    
    # 设置审计目标
    set_audit_target(request, "port_forwarding_rule", "batch", f"{len(batch_in.ids)} rules")
    
    return success_response(
        data=result,
        message=t("port_forwarding.success.batch_stopped", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/batch-delete",
    response_model=ApiResponse[dict],
    summary="批量删除端口转发规则",
    description="批量删除多个端口转发规则"
)
@audit_route(
    module="port_forwarding",
    action="batch_delete",
    action_key="audit.action.port_forwarding_batch_deleted"
)
async def batch_delete_rules(
    batch_in: BatchOperationRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[dict]:
    """批量删除端口转发规则"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("port_forwarding.error.permission_denied", locale)
    )
    
    success_ids = []
    failed_ids = []
    errors = {}
    
    for rule_id in batch_in.ids:
        try:
            # 获取规则
            rule = await port_forwarding_crud.get_by_id(db, rule_id)
            if not rule:
                failed_ids.append(rule_id)
                errors[rule_id] = "Rule not found"
                continue
            
            # 如果正在运行，先停止
            if rule.status == "running":
                try:
                    await port_forwarding_service.stop_forwarding(db, rule_id)
                except Exception:
                    pass
            
            # 删除规则
            await port_forwarding_crud.delete(db, rule)
            success_ids.append(rule_id)
            
        except Exception as e:
            failed_ids.append(rule_id)
            errors[rule_id] = str(e)
    
    result = {
        "success_count": len(success_ids),
        "failed_count": len(failed_ids),
        "success_ids": success_ids,
        "failed_ids": failed_ids,
        "errors": errors
    }
    
    # 设置审计目标
    set_audit_target(request, "port_forwarding_rule", "batch", f"{len(batch_in.ids)} rules")
    
    return success_response(
        data=result,
        message=t("port_forwarding.success.batch_deleted", locale),
        locale=locale,
        request_id=request_id
    )

