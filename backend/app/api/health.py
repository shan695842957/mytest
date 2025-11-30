"""
健康检查接口
提供服务健康状态和依赖项检查
"""

from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.api.deps import get_locale, get_translator
from app.i18n import I18n
from app.config import settings


router = APIRouter(tags=["健康检查"])


class HealthResponse(BaseModel):
    """健康检查响应模型"""
    
    status: str = Field(..., description="服务状态: healthy | unhealthy")
    message: str = Field(..., description="状态描述")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="检查时间")
    version: str = Field(..., description="应用版本")
    checks: Dict[str, Any] = Field(default_factory=dict, description="各项检查结果")


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="健康检查",
    description="检查服务及其依赖项的健康状态",
    responses={
        200: {"description": "服务健康"},
        503: {"description": "服务异常"}
    }
)
async def health_check(
    db: AsyncSession = Depends(get_db),
    locale: str = Depends(get_locale),
    i18n: I18n = Depends(get_translator)
) -> HealthResponse:
    """
    健康检查端点
    
    检查项：
    - 数据库连接状态
    - 应用基本信息
    
    返回：
    - 200: 所有检查通过
    - 503: 至少一项检查失败
    """
    checks = {}
    all_healthy = True
    
    # 检查数据库连接
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = {
            "status": "healthy",
            "message": i18n.t("health.database.connected", locale)
        }
    except Exception as e:
        all_healthy = False
        checks["database"] = {
            "status": "unhealthy",
            "message": i18n.t("health.database.disconnected", locale),
            "error": str(e)
        }
    
    # 构建响应
    response_status = "healthy" if all_healthy else "unhealthy"
    response_message = i18n.t(
        f"health.status.{response_status}",
        locale
    )
    
    return HealthResponse(
        status=response_status,
        message=response_message,
        version=settings.app_version,
        checks=checks
    )


@router.get(
    "/health/live",
    summary="存活探针",
    description="Kubernetes 存活探针端点（轻量级检查）",
    status_code=status.HTTP_200_OK
)
async def liveness_probe() -> Dict[str, str]:
    """
    存活探针
    
    用于 Kubernetes liveness probe
    仅检查进程是否存活，不检查依赖项
    """
    return {"status": "alive"}


@router.get(
    "/health/ready",
    summary="就绪探针",
    description="Kubernetes 就绪探针端点（检查依赖项）",
    responses={
        200: {"description": "服务就绪"},
        503: {"description": "服务未就绪"}
    }
)
async def readiness_probe(
    db: AsyncSession = Depends(get_db)
) -> Dict[str, str]:
    """
    就绪探针
    
    用于 Kubernetes readiness probe
    检查服务是否准备好接收流量
    """
    try:
        # 检查数据库连接
        await db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"status": "not_ready", "error": str(e)}
        )

