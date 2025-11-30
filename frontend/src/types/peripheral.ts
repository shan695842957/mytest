/**
 * 外设设备相关类型定义
 */

/**
 * 外设设备
 */
export interface Peripheral {
  id: number
  name: string
  display_name: string
  peripheral_type: 'serial' | 'can' | 'spi' | 'i2c' | 'gpio' | 'pwm' | 'adc' | 'dac' | 'other'
  device_path: string
  enabled: boolean
  description: string
  created_at: string
  updated_at: string
}

/**
 * 创建外设请求
 */
export interface CreatePeripheralRequest {
  name: string
  display_name: string
  peripheral_type: 'serial' | 'can' | 'spi' | 'i2c' | 'gpio' | 'pwm' | 'adc' | 'dac' | 'other'
  device_path: string
  enabled?: boolean
  description?: string
}

/**
 * 更新外设请求
 */
export interface UpdatePeripheralRequest {
  display_name?: string
  peripheral_type?: 'serial' | 'can' | 'spi' | 'i2c' | 'gpio' | 'pwm' | 'adc' | 'dac' | 'other'
  device_path?: string
  enabled?: boolean
  description?: string
}

/**
 * 外设简单响应（用于下拉框）
 */
export interface PeripheralSimpleResponse {
  value: string // device_path
  label: string // display_name
  name: string // name
}

/**
 * 外设列表查询参数
 */
export interface PeripheralListParams {
  skip?: number
  limit?: number
  peripheral_type?: string
  enabled_only?: boolean
}

