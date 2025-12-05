"""
历史数据查询相关的 Pydantic Schemas
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict


# ============================================================================
# 设备树节点 Schema
# ============================================================================

class DataPointNode(BaseModel):
    """数据点节点（叶子节点）"""
    id: str = Field(..., description="数据点唯一标识（格式：asset_id:tag_name）")
    name: str = Field(..., description="数据点显示名称")
    semantic_type: Literal["MEASURE", "ACCUM", "PARAM"] = Field(..., description="语义类型")
    engineering_unit: str = Field(default="", description="工程单位")
    asset_id: int = Field(..., description="资产ID")
    asset_name: str = Field(..., description="资产名称")
    asset_display_name: str = Field(..., description="资产显示名")
    tag_name: str = Field(..., description="业务字段名")
    tag_display_name: str = Field(..., description="业务字段显示名")
    
    model_config = ConfigDict(from_attributes=True)


class DeviceNode(BaseModel):
    """设备节点"""
    id: str = Field(..., description="设备唯一标识（格式：asset_{asset_id}）")
    name: str = Field(..., description="设备显示名称")
    asset_id: int = Field(..., description="资产ID")
    children: List[DataPointNode] = Field(default_factory=list, description="数据点列表")
    
    model_config = ConfigDict(from_attributes=True)


class StationNode(BaseModel):
    """电站节点"""
    id: str = Field(..., description="电站唯一标识")
    name: str = Field(..., description="电站名称")
    children: List[DeviceNode] = Field(default_factory=list, description="设备列表")
    
    model_config = ConfigDict(from_attributes=True)


class DeviceTreeResponse(BaseModel):
    """设备树响应"""
    stations: List[StationNode] = Field(default_factory=list, description="电站列表")
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# 历史数据查询 Schema
# ============================================================================

class HistoryDataPoint(BaseModel):
    """历史数据点（单个查询项）"""
    asset_id: int = Field(..., description="资产ID")
    tag_name: str = Field(..., description="业务字段名")
    semantic_type: Literal["MEASURE", "ACCUM", "PARAM"] = Field(..., description="语义类型")
    
    model_config = ConfigDict(from_attributes=True)


class HistoryDataQueryRequest(BaseModel):
    """历史数据查询请求"""
    data_points: List[HistoryDataPoint] = Field(..., description="数据点列表")
    start_time: datetime = Field(..., description="开始时间")
    end_time: datetime = Field(..., description="结束时间")
    interval: Optional[str] = Field(default=None, description="聚合间隔（如：5m, 1h），None表示原始数据")
    
    model_config = ConfigDict(from_attributes=True)


class HistoryDataValue(BaseModel):
    """历史数据值（单个时间点的数据）"""
    time: datetime = Field(..., description="时间戳")
    value: Optional[float] = Field(None, description="数值（None表示无效数据）")
    quality: Optional[int] = Field(None, description="质量码")
    
    model_config = ConfigDict(from_attributes=True)


class HistoryDataSeries(BaseModel):
    """历史数据序列（一个数据点的时间序列）"""
    asset_id: int = Field(..., description="资产ID")
    asset_display_name: str = Field(..., description="资产显示名")
    tag_name: str = Field(..., description="业务字段名")
    tag_display_name: str = Field(..., description="业务字段显示名")
    semantic_type: Literal["MEASURE", "ACCUM", "PARAM"] = Field(..., description="语义类型")
    engineering_unit: str = Field(default="", description="工程单位")
    data: List[HistoryDataValue] = Field(default_factory=list, description="时间序列数据")
    
    model_config = ConfigDict(from_attributes=True)


class HistoryDataQueryResponse(BaseModel):
    """历史数据查询响应"""
    series: List[HistoryDataSeries] = Field(default_factory=list, description="数据序列列表")
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# 导出数据 Schema
# ============================================================================

class ExportDataRequest(BaseModel):
    """导出数据请求"""
    data_points: List[HistoryDataPoint] = Field(..., description="数据点列表")
    start_time: datetime = Field(..., description="开始时间")
    end_time: datetime = Field(..., description="结束时间")
    interval: Optional[str] = Field(default=None, description="聚合间隔")
    format: Literal["csv", "xlsx"] = Field(default="csv", description="导出格式")
    
    model_config = ConfigDict(from_attributes=True)

