"""
审计日志查询 API
提供审计日志的查询和统计功能
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.audit import AuditLogResponse
from app.schemas.response import ApiResponse, paginated_response
from app.models.user import User
from app.crud.audit_log import audit_log_crud
from app.api.deps import get_current_user, get_locale, get_request_id
from app.i18n import t


router = APIRouter(tags=["审计日志"])


@router.get(
    "/audit-logs",
    response_model=ApiResponse[List[AuditLogResponse]],
    summary="查询审计日志",
    description="查询审计日志（支持多维度筛选和分页）"
)
async def query_audit_logs(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(100, ge=1, le=1000, description="限制记录数"),
    user_id: Optional[int] = Query(None, description="按操作者筛选"),
    module: Optional[str] = Query(None, description="按模块筛选"),
    action: Optional[str] = Query(None, description="按操作类型筛选"),
    target_type: Optional[str] = Query(None, description="按目标类型筛选"),
    target_id: Optional[str] = Query(None, description="按目标ID筛选"),
    success: Optional[str] = Query(None, description="按结果筛选（success/failed）"),
    start_time: Optional[datetime] = Query(None, description="开始时间"),
    end_time: Optional[datetime] = Query(None, description="结束时间"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[AuditLogResponse]]:
    """
    查询审计日志
    
    权限要求（同级别和子级别）：
    - Developer（开发者）：可以查看所有审计日志（developer、operator、user）
    - Operator（运维者）：可以查看同级别和子级别的审计日志（operator、user）
    - User（用户）：可以查看同级别的审计日志（user）
    """
    from app.models.user import UserRole
    
    # ⭐ 角色权限检查
    allowed_roles = []
    
    if current_user.role == UserRole.DEVELOPER:
        # Developer 可以查看所有级别的审计日志
        allowed_roles = ["developer", "operator", "user"]
    
    elif current_user.role == UserRole.OPERATOR:
        # Operator 只能查看 Operator 和 User 级别的审计日志
        allowed_roles = ["operator", "user"]
    
    elif current_user.role == UserRole.USER:
        # User 可以查看同级别（user）的所有审计日志
        allowed_roles = ["user"]
    
    # ⭐ 查询审计日志（根据角色权限过滤）
    logs = await audit_log_crud.get_multi(
        db=db,
        skip=skip,
        limit=limit,
        user_id=user_id,
        module=module,
        action=action,
        target_type=target_type,
        target_id=target_id,
        success=success,
        start_time=start_time,
        end_time=end_time,
        allowed_roles=allowed_roles  # ⭐ 新增：角色过滤
    )
    
    # ⭐ 统计总数（根据角色权限过滤）
    total = await audit_log_crud.count(
        db=db,
        user_id=user_id,
        module=module,
        action=action,
        target_type=target_type,
        target_id=target_id,
        success=success,
        start_time=start_time,
        end_time=end_time,
        allowed_roles=allowed_roles  # ⭐ 新增：角色过滤
    )
    
    # ⭐ 添加翻译后的显示名称
    translated_logs = []
    for log in logs:
        log_dict = AuditLogResponse.model_validate(log).model_dump()
        
        # 翻译 action_key
        if log.action_key:
            log_dict["action_display"] = t(log.action_key, locale)
        else:
            log_dict["action_display"] = log.action
        
        # 翻译 module
        module_key = f"audit.module.{log.module}"
        log_dict["module_display"] = t(module_key, locale)
        
        # 翻译 target_type
        if log.target_type:
            target_key = f"audit.target.{log.target_type}"
            log_dict["target_type_display"] = t(target_key, locale)
        
        translated_logs.append(log_dict)
    
    # 返回分页响应
    return paginated_response(
        items=translated_logs,
        skip=skip,
        limit=limit,
        total=total,
        message=t("response.query_success", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/audit-logs/{log_id}",
    response_model=ApiResponse[AuditLogResponse],
    summary="获取审计日志详情",
    description="根据ID获取审计日志的详细信息"
)
async def get_audit_log(
    log_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[AuditLogResponse]:
    """
    获取审计日志详情
    
    权限要求：
    - 需要登录
    - 普通用户只能查看自己的操作记录
    """
    # 查询审计日志
    log = await audit_log_crud.get_by_id(db, log_id)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("audit.query.no_records", locale)
        )
    
    # 权限检查：普通用户只能查看自己的记录
    from app.models.user import UserRole
    if current_user.role == UserRole.USER and log.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=t("auth.error.no_permission_view", locale)
        )
    
    # 返回响应
    from app.schemas.response import success_response
    return success_response(
        data=log,
        message=t("response.query_success", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/audit-logs/target/{target_type}/{target_id}",
    response_model=ApiResponse[List[AuditLogResponse]],
    summary="查询目标的操作历史",
    description="查询指定目标的所有操作历史"
)
async def get_target_audit_history(
    target_type: str,
    target_id: str,
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(100, ge=1, le=1000, description="限制记录数"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[AuditLogResponse]]:
    """
    查询目标的操作历史
    
    例如：查询某个用户的所有操作历史
    GET /api/v1/audit-logs/target/user/123
    """
    # 查询操作历史
    logs = await audit_log_crud.get_by_target(
        db=db,
        target_type=target_type,
        target_id=target_id,
        skip=skip,
        limit=limit
    )
    
    # 返回响应
    from app.schemas.response import success_response
    return success_response(
        data=logs,
        message=t("response.query_success", locale),
        locale=locale,
        request_id=request_id
    )

