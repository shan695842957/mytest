/**
 * 串口测试工具类型定义
 */

/**
 * 串口信息
 */
export interface SerialPortInfo {
  port: string
  description: string
  hwid: string
  vid?: number
  pid?: number
  serial_number?: string
  location?: string
  manufacturer?: string
  product?: string
  is_opened: boolean
}

/**
 * 打开串口请求
 */
export interface OpenSerialRequest {
  port: string
  baudrate: number
  bytesize: number
  parity: 'N' | 'E' | 'O' | 'M' | 'S'
  stopbits: 1.0 | 1.5 | 2.0
  timeout: number
}

/**
 * 打开串口响应
 */
export interface OpenSerialResponse {
  port: string
  baudrate: number
  bytesize: number
  parity: string
  stopbits: number
  is_open: boolean
  opened_at: string
}

/**
 * 关闭串口请求
 */
export interface CloseSerialRequest {
  port: string
}

/**
 * 发送数据请求
 */
export interface SendDataRequest {
  port: string
  data: string
  data_type: 'hex' | 'ascii' | 'utf8'
}

/**
 * 发送数据响应
 */
export interface SendDataResponse {
  port: string
  bytes_sent: number
  data_hex: string
  sent_at: string
}

/**
 * 获取缓冲区请求
 */
export interface GetBufferRequest {
  port: string
  clear?: boolean
}

/**
 * 接收数据项
 */
export interface ReceivedDataItem {
  timestamp: string
  data: string
  length: number
}

/**
 * 串口状态
 */
export interface SerialPortStatus {
  port: string
  is_open: boolean
  baudrate: number
  bytesize: number
  parity: string
  stopbits: number
  in_waiting: number
  buffer_size: number
}

/**
 * 串口配置表单
 */
export interface SerialConfigForm {
  baudrate: number
  bytesize: number
  parity: 'N' | 'E' | 'O' | 'M' | 'S'
  stopbits: 1.0 | 1.5 | 2.0
  timeout: number
}

