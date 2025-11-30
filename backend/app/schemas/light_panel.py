"""
光字牌相关的 Pydantic Schemas
"""

from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field


class AssetTreeNode(BaseModel):
    """资产树节点"""
    id: int = Field(..., description="资产ID")
    name: str = Field(..., description="内部名")
    display_name: str = Field(..., description="显示名")
    device_type_id: int = Field(..., description="设备类型ID")
    device_type_name: Optional[str] = Field(None, description="设备类型名称")
    device_type_display_name: Optional[str] = Field(None, description="设备类型显示名")
    location: str = Field(default="", description="位置")
    enabled: bool = Field(default=True, description="是否启用")
    children: List["AssetTreeNode"] = Field(default_factory=list, description="子节点（预留，用于树形结构）")


class LightPanelTagValue(BaseModel):
    """光字牌字段值"""
    tag_name: str = Field(..., description="字段名（内部）")
    display_name: str = Field(..., description="显示名")
    data_type: str = Field(..., description="数据类型：BOOL/INT/FLOAT/ENUM/BITFIELD16")
    semantic_type: str = Field(..., description="语义类型：MEASURE/STATUS/ACCUM/PARAM/SETPOINT/COMMAND/PARAM_SET")
    group_name: str = Field(default="", description="分组名（用于UI分组显示）")
    engineering_unit: str = Field(default="", description="工程单位")
    severity: int = Field(default=0, description="严重性：0~5")
    
    # 当前值（根据data_type不同，可能是不同类型）
    value: Union[bool, int, float, str, None] = Field(None, description="当前值")
    
    # ENUM类型需要枚举映射
    enum_json: Dict[str, str] = Field(default_factory=dict, description="枚举映射（code -> label）")
    
    # BITFIELD16类型需要bit数组
    bits: Optional[List[int]] = Field(None, description="BITFIELD16的bit数组（16个bit）")
    raw_value: Optional[int] = Field(None, description="BITFIELD16的原始值")
    
    # 映射信息
    instance_name: Optional[str] = Field(None, description="通信实例名称")
    point_name: Optional[str] = Field(None, description="点表点名")


class LightPanelGroup(BaseModel):
    """光字牌分组（卡片内的分组，如运行状态、工艺报警）"""
    group_name: str = Field(..., description="分组名")
    tags: List[LightPanelTagValue] = Field(default_factory=list, description="该分组下的字段列表")


class LightPanelPointCard(BaseModel):
    """光字牌点卡片（同一寄存器的所有子点在一个卡片中）"""
    point_name: str = Field(..., description="点表点名（如 StatusWord4）")
    point_display_name: str = Field(..., description="点表点显示名")
    instance_name: Optional[str] = Field(None, description="通信实例名称")
    instance_display_name: Optional[str] = Field(None, description="通信实例显示名")
    raw_value: Optional[int] = Field(None, description="原始寄存器值（如果有）")
    # 卡片内的分组（按group_name分组）
    groups: List[LightPanelGroup] = Field(default_factory=list, description="卡片内的分组列表")
    ungrouped_tags: List[LightPanelTagValue] = Field(default_factory=list, description="卡片内未分组的字段")


class LightPanelStatusResponse(BaseModel):
    """光字牌状态响应"""
    asset_id: int = Field(..., description="资产ID")
    asset_name: str = Field(..., description="资产内部名")
    asset_display_name: str = Field(..., description="资产显示名")
    device_type_name: Optional[str] = Field(None, description="设备类型名称")
    point_cards: List[LightPanelPointCard] = Field(default_factory=list, description="按点表点组织的卡片列表")


# 更新前向引用
AssetTreeNode.model_rebuild()

