"""
历史数据查询 API 路由
"""

import random
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.database import get_db
from app.schemas.history import (
    DeviceTreeResponse,
    StationNode,
    DeviceNode,
    DataPointNode,
    HistoryDataQueryRequest,
    HistoryDataQueryResponse,
    HistoryDataSeries,
    HistoryDataValue,
    HistoryDataPoint,
    ExportDataRequest,
)
from app.schemas.response import ApiResponse, success_response
from app.models.user import User
from app.models.asset import Asset, AssetMapping
from app.models.device_type import DeviceTypeTag
from app.models.device_type import DeviceType
from app.api.deps import get_current_user, get_locale, get_request_id
from app.i18n import t
from fastapi.responses import StreamingResponse
import io
import csv


router = APIRouter(tags=["历史数据查询"])


# ============================================================================
# 设备树查询 API
# ============================================================================

@router.get(
    "/device-tree",
    response_model=ApiResponse[DeviceTreeResponse],
    summary="获取设备树",
    description="获取用于历史数据查询的设备树结构（电站-设备-数据点层级）"
)
async def get_device_tree(
    semantic_types: Optional[str] = Query(
        None, 
        description="语义类型过滤（逗号分隔，如：MEASURE,ACCUM,PARAM）"
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[DeviceTreeResponse]:
    """获取设备树结构"""
    
    # 解析语义类型过滤
    allowed_semantic_types = None
    if semantic_types:
        allowed_semantic_types = [t.strip() for t in semantic_types.split(",")]
        allowed_semantic_types = [
            t for t in allowed_semantic_types 
            if t in ["MEASURE", "ACCUM", "PARAM"]
        ]
        if not allowed_semantic_types:
            allowed_semantic_types = None
    
    # 查询所有启用的资产
    assets_result = await db.execute(
        select(Asset).where(Asset.enabled == True).order_by(Asset.location, Asset.display_name)
    )
    assets = assets_result.scalars().all()
    
    if not assets:
        return success_response(
            data=DeviceTreeResponse(stations=[]),
            message=t("history.success.tree_empty", locale),
            locale=locale,
            request_id=request_id
        )
    
    # 构建设备树
    # 按 location 分组（location 作为电站名称）
    stations_dict: dict[str, StationNode] = {}
    
    for asset in assets:
        # 获取资产关联的映射和标签信息
        mappings_result = await db.execute(
            select(AssetMapping).where(AssetMapping.asset_id == asset.id)
        )
        mappings = mappings_result.scalars().all()
        
        if not mappings:
            continue
        
        # 获取设备类型和标签信息
        device_type_result = await db.execute(
            select(DeviceType).where(DeviceType.id == asset.device_type_id)
        )
        device_type = device_type_result.scalar_one_or_none()
        if not device_type:
            continue
        
        # 获取资产的所有标签（过滤语义类型）
        tags_result = await db.execute(
            select(DeviceTypeTag).where(
                and_(
                    DeviceTypeTag.device_type_id == asset.device_type_id,
                    DeviceTypeTag.semantic_type.in_(["MEASURE", "ACCUM", "PARAM"])
                )
            )
        )
        tags = tags_result.scalars().all()
        
        # 过滤语义类型
        if allowed_semantic_types:
            tags = [tag for tag in tags if tag.semantic_type in allowed_semantic_types]
        
        if not tags:
            continue
        
        # 使用 location 作为电站名称，如果为空则使用"未分类"
        station_name = asset.location.strip() if asset.location else t("history.station.uncategorized", locale)
        
        # 创建或获取电站节点
        if station_name not in stations_dict:
            stations_dict[station_name] = StationNode(
                id=f"station_{station_name}",
                name=station_name,
                children=[]
            )
        
        # 创建设备节点
        device_node = DeviceNode(
            id=f"asset_{asset.id}",
            name=asset.display_name,
            asset_id=asset.id,
            children=[]
        )
        
        # 为每个标签创建数据点节点
        for tag in tags:
            # 检查是否有映射（只有映射的标签才显示）
            has_mapping = any(
                mapping.asset_tag_name == tag.tag_name for mapping in mappings
            )
            
            if not has_mapping:
                continue
            
            data_point = DataPointNode(
                id=f"{asset.id}:{tag.tag_name}",
                name=f"{tag.display_name} ({tag.engineering_unit})" if tag.engineering_unit else tag.display_name,
                semantic_type=tag.semantic_type,  # type: ignore
                engineering_unit=tag.engineering_unit or "",
                asset_id=asset.id,
                asset_name=asset.name,
                asset_display_name=asset.display_name,
                tag_name=tag.tag_name,
                tag_display_name=tag.display_name
            )
            device_node.children.append(data_point)
        
        # 只添加有数据点的设备
        if device_node.children:
            stations_dict[station_name].children.append(device_node)
    
    # 过滤掉空的电站
    stations = [station for station in stations_dict.values() if station.children]
    
    return success_response(
        data=DeviceTreeResponse(stations=stations),
        message=t("history.success.tree_loaded", locale),
        locale=locale,
        request_id=request_id
    )


# ============================================================================
# 历史数据查询 API
# ============================================================================

@router.post(
    "/query",
    response_model=ApiResponse[HistoryDataQueryResponse],
    summary="查询历史数据",
    description="查询指定数据点在指定时间范围内的历史数据（支持MEASURE/ACCUM/PARAM三种语义）"
)
async def query_history_data(
    query: HistoryDataQueryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale),
    request_id: str = Depends(get_request_id)
) -> ApiResponse[HistoryDataQueryResponse]:
    """查询历史数据"""
    
    # 验证时间范围
    if query.end_time <= query.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("history.error.invalid_time_range", locale)
        )
    
    # 验证时间范围不超过30天（可以调整）
    max_duration = timedelta(days=30)
    if query.end_time - query.start_time > max_duration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("history.error.time_range_too_large", locale)
        )
    
    # 验证数据点
    if not query.data_points:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("history.error.no_data_points", locale)
        )
    
    # 限制数据点数量
    if len(query.data_points) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=t("history.error.too_many_data_points", locale)
        )
    
    # TODO: 实际应从 InfluxDB 查询数据
    # 当前使用模拟数据
    series_list: List[HistoryDataSeries] = []
    
    for data_point in query.data_points:
        # 验证资产和标签是否存在
        asset_result = await db.execute(
            select(Asset).where(Asset.id == data_point.asset_id)
        )
        asset = asset_result.scalar_one_or_none()
        if not asset:
            continue
        
        # 获取标签信息
        device_type_result = await db.execute(
            select(DeviceType).where(DeviceType.id == asset.device_type_id)
        )
        device_type = device_type_result.scalar_one_or_none()
        if not device_type:
            continue
        
        tag_result = await db.execute(
            select(DeviceTypeTag).where(
                and_(
                    DeviceTypeTag.device_type_id == device_type.id,
                    DeviceTypeTag.tag_name == data_point.tag_name,
                    DeviceTypeTag.semantic_type == data_point.semantic_type
                )
            )
        )
        tag = tag_result.scalar_one_or_none()
        if not tag:
            continue
        
        # 生成模拟数据
        # 计算时间点数量（每小时一个点）
        duration = query.end_time - query.start_time
        hours = int(duration.total_seconds() / 3600)
        if hours < 1:
            hours = 1
        
        # 生成时间序列
        data_values: List[HistoryDataValue] = []
        base_time = query.start_time
        
        # 根据语义类型生成不同的数据模式
        if data_point.semantic_type == "MEASURE":
            # 测量量：正弦波动
            base_value = random.uniform(50, 150)
            for i in range(hours + 1):
                time_point = base_time + timedelta(hours=i)
                # 正弦波 + 随机噪声
                value = base_value + 20 * (i / (hours or 1)) + 10 * random.random() * (1 if i % 2 == 0 else -1)
                data_values.append(HistoryDataValue(
                    time=time_point,
                    value=round(value, 2),
                    quality=0
                ))
        elif data_point.semantic_type == "ACCUM":
            # 累积量：单调递增
            base_value = random.uniform(1000, 5000)
            increment = random.uniform(10, 50)
            for i in range(hours + 1):
                time_point = base_time + timedelta(hours=i)
                value = base_value + increment * i
                data_values.append(HistoryDataValue(
                    time=time_point,
                    value=round(value, 2),
                    quality=0
                ))
        else:  # PARAM
            # 参数：基本恒定，偶尔变化
            base_value = random.uniform(80, 120)
            last_value = base_value
            for i in range(hours + 1):
                time_point = base_time + timedelta(hours=i)
                # 偶尔变化
                if random.random() < 0.1:  # 10% 概率变化
                    last_value = base_value + random.uniform(-10, 10)
                data_values.append(HistoryDataValue(
                    time=time_point,
                    value=round(last_value, 2),
                    quality=0
                ))
        
        # 创建数据序列
        series = HistoryDataSeries(
            asset_id=asset.id,
            asset_display_name=asset.display_name,
            tag_name=tag.tag_name,
            tag_display_name=tag.display_name,
            semantic_type=data_point.semantic_type,  # type: ignore
            engineering_unit=tag.engineering_unit or "",
            data=data_values
        )
        series_list.append(series)
    
    return success_response(
        data=HistoryDataQueryResponse(series=series_list),
        message=t("history.success.query_completed", locale),
        locale=locale,
        request_id=request_id
    )


# ============================================================================
# 导出数据 API
# ============================================================================

@router.post(
    "/export",
    summary="导出历史数据",
    description="导出历史数据为 CSV 或 XLSX 格式"
)
async def export_history_data(
    query: ExportDataRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    locale: str = Depends(get_locale)
):
    """导出历史数据"""
    
    # 先查询数据（复用查询逻辑）
    query_request = HistoryDataQueryRequest(
        data_points=query.data_points,
        start_time=query.start_time,
        end_time=query.end_time,
        interval=query.interval
    )
    
    # 调用查询API获取数据
    query_response = await query_history_data(
        query_request, db, current_user, locale, ""
    )
    
    if not query_response.data or not query_response.data.series:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=t("history.error.no_data_to_export", locale)
        )
    
    # 生成导出文件
    if query.format == "csv":
        return _export_csv(query_response.data.series, query.start_time, query.end_time)
    else:
        # TODO: 实现 XLSX 导出
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=t("history.error.xlsx_not_implemented", locale)
        )


def _export_csv(series_list: List[HistoryDataSeries], start_time: datetime, end_time: datetime) -> StreamingResponse:
    """导出为 CSV 格式"""
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # 写入表头
    header = ["时间"]
    for series in series_list:
        column_name = f"{series.asset_display_name}/{series.tag_display_name}"
        if series.engineering_unit:
            column_name += f" ({series.engineering_unit})"
        header.append(column_name)
    writer.writerow(header)
    
    # 获取所有时间点（合并所有序列的时间点）
    all_times = set()
    for series in series_list:
        for value in series.data:
            all_times.add(value.time)
    all_times = sorted(list(all_times))
    
    # 为每个序列创建时间到值的映射
    series_dicts = []
    for series in series_list:
        value_dict = {v.time: v.value for v in series.data}
        series_dicts.append(value_dict)
    
    # 写入数据行
    for time_point in all_times:
        row = [time_point.strftime("%Y-%m-%d %H:%M:%S")]
        for value_dict in series_dicts:
            value = value_dict.get(time_point)
            row.append(str(value) if value is not None else "")
        writer.writerow(row)
    
    # 生成文件名
    filename = f"history_data_{start_time.strftime('%Y%m%d_%H%M%S')}_{end_time.strftime('%Y%m%d_%H%M%S')}.csv"
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

