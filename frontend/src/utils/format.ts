/**
 * 格式化工具函数
 */

import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'

/**
 * 格式化日期时间（自动处理时区）
 * 
 * ⭐ 时区处理逻辑：
 * 1. 如果后端返回的时间带时区标记（如 +00:00 或 Z），会正确解析
 * 2. 如果后端返回的时间无时区标记，假设是 UTC 时间，添加 'Z' 标记
 * 3. 使用 date-fns 的 parseISO 和 format 确保时区转换正确
 * 
 * @param dateString - 日期时间字符串或 Date 对象
 * @returns 格式化后的时间字符串（YYYY-MM-DD HH:mm:ss）
 */
export function formatDateTime(dateString: string | Date, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string {
  let date: Date
  
  if (typeof dateString === 'string') {
    // 检查是否有时区标记
    const hasTimezone = dateString.includes('+') || 
                        dateString.includes('Z') || 
                        (dateString.includes('-') && dateString.length > 19)
    
    // 如果无时区标记，假设是 UTC 时间，添加 'Z' 标记
    // 这样可以确保前端正确解析为 UTC，然后转换为本地时间显示
    const normalizedString = hasTimezone ? dateString : dateString + 'Z'
    
    try {
      date = parseISO(normalizedString)
    } catch (error) {
      // 如果解析失败，尝试直接创建 Date 对象
      console.warn('Failed to parse date with date-fns, falling back to Date constructor:', dateString)
      date = new Date(dateString)
    }
  } else {
    date = dateString
  }
  
  // 使用 date-fns 格式化，自动转换为本地时间
  // 将 YYYY 转换为 yyyy（date-fns 使用小写）
  const normalizedFormat = formatStr.replace(/YYYY/g, 'yyyy').replace(/MM/g, 'MM').replace(/DD/g, 'dd').replace(/HH/g, 'HH').replace(/mm/g, 'mm')
  return format(date, normalizedFormat, { locale: zhCN })
}

/**
 * 格式化日期
 * 
 * @param dateString - 日期时间字符串或 Date 对象
 * @returns 格式化后的日期字符串（YYYY-MM-DD）
 */
export function formatDate(dateString: string | Date): string {
  let date: Date
  
  if (typeof dateString === 'string') {
    const hasTimezone = dateString.includes('+') || 
                        dateString.includes('Z') || 
                        (dateString.includes('-') && dateString.length > 19)
    const normalizedString = hasTimezone ? dateString : dateString + 'Z'
    
    try {
      date = parseISO(normalizedString)
    } catch (error) {
      console.warn('Failed to parse date with date-fns, falling back to Date constructor:', dateString)
      date = new Date(dateString)
    }
  } else {
    date = dateString
  }
  
  return format(date, 'yyyy-MM-dd', { locale: zhCN })
}

/**
 * 格式化时间
 * 
 * @param dateString - 日期时间字符串或 Date 对象
 * @returns 格式化后的时间字符串（HH:mm:ss）
 */
export function formatTime(dateString: string | Date): string {
  let date: Date
  
  if (typeof dateString === 'string') {
    const hasTimezone = dateString.includes('+') || 
                        dateString.includes('Z') || 
                        (dateString.includes('-') && dateString.length > 19)
    const normalizedString = hasTimezone ? dateString : dateString + 'Z'
    
    try {
      date = parseISO(normalizedString)
    } catch (error) {
      console.warn('Failed to parse date with date-fns, falling back to Date constructor:', dateString)
      date = new Date(dateString)
    }
  } else {
    date = dateString
  }
  
  return format(date, 'HH:mm:ss', { locale: zhCN })
}

/**
 * 相对时间（多久以前）
 * 
 * @param dateString - 日期时间字符串或 Date 对象
 * @returns 相对时间描述（如 "2 小时前"）
 */
export function formatRelativeTime(dateString: string | Date): string {
  let date: Date
  
  if (typeof dateString === 'string') {
    const hasTimezone = dateString.includes('+') || 
                        dateString.includes('Z') || 
                        (dateString.includes('-') && dateString.length > 19)
    const normalizedString = hasTimezone ? dateString : dateString + 'Z'
    
    try {
      date = parseISO(normalizedString)
    } catch (error) {
      console.warn('Failed to parse date with date-fns, falling back to Date constructor:', dateString)
      date = new Date(dateString)
    }
  } else {
    date = dateString
  }
  
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days} 天前`
  if (hours > 0) return `${hours} 小时前`
  if (minutes > 0) return `${minutes} 分钟前`
  if (seconds > 0) return `${seconds} 秒前`
  return '刚刚'
}

