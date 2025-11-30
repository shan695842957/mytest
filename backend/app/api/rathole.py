"""Rathole 配置管理 API 路由"""
import os
import logging
import asyncio
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

from app.database import get_db
from app.schemas.rathole import (
    RatholeGlobalConfig,
    RatholeServiceCreate,
    RatholeServiceUpdate,
    RatholeServiceResponse,
    RatholeConfigResponse,
    RatholeBackupInfo,
    RatholeServiceStatus
)
from app.schemas.response import ApiResponse, success_response
from app.models.user import User, UserRole
from app.services.rathole import rathole_service
from app.core.dependencies import set_audit_target, set_audit_changes
from app.core.permissions import check_role_permission
from app.middleware.audit import audit_route
from app.api.deps import get_current_user, get_locale, get_request_id
from app.i18n import t

router = APIRouter(tags=["Rathole 内网穿透"])


# ==================== 全局配置 ====================

@router.get(
    "/config",
    response_model=ApiResponse[RatholeConfigResponse],
    summary="获取 Rathole 配置",
    description="获取全局配置和服务列表"
)
async def get_config(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[RatholeConfigResponse]:
    """获取 Rathole 配置"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("rathole.error.permission_denied", locale)
    )
    
    # TODO: 从 software_config 表读取配置路径
    config_path = rathole_service.default_config_path
    
    # 加载配置
    config = await rathole_service.load_config(config_path)
    services = await rathole_service.get_services(config_path)
    
    # 转换为响应格式
    services_dict = {s.service_name: s for s in services}
    
    response_data = RatholeConfigResponse(
        remote_addr=config.get("client", {}).get("remote_addr", ""),
        config_path=config_path,
        services=services_dict,
        service_count=len(services)
    )
    
    return success_response(
        data=response_data,
        message=t("rathole.success.config_loaded", locale),
        locale=locale,
        request_id=request_id
    )


@router.put(
    "/config/remote-addr",
    response_model=ApiResponse[dict],
    summary="更新远程服务器地址",
    description="更新 Rathole 远程服务器地址"
)
@audit_route(
    module="rathole",
    action="update_remote_addr",
    action_key="audit.action.rathole_remote_addr_updated"
)
async def update_remote_addr(
    config_in: RatholeGlobalConfig,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[dict]:
    """更新远程服务器地址"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("rathole.error.permission_denied", locale)
    )
    
    config_path = rathole_service.default_config_path
    
    # 更新配置
    await rathole_service.update_remote_addr(config_path, config_in.remote_addr)
    
    # 设置审计目标
    set_audit_target(request, "rathole_config", "remote_addr", config_in.remote_addr)
    
    return success_response(
        data={"remote_addr": config_in.remote_addr},
        message=t("rathole.success.remote_addr_updated", locale),
        locale=locale,
        request_id=request_id
    )


# ==================== 服务管理 ====================

@router.get(
    "/services",
    response_model=ApiResponse[List[RatholeServiceResponse]],
    summary="获取服务列表",
    description="获取所有 Rathole 服务"
)
async def list_services(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[RatholeServiceResponse]]:
    """获取服务列表"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("rathole.error.permission_denied", locale)
    )
    
    config_path = rathole_service.default_config_path
    
    # 获取服务列表
    services = await rathole_service.get_services(config_path)
    
    return success_response(
        data=services,
        message=t("rathole.success.service_list", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/services",
    response_model=ApiResponse[RatholeServiceResponse],
    summary="创建服务",
    description="创建新的 Rathole 服务"
)
@audit_route(
    module="rathole",
    action="create_service",
    action_key="audit.action.rathole_service_created"
)
async def create_service(
    service_in: RatholeServiceCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[RatholeServiceResponse]:
    """创建服务"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("rathole.error.permission_denied", locale)
    )
    
    config_path = rathole_service.default_config_path
    
    # 创建服务
    service = await rathole_service.create_service(config_path, service_in)
    
    # 设置审计目标
    set_audit_target(request, "rathole_service", service.service_name, service.service_name)
    
    return success_response(
        data=service,
        message=t("rathole.success.service_created", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/services/{service_name}",
    response_model=ApiResponse[RatholeServiceResponse],
    summary="获取服务详情",
    description="获取指定服务的详细信息"
)
async def get_service(
    service_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[RatholeServiceResponse]:
    """获取服务详情"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("rathole.error.permission_denied", locale)
    )
    
    config_path = rathole_service.default_config_path
    
    # 获取服务
    service = await rathole_service.get_service(config_path, service_name)
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("rathole.error.service_not_found", locale)
        )
    
    return success_response(
        data=service,
        message=t("rathole.success.service_get", locale),
        locale=locale,
        request_id=request_id
    )


@router.patch(
    "/services/{service_name}",
    response_model=ApiResponse[RatholeServiceResponse],
    summary="更新服务",
    description="更新 Rathole 服务配置"
)
@audit_route(
    module="rathole",
    action="update_service",
    action_key="audit.action.rathole_service_updated"
)
async def update_service(
    service_name: str,
    service_in: RatholeServiceUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[RatholeServiceResponse]:
    """更新服务"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("rathole.error.permission_denied", locale)
    )
    
    config_path = rathole_service.default_config_path
    
    # 更新服务
    service = await rathole_service.update_service(config_path, service_name, service_in)
    
    # 设置审计目标
    set_audit_target(request, "rathole_service", service.service_name, service.service_name)
    
    return success_response(
        data=service,
        message=t("rathole.success.service_updated", locale),
        locale=locale,
        request_id=request_id
    )


@router.delete(
    "/services/{service_name}",
    response_model=ApiResponse[None],
    summary="删除服务",
    description="删除 Rathole 服务"
)
@audit_route(
    module="rathole",
    action="delete_service",
    action_key="audit.action.rathole_service_deleted"
)
async def delete_service(
    service_name: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """删除服务"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("rathole.error.permission_denied", locale)
    )
    
    config_path = rathole_service.default_config_path
    
    # 设置审计目标
    set_audit_target(request, "rathole_service", service_name, service_name)
    
    # 删除服务
    await rathole_service.delete_service(config_path, service_name)
    
    return success_response(
        data=None,
        message=t("rathole.success.service_deleted", locale),
        locale=locale,
        request_id=request_id
    )


# ==================== TOML 文件管理 ====================

@router.get(
    "/toml/content",
    response_model=ApiResponse[str],
    summary="获取 TOML 内容",
    description="获取当前 TOML 配置文件内容"
)
async def get_toml_content(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[str]:
    """获取 TOML 内容"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("rathole.error.permission_denied", locale)
    )
    
    config_path = rathole_service.default_config_path
    
    # 获取内容
    content = await rathole_service.get_toml_content(config_path)
    
    return success_response(
        data=content,
        message=t("rathole.success.toml_loaded", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/toml/download",
    summary="下载 TOML 文件",
    description="下载当前 TOML 配置文件",
    response_class=FileResponse
)
async def download_toml(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """下载 TOML 文件"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message="Permission denied"
    )
    
    config_path = rathole_service.default_config_path
    
    if not os.path.exists(config_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Config file not found"
        )
    
    return FileResponse(
        path=config_path,
        filename="rathole_client.toml",
        media_type="text/plain"
    )


# ==================== 服务控制 ====================

@router.post(
    "/systemctl/start",
    response_model=ApiResponse[dict],
    summary="启动 Rathole 服务",
    description="启动 rathole systemd 服务"
)
@audit_route(
    module="rathole",
    action="start_service",
    action_key="audit.action.rathole_service_started"
)
async def start_rathole_service(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[dict]:
    """启动 Rathole 服务"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("rathole.error.permission_denied", locale)
    )
    
    # 启动服务
    result = await rathole_service.start_rathole()
    
    # 设置审计目标
    set_audit_target(request, "rathole_systemctl", "service", "rathole")
    
    return success_response(
        data=result,
        message=t("rathole.success.service_started", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/systemctl/stop",
    response_model=ApiResponse[dict],
    summary="停止 Rathole 服务",
    description="停止 rathole systemd 服务"
)
@audit_route(
    module="rathole",
    action="stop_service",
    action_key="audit.action.rathole_service_stopped"
)
async def stop_rathole_service(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[dict]:
    """停止 Rathole 服务"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("rathole.error.permission_denied", locale)
    )
    
    # 停止服务
    result = await rathole_service.stop_rathole()
    
    # 设置审计目标
    set_audit_target(request, "rathole_systemctl", "service", "rathole")
    
    return success_response(
        data=result,
        message=t("rathole.success.service_stopped", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/systemctl/restart",
    response_model=ApiResponse[dict],
    summary="重启 Rathole 服务",
    description="重启 rathole systemd 服务"
)
@audit_route(
    module="rathole",
    action="restart_service",
    action_key="audit.action.rathole_service_restarted"
)
async def restart_rathole_service(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[dict]:
    """重启 Rathole 服务"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("rathole.error.permission_denied", locale)
    )
    
    # 重启服务
    result = await rathole_service.restart_rathole()
    
    # 设置审计目标
    set_audit_target(request, "rathole_systemctl", "service", "rathole")
    
    return success_response(
        data=result,
        message=t("rathole.success.service_restarted", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/systemctl/status",
    response_model=ApiResponse[RatholeServiceStatus],
    summary="获取 Rathole 服务状态",
    description="获取 rathole systemd 服务运行状态"
)
async def get_rathole_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[RatholeServiceStatus]:
    """获取 Rathole 服务状态"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("rathole.error.permission_denied", locale)
    )
    
    # 获取状态
    status_info = await rathole_service.get_rathole_status()
    
    return success_response(
        data=status_info,
        message=t("rathole.success.status_retrieved", locale),
        locale=locale,
        request_id=request_id
    )


# ==================== 备份管理 ====================

@router.get(
    "/backups",
    response_model=ApiResponse[List[RatholeBackupInfo]],
    summary="获取备份列表",
    description="获取所有配置文件备份"
)
async def list_backups(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[RatholeBackupInfo]]:
    """获取备份列表"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("rathole.error.permission_denied", locale)
    )
    
    config_path = rathole_service.default_config_path
    
    # 获取备份列表
    backups = await rathole_service.list_backups(config_path)
    
    return success_response(
        data=backups,
        message=t("rathole.success.backup_list", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/backups/{backup_filename}/content",
    response_model=ApiResponse[str],
    summary="查看备份内容",
    description="查看指定备份文件的内容"
)
async def get_backup_content(
    backup_filename: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[str]:
    """查看备份内容"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("rathole.error.permission_denied", locale)
    )
    
    config_path = rathole_service.default_config_path
    
    # 获取备份内容
    content = await rathole_service.get_backup_content(config_path, backup_filename)
    
    return success_response(
        data=content,
        message=t("rathole.success.backup_content_retrieved", locale),
        locale=locale,
        request_id=request_id
    )


@router.post(
    "/backups/{backup_filename}/restore",
    response_model=ApiResponse[None],
    summary="恢复备份",
    description="从备份文件恢复配置"
)
@audit_route(
    module="rathole",
    action="restore_backup",
    action_key="audit.action.rathole_backup_restored"
)
async def restore_backup(
    backup_filename: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """恢复备份"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("rathole.error.permission_denied", locale)
    )
    
    config_path = rathole_service.default_config_path
    
    # 设置审计目标
    set_audit_target(request, "rathole_backup", backup_filename, backup_filename)
    
    # 恢复备份
    await rathole_service.restore_backup(config_path, backup_filename)
    
    return success_response(
        data=None,
        message=t("rathole.success.backup_restored", locale),
        locale=locale,
        request_id=request_id
    )


@router.delete(
    "/backups/{backup_filename}",
    response_model=ApiResponse[None],
    summary="删除备份",
    description="删除指定的备份文件"
)
@audit_route(
    module="rathole",
    action="delete_backup",
    action_key="audit.action.rathole_backup_deleted"
)
async def delete_backup(
    backup_filename: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """删除备份"""
    
    # 权限检查
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("rathole.error.permission_denied", locale)
    )
    
    config_path = rathole_service.default_config_path
    backup_dir = await rathole_service._get_backup_directory()
    backup_path = os.path.join(backup_dir, backup_filename)
    
    if not os.path.exists(backup_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("rathole.error.backup_not_found", locale)
        )
    
    # 设置审计目标
    set_audit_target(request, "rathole_backup", backup_filename, backup_filename)
    
    # 删除备份
    try:
        await asyncio.to_thread(os.remove, backup_path)
    except PermissionError:
        logger.error(f"Permission denied when deleting backup: {backup_path}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=t("rathole.error.backup_delete_permission_denied", locale)
        )
    except Exception as e:
        logger.error(f"Failed to delete backup {backup_filename}: {e}")
        error_msg = t("rathole.error.backup_delete_failed_detail", locale).replace("{error}", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )
    
    return success_response(
        data=None,
        message=t("rathole.success.backup_deleted", locale),
        locale=locale,
        request_id=request_id
    )
