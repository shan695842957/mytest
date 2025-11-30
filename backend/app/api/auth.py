"""
认证和用户管理 API
使用中间件自动审计，代码简洁优雅
"""

from datetime import timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserUpdate,
    Token,
    LoginRequest,
    ChangePasswordRequest,
    UserRole
)
from app.schemas.response import ApiResponse, success_response, paginated_response
from app.models.user import User
from app.crud.user import user_crud
from app.core.security import (
    verify_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.core.permissions import check_permission
from app.core.dependencies import set_audit_target, set_audit_changes
from app.middleware.audit import audit_route
from app.api.deps import get_current_user, get_locale, get_request_id
from app.i18n import t


router = APIRouter(tags=["认证和用户管理"])


@router.post(
    "/login",
    response_model=ApiResponse[Token],
    summary="用户登录",
    description="使用用户名和密码登录，返回 JWT Token"
)
@audit_route(
    module="auth",
    action="login",
    action_key="audit.action.user_login"
)
async def login(
    login_data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[Token]:
    """
    用户登录
    
    - **username**: 用户名
    - **password**: 密码
    
    返回：
    - **access_token**: JWT Token
    - **token_type**: Bearer
    - **expires_in**: 过期时间（秒）
    """
    # 查询用户
    user = await user_crud.get_by_username(db, login_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=t("auth.error.invalid_credentials", locale)
        )
    
    # 验证密码
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=t("auth.error.invalid_credentials", locale)
        )
    
    # 检查用户是否激活
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=t("auth.error.user_inactive", locale)
        )
    
    # 创建 Token
    access_token = create_access_token(
        data={
            "user_id": user.id,
            "username": user.username,
            "role": user.role.value
        },
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    # ⭐ 返回 Token 和用户信息（前端需要 role 等信息做权限判断）
    token_data = Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)  # 包含 id、username、role 等
    )
    
    # ⭐ 设置审计目标和用户信息（登录时用户未认证，需要手动设置）
    set_audit_target(request, "user", str(user.id), user.username)
    
    from app.core.dependencies import set_audit_user
    set_audit_user(request, user.id, user.username, user.role.value)
    
    return success_response(
        data=token_data,
        message=t("response.success", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/users",
    response_model=ApiResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    summary="创建用户",
    description="创建新用户（需要权限）"
)
@audit_route(
    module="auth",
    action="create_user",
    action_key="audit.action.user_created"
)
async def create_user(
    user_in: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[UserResponse]:
    """
    创建用户
    
    权限要求：
    - 高角色可以创建低角色账号
    - 内置账号可以创建同级别账号
    """
    # 检查权限
    check_permission(
        operator=current_user,
        target=None,
        action="create",
        target_role=user_in.role
    )
    
    # 检查用户名是否已存在
    if await user_crud.is_username_taken(db, user_in.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("auth.error.username_exists", locale)
        )
    
    # 创建用户
    user = await user_crud.create(db, user_in, creator_id=current_user.id)
    
    # 设置审计目标（中间件会自动记录）
    set_audit_target(request, "user", str(user.id), user.username)
    
    return success_response(
        data=user,
        message=t("response.created", locale),
        code=0,
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/users/me",
    response_model=ApiResponse[UserResponse],
    summary="获取当前用户信息",
    description="获取当前登录用户的详细信息"
)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[UserResponse]:
    """获取当前用户信息"""
    return success_response(
        data=current_user,
        message=t("response.query_success", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/users/{user_id}",
    response_model=ApiResponse[UserResponse],
    summary="获取指定用户信息",
    description="根据用户 ID 获取用户信息（需要权限）"
)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[UserResponse]:
    """
    获取指定用户信息
    
    权限要求：
    - 可以查看自己
    - 高角色可以查看低角色
    - 内置账号可以查看同级别账号
    - 创建者可以查看自己创建的账号
    """
    # 查询用户
    user = await user_crud.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("auth.error.user_not_found", locale)
        )
    
    # 检查权限
    check_permission(
        operator=current_user,
        target=user,
        action="view"
    )
    
    return success_response(
        data=user,
        message=t("response.query_success", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/users",
    response_model=ApiResponse[List[UserResponse]],
    summary="获取用户列表",
    description="获取用户列表（根据权限过滤）"
)
async def list_users(
    skip: int = Query(0, ge=0, description="跳过记录数"),
    limit: int = Query(100, ge=1, le=1000, description="限制记录数"),
    role: UserRole = Query(None, description="按角色过滤"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[UserResponse]]:
    """
    获取用户列表
    
    权限要求：
    - 返回当前用户有权查看的用户列表
    """
    # 获取用户列表
    if role:
        users = await user_crud.get_by_role(db, role, skip, limit)
    else:
        users = await user_crud.get_multi(db, skip, limit)
    
    # 过滤当前用户有权查看的用户
    from app.core.permissions import PermissionChecker
    checker = PermissionChecker()
    
    viewable_users = [
        user for user in users
        if checker.can_view_user(current_user, user)
    ]
    
    # TODO: 实现总数统计
    total = len(viewable_users)
    
    return paginated_response(
        items=viewable_users,
        skip=skip,
        limit=limit,
        total=total,
        message=t("response.query_success", locale),
        locale=locale,
        request_id=request_id
    )


@router.patch(
    "/users/{user_id}",
    response_model=ApiResponse[UserResponse],
    summary="更新用户信息",
    description="更新用户的激活状态（需要权限）"
)
@audit_route(
    module="auth",
    action="update_user",
    action_key="audit.action.user_updated"
)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[UserResponse]:
    """
    更新用户信息
    
    权限要求：
    - 高角色可以更新低角色
    - 内置账号可以更新同级别账号（除了自己）
    """
    # 查询用户
    user = await user_crud.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("auth.error.user_not_found", locale)
        )
    
    # 检查权限
    check_permission(
        operator=current_user,
        target=user,
        action="update"
    )
    
    # 记录变更前的状态
    old_data = {"is_active": user.is_active}
    
    # 更新激活状态
    if user_update.is_active is not None:
        user = await user_crud.update_active_status(
            db, user, user_update.is_active
        )
    
    # 记录变更后的状态
    new_data = {"is_active": user.is_active}
    
    # 设置审计信息（中间件会自动记录）
    set_audit_target(request, "user", str(user.id), user.username)
    set_audit_changes(request, old_data, new_data)
    
    return success_response(
        data=user,
        message=t("response.updated", locale),
        locale=locale,
        request_id=request_id
    )


@router.delete(
    "/users/{user_id}",
    response_model=ApiResponse[None],
    summary="删除用户",
    description="删除指定用户（需要权限，内置账号不可删除）"
)
@audit_route(
    module="auth",
    action="delete_user",
    action_key="audit.action.user_deleted"
)
async def delete_user(
    user_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """
    删除用户
    
    权限要求：
    - 内置账号不可删除
    - 高角色可以删除低角色
    - 内置账号可以删除同级别的非内置账号
    """
    # 查询用户
    user = await user_crud.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("auth.error.user_not_found", locale)
        )
    
    # 检查权限
    check_permission(
        operator=current_user,
        target=user,
        action="delete"
    )
    
    # 记录被删除用户的信息
    deleted_username = user.username
    
    # 删除用户
    success = await user_crud.delete(db, user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=t("auth.error.cannot_delete_builtin", locale)
        )
    
    # 设置审计目标（中间件会自动记录）
    set_audit_target(request, "user", str(user_id), deleted_username)
    
    return success_response(
        data=None,
        message=t("response.deleted", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/users/{user_id}/change-password",
    response_model=ApiResponse[UserResponse],
    summary="修改用户密码",
    description="修改指定用户的密码（需要权限）"
)
@audit_route(
    module="auth",
    action="change_password",
    action_key="audit.action.password_changed"
)
async def change_user_password(
    user_id: int,
    password_data: ChangePasswordRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[UserResponse]:
    """
    修改用户密码
    
    权限要求：
    - 可以修改自己的密码（需要验证旧密码）
    - 高角色可以修改低角色的密码（无需旧密码）
    """
    # 查询用户
    user = await user_crud.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("auth.error.user_not_found", locale)
        )
    
    # 检查权限
    check_permission(
        operator=current_user,
        target=user,
        action="change_password"
    )
    
    # 如果是修改自己的密码，需要验证旧密码
    if current_user.id == user.id:
        if not verify_password(password_data.old_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=t("auth.error.incorrect_old_password", locale)
            )
    
    # 更新密码
    user = await user_crud.update_password(db, user, password_data.new_password)
    
    # 设置审计目标（中间件会自动记录，密码已自动过滤）
    set_audit_target(request, "user", str(user.id), user.username)
    
    return success_response(
        data=user,
        message=t("response.updated", locale),
        locale=locale,
        request_id=request_id
    )
