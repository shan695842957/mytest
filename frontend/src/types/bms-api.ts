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
