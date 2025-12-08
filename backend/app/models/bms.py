"""
BMS（电池管理系统）模型
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, REAL
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class BMSArchitecture(Base):
    """
    BMS 架构类型表
    """
    __tablename__ = "bms_architectures"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True, comment="架构名称：'level2' | 'level3'")
    display_name_zh = Column(String(100), nullable=False, comment="中文显示名称")
    display_name_en = Column(String(100), nullable=False, comment="英文显示名称")
    description_zh = Column(Text, nullable=False, default="", comment="中文描述")
    description_en = Column(Text, nullable=False, default="", comment="英文描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    page_configs = relationship("BMSPageConfig", back_populates="architecture", cascade="all, delete-orphan")
    instances = relationship("BMSInstance", back_populates="architecture")
    
    def __repr__(self):
        return f"<BMSArchitecture(id={self.id}, name={self.name})>"


class BMSPageConfig(Base):
    """
    BMS 页面配置表（全局配置，所有实例共享）
    """
    __tablename__ = "bms_page_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    architecture_id = Column(Integer, ForeignKey("bms_architectures.id", ondelete="CASCADE"), nullable=False, index=True)
    page_type = Column(String(10), nullable=False, comment="页面类型：'SYS' | 'BCU' | 'BAU' | 'BMU'")
    display_name_zh = Column(String(100), nullable=False, comment="中文显示名称")
    display_name_en = Column(String(100), nullable=False, comment="英文显示名称")
    description_zh = Column(Text, nullable=False, default="", comment="中文描述")
    description_en = Column(Text, nullable=False, default="", comment="英文描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    architecture = relationship("BMSArchitecture", back_populates="page_configs")
    
    def __repr__(self):
        return f"<BMSPageConfig(id={self.id}, architecture_id={self.architecture_id}, page_type={self.page_type})>"


class BMSInstance(Base):
    """
    BMS 实例表
    说明：如果一个资产被关联到此表，就被系统识别为BMS
    """
    __tablename__ = "bms_instances"
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    architecture_id = Column(Integer, ForeignKey("bms_architectures.id", ondelete="RESTRICT"), nullable=False, index=True)
    instance_name = Column(String(100), nullable=False, comment="实例名称（如 '1号电池簇', '1号电池堆'）")
    display_name_zh = Column(String(200), nullable=False, comment="中文显示名")
    display_name_en = Column(String(200), nullable=False, comment="英文显示名")
    enabled = Column(Boolean, nullable=False, default=True, index=True, comment="是否启用")
    metadata_json = Column(Text, nullable=False, default="{}", comment="自定义元数据JSON")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    asset = relationship("Asset")
    architecture = relationship("BMSArchitecture", back_populates="instances")
    hierarchy_config = relationship("BMSHierarchyConfig", back_populates="bms_instance", uselist=False, cascade="all, delete-orphan")
    field_configs = relationship("BMSFieldConfig", back_populates="bms_instance", cascade="all, delete-orphan")
    teleindication_configs = relationship("BMSTeleindicationConfig", back_populates="bms_instance", cascade="all, delete-orphan")
    topology_configs = relationship("BMSTopologyConfig", back_populates="bms_instance", cascade="all, delete-orphan")
    bmu_config = relationship("BMSBMUConfig", back_populates="bms_instance", uselist=False, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<BMSInstance(id={self.id}, asset_id={self.asset_id}, instance_name={self.instance_name})>"


class BMSHierarchyConfig(Base):
    """
    BMS 层级配置表
    说明：每个 BMS 实例一条记录，统一配置簇数、每簇包数、串并数、温度测点数
    """
    __tablename__ = "bms_hierarchy_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    bms_instance_id = Column(Integer, ForeignKey("bms_instances.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    cluster_count = Column(Integer, nullable=False, default=1, comment="簇数量（三级架构为堆下簇数，二级架构通常为 1）")
    pack_count_per_cluster = Column(Integer, nullable=False, default=1, comment="每个簇下的包数量")
    series_count = Column(Integer, nullable=False, comment="包的串联数（如 15）")
    parallel_count = Column(Integer, nullable=False, comment="包的并联数（如 2）")
    temperature_point_count = Column(Integer, nullable=False, default=0, comment="每个包的温度测点数量（统一配置，若没有则填 0）")
    description_zh = Column(Text, nullable=False, default="", comment="中文描述")
    description_en = Column(Text, nullable=False, default="", comment="英文描述")
    metadata_json = Column(Text, nullable=False, default="{}", comment="自定义元数据JSON")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    bms_instance = relationship("BMSInstance", back_populates="hierarchy_config")
    
    def __repr__(self):
        return f"<BMSHierarchyConfig(id={self.id}, bms_instance_id={self.bms_instance_id})>"


class BMSFieldConfig(Base):
    """
    BMS 字段配置表
    说明：SYS/BCU/BAU 页面的字段配置（固定字段 + 可配置字段）
    """
    __tablename__ = "bms_field_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    bms_instance_id = Column(Integer, ForeignKey("bms_instances.id", ondelete="CASCADE"), nullable=False, index=True)
    page_type = Column(String(10), nullable=False, comment="页面类型：'SYS' | 'BCU' | 'BAU' | 'BMU'")
    field_key = Column(String(100), nullable=False, comment="字段键（如 'fault', 'voltage', 'current'）")
    display_name_zh = Column(String(200), nullable=False, comment="中文显示名")
    display_name_en = Column(String(200), nullable=False, comment="英文显示名")
    field_type = Column(String(20), nullable=False, comment="字段类型：'fixed' | 'dynamic'")
    data_type = Column(String(20), nullable=False, comment="数据类型：'boolean' | 'number' | 'enum'")
    unit_zh = Column(String(50), nullable=False, default="", comment="中文单位")
    unit_en = Column(String(50), nullable=False, default="", comment="英文单位")
    is_required = Column(Boolean, nullable=False, default=False, comment="是否必填（固定字段为1）")
    is_readable = Column(Boolean, nullable=False, default=True, comment="是否可读（1=可读，0=只写）")
    is_writable = Column(Boolean, nullable=False, default=False, comment="是否可写（1=可写，0=只读）")
    source_type = Column(String(20), nullable=False, comment="字段来源类型：'asset_field' | 'custom' | 'di_point'")
    read_device_type_tag_id = Column(Integer, ForeignKey("device_type_tags.id", ondelete="RESTRICT"), nullable=True, index=True)
    write_device_type_tag_id = Column(Integer, ForeignKey("device_type_tags.id", ondelete="RESTRICT"), nullable=True)
    read_comm_instance_id = Column(Integer, ForeignKey("comm_instances.id", ondelete="RESTRICT"), nullable=True, index=True)
    read_point_id = Column(Integer, ForeignKey("point_table_points.id", ondelete="RESTRICT"), nullable=True)
    write_comm_instance_id = Column(Integer, ForeignKey("comm_instances.id", ondelete="RESTRICT"), nullable=True)
    write_point_id = Column(Integer, ForeignKey("point_table_points.id", ondelete="RESTRICT"), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0, comment="排序索引")
    description_zh = Column(Text, nullable=False, default="", comment="中文描述")
    description_en = Column(Text, nullable=False, default="", comment="英文描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    bms_instance = relationship("BMSInstance", back_populates="field_configs")
    read_device_type_tag = relationship("DeviceTypeTag", foreign_keys=[read_device_type_tag_id])
    write_device_type_tag = relationship("DeviceTypeTag", foreign_keys=[write_device_type_tag_id])
    read_comm_instance = relationship("CommInstance", foreign_keys=[read_comm_instance_id])
    read_point = relationship("PointTablePoint", foreign_keys=[read_point_id])
    
    def __repr__(self):
        return f"<BMSFieldConfig(id={self.id}, bms_instance_id={self.bms_instance_id}, field_key={self.field_key})>"


class BMSTeleindicationConfig(Base):
    """
    BMS 遥信量配置表
    说明：BCU/BAU 页面的遥信量配置
    """
    __tablename__ = "bms_teleindication_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    bms_instance_id = Column(Integer, ForeignKey("bms_instances.id", ondelete="CASCADE"), nullable=False, index=True)
    page_type = Column(String(10), nullable=False, comment="页面类型：'BCU' | 'BAU'")
    teleindication_key = Column(String(100), nullable=False, comment="遥信量键（如 'total_overvoltage'）")
    display_name_zh = Column(String(200), nullable=False, comment="中文显示名")
    display_name_en = Column(String(200), nullable=False, comment="英文显示名")
    teleindication_type = Column(String(20), nullable=False, comment="遥信类型：'boolean' | 'enum' | 'bitfield'")
    source_type = Column(String(20), nullable=False, comment="字段来源类型：'asset_field' | 'di_point'")
    device_type_tag_id = Column(Integer, ForeignKey("device_type_tags.id", ondelete="RESTRICT"), nullable=True, index=True)
    comm_instance_id = Column(Integer, ForeignKey("comm_instances.id", ondelete="RESTRICT"), nullable=True, index=True)
    point_id = Column(Integer, ForeignKey("point_table_points.id", ondelete="RESTRICT"), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0, comment="排序索引")
    description_zh = Column(Text, nullable=False, default="", comment="中文描述")
    description_en = Column(Text, nullable=False, default="", comment="英文描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    bms_instance = relationship("BMSInstance", back_populates="teleindication_configs")
    device_type_tag = relationship("DeviceTypeTag")
    comm_instance = relationship("CommInstance")
    point = relationship("PointTablePoint")
    
    def __repr__(self):
        return f"<BMSTeleindicationConfig(id={self.id}, bms_instance_id={self.bms_instance_id}, teleindication_key={self.teleindication_key})>"


class BMSTopologyConfig(Base):
    """
    BMS 拓扑配置表
    说明：SYS 页面的拓扑图配置
    """
    __tablename__ = "bms_topology_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    bms_instance_id = Column(Integer, ForeignKey("bms_instances.id", ondelete="CASCADE"), nullable=False, index=True)
    topology_type = Column(String(20), nullable=False, comment="拓扑类型：'pack'（二级架构）| 'cluster'（三级架构）")
    display_name_zh = Column(String(200), nullable=False, comment="中文显示名")
    display_name_en = Column(String(200), nullable=False, comment="英文显示名")
    description_zh = Column(Text, nullable=False, default="", comment="中文描述")
    description_en = Column(Text, nullable=False, default="", comment="英文描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    bms_instance = relationship("BMSInstance", back_populates="topology_configs")
    field_configs = relationship("BMSTopologyFieldConfig", back_populates="topology_config", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<BMSTopologyConfig(id={self.id}, bms_instance_id={self.bms_instance_id}, topology_type={self.topology_type})>"


class BMSTopologyFieldConfig(Base):
    """
    BMS 拓扑字段配置表
    说明：拓扑图中每个节点显示的字段
    """
    __tablename__ = "bms_topology_field_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    topology_config_id = Column(Integer, ForeignKey("bms_topology_configs.id", ondelete="CASCADE"), nullable=False, index=True)
    field_key = Column(String(100), nullable=False, comment="字段键（独立定义）")
    display_name_zh = Column(String(200), nullable=False, comment="中文显示名")
    display_name_en = Column(String(200), nullable=False, comment="英文显示名")
    display_position = Column(String(20), nullable=False, default="card", comment="显示位置：'header' | 'card' | 'footer'")
    source_type = Column(String(20), nullable=False, comment="字段来源类型：'asset_field' | 'di_point'")
    read_device_type_tag_id = Column(Integer, ForeignKey("device_type_tags.id", ondelete="RESTRICT"), nullable=True, index=True)
    write_device_type_tag_id = Column(Integer, ForeignKey("device_type_tags.id", ondelete="RESTRICT"), nullable=True)
    read_comm_instance_id = Column(Integer, ForeignKey("comm_instances.id", ondelete="RESTRICT"), nullable=True, index=True)
    read_point_id = Column(Integer, ForeignKey("point_table_points.id", ondelete="RESTRICT"), nullable=True)
    write_comm_instance_id = Column(Integer, ForeignKey("comm_instances.id", ondelete="RESTRICT"), nullable=True)
    write_point_id = Column(Integer, ForeignKey("point_table_points.id", ondelete="RESTRICT"), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0, comment="排序索引")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    topology_config = relationship("BMSTopologyConfig", back_populates="field_configs")
    read_device_type_tag = relationship("DeviceTypeTag", foreign_keys=[read_device_type_tag_id])
    write_device_type_tag = relationship("DeviceTypeTag", foreign_keys=[write_device_type_tag_id])
    read_comm_instance = relationship("CommInstance", foreign_keys=[read_comm_instance_id])
    read_point = relationship("PointTablePoint", foreign_keys=[read_point_id])
    
    def __repr__(self):
        return f"<BMSTopologyFieldConfig(id={self.id}, topology_config_id={self.topology_config_id}, field_key={self.field_key})>"


class BMSBMUConfig(Base):
    """
    BMS BMU 配置表
    说明：BMU 页面的配置（包含阈值配置）
    """
    __tablename__ = "bms_bmu_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    bms_instance_id = Column(Integer, ForeignKey("bms_instances.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    voltage_upper_limit = Column(REAL, nullable=True, comment="电压上限（用于判断过压，超过此值为 alarm）")
    voltage_lower_limit = Column(REAL, nullable=True, comment="电压下限（用于判断欠压，低于此值为 alarm）")
    voltage_warning_upper_limit = Column(REAL, nullable=True, comment="电压警告上限（超过此值为 warning）")
    voltage_warning_lower_limit = Column(REAL, nullable=True, comment="电压警告下限（低于此值为 warning）")
    temperature_upper_limit = Column(REAL, nullable=True, comment="温度上限（用于判断过温，超过此值为 alarm）")
    temperature_lower_limit = Column(REAL, nullable=True, comment="温度下限（用于判断欠温，低于此值为 alarm）")
    temperature_warning_upper_limit = Column(REAL, nullable=True, comment="温度警告上限（超过此值为 warning）")
    temperature_warning_lower_limit = Column(REAL, nullable=True, comment="温度警告下限（低于此值为 warning）")
    description_zh = Column(Text, nullable=False, default="", comment="中文描述")
    description_en = Column(Text, nullable=False, default="", comment="英文描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    bms_instance = relationship("BMSInstance", back_populates="bmu_config")
    cell_field_configs = relationship("BMSBMUCellFieldConfig", back_populates="bmu_config", cascade="all, delete-orphan")
    temperature_points = relationship("BMSBMUTemperaturePoint", back_populates="bmu_config", cascade="all, delete-orphan")
    other_data_configs = relationship("BMSBMUOtherDataConfig", back_populates="bmu_config", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<BMSBMUConfig(id={self.id}, bms_instance_id={self.bms_instance_id})>"


class BMSBMUCellFieldConfig(Base):
    """
    BMS BMU 单体字段配置表
    说明：BMU 页面显示的单体字段配置（不包含温度，温度测点单独配置）
    """
    __tablename__ = "bms_bmu_cell_field_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    bmu_config_id = Column(Integer, ForeignKey("bms_bmu_configs.id", ondelete="CASCADE"), nullable=False, index=True)
    field_key = Column(String(100), nullable=False, comment="字段键（如 'voltage', 'soc', 'soh'，注意：不包含 'temperature'）")
    display_name_zh = Column(String(200), nullable=False, comment="中文显示名")
    display_name_en = Column(String(200), nullable=False, comment="英文显示名")
    data_type = Column(String(20), nullable=False, comment="数据类型：'number'")
    unit_zh = Column(String(50), nullable=False, default="", comment="中文单位")
    unit_en = Column(String(50), nullable=False, default="", comment="英文单位")
    source_type = Column(String(20), nullable=False, comment="字段来源类型：'asset_field' | 'di_point'")
    device_type_tag_id = Column(Integer, ForeignKey("device_type_tags.id", ondelete="RESTRICT"), nullable=True, index=True)
    comm_instance_id = Column(Integer, ForeignKey("comm_instances.id", ondelete="RESTRICT"), nullable=True, index=True)
    point_id = Column(Integer, ForeignKey("point_table_points.id", ondelete="RESTRICT"), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0, comment="排序索引")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    bmu_config = relationship("BMSBMUConfig", back_populates="cell_field_configs")
    device_type_tag = relationship("DeviceTypeTag")
    comm_instance = relationship("CommInstance")
    point = relationship("PointTablePoint")
    
    def __repr__(self):
        return f"<BMSBMUCellFieldConfig(id={self.id}, bmu_config_id={self.bmu_config_id}, field_key={self.field_key})>"


class BMSBMUTemperaturePoint(Base):
    """
    BMS BMU 温度测点配置表
    说明：BMU 页面的温度测点配置（温度测点不是每个单体都有，需要单独配置）
    """
    __tablename__ = "bms_bmu_temperature_points"
    
    id = Column(Integer, primary_key=True, index=True)
    bmu_config_id = Column(Integer, ForeignKey("bms_bmu_configs.id", ondelete="CASCADE"), nullable=False, index=True)
    point_number = Column(Integer, nullable=False, comment="测点编号（如 1, 2, 3...）")
    display_name_zh = Column(String(200), nullable=False, comment="中文显示名（如 '测点1', '测点2'）")
    display_name_en = Column(String(200), nullable=False, comment="英文显示名（如 'Point 1', 'Point 2'）")
    unit_zh = Column(String(50), nullable=False, default="℃", comment="中文单位")
    unit_en = Column(String(50), nullable=False, default="°C", comment="英文单位")
    source_type = Column(String(20), nullable=False, comment="字段来源类型：'asset_field' | 'di_point'")
    device_type_tag_id = Column(Integer, ForeignKey("device_type_tags.id", ondelete="RESTRICT"), nullable=True, index=True)
    comm_instance_id = Column(Integer, ForeignKey("comm_instances.id", ondelete="RESTRICT"), nullable=True, index=True)
    point_id = Column(Integer, ForeignKey("point_table_points.id", ondelete="RESTRICT"), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0, comment="排序索引")
    description_zh = Column(Text, nullable=False, default="", comment="中文描述")
    description_en = Column(Text, nullable=False, default="", comment="英文描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    bmu_config = relationship("BMSBMUConfig", back_populates="temperature_points")
    device_type_tag = relationship("DeviceTypeTag")
    comm_instance = relationship("CommInstance")
    point = relationship("PointTablePoint")
    
    def __repr__(self):
        return f"<BMSBMUTemperaturePoint(id={self.id}, bmu_config_id={self.bmu_config_id}, point_number={self.point_number})>"


class BMSBMUOtherDataConfig(Base):
    """
    BMS BMU 其它数据配置表
    说明：某些BMS供应商提供的与单体、温度无关的数据（如均衡器状态等）
    """
    __tablename__ = "bms_bmu_other_data_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    bmu_config_id = Column(Integer, ForeignKey("bms_bmu_configs.id", ondelete="CASCADE"), nullable=False, index=True)
    field_key = Column(String(100), nullable=False, comment="字段键（如 'balancer_status', 'balancer_current'）")
    display_name_zh = Column(String(200), nullable=False, comment="中文显示名")
    display_name_en = Column(String(200), nullable=False, comment="英文显示名")
    data_type = Column(String(20), nullable=False, comment="数据类型：'number' | 'boolean' | 'enum'")
    unit_zh = Column(String(50), nullable=False, default="", comment="中文单位")
    unit_en = Column(String(50), nullable=False, default="", comment="英文单位")
    source_type = Column(String(20), nullable=False, comment="字段来源类型：'asset_field' | 'di_point'")
    device_type_tag_id = Column(Integer, ForeignKey("device_type_tags.id", ondelete="RESTRICT"), nullable=True, index=True)
    comm_instance_id = Column(Integer, ForeignKey("comm_instances.id", ondelete="RESTRICT"), nullable=True, index=True)
    point_id = Column(Integer, ForeignKey("point_table_points.id", ondelete="RESTRICT"), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0, comment="排序索引")
    description_zh = Column(Text, nullable=False, default="", comment="中文描述")
    description_en = Column(Text, nullable=False, default="", comment="英文描述")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 关系
    bmu_config = relationship("BMSBMUConfig", back_populates="other_data_configs")
    device_type_tag = relationship("DeviceTypeTag")
    comm_instance = relationship("CommInstance")
    point = relationship("PointTablePoint")
    
    def __repr__(self):
        return f"<BMSBMUOtherDataConfig(id={self.id}, bmu_config_id={self.bmu_config_id}, field_key={self.field_key})>"
