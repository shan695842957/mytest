"""
网络抓包工具 (tcpdump)
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from datetime import datetime, timedelta
import asyncio
import os

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.api.deps import get_current_user, get_locale, get_request_id
from app.database import get_db
from app.schemas.response import ApiResponse, success_response
from app.schemas.capture import CaptureTaskCreate, CaptureTaskResponse
from app.models.user import User, UserRole
from app.models.capture import CaptureTask
from app.core.permissions import check_role_permission
from app.core.capture_manager import capture_manager
from app.core.dependencies import set_audit_target
from app.middleware.audit import audit_route
from app.i18n import t

router = APIRouter()


# ============================================================================
# API 路由
# ============================================================================

@router.post(
    "/capture",
    response_model=ApiResponse[dict],
    summary="创建抓包任务",
    description="创建新的网络抓包任务"
)
@audit_route(
    module="tools",
    action="create_capture",
    action_key="audit.action.capture_created"
)
async def create_capture(
    capture_request: CaptureTaskCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[dict]:
    """
    创建抓包任务
    
    参数：
    - name: 任务名称
    - interface: 网络接口
    - filter_expression: 过滤表达式（可选）
    - duration: 持续时间（10-3600秒）
    - packet_count: 最大抓包数量（可选）
    
    权限：Developer/Operator
    
    返回：任务信息
    """
    # 检查权限
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("tools.error.capture_permission_denied", locale)
    )
    
    try:
        # 检查并发限制
        running_count_result = await db.execute(
            select(func.count(CaptureTask.id)).where(CaptureTask.status == 'running')
        )
        running_count = running_count_result.scalar()
        
        if running_count >= capture_manager.MAX_CONCURRENT:
            return success_response(
                data=None,
                message=t("tools.error.capture_too_many_running", locale, count=capture_manager.MAX_CONCURRENT),
                code=429,
                locale=locale,
                request_id=request_id
            )
        
        # 创建任务记录
        task = CaptureTask(
            name=capture_request.name,
            interface=capture_request.interface,
            filter_expression=capture_request.filter_expression,
            duration=capture_request.duration,
            packet_count=capture_request.packet_count,
            status='pending',
            created_by=current_user.id,
            expires_at=datetime.now() + timedelta(seconds=capture_request.duration)
        )
        db.add(task)
        await db.commit()
        await db.refresh(task)
        
        # 设置审计目标
        set_audit_target(request, "capture_task", str(task.id), task.name)
        
        # 后台启动抓包（不传递 db，start_capture 会创建自己的 session）
        asyncio.create_task(
            capture_manager.start_capture(
                task.id,
                capture_request.interface,
                capture_request.filter_expression,
                capture_request.duration,
                capture_request.packet_count
            )
        )
        
        return success_response(
            data={"id": task.id, "status": task.status},
            message=t("tools.success.capture_created", locale),
            locale=locale,
            request_id=request_id
        )
    
    except ValueError as e:
        return success_response(
            data=None,
            message=str(e),
            code=400,
            locale=locale,
            request_id=request_id
        )
    except RuntimeError as e:
        return success_response(
            data=None,
            message=str(e),
            code=500,
            locale=locale,
            request_id=request_id
        )
    except Exception as e:
        return success_response(
            data=None,
            message=t("tools.error.capture_create_failed", locale, error=str(e)),
            code=500,
            locale=locale,
            request_id=request_id
        )


@router.get(
    "/capture",
    response_model=ApiResponse[dict],
    summary="获取抓包任务列表",
    description="获取当前用户的所有抓包任务"
)
async def list_captures(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[dict]:
    """
    获取抓包任务列表
    
    参数：
    - status: 过滤状态（可选）
    - skip: 跳过记录数
    - limit: 每页记录数
    
    权限：Developer/Operator
    
    返回：任务列表
    """
    # 检查权限
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("tools.error.capture_permission_denied", locale)
    )
    
    try:
        # 构建查询
        query = select(CaptureTask)
        count_query = select(func.count(CaptureTask.id))
        
        # 只显示当前用户的任务（或Developer可以看所有）
        if current_user.role != UserRole.DEVELOPER:
            query = query.where(CaptureTask.created_by == current_user.id)
            count_query = count_query.where(CaptureTask.created_by == current_user.id)
        
        # 状态过滤
        if status:
            query = query.where(CaptureTask.status == status)
            count_query = count_query.where(CaptureTask.status == status)
        
        # 获取总数
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # 获取运行中的任务数
        running_query = select(func.count(CaptureTask.id)).where(
            CaptureTask.status == 'running'
        )
        if current_user.role != UserRole.DEVELOPER:
            running_query = running_query.where(CaptureTask.created_by == current_user.id)
        running_result = await db.execute(running_query)
        running_count = running_result.scalar()
        
        # 获取列表
        query = query.offset(skip).limit(limit).order_by(CaptureTask.created_at.desc())
        result = await db.execute(query)
        tasks = result.scalars().all()
        
        # 构建响应
        items = []
        for task in tasks:
            # 计算进度
            progress = None
            if task.status == 'running' and task.started_at:
                elapsed = (datetime.now() - task.started_at).total_seconds()
                progress = min(int((elapsed / task.duration) * 100), 99)
            elif task.status in ['completed', 'stopped', 'failed']:
                progress = 100
            
            # 判断操作权限
            can_download = task.file_path is not None and task.file_size > 0
            can_stop = task.status in ['pending', 'running']  # pending 和 running 都可以取消/停止
            can_delete = task.status in ['pending', 'completed', 'stopped', 'failed']  # pending 也可以删除
            
            item_dict = {
                "id": task.id,
                "name": task.name,
                "interface": task.interface,
                "filter_expression": task.filter_expression,
                "duration": task.duration,
                "packet_count": task.packet_count,
                "status": task.status,
                "pid": task.pid,
                "file_path": task.file_path,
                "file_size": task.file_size,
                "actual_duration": task.actual_duration,
                "error_message": task.error_message,
                "created_by": task.created_by,
                "created_at": task.created_at.isoformat(),
                "started_at": task.started_at.isoformat() if task.started_at else None,
                "completed_at": task.completed_at.isoformat() if task.completed_at else None,
                "expires_at": task.expires_at.isoformat(),
                "updated_at": task.updated_at.isoformat(),
                "progress": progress,
                "can_download": can_download,
                "can_stop": can_stop,
                "can_delete": can_delete,
            }
            items.append(item_dict)
        
        return success_response(
            data={
                "items": items,
                "total": total,
                "running_count": running_count
            },
            message=t("tools.success.capture_list", locale),
            locale=locale,
            request_id=request_id
        )
    
    except Exception as e:
        return success_response(
            data=None,
            message=t("tools.error.capture_list_failed", locale, error=str(e)),
            code=500,
            locale=locale,
            request_id=request_id
        )


@router.post(
    "/capture/{task_id}/stop",
    response_model=ApiResponse[None],
    summary="停止抓包任务",
    description="手动停止正在运行的抓包任务"
)
@audit_route(
    module="tools",
    action="stop_capture",
    action_key="audit.action.capture_stopped"
)
async def stop_capture(
    task_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """
    停止抓包任务
    
    参数：
    - task_id: 任务ID
    
    权限：Developer/Operator（只能停止自己的任务）
    
    返回：无
    """
    # 检查权限
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("tools.error.capture_permission_denied", locale)
    )
    
    try:
        # 获取任务
        result = await db.execute(
            select(CaptureTask).where(CaptureTask.id == task_id)
        )
        task = result.scalar_one_or_none()
        
        if not task:
            return success_response(
                data=None,
                message=t("tools.error.capture_not_found", locale),
                code=404,
                locale=locale,
                request_id=request_id
            )
        
        # 检查所有权
        if current_user.role != UserRole.DEVELOPER and task.created_by != current_user.id:
            return success_response(
                data=None,
                message=t("tools.error.capture_permission_denied", locale),
                code=403,
                locale=locale,
                request_id=request_id
            )
        
        # 检查状态
        if task.status not in ['pending', 'running']:
            return success_response(
                data=None,
                message=t("tools.error.capture_not_running", locale),
                code=400,
                locale=locale,
                request_id=request_id
            )
        
        # 设置审计目标
        set_audit_target(request, "capture_task", str(task.id), task.name)
        
        # 停止任务
        if task.status == 'running':
            await capture_manager.stop_capture(db, task_id)
        else:
            # pending 状态直接标记为 stopped
            task.status = 'stopped'
            task.completed_at = datetime.now()
            await db.commit()
        
        return success_response(
            data=None,
            message=t("tools.success.capture_stopped", locale),
            locale=locale,
            request_id=request_id
        )
    
    except Exception as e:
        return success_response(
            data=None,
            message=t("tools.error.capture_stop_failed", locale, error=str(e)),
            code=500,
            locale=locale,
            request_id=request_id
        )


@router.delete(
    "/capture/{task_id}",
    response_model=ApiResponse[None],
    summary="删除抓包任务",
    description="删除已完成的抓包任务及其文件"
)
@audit_route(
    module="tools",
    action="delete_capture",
    action_key="audit.action.capture_deleted"
)
async def delete_capture(
    task_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[None]:
    """
    删除抓包任务
    
    参数：
    - task_id: 任务ID
    
    权限：Developer/Operator（只能删除自己的任务）
    
    返回：无
    """
    # 检查权限
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("tools.error.capture_permission_denied", locale)
    )
    
    try:
        # 获取任务
        result = await db.execute(
            select(CaptureTask).where(CaptureTask.id == task_id)
        )
        task = result.scalar_one_or_none()
        
        if not task:
            return success_response(
                data=None,
                message=t("tools.error.capture_not_found", locale),
                code=404,
                locale=locale,
                request_id=request_id
            )
        
        # 检查所有权
        if current_user.role != UserRole.DEVELOPER and task.created_by != current_user.id:
            return success_response(
                data=None,
                message=t("tools.error.capture_permission_denied", locale),
                code=403,
                locale=locale,
                request_id=request_id
            )
        
        # 检查状态（只有 running 状态不能删除）
        if task.status == 'running':
            return success_response(
                data=None,
                message=t("tools.error.capture_still_running", locale),
                code=400,
                locale=locale,
                request_id=request_id
            )
        
        # 设置审计目标
        set_audit_target(request, "capture_task", str(task.id), task.name)
        
        # 删除文件
        if task.file_path and os.path.exists(task.file_path):
            try:
                os.remove(task.file_path)
            except Exception:
                pass
        
        # 删除数据库记录
        await db.delete(task)
        await db.commit()
        
        return success_response(
            data=None,
            message=t("tools.success.capture_deleted", locale),
            locale=locale,
            request_id=request_id
        )
    
    except Exception as e:
        return success_response(
            data=None,
            message=t("tools.error.capture_delete_failed", locale, error=str(e)),
            code=500,
            locale=locale,
            request_id=request_id
        )


@router.post(
    "/capture/cleanup",
    response_model=ApiResponse[dict],
    summary="清理过期抓包任务",
    description="手动触发清理7天前的抓包任务和文件"
)
async def cleanup_captures(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[dict]:
    """
    手动清理过期抓包任务
    
    权限：仅Developer可操作
    
    返回：清理统计信息
    """
    from app.core.capture_cleaner import capture_cleaner
    
    # 检查权限（仅Developer可手动清理）
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.DEVELOPER,
        error_message=t("tools.error.capture_permission_denied", locale)
    )
    
    try:
        # 清理过期任务（7天）
        tasks_deleted, files_deleted = await capture_cleaner.cleanup_expired_tasks(db, retention_days=7)
        
        # 清理孤立文件
        orphaned_deleted = await capture_cleaner.cleanup_orphaned_files(db)
        
        return success_response(
            data={
                "tasks_deleted": tasks_deleted,
                "files_deleted": files_deleted,
                "orphaned_deleted": orphaned_deleted,
                "retention_days": 7
            },
            message=t("tools.success.capture_cleaned", locale, 
                     tasks=tasks_deleted, files=files_deleted, orphaned=orphaned_deleted),
            locale=locale,
            request_id=request_id
        )
    
    except Exception as e:
        return success_response(
            data=None,
            message=t("tools.error.capture_cleanup_failed", locale, error=str(e)),
            code=500,
            locale=locale,
            request_id=request_id
        )


@router.get(
    "/capture/{task_id}/download",
    summary="下载抓包文件",
    description="下载已完成的抓包文件（.pcap格式）"
)
async def download_capture(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    locale: str = Depends(get_locale)
):
    """
    下载抓包文件
    
    参数：
    - task_id: 任务ID
    
    权限：Developer/Operator（只能下载自己的任务）
    
    返回：.pcap文件
    """
    from fastapi.responses import FileResponse
    
    # 检查权限
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("tools.error.capture_permission_denied", locale)
    )
    
    # 获取任务
    result = await db.execute(
        select(CaptureTask).where(CaptureTask.id == task_id)
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("tools.error.capture_not_found", locale)
        )
    
    # 检查所有权
    if current_user.role != UserRole.DEVELOPER and task.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=t("tools.error.capture_permission_denied", locale)
        )
    
    # 检查文件是否存在
    if not task.file_path or not os.path.exists(task.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("tools.error.capture_file_not_found", locale)
        )
    
    # 返回文件
    filename = f"{task.name}_{task.id}.pcap"
    return FileResponse(
        path=task.file_path,
        media_type="application/vnd.tcpdump.pcap",
        filename=filename
    )

