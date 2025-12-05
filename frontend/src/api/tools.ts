/**
 * 系统工具 API
 */

import { http } from '@/utils/request'
import type { ApiResponse } from '@/types'

/**
 * Ping请求参数
 */
export interface PingRequest {
  target: string
  count?: number
  timeout?: number
  interface?: string
}

/**
 * Ping统计信息
 */
export interface PingStatistics {
  packets_sent: number
  packets_received: number
  packets_lost: number
  loss_rate: number
  min_time?: number
  max_time?: number
  avg_time?: number
}

/**
 * Ping结果
 */
export interface PingResult {
  target: string
  success: boolean
  output: string
  statistics?: PingStatistics
  error_message?: string
  executed_at: string
  interface_used?: string
}

/**
 * 执行Ping测试
 */
export const pingTest = async (request: PingRequest): Promise<ApiResponse<PingResult>> => {
  const response = await http.post<ApiResponse<PingResult>>('/tools/ping', request)
  return response.data
}

/**
 * 获取网络接口列表
 */
export const getNetworkInterfaces = async (): Promise<ApiResponse<string[]>> => {
  const response = await http.get<ApiResponse<string[]>>('/tools/network/interfaces')
  return response.data
}

/**
 * 端口扫描请求
 */
export interface PortScanRequest {
  port: number
}

/**
 * 进程信息
 */
export interface ProcessInfo {
  pid: number
  name: string
  user?: string
  cmdline?: string
}

/**
 * 端口信息
 */
export interface PortInfo {
  port: number
  host: string
  is_occupied: boolean
  process?: ProcessInfo
  protocol: string
}

/**
 * 端口扫描
 */
export const scanPort = async (request: PortScanRequest): Promise<ApiResponse<PortInfo>> => {
  const response = await http.post<ApiResponse<PortInfo>>('/tools/port/scan', request)
  return response.data
}

/**
 * 终止进程
 */
export const killProcess = async (pid: number): Promise<ApiResponse<any>> => {
  const response = await http.delete<ApiResponse<any>>(`/tools/port/process/${pid}`)
  return response.data
}

/**
 * ARP表项
 */
export interface ARPEntry {
  ip: string
  mac: string
  interface?: string
  type?: string
}

/**
 * 获取ARP表
 */
export const getARPTable = async (): Promise<ApiResponse<ARPEntry[]>> => {
  const response = await http.get<ApiResponse<ARPEntry[]>>('/tools/arp')
  return response.data
}

/**
 * Traceroute跳点
 */
export interface TracerouteHop {
  hop_number: number
  ip?: string
  hostname?: string
  rtt1?: number
  rtt2?: number
  rtt3?: number
  timeout: boolean
}

/**
 * Traceroute请求
 */
export interface TracerouteRequest {
  target: string
  max_hops?: number
  timeout?: number
}

/**
 * Traceroute结果
 */
export interface TracerouteResult {
  target: string
  success: boolean
  hops: TracerouteHop[]
  output: string
  executed_at: string
  total_hops: number
}

/**
 * 执行Traceroute
 */
export const tracerouteTest = async (request: TracerouteRequest): Promise<ApiResponse<TracerouteResult>> => {
  // 动态计算超时时间：与后端保持一致
  // 后端超时 = timeout * max_hops + 30 秒
  // 前端设置稍长一点，避免前端先超时
  const timeoutMs = (request.timeout * request.max_hops + 60) * 1000 // 多留30秒余量，转换为毫秒
  
  const response = await http.post<ApiResponse<TracerouteResult>>(
    '/tools/traceroute', 
    request,
    { timeout: timeoutMs }
  )
  return response.data
}

