import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合并 className 的工具函数
 * 结合 clsx 和 tailwind-merge，用于条件性地合并 Tailwind CSS 类名
 * 
 * @param inputs - 可以是字符串、对象、数组等 clsx 支持的所有格式
 * @returns 合并后的 className 字符串
 * 
 * @example
 * ```tsx
 * cn("px-2 py-1", "bg-red-500") // "px-2 py-1 bg-red-500"
 * cn("px-2", "px-4") // "px-4" (tailwind-merge 会去重)
 * cn({ "bg-red-500": true, "bg-blue-500": false }) // "bg-red-500"
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

