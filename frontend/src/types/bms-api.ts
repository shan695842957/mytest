/**
 * BMS API 接口类型定义
 * 
 * TODO: 后端接口整理好后，实现实际的API调用
 */

/**
 * 动态字段配置（支持中英双语）
 */
export interface DynamicField {
  /** 字段英文名 */
  nameEn: string;
  /** 字段中文名 */
  nameZh: string;
  /** 字段英文值 */
  valueEn: number | string | boolean;
  /** 字段中文值（某些字段可能需要，如状态） */
  valueZh?: number | string | boolean;
  /** 字段英文单位 */
  unitEn?: string;
  /** 字段中文单位 */
  unitZh?: string;
}

/**
 * 固定字段值（所有BMS都有的字段）
 */
export interface FixedFields {
  /** 故障状态 */
  fault: boolean;
  /** 电压 */
  voltage: number;
  /** 电流 */
  current: number;
  /** 功率 */
  power: number;
  /** 断路器状态 */
  breakerClosed: boolean;
}

/**
 * 二级架构簇基本信息响应
 */
export interface ClusterBasicInfoResponse {
  /** 固定字段 */
  fixedFields: FixedFields;
  /** 动态字段列表 */
  dynamicFields: DynamicField[];
}

/**
 * 三级架构堆基本信息响应
 */
export interface StackBasicInfoResponse {
  /** 固定字段 */
  fixedFields: FixedFields;
  /** 动态字段列表 */
  dynamicFields: DynamicField[];
}

/**
 * 包信息（二级架构）
 */
export interface PackInfo {
  /** 包ID */
  id: string;
  /** 包编号 */
  number: number;
  /** 固定字段 */
  fixedFields: {
    voltage: number;
    current: number;
    fault: boolean;
  };
  /** 动态字段列表 */
  dynamicFields: DynamicField[];
}

/**
 * 簇信息（三级架构）
 */
export interface ClusterInfo {
  /** 簇ID */
  id: string;
  /** 簇编号 */
  number: number;
  /** 固定字段 */
  fixedFields: {
    voltage: number;
    current: number;
    fault: boolean;
    breakerClosed: boolean;
  };
  /** 动态字段列表 */
  dynamicFields: DynamicField[];
}

/**
 * 二级架构包列表响应
 */
export interface PackListResponse {
  /** 包列表 */
  packs: PackInfo[];
}

/**
 * 三级架构簇列表响应
 */
export interface ClusterListResponse {
  /** 簇列表 */
  clusters: ClusterInfo[];
}

/**
 * 断路器控制请求
 */
export interface BreakerControlRequest {
  /** 目标ID（簇ID或堆ID） */
  targetId: string;
  /** 操作：close=合闸, open=分闸 */
  action: 'close' | 'open';
}

/**
 * 断路器控制响应
 */
export interface BreakerControlResponse {
  /** 是否成功 */
  success: boolean;
  /** 消息 */
  message?: string;
}

// ========== 遥测遥信数据 ==========

/**
 * 遥测数据（动态字段）
 */
export interface TelemetryData extends DynamicField {
  // 继承 DynamicField 的所有属性
}

/**
 * 遥信数据 - 布尔类型
 */
export interface TelecontrolBoolean {
  /** 遥信ID */
  id: string;
  /** 汉字名 */
  nameZh: string;
  /** 英文名 */
  nameEn: string;
  /** 是否激活 */
  active: boolean;
  /** 故障等级 (1~4，越大越严重) */
  faultLevel: number;
}

/**
 * 枚举值定义
 */
export interface EnumValue {
  /** 枚举值（数字） */
  value: number;
  /** 汉字含义 */
  labelZh: string;
  /** 英文含义 */
  labelEn: string;
}

/**
 * 遥信数据 - 枚举类型
 */
export interface TelecontrolEnum {
  /** 遥信ID */
  id: string;
  /** 汉字名 */
  nameZh: string;
  /** 英文名 */
  nameEn: string;
  /** 当前值 */
  currentValue: number;
  /** 故障等级 (1~4) */
  faultLevel: number;
  /** 所有可能的枚举值 */
  enumValues: EnumValue[];
}

/**
 * 复杂位域 - 布尔位定义
 */
export interface BitfieldBooleanBit {
  /** 位索引 (0-15) */
  bitIndex: number;
  /** 汉字名 */
  nameZh: string;
  /** 英文名 */
  nameEn: string;
  /** 是否激活 */
  active: boolean;
  /** 故障等级 (1~4) */
  faultLevel: number;
}

/**
 * 复杂位域 - 枚举位定义
 */
export interface BitfieldEnumBit {
  /** 起始位索引 */
  startBit: number;
  /** 结束位索引 */
  endBit: number;
  /** 汉字名 */
  nameZh: string;
  /** 英文名 */
  nameEn: string;
  /** 当前值 */
  currentValue: number;
  /** 故障等级 (1~4) */
  faultLevel: number;
  /** 所有可能的枚举值 */
  enumValues: EnumValue[];
}

/**
 * 遥信数据 - 复杂位域类型
 */
export interface TelecontrolBitfield {
  /** 遥信ID */
  id: string;
  /** 汉字名 */
  nameZh: string;
  /** 英文名 */
  nameEn: string;
  /** 原始值（16位整数） */
  rawValue: number;
  /** 布尔位列表 (bit0~bit7) */
  booleanBits: BitfieldBooleanBit[];
  /** 预留位范围 (bit8~bit11，不显示) */
  reservedBits?: { startBit: number; endBit: number };
  /** 枚举位 (bit12~bit15) */
  enumBit?: BitfieldEnumBit;
}

/**
 * 遥信数据（联合类型）
 */
export type TelecontrolData = TelecontrolBoolean | TelecontrolEnum | TelecontrolBitfield;

/**
 * 状态字数据
 */
export interface StatusWord {
  /** 状态字ID */
  id: string;
  /** 汉字名 */
  nameZh: string;
  /** 英文名 */
  nameEn: string;
  /** 原始值（16进制字符串，如 "0x0C26"） */
  rawValue: string;
  /** 数值 */
  numericValue: number;
}

/**
 * 堆详细信息响应（三级架构BAU）
 */
export interface StackDetailInfoResponse {
  /** 遥测数据列表 */
  telemetryData: TelemetryData[];
  /** 状态字列表 */
  statusWords: StatusWord[];
  /** 遥信数据列表 */
  telecontrolData: TelecontrolData[];
}

/**
 * 簇详细信息响应（三级架构BCU、二级架构BCU）
 */
export interface ClusterDetailInfoResponse {
  /** 遥测数据列表 */
  telemetryData: TelemetryData[];
  /** 状态字列表 */
  statusWords: StatusWord[];
  /** 遥信数据列表 */
  telecontrolData: TelecontrolData[];
}

/**
 * 故障复位请求
 */
export interface FaultResetRequest {
  /** 目标ID（堆ID或簇ID） */
  targetId: string;
}

/**
 * 故障复位响应
 */
export interface FaultResetResponse {
  /** 是否成功 */
  success: boolean;
  /** 消息 */
  message?: string;
}

// ========== BMU页面数据 ==========

/**
 * 单体信息
 */
export interface CellInfo {
  /** 单体ID */
  id: string;
  /** 单体编号 */
  number: number;
  /** 动态字段列表（电压、SOC、SOH等） */
  dynamicFields: DynamicField[];
  /** 状态：normal/warning/alarm */
  status?: 'normal' | 'warning' | 'alarm';
}

/**
 * 温度测点信息
 */
export interface TemperaturePoint {
  /** 测点ID */
  id: string;
  /** 测点编号 */
  number: number;
  /** 温度值 */
  temperature: number;
  /** 单位 */
  unit: string;
  /** 状态：normal/warning/alarm */
  status?: 'normal' | 'warning' | 'alarm';
}

/**
 * 包内单体信息响应（二级架构）
 */
export interface PackCellInfoResponse {
  /** 包ID */
  packId: string;
  /** 包编号 */
  packNumber: number;
  /** 单体配置信息（如 "15S 2P (30 cells total)"） */
  cellConfiguration: string;
  /** 单体列表 */
  cells: CellInfo[];
}

/**
 * 包内温度测点响应（二级架构）
 */
export interface PackTemperatureResponse {
  /** 包ID */
  packId: string;
  /** 包编号 */
  packNumber: number;
  /** 温度测点列表 */
  temperaturePoints: TemperaturePoint[];
}

/**
 * 包内单体信息响应（三级架构）
 */
export interface ClusterPackCellInfoResponse {
  /** 簇ID */
  clusterId: string;
  /** 簇编号 */
  clusterNumber: number;
  /** 包ID */
  packId: string;
  /** 包编号 */
  packNumber: number;
  /** 单体配置信息（如 "15S 2P (30 cells total)"） */
  cellConfiguration: string;
  /** 单体列表 */
  cells: CellInfo[];
}

/**
 * 包内温度测点响应（三级架构）
 */
export interface ClusterPackTemperatureResponse {
  /** 簇ID */
  clusterId: string;
  /** 簇编号 */
  clusterNumber: number;
  /** 包ID */
  packId: string;
  /** 包编号 */
  packNumber: number;
  /** 温度测点列表 */
  temperaturePoints: TemperaturePoint[];
}

// ========== EVT页面数据 ==========

/**
 * 事件记录
 */
export interface EventLog {
  /** 事件ID */
  id: string;
  /** 时间戳 */
  timestamp: string;
  /** 类别：Fault/Alarm/Status */
  category: 'Fault' | 'Alarm' | 'Status';
  /** 详情描述 */
  details: string;
  /** 关联的设备/模块（如 BCMU7, BEMU等） */
  device?: string;
}

/**
 * 当前激活的遥信量
 */
export interface ActiveTelecontrol {
  /** 遥信ID */
  id: string;
  /** 汉字名 */
  nameZh: string;
  /** 英文名 */
  nameEn: string;
  /** 是否激活 */
  active: boolean;
  /** 故障等级 */
  faultLevel: number;
}

/**
 * 事件记录响应（二级架构）
 */
export interface EventLogResponse {
  /** 事件列表 */
  events: EventLog[];
  /** 当前激活的遥信量列表 */
  activeTelecontrols: ActiveTelecontrol[];
}

/**
 * 事件记录响应（三级架构）
 */
export interface EventLogResponseLevel3 {
  /** 事件列表 */
  events: EventLog[];
  /** 当前激活的遥信量列表 */
  activeTelecontrols: ActiveTelecontrol[];
}
