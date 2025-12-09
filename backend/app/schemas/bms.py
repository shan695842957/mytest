"""
BMS（电池管理系统）相关的 Pydantic Schemas
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator
import json


# ============================================================================
# BMS Architecture Schemas
# ============================================================================

class BMSArchitectureBase(BaseModel):
    """BMS架构基础模型"""
    name: str = Field(..., description="架构名称：'level2' | 'level3'")
    display_name_zh: str = Field(..., description="中文显示名称")
    display_name_en: str = Field(..., description="英文显示名称")
    description_zh: str = Field(default="", description="中文描述")
    description_en: str = Field(default="", description="英文描述")


class BMSArchitectureResponse(BMSArchitectureBase):
    """BMS架构响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# BMS Page Config Schemas
# ============================================================================

class BMSPageConfigBase(BaseModel):
    """BMS页面配置基础模型"""
    architecture_id: int = Field(..., description="架构ID")
    page_type: str = Field(..., description="页面类型：'SYS' | 'BCU' | 'BAU' | 'BMU'")
    display_name_zh: str = Field(..., description="中文显示名称")
    display_name_en: str = Field(..., description="英文显示名称")
    description_zh: str = Field(default="", description="中文描述")
    description_en: str = Field(default="", description="英文描述")


class BMSPageConfigCreate(BMSPageConfigBase):
    """创建BMS页面配置请求模型"""
    pass


class BMSPageConfigUpdate(BaseModel):
    """更新BMS页面配置请求模型"""
    display_name_zh: Optional[str] = None
    display_name_en: Optional[str] = None
    description_zh: Optional[str] = None
    description_en: Optional[str] = None
    
    model_config = ConfigDict(extra="forbid")


class BMSPageConfigResponse(BMSPageConfigBase):
    """BMS页面配置响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# BMS Instance Schemas
# ============================================================================

class BMSInstanceBase(BaseModel):
    """BMS实例基础模型"""
    asset_id: int = Field(..., description="资产ID")
    architecture_id: int = Field(..., description="架构ID")
    instance_name: str = Field(..., description="实例名称（如 '1号电池簇', '1号电池堆'）")
    display_name_zh: str = Field(..., description="中文显示名")
    display_name_en: str = Field(..., description="英文显示名")
    enabled: bool = Field(default=True, description="是否启用")
    metadata_json: Dict[str, Any] = Field(default_factory=dict, description="自定义元数据JSON")
    
    @field_validator("metadata_json", mode="before")
    @classmethod
    def parse_metadata_json(cls, v):
        """解析 metadata_json（可能是字符串或字典）"""
        if isinstance(v, str):
            try:
                return json.loads(v) if v else {}
            except json.JSONDecodeError:
                return {}
        return v or {}


class BMSInstanceCreate(BMSInstanceBase):
    """创建BMS实例请求模型"""
    pass


class BMSInstanceUpdate(BaseModel):
    """更新BMS实例请求模型"""
    instance_name: Optional[str] = None
    display_name_zh: Optional[str] = None
    display_name_en: Optional[str] = None
    enabled: Optional[bool] = None
    metadata_json: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(extra="forbid")


class BMSInstanceResponse(BMSInstanceBase):
    """BMS实例响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime
    asset_name: Optional[str] = Field(None, description="资产名称")
    asset_display_name: Optional[str] = Field(None, description="资产显示名")
    architecture_name: Optional[str] = Field(None, description="架构名称")
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# BMS Hierarchy Config Schemas
# ============================================================================

class BMSHierarchyConfigBase(BaseModel):
    """BMS层级配置基础模型"""
    cluster_count: int = Field(..., ge=1, description="簇数量（三级架构为堆下簇数，二级架构通常为 1）")
    pack_count_per_cluster: int = Field(..., ge=1, description="每个簇下的包数量")
    series_count: int = Field(..., ge=1, description="包的串联数（如 15）")
    parallel_count: int = Field(..., ge=1, description="包的并联数（如 2）")
    temperature_point_count: int = Field(default=0, ge=0, description="每个包的温度测点数量（统一配置，若没有则填 0）")
    description_zh: str = Field(default="", description="中文描述")
    description_en: str = Field(default="", description="英文描述")
    metadata_json: Dict[str, Any] = Field(default_factory=dict, description="自定义元数据JSON")
    
    @field_validator("metadata_json", mode="before")
    @classmethod
    def parse_metadata_json(cls, v):
        """解析 metadata_json（可能是字符串或字典）"""
        if isinstance(v, str):
            try:
                return json.loads(v) if v else {}
            except json.JSONDecodeError:
                return {}
        return v or {}


class BMSHierarchyConfigCreate(BMSHierarchyConfigBase):
    """创建BMS层级配置请求模型"""
    pass


class BMSHierarchyConfigUpdate(BaseModel):
    """更新BMS层级配置请求模型"""
    cluster_count: Optional[int] = Field(None, ge=1)
    pack_count_per_cluster: Optional[int] = Field(None, ge=1)
    series_count: Optional[int] = Field(None, ge=1)
    parallel_count: Optional[int] = Field(None, ge=1)
    temperature_point_count: Optional[int] = Field(None, ge=0)
    description_zh: Optional[str] = None
    description_en: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(extra="forbid")


class BMSHierarchyConfigResponse(BMSHierarchyConfigBase):
    """BMS层级配置响应模型"""
    id: int
    bms_instance_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# BMS Field Config Schemas
# ============================================================================

class BMSFieldConfigBase(BaseModel):
    """BMS字段配置基础模型"""
    page_type: str = Field(..., description="页面类型：'SYS' | 'BCU' | 'BAU' | 'BMU'")
    field_key: str = Field(..., description="字段键（如 'fault', 'voltage', 'current'）")
    display_name_zh: str = Field(..., description="中文显示名")
    display_name_en: str = Field(..., description="英文显示名")
    field_type: str = Field(..., description="字段类型：'fixed' | 'dynamic'")
    unit_zh: str = Field(default="", description="中文单位")
    unit_en: str = Field(default="", description="英文单位")
    source_type: str = Field(..., description="字段来源类型：'asset_field' | 'custom' | 'di_point'")
    read_device_type_tag_id: Optional[int] = Field(None, description="读：资产字段ID")
    write_device_type_tag_id: Optional[int] = Field(None, description="写：资产字段ID")
    read_comm_instance_id: Optional[int] = Field(None, description="读：通信实例ID")
    read_point_id: Optional[int] = Field(None, description="读：点表点ID")
    write_comm_instance_id: Optional[int] = Field(None, description="写：通信实例ID")
    write_point_id: Optional[int] = Field(None, description="写：点表点ID")
    sort_order: int = Field(default=0, description="排序索引")
    description_zh: str = Field(default="", description="中文描述")
    description_en: str = Field(default="", description="英文描述")


class BMSFieldConfigCreate(BMSFieldConfigBase):
    """创建BMS字段配置请求模型"""
    pass


class BMSFieldConfigUpdate(BaseModel):
    """更新BMS字段配置请求模型"""
    display_name_zh: Optional[str] = None
    display_name_en: Optional[str] = None
    unit_zh: Optional[str] = None
    unit_en: Optional[str] = None
    source_type: Optional[str] = None
    read_device_type_tag_id: Optional[int] = None
    write_device_type_tag_id: Optional[int] = None
    read_comm_instance_id: Optional[int] = None
    read_point_id: Optional[int] = None
    write_comm_instance_id: Optional[int] = None
    write_point_id: Optional[int] = None
    sort_order: Optional[int] = None
    description_zh: Optional[str] = None
    description_en: Optional[str] = None
    
    model_config = ConfigDict(extra="forbid")


class BMSFieldConfigResponse(BMSFieldConfigBase):
    """BMS字段配置响应模型"""
    id: int
    bms_instance_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# BMS Teleindication Config Schemas
# ============================================================================

class BMSTeleindicationConfigBase(BaseModel):
    """BMS遥信量配置基础模型"""
    page_type: str = Field(..., description="页面类型：'BCU' | 'BAU'")
    teleindication_key: str = Field(..., description="遥信量键（如 'total_overvoltage'）")
    display_name_zh: str = Field(..., description="中文显示名")
    display_name_en: str = Field(..., description="英文显示名")
    teleindication_type: str = Field(..., description="遥信类型：'boolean' | 'enum' | 'bitfield'")
    source_type: str = Field(..., description="字段来源类型：'asset_field' | 'di_point'")
    device_type_tag_id: Optional[int] = Field(None, description="资产字段ID")
    comm_instance_id: Optional[int] = Field(None, description="通信实例ID")
    point_id: Optional[int] = Field(None, description="点表点ID")
    sort_order: int = Field(default=0, description="排序索引")
    description_zh: str = Field(default="", description="中文描述")
    description_en: str = Field(default="", description="英文描述")


class BMSTeleindicationConfigCreate(BMSTeleindicationConfigBase):
    """创建BMS遥信量配置请求模型"""
    pass


class BMSTeleindicationConfigUpdate(BaseModel):
    """更新BMS遥信量配置请求模型"""
    display_name_zh: Optional[str] = None
    display_name_en: Optional[str] = None
    source_type: Optional[str] = None
    device_type_tag_id: Optional[int] = None
    comm_instance_id: Optional[int] = None
    point_id: Optional[int] = None
    sort_order: Optional[int] = None
    description_zh: Optional[str] = None
    description_en: Optional[str] = None
    
    model_config = ConfigDict(extra="forbid")


class BMSTeleindicationConfigResponse(BMSTeleindicationConfigBase):
    """BMS遥信量配置响应模型"""
    id: int
    bms_instance_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# BMS Topology Config Schemas
# ============================================================================

class BMSTopologyConfigBase(BaseModel):
    """BMS拓扑配置基础模型"""
    topology_type: str = Field(..., description="拓扑类型：'pack'（二级架构）| 'cluster'（三级架构）")
    display_name_zh: str = Field(..., description="中文显示名")
    display_name_en: str = Field(..., description="英文显示名")
    description_zh: str = Field(default="", description="中文描述")
    description_en: str = Field(default="", description="英文描述")


class BMSTopologyConfigCreate(BMSTopologyConfigBase):
    """创建BMS拓扑配置请求模型"""
    pass


class BMSTopologyConfigUpdate(BaseModel):
    """更新BMS拓扑配置请求模型"""
    display_name_zh: Optional[str] = None
    display_name_en: Optional[str] = None
    description_zh: Optional[str] = None
    description_en: Optional[str] = None
    
    model_config = ConfigDict(extra="forbid")


class BMSTopologyConfigResponse(BMSTopologyConfigBase):
    """BMS拓扑配置响应模型"""
    id: int
    bms_instance_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# BMS Topology Field Config Schemas
# ============================================================================

class BMSTopologyFieldConfigBase(BaseModel):
    """BMS拓扑字段配置基础模型"""
    field_key: str = Field(..., description="字段键（独立定义）")
    display_name_zh: str = Field(..., description="中文显示名")
    display_name_en: str = Field(..., description="英文显示名")
    display_position: str = Field(default="card", description="显示位置：'header' | 'card' | 'footer'")
    source_type: str = Field(..., description="字段来源类型：'asset_field' | 'di_point'")
    read_device_type_tag_id: Optional[int] = Field(None, description="读：资产字段ID")
    write_device_type_tag_id: Optional[int] = Field(None, description="写：资产字段ID")
    read_comm_instance_id: Optional[int] = Field(None, description="读：通信实例ID")
    read_point_id: Optional[int] = Field(None, description="读：点表点ID")
    write_comm_instance_id: Optional[int] = Field(None, description="写：通信实例ID")
    write_point_id: Optional[int] = Field(None, description="写：点表点ID")
    sort_order: int = Field(default=0, description="排序索引")


class BMSTopologyFieldConfigCreate(BMSTopologyFieldConfigBase):
    """创建BMS拓扑字段配置请求模型"""
    pass


class BMSTopologyFieldConfigUpdate(BaseModel):
    """更新BMS拓扑字段配置请求模型"""
    display_name_zh: Optional[str] = None
    display_name_en: Optional[str] = None
    display_position: Optional[str] = None
    source_type: Optional[str] = None
    read_device_type_tag_id: Optional[int] = None
    write_device_type_tag_id: Optional[int] = None
    read_comm_instance_id: Optional[int] = None
    read_point_id: Optional[int] = None
    write_comm_instance_id: Optional[int] = None
    write_point_id: Optional[int] = None
    sort_order: Optional[int] = None
    
    model_config = ConfigDict(extra="forbid")


class BMSTopologyFieldConfigResponse(BMSTopologyFieldConfigBase):
    """BMS拓扑字段配置响应模型"""
    id: int
    topology_config_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# BMS BMU Config Schemas
# ============================================================================

class BMSBMUConfigBase(BaseModel):
    """BMS BMU配置基础模型"""
    voltage_upper_limit: Optional[float] = Field(None, description="电压上限（用于判断过压，超过此值为 alarm）")
    voltage_lower_limit: Optional[float] = Field(None, description="电压下限（用于判断欠压，低于此值为 alarm）")
    voltage_warning_upper_limit: Optional[float] = Field(None, description="电压警告上限（超过此值为 warning）")
    voltage_warning_lower_limit: Optional[float] = Field(None, description="电压警告下限（低于此值为 warning）")
    temperature_upper_limit: Optional[float] = Field(None, description="温度上限（用于判断过温，超过此值为 alarm）")
    temperature_lower_limit: Optional[float] = Field(None, description="温度下限（用于判断欠温，低于此值为 alarm）")
    temperature_warning_upper_limit: Optional[float] = Field(None, description="温度警告上限（超过此值为 warning）")
    temperature_warning_lower_limit: Optional[float] = Field(None, description="温度警告下限（低于此值为 warning）")
    description_zh: str = Field(default="", description="中文描述")
    description_en: str = Field(default="", description="英文描述")


class BMSBMUConfigCreate(BMSBMUConfigBase):
    """创建BMS BMU配置请求模型"""
    pass


class BMSBMUConfigUpdate(BaseModel):
    """更新BMS BMU配置请求模型"""
    voltage_upper_limit: Optional[float] = None
    voltage_lower_limit: Optional[float] = None
    voltage_warning_upper_limit: Optional[float] = None
    voltage_warning_lower_limit: Optional[float] = None
    temperature_upper_limit: Optional[float] = None
    temperature_lower_limit: Optional[float] = None
    temperature_warning_upper_limit: Optional[float] = None
    temperature_warning_lower_limit: Optional[float] = None
    description_zh: Optional[str] = None
    description_en: Optional[str] = None
    
    model_config = ConfigDict(extra="forbid")


class BMSBMUConfigResponse(BMSBMUConfigBase):
    """BMS BMU配置响应模型"""
    id: int
    bms_instance_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# BMS BMU Cell Field Config Schemas
# ============================================================================

class BMSBMUCellFieldConfigBase(BaseModel):
    """BMS BMU单体字段配置基础模型"""
    field_key: str = Field(..., description="字段键（如 'voltage', 'soc', 'soh'，注意：不包含 'temperature'）")
    display_name_zh: str = Field(..., description="中文显示名")
    display_name_en: str = Field(..., description="英文显示名")
    data_type: str = Field(..., description="数据类型：'number'")
    unit_zh: str = Field(default="", description="中文单位")
    unit_en: str = Field(default="", description="英文单位")
    source_type: str = Field(..., description="字段来源类型：'asset_field' | 'di_point'")
    device_type_tag_id: Optional[int] = Field(None, description="资产字段ID")
    comm_instance_id: Optional[int] = Field(None, description="通信实例ID")
    point_id: Optional[int] = Field(None, description="点表点ID")
    sort_order: int = Field(default=0, description="排序索引")


class BMSBMUCellFieldConfigCreate(BMSBMUCellFieldConfigBase):
    """创建BMS BMU单体字段配置请求模型"""
    pass


class BMSBMUCellFieldConfigUpdate(BaseModel):
    """更新BMS BMU单体字段配置请求模型"""
    display_name_zh: Optional[str] = None
    display_name_en: Optional[str] = None
    unit_zh: Optional[str] = None
    unit_en: Optional[str] = None
    source_type: Optional[str] = None
    device_type_tag_id: Optional[int] = None
    comm_instance_id: Optional[int] = None
    point_id: Optional[int] = None
    sort_order: Optional[int] = None
    
    model_config = ConfigDict(extra="forbid")


class BMSBMUCellFieldConfigResponse(BMSBMUCellFieldConfigBase):
    """BMS BMU单体字段配置响应模型"""
    id: int
    bmu_config_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# BMS BMU Temperature Point Schemas
# ============================================================================

class BMSBMUTemperaturePointBase(BaseModel):
    """BMS BMU温度测点配置基础模型"""
    point_number: int = Field(..., ge=1, description="测点编号（如 1, 2, 3...）")
    display_name_zh: str = Field(..., description="中文显示名（如 '测点1', '测点2'）")
    display_name_en: str = Field(..., description="英文显示名（如 'Point 1', 'Point 2'）")
    unit_zh: str = Field(default="℃", description="中文单位")
    unit_en: str = Field(default="°C", description="英文单位")
    source_type: str = Field(..., description="字段来源类型：'asset_field' | 'di_point'")
    device_type_tag_id: Optional[int] = Field(None, description="资产字段ID")
    comm_instance_id: Optional[int] = Field(None, description="通信实例ID")
    point_id: Optional[int] = Field(None, description="点表点ID")
    sort_order: int = Field(default=0, description="排序索引")
    description_zh: str = Field(default="", description="中文描述")
    description_en: str = Field(default="", description="英文描述")


class BMSBMUTemperaturePointCreate(BMSBMUTemperaturePointBase):
    """创建BMS BMU温度测点配置请求模型"""
    pass


class BMSBMUTemperaturePointUpdate(BaseModel):
    """更新BMS BMU温度测点配置请求模型"""
    display_name_zh: Optional[str] = None
    display_name_en: Optional[str] = None
    unit_zh: Optional[str] = None
    unit_en: Optional[str] = None
    source_type: Optional[str] = None
    device_type_tag_id: Optional[int] = None
    comm_instance_id: Optional[int] = None
    point_id: Optional[int] = None
    sort_order: Optional[int] = None
    description_zh: Optional[str] = None
    description_en: Optional[str] = None
    
    model_config = ConfigDict(extra="forbid")


class BMSBMUTemperaturePointResponse(BMSBMUTemperaturePointBase):
    """BMS BMU温度测点配置响应模型"""
    id: int
    bmu_config_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# BMS BMU Other Data Config Schemas
# ============================================================================

class BMSBMUOtherDataConfigBase(BaseModel):
    """BMS BMU其它数据配置基础模型"""
    field_key: str = Field(..., description="字段键（如 'balancer_status', 'balancer_current'）")
    display_name_zh: str = Field(..., description="中文显示名")
    display_name_en: str = Field(..., description="英文显示名")
    data_type: str = Field(..., description="数据类型：'number' | 'boolean' | 'enum'")
    unit_zh: str = Field(default="", description="中文单位")
    unit_en: str = Field(default="", description="英文单位")
    source_type: str = Field(..., description="字段来源类型：'asset_field' | 'di_point'")
    device_type_tag_id: Optional[int] = Field(None, description="资产字段ID")
    comm_instance_id: Optional[int] = Field(None, description="通信实例ID")
    point_id: Optional[int] = Field(None, description="点表点ID")
    sort_order: int = Field(default=0, description="排序索引")
    description_zh: str = Field(default="", description="中文描述")
    description_en: str = Field(default="", description="英文描述")


class BMSBMUOtherDataConfigCreate(BMSBMUOtherDataConfigBase):
    """创建BMS BMU其它数据配置请求模型"""
    pass


class BMSBMUOtherDataConfigUpdate(BaseModel):
    """更新BMS BMU其它数据配置请求模型"""
    display_name_zh: Optional[str] = None
    display_name_en: Optional[str] = None
    unit_zh: Optional[str] = None
    unit_en: Optional[str] = None
    source_type: Optional[str] = None
    device_type_tag_id: Optional[int] = None
    comm_instance_id: Optional[int] = None
    point_id: Optional[int] = None
    sort_order: Optional[int] = None
    description_zh: Optional[str] = None
    description_en: Optional[str] = None
    
    model_config = ConfigDict(extra="forbid")


class BMSBMUOtherDataConfigResponse(BMSBMUOtherDataConfigBase):
    """BMS BMU其它数据配置响应模型"""
    id: int
    bmu_config_id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# BMS 实时数据查询 Schemas（用于前端展示）
# ============================================================================

class BMSFieldValue(BaseModel):
    """BMS字段值"""
    field_key: str
    display_name_zh: str
    display_name_en: str
    value: Optional[Any] = None  # 值可能是数字、布尔、字符串等
    unit_zh: str = ""
    unit_en: str = ""


class BMSTeleindicationValue(BaseModel):
    """BMS遥信量值"""
    teleindication_key: str
    display_name_zh: str
    display_name_en: str
    teleindication_type: str  # 'boolean' | 'enum' | 'bitfield'
    value: Optional[Any] = None
    fault_level: Optional[int] = None  # 故障等级（0~4）
    enum_values: Optional[List[Dict[str, Any]]] = None  # 枚举值（当 teleindication_type='enum' 时）
    bitfield_data: Optional[Dict[str, Any]] = None  # 位域数据（当 teleindication_type='bitfield' 时）


class BMSSysPageData(BaseModel):
    """BMS SYS页面数据响应"""
    fixed_fields: Dict[str, BMSFieldValue]  # 固定字段（fault, voltage, current, power, breaker_status）
    dynamic_fields: List[BMSFieldValue]  # 动态字段（SOC、SOH等）
    topology_data: Optional[Dict[str, Any]] = None  # 拓扑图数据（包列表或簇列表）


class BMSBCUPageData(BaseModel):
    """BMS BCU页面数据响应"""
    telemetry_data: List[BMSFieldValue]  # 遥测数据
    telecontrol_data: List[BMSTeleindicationValue]  # 遥信数据


class BMSBAUPageData(BaseModel):
    """BMS BAU页面数据响应（三级架构）"""
    telemetry_data: List[BMSFieldValue]  # 遥测数据
    telecontrol_data: List[BMSTeleindicationValue]  # 遥信数据


class BMSBMUPageData(BaseModel):
    """BMS BMU页面数据响应"""
    pack_id: str
    pack_number: int
    cell_configuration: str  # 如 "15S 2P (30 cells total)"
    cell_fields: List[BMSFieldValue]  # 单体字段配置
    cells: List[Dict[str, Any]]  # 单体数据列表（每个单体包含字段值）
    temperature_points: List[Dict[str, Any]]  # 温度测点数据
    other_data: List[BMSFieldValue]  # 其它数据


# ============================================================================
# BMS 批量导入导出 Schemas
# ============================================================================

class BMSFieldConfigImport(BaseModel):
    """BMS字段配置导入模型（用于批量导入）"""
    page_type: str
    field_key: str
    display_name_zh: str
    display_name_en: str
    field_type: str
    unit_zh: str = ""
    unit_en: str = ""
    source_type: str
    read_device_type_tag_id: Optional[int] = None
    write_device_type_tag_id: Optional[int] = None
    read_comm_instance_id: Optional[int] = None
    read_point_id: Optional[int] = None
    write_comm_instance_id: Optional[int] = None
    write_point_id: Optional[int] = None
    sort_order: int = 0
    description_zh: str = ""
    description_en: str = ""


class BMSBatchImportRequest(BaseModel):
    """BMS批量导入请求模型"""
    import_mode: str = Field(..., description="导入模式：'append'（追加）| 'update'（更新）")
    field_configs: List[BMSFieldConfigImport] = Field(..., description="字段配置列表")
    teleindication_configs: Optional[List[Dict[str, Any]]] = Field(None, description="遥信量配置列表")
    cell_field_configs: Optional[List[Dict[str, Any]]] = Field(None, description="单体字段配置列表")
    temperature_points: Optional[List[Dict[str, Any]]] = Field(None, description="温度测点配置列表")


class BMSBatchImportResponse(BaseModel):
    """BMS批量导入响应模型"""
    success_count: int
    failed_count: int
    errors: List[Dict[str, Any]] = Field(default_factory=list, description="错误列表")
