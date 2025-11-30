"""
统一响应结构
所有 API 接口都应该使用这个统一的响应格式
"""

from typing import Generic, TypeVar, Optional, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

# 泛型类型变量
T = TypeVar('T')


class ResponseMetadata(BaseModel):
    """响应元数据"""
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="响应时间")
    request_id: Optional[str] = Field(None, description="请求ID（用于追踪）")
    locale: str = Field("zh_CN", description="响应语言")


class PaginationInfo(BaseModel):
    """分页信息"""
    page: int = Field(..., ge=1, description="当前页码")
    page_size: int = Field(..., ge=1, le=1000, description="每页数量")
    total: int = Field(..., ge=0, description="总记录数")
    total_pages: int = Field(..., ge=0, description="总页数")
    
    @staticmethod
    def from_params(skip: int, limit: int, total: int) -> "PaginationInfo":
        """从 skip/limit 参数创建分页信息"""
        page = (skip // limit) + 1
        total_pages = (total + limit - 1) // limit if limit > 0 else 0
        return PaginationInfo(
            page=page,
            page_size=limit,
            total=total,
            total_pages=total_pages
        )


class ApiResponse(BaseModel, Generic[T]):
    """
    统一的 API 响应结构
    
    所有接口都使用这个格式返回：
    - 成功：code=0, success=true, data=实际数据
    - 失败：code!=0, success=false, error=错误信息
    """
    
    # 响应状态
    success: bool = Field(..., description="是否成功")
    code: int = Field(..., description="响应码（0=成功，非0=错误码）")
    message: str = Field(..., description="响应消息")
    
    # 响应数据
    data: Optional[T] = Field(None, description="响应数据")
    
    # 错误信息（仅失败时）
    error: Optional[str] = Field(None, description="错误详情")
    error_code: Optional[str] = Field(None, description="错误代码（用于国际化）")
    
    # 分页信息（列表查询时）
    pagination: Optional[PaginationInfo] = Field(None, description="分页信息")
    
    # 元数据
    metadata: ResponseMetadata = Field(
        default_factory=ResponseMetadata,
        description="响应元数据"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "code": 0,
                "message": "操作成功",
                "data": {"id": 1, "username": "admin"},
                "metadata": {
                    "timestamp": "2024-01-01T12:00:00",
                    "locale": "zh_CN"
                }
            }
        }


# 便捷函数：创建成功响应
def success_response(
    data: Optional[T] = None,
    message: str = "操作成功",
    code: int = 0,
    pagination: Optional[PaginationInfo] = None,
    locale: str = "zh_CN",
    request_id: Optional[str] = None
) -> ApiResponse[T]:
    """
    创建响应（统一格式）
    
    Args:
        data: 响应数据
        message: 响应消息
        code: 响应码（0=成功，非0=错误）
        pagination: 分页信息（可选）
        locale: 响应语言
        request_id: 请求ID
    
    Returns:
        统一的响应格式
    
    注意：code != 0 时，success=False，表示业务错误
    """
    if code == 0:
        return ApiResponse(
            success=True,
            code=code,
            message=message,
            data=data,
            pagination=pagination,
            metadata=ResponseMetadata(
                locale=locale,
                request_id=request_id
            )
        )
    return ApiResponse(
        success=False,
        code=code,
        message=message,
        data=None,
        metadata=ResponseMetadata(locale=locale, request_id=request_id)
    )


# 便捷函数：创建失败响应
def error_response(
    message: str,
    code: int = 1,
    error: Optional[str] = None,
    error_code: Optional[str] = None,
    locale: str = "zh_CN",
    request_id: Optional[str] = None
) -> ApiResponse[None]:
    """
    创建失败响应
    
    Args:
        message: 错误消息
        code: 错误码（默认 1）
        error: 详细错误信息
        error_code: 错误代码（用于国际化）
        locale: 响应语言
        request_id: 请求ID
    
    Returns:
        统一的错误响应
    """
    return ApiResponse(
        success=False,
        code=code,
        message=message,
        data=None,
        error=error,
        error_code=error_code,
        metadata=ResponseMetadata(
            locale=locale,
            request_id=request_id
        )
    )


# 便捷函数：创建分页响应
def paginated_response(
    items: List[T],
    skip: int,
    limit: int,
    total: int,
    message: str = "查询成功",
    locale: str = "zh_CN",
    request_id: Optional[str] = None
) -> ApiResponse[List[T]]:
    """
    创建分页响应
    
    Args:
        items: 数据列表
        skip: 跳过的记录数
        limit: 每页数量
        total: 总记录数
        message: 响应消息
        locale: 响应语言
        request_id: 请求ID
    
    Returns:
        包含分页信息的响应
    """
    pagination = PaginationInfo.from_params(skip, limit, total)
    
    return ApiResponse(
        success=True,
        code=0,
        message=message,
        data=items,
        pagination=pagination,
        metadata=ResponseMetadata(
            locale=locale,
            request_id=request_id
        )
    )


# 标准错误码定义
class ErrorCode:
    """标准错误码"""
    
    # 通用错误 (1-999)
    SUCCESS = 0
    UNKNOWN_ERROR = 1
    VALIDATION_ERROR = 2
    NOT_FOUND = 404
    INTERNAL_ERROR = 500
    
    # 认证错误 (1000-1099)
    AUTH_INVALID_CREDENTIALS = 1001
    AUTH_INVALID_TOKEN = 1002
    AUTH_USER_NOT_FOUND = 1003
    AUTH_USER_INACTIVE = 1004
    AUTH_TOKEN_EXPIRED = 1005
    
    # 权限错误 (1100-1199)
    PERMISSION_DENIED = 1100
    PERMISSION_CREATE = 1101
    PERMISSION_VIEW = 1102
    PERMISSION_UPDATE = 1103
    PERMISSION_DELETE = 1104
    PERMISSION_CHANGE_PASSWORD = 1105
    
    # 业务错误 (1200+)
    USERNAME_EXISTS = 1201
    CANNOT_DELETE_BUILTIN = 1202
    INCORRECT_OLD_PASSWORD = 1203

