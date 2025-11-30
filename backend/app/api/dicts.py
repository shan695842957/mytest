"""
字典数据 API（枚举值、常量等）
用于前端下拉框、选择器等组件
"""

from typing import Dict, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.response import ApiResponse, success_response
from app.models.user import User, UserRole
from app.api.deps import get_current_user, get_locale, get_request_id
from app.core.permissions import check_role_permission
from app.i18n import t


router = APIRouter(tags=["字典数据"])


@router.get(
    "/protocol-types",
    response_model=ApiResponse[List[Dict[str, str]]],
    summary="获取协议类型列表",
    description="获取所有支持的通信协议类型（从数据库读取，普通用户也可访问）"
)
async def get_protocol_types(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[Dict[str, str]]]:
    """获取协议类型列表（从数据库读取）"""
    # 注意：普通用户也可以访问此接口（用于创建通信实例时选择协议类型）
    from app.crud.protocol_type import protocol_type_crud
    
    protocol_types_list = await protocol_type_crud.get_enabled_list(db, include_params=False)
    
    # 转换为字典格式
    protocol_types = [
        {"value": pt.name, "label": pt.display_name}
        for pt in protocol_types_list
    ]
    
    return success_response(
        data=protocol_types,
        message=t("dicts.success.protocol_types", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/data-types",
    response_model=ApiResponse[List[Dict[str, str]]],
    summary="获取数据类型列表",
    description="获取业务字段数据类型列表"
)
async def get_data_types(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[Dict[str, str]]]:
    """获取数据类型列表"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("dicts.error.permission_denied", locale)
    )
    
    data_types = [
        {"value": "BOOL", "label": "布尔值 (BOOL)"},
        {"value": "INT", "label": "整数 (INT)"},
        {"value": "FLOAT", "label": "浮点数 (FLOAT)"},
        {"value": "ENUM", "label": "枚举 (ENUM)"},
    ]
    
    return success_response(
        data=data_types,
        message=t("dicts.success.data_types", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/semantic-types",
    response_model=ApiResponse[List[Dict[str, str]]],
    summary="获取语义类型列表",
    description="获取业务字段语义类型列表"
)
async def get_semantic_types(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[Dict[str, str]]]:
    """获取语义类型列表"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("dicts.error.permission_denied", locale)
    )
    
    semantic_types = [
        {"value": "MEASURE", "label": "测量量 (MEASURE)"},
        {"value": "STATUS", "label": "状态量 (STATUS)"},
        {"value": "ACCUM", "label": "累积量 (ACCUM)"},
        {"value": "PARAM", "label": "参数值 (PARAM)"},
        {"value": "SETPOINT", "label": "设定值 (SETPOINT)"},
        {"value": "COMMAND", "label": "控制命令 (COMMAND)"},
        {"value": "PARAM_SET", "label": "参数设定 (PARAM_SET)"},
    ]
    
    return success_response(
        data=semantic_types,
        message=t("dicts.success.semantic_types", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/io-types",
    response_model=ApiResponse[List[Dict[str, str]]],
    summary="获取IO类型列表",
    description="获取点表点IO类型列表"
)
async def get_io_types(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[Dict[str, str]]]:
    """获取IO类型列表"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("dicts.error.permission_denied", locale)
    )
    
    io_types = [
        {"value": "AI", "label": "模拟输入 (AI)"},
        {"value": "AO", "label": "模拟输出 (AO)"},
        {"value": "DI", "label": "数字输入 (DI)"},
        {"value": "DO", "label": "数字输出 (DO)"},
        {"value": "STRING", "label": "字符串 (STRING)"},
    ]
    
    return success_response(
        data=io_types,
        message=t("dicts.success.io_types", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/raw-types",
    response_model=ApiResponse[List[Dict[str, str]]],
    summary="获取原始数据类型列表",
    description="获取点表点原始数据类型列表"
)
async def get_raw_types(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[Dict[str, str]]]:
    """获取原始数据类型列表"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("dicts.error.permission_denied", locale)
    )
    
    raw_types = [
        {"value": "INT8", "label": "有符号8位整数 (INT8)"},
        {"value": "UINT8", "label": "无符号8位整数 (UINT8)"},
        {"value": "INT16", "label": "有符号16位整数 (INT16)"},
        {"value": "UINT16", "label": "无符号16位整数 (UINT16)"},
        {"value": "INT32", "label": "有符号32位整数 (INT32)"},
        {"value": "UINT32", "label": "无符号32位整数 (UINT32)"},
        {"value": "INT64", "label": "有符号64位整数 (INT64)"},
        {"value": "UINT64", "label": "无符号64位整数 (UINT64)"},
        {"value": "FLOAT32", "label": "32位浮点数 (FLOAT32)"},
        {"value": "FLOAT64", "label": "64位浮点数 (FLOAT64)"},
        {"value": "BITFIELD16", "label": "16位位域 (BITFIELD16)"},
        {"value": "BITFIELD32", "label": "32位位域 (BITFIELD32)"},
        {"value": "STRING", "label": "字符串 (STRING)"},
    ]
    
    return success_response(
        data=raw_types,
        message=t("dicts.success.raw_types", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/byte-orders",
    response_model=ApiResponse[List[Dict[str, str]]],
    summary="获取字节序列表",
    description="获取点表点字节序列表"
)
async def get_byte_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[Dict[str, str]]]:
    """获取字节序列表"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("dicts.error.permission_denied", locale)
    )
    
    byte_orders = [
        {"value": "BE", "label": "大端序 (BE)"},
        {"value": "LE", "label": "小端序 (LE)"},
        {"value": "BE_SWAP", "label": "大端序交换 (BE_SWAP)"},
        {"value": "LE_SWAP", "label": "小端序交换 (LE_SWAP)"},
    ]
    
    return success_response(
        data=byte_orders,
        message=t("dicts.success.byte_orders", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/binding-kinds",
    response_model=ApiResponse[List[Dict[str, str]]],
    summary="获取绑定类型列表",
    description="获取资产映射绑定类型列表"
)
async def get_binding_kinds(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[Dict[str, str]]]:
    """获取绑定类型列表"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("dicts.error.permission_denied", locale)
    )
    
    binding_kinds = [
        {"value": "DIRECT", "label": "直接映射 (DIRECT)"},
    ]
    
    return success_response(
        data=binding_kinds,
        message=t("dicts.success.binding_kinds", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/event-types",
    response_model=ApiResponse[List[Dict[str, str]]],
    summary="获取事件类型列表",
    description="获取SOE事件类型列表"
)
async def get_event_types(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[Dict[str, str]]]:
    """获取事件类型列表"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("dicts.error.permission_denied", locale)
    )
    
    event_types = [
        {"value": "ALARM_ON", "label": "报警开启 (ALARM_ON)"},
        {"value": "ALARM_OFF", "label": "报警关闭 (ALARM_OFF)"},
        {"value": "STATE_CHANGE", "label": "状态变化 (STATE_CHANGE)"},
        {"value": "CMD_SENT", "label": "命令已发送 (CMD_SENT)"},
        {"value": "CMD_FAIL", "label": "命令失败 (CMD_FAIL)"},
        {"value": "PARAM_CHANGE", "label": "参数变更 (PARAM_CHANGE)"},
        {"value": "SETPOINT_CHANGE", "label": "设定值变更 (SETPOINT_CHANGE)"},
    ]
    
    return success_response(
        data=event_types,
        message=t("dicts.success.event_types", locale),
        locale=locale,
        request_id=request_id
    )


@router.get(
    "/severity-levels",
    response_model=ApiResponse[List[Dict[str, str]]],
    summary="获取严重性级别列表",
    description="获取SOE事件严重性级别列表（0~5）"
)
async def get_severity_levels(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[List[Dict[str, str]]]:
    """获取严重性级别列表"""
    check_role_permission(
        current_user=current_user,
        required_role=UserRole.OPERATOR,
        error_message=t("dicts.error.permission_denied", locale)
    )
    
    severity_levels = [
        {"value": "0", "label": "0 - 信息"},
        {"value": "1", "label": "1 - 低"},
        {"value": "2", "label": "2 - 中"},
        {"value": "3", "label": "3 - 高"},
        {"value": "4", "label": "4 - 紧急"},
        {"value": "5", "label": "5 - 致命"},
    ]
    
    return success_response(
        data=severity_levels,
        message=t("dicts.success.severity_levels", locale),
        locale=locale,
        request_id=request_id
    )

