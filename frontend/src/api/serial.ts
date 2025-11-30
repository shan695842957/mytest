/**
 * 串口测试工具 API
 */

import { http } from '@/utils/request'
import type {
  SerialPortInfo,
  OpenSerialRequest,
  OpenSerialResponse,
  CloseSerialRequest,
  SendDataRequest,
  SendDataResponse,
  GetBufferRequest,
  ReceivedDataItem,
  SerialPortStatus,
} from '@/types/serial'
import type { ApiResponse } from '@/types/api'

/**
 * 获取串口列表
 */
export const getSerialPorts = async () => {
  const response = await http.get<ApiResponse<SerialPortInfo[]>>(
    '/tools/serial/list'
  )
  return response.data
}

/**
 * 打开串口
 */
export const openSerialPort = async (data: OpenSerialRequest) => {
  const response = await http.post<ApiResponse<OpenSerialResponse>>(
    '/tools/serial/open',
    data
  )
  return response.data
}

/**
 * 关闭串口
 */
export const closeSerialPort = async (data: CloseSerialRequest) => {
  const response = await http.post<ApiResponse<null>>(
    '/tools/serial/close',
    data
  )
  return response.data
}

/**
 * 发送数据
 */
export const sendSerialData = async (data: SendDataRequest) => {
  const response = await http.post<ApiResponse<SendDataResponse>>(
    '/tools/serial/send',
    data
  )
  return response.data
}

/**
 * 获取接收缓冲区
 */
export const getSerialBuffer = async (data: GetBufferRequest) => {
  const response = await http.post<ApiResponse<ReceivedDataItem[]>>(
    '/tools/serial/buffer',
    data
  )
  return response.data
}

/**
 * 获取串口状态
 */
export const getSerialStatus = async () => {
  const response = await http.get<ApiResponse<SerialPortStatus[]>>(
    '/tools/serial/status'
  )
  return response.data
}

