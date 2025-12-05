/**
 * 网关系统管理 API
 */
import { http } from '@/utils/request';
import type {
  SystemMonitor,
  NetworkConfig,
  TimeConfig,
  SystemInfo,
  ServiceStatus,
  SecurityConfig,
  BackupInfo,
  BackupValidation,
  BackupRestoreRequest,
  MonitorHistoryList,
  SystemConfigItem,
  SystemConfigUpdate,
  LogLevelUpdate,
  ApiResponse,
} from '@/types';

/**
 * 获取系统监控信息
 */
export const getSystemMonitor = async (): Promise<ApiResponse<SystemMonitor>> => {
  const response = await http.get<ApiResponse<SystemMonitor>>('/gateway/monitor');
  return response.data;
};

/**
 * 获取网络配置
 */
export const getNetworkConfig = async (): Promise<ApiResponse<NetworkConfig>> => {
  const response = await http.get<ApiResponse<NetworkConfig>>('/gateway/network');
  return response.data;
};

/**
 * 获取时间配置
 */
export const getTimeConfig = async (): Promise<ApiResponse<TimeConfig>> => {
  const response = await http.get<ApiResponse<TimeConfig>>('/gateway/time');
  return response.data;
};

/**
 * 获取系统信息
 */
export const getSystemInfo = async (): Promise<ApiResponse<SystemInfo>> => {
  const response = await http.get<ApiResponse<SystemInfo>>('/gateway/info');
  return response.data;
};

/**
 * 获取服务状态列表
 */
export const getServicesStatus = async (): Promise<ApiResponse<ServiceStatus[]>> => {
  const response = await http.get<ApiResponse<ServiceStatus[]>>('/gateway/services');
  return response.data;
};

/**
 * 更新日志级别
 */
export const updateLogLevel = async (level: string): Promise<ApiResponse<null>> => {
  const response = await http.post<ApiResponse<null>>('/gateway/service/log-level', { level });
  return response.data;
};

/**
 * 获取安全配置
 */
export const getSecurityConfig = async (): Promise<ApiResponse<SecurityConfig>> => {
  const response = await http.get<ApiResponse<SecurityConfig>>('/gateway/security');
  return response.data;
};

/**
 * 更新DNS配置
 */
export const updateDNSConfig = async (data: {
  primary?: string;
  secondary?: string;
  search_domains?: string[];
}): Promise<ApiResponse<any>> => {
  const response = await http.patch<ApiResponse<any>>('/gateway/network/dns', data);
  return response.data;
};

/**
 * 更新网络接口配置
 */
export const updateNetworkInterface = async (
  interfaceName: string,
  data: { ip_address?: string; netmask?: string; gateway?: string }
): Promise<ApiResponse<any>> => {
  const response = await http.patch<ApiResponse<any>>(`/gateway/network/interface/${interfaceName}`, data);
  return response.data;
};

/**
 * 获取系统路由表
 */
export const getRoutes = async (): Promise<ApiResponse<import('@/types/gateway').RouteList>> => {
  const response = await http.get<ApiResponse<import('@/types/gateway').RouteList>>('/gateway/routes');
  return response.data;
};

/**
 * 添加路由
 */
export const addRoute = async (
  data: import('@/types/gateway').RouteCreate
): Promise<ApiResponse<any>> => {
  const response = await http.post<ApiResponse<any>>('/gateway/routes', data);
  return response.data;
};

/**
 * 删除路由
 */
export const deleteRoute = async (
  destination: string,
  gateway: string,
  interfaceName: string
): Promise<ApiResponse<any>> => {
  const response = await http.delete<ApiResponse<any>>('/gateway/routes', {
    params: { destination, gateway, interface: interfaceName }
  });
  return response.data;
};

/**
 * 获取所有可用时区
 */
export const getTimezones = async (): Promise<ApiResponse<import('@/types/gateway').TimezoneList>> => {
  const response = await http.get<ApiResponse<import('@/types/gateway').TimezoneList>>('/gateway/timezones');
  return response.data;
};

/**
 * 更新时区配置
 */
export const updateTimezone = async (timezone: string): Promise<ApiResponse<any>> => {
  const response = await http.patch<ApiResponse<any>>('/gateway/time/timezone', { timezone });
  return response.data;
};

/**
 * 更新NTP配置
 */
export const updateNTPConfig = async (data: {
  enabled?: boolean;
  servers?: string[];
}): Promise<ApiResponse<any>> => {
  const response = await http.patch<ApiResponse<any>>('/gateway/time/ntp', data);
  return response.data;
};

/**
 * 立即同步NTP时间
 */
export const syncNTP = async (): Promise<ApiResponse<null>> => {
  const response = await http.post<ApiResponse<null>>('/gateway/time/ntp/sync');
  return response.data;
};

/**
 * 服务控制（重启/清缓存/重载配置）
 */
export const controlService = async (action: 'restart' | 'clear_cache' | 'reload'): Promise<ApiResponse<null>> => {
  const response = await http.post<ApiResponse<null>>('/gateway/service/control', { action });
  return response.data;
};

/**
 * 创建数据库备份
 */
export const createBackup = async (): Promise<ApiResponse<BackupInfo>> => {
  const response = await http.post<ApiResponse<BackupInfo>>('/gateway/backup');
  return response.data;
};

/**
 * 下载数据库备份（已加密）
 * 
 * 安全特性：
 * - 下载的文件已使用Fernet加密（AES-128-CBC + HMAC-SHA256）
 * - 文件扩展名为 .ren
 * - 无法直接打开，需要通过系统还原
 * - 密钥：使用系统配置的加密密钥（backup_encryption_key）
 */
export const downloadBackup = async (filename: string): Promise<void> => {
  const response = await http.get(`/gateway/backup/${filename}`, {
    responseType: 'blob', // 重要：告诉axios期望二进制数据
  });

  // 创建Blob URL
  const blob = new Blob([response.data], { type: 'application/octet-stream' });
  const url = window.URL.createObjectURL(blob);

  // 文件名替换为 .ren
  const encryptedFilename = filename.replace('.db', '.ren')

  // 创建临时链接并触发下载
  const link = document.createElement('a');
  link.href = url;
  link.download = encryptedFilename;
  document.body.appendChild(link);
  link.click();

  // 清理
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * 验证备份文件（预览）
 */
export const validateBackup = async (file: File): Promise<ApiResponse<BackupValidation>> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await http.post<ApiResponse<BackupValidation>>(
    '/gateway/backup/validate',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * 还原数据库备份
 */
export const restoreBackup = async (
  file: File,
  restoreRequest: BackupRestoreRequest
): Promise<ApiResponse<Record<string, any>>> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('confirm_text', restoreRequest.confirm_text);
  formData.append('force', String(restoreRequest.force));

  const response = await http.post<ApiResponse<Record<string, any>>>(
    '/gateway/backup/restore',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * 获取监控历史数据（通用接口，支持字段筛选和分页）
 */
export const getMonitorHistory = async (params: {
  start_time?: string;
  end_time?: string;
  hours?: number;
  limit?: number;
  interval?: number;
  fields?: string; // 'cpu,memory,disk,network'
}): Promise<ApiResponse<MonitorHistoryList>> => {
  const response = await http.get<ApiResponse<MonitorHistoryList>>(
    '/gateway/monitor/history',
    { params }
  );
  return response.data;
};

/**
 * 获取CPU历史数据（轻量级，只返回CPU字段）
 */
export const getCpuHistory = async (params: {
  hours?: number;
  limit?: number;
  interval?: number;
}): Promise<ApiResponse<MonitorHistoryList>> => {
  const response = await http.get<ApiResponse<MonitorHistoryList>>(
    '/gateway/monitor/history/cpu',
    { params }
  );
  return response.data;
};

/**
 * 获取内存历史数据（轻量级，只返回内存字段）
 */
export const getMemoryHistory = async (params: {
  hours?: number;
  limit?: number;
  interval?: number;
}): Promise<ApiResponse<MonitorHistoryList>> => {
  const response = await http.get<ApiResponse<MonitorHistoryList>>(
    '/gateway/monitor/history/memory',
    { params }
  );
  return response.data;
};

/**
 * 获取磁盘历史数据（轻量级，只返回磁盘字段）
 */
export const getDiskHistory = async (params: {
  hours?: number;
  limit?: number;
  interval?: number;
}): Promise<ApiResponse<MonitorHistoryList>> => {
  const response = await http.get<ApiResponse<MonitorHistoryList>>(
    '/gateway/monitor/history/disk',
    { params }
  );
  return response.data;
};

/**
 * 获取网络历史数据（轻量级，只返回网络字段）
 */
export const getNetworkHistory = async (params: {
  hours?: number;
  limit?: number;
  interval?: number;
}): Promise<ApiResponse<MonitorHistoryList>> => {
  const response = await http.get<ApiResponse<MonitorHistoryList>>(
    '/gateway/monitor/history/network',
    { params }
  );
  return response.data;
};

/**
 * 获取系统配置（当前包含监控参数）
 */
export const getSystemConfig = async (module?: string): Promise<ApiResponse<SystemConfigItem[]>> => {
  const response = await http.get<ApiResponse<SystemConfigItem[]>>('/gateway/config/system', {
    params: module ? { module } : undefined,
  });
  return response.data;
};

/**
 * 更新系统配置
 */
export const updateSystemConfig = async (
  config: SystemConfigUpdate
): Promise<ApiResponse<SystemConfigItem[]>> => {
  const response = await http.patch<ApiResponse<SystemConfigItem[]>>(
    '/gateway/config/system',
    config
  );
  return response.data;
};
