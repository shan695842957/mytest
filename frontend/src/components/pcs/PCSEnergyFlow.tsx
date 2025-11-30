/**
 * PCS 能量流向图组件
 * 使用 SVG 绘制，展示交流侧、PCS、直流侧的能量流向
 */

import { cn } from '@/lib/utils'

interface PCSEnergyFlowProps {
  /** 流向：charge=充电（交流→直流），discharge=放电（直流→交流），idle=待机 */
  direction: 'charge' | 'discharge' | 'idle'
  /** 交流侧功率 (kW) */
  acPower: number
  /** 直流侧功率 (kW) */
  dcPower: number
  /** 效率 (%) */
  efficiency: number
  /** 主题变体 */
  variant?: 'light' | 'dark'
  /** 自定义类名 */
  className?: string
}

export function PCSEnergyFlow({
  direction,
  acPower,
  dcPower,
  efficiency,
  variant = 'light',
  className,
}: PCSEnergyFlowProps) {
  const isCharging = direction === 'charge'
  const isDischarging = direction === 'discharge'
  const isIdle = direction === 'idle'

  // 箭头颜色
  const arrowColor = isCharging
    ? '#3b82f6' // 蓝色 - 充电
    : isDischarging
    ? '#10b981' // 绿色 - 放电
    : '#6b7280' // 灰色 - 待机

  // 功率显示颜色（SVG fill颜色）
  const powerFillColor = isCharging
    ? '#2563eb' // blue-600
    : isDischarging
    ? '#059669' // green-600
    : '#6b7280' // gray-500
  
  // 文本颜色
  const textFillColor = variant === 'dark' ? '#f9fafb' : '#111827'
  const mutedTextFillColor = variant === 'dark' ? '#9ca3af' : '#6b7280'

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox="0 0 800 300"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 背景 */}
        <rect width="800" height="300" fill="transparent" />

        {/* 交流侧区域 */}
        <g id="ac-side">
          {/* 交流侧框 */}
          <rect
            x="50"
            y="100"
            width="200"
            height="100"
            rx="8"
            fill={variant === 'dark' ? '#1f2937' : '#f9fafb'}
            stroke={variant === 'dark' ? '#374151' : '#e5e7eb'}
            strokeWidth="2"
          />
          <text
            x="150"
            y="130"
            textAnchor="middle"
            fill={textFillColor}
            fontSize="16"
            fontWeight="600"
          >
            交流侧 (AC)
          </text>
          <text
            x="150"
            y="155"
            textAnchor="middle"
            fill={powerFillColor}
            fontSize="20"
            fontWeight="700"
          >
            {acPower.toFixed(1)} kW
          </text>
          <text
            x="150"
            y="180"
            textAnchor="middle"
            fill={mutedTextFillColor}
            fontSize="12"
          >
            50Hz / 380V
          </text>
        </g>

        {/* PCS 区域 */}
        <g id="pcs">
          {/* PCS 框 */}
          <rect
            x="300"
            y="80"
            width="200"
            height="140"
            rx="8"
            fill={variant === 'dark' ? '#111827' : '#ffffff'}
            stroke={variant === 'dark' ? '#4b5563' : '#d1d5db'}
            strokeWidth="3"
          />
          <text
            x="400"
            y="110"
            textAnchor="middle"
            fill={textFillColor}
            fontSize="18"
            fontWeight="700"
          >
            PCS
          </text>
          <text
            x="400"
            y="135"
            textAnchor="middle"
            fill={mutedTextFillColor}
            fontSize="11"
          >
            储能变流器
          </text>
          <text
            x="400"
            y="160"
            textAnchor="middle"
            fill={textFillColor}
            fontSize="14"
          >
            效率: {efficiency.toFixed(1)}%
          </text>
          <text
            x="400"
            y="185"
            textAnchor="middle"
            fill={powerFillColor}
            fontSize="13"
            fontWeight="600"
          >
            {isCharging ? '充电' : isDischarging ? '放电' : '待机'}
          </text>
        </g>

        {/* 直流侧区域 */}
        <g id="dc-side">
          {/* 直流侧框 */}
          <rect
            x="550"
            y="100"
            width="200"
            height="100"
            rx="8"
            fill={variant === 'dark' ? '#1f2937' : '#f9fafb'}
            stroke={variant === 'dark' ? '#374151' : '#e5e7eb'}
            strokeWidth="2"
          />
          <text
            x="650"
            y="130"
            textAnchor="middle"
            fill={textFillColor}
            fontSize="16"
            fontWeight="600"
          >
            直流侧 (DC)
          </text>
          <text
            x="650"
            y="155"
            textAnchor="middle"
            fill={powerFillColor}
            fontSize="20"
            fontWeight="700"
          >
            {dcPower.toFixed(1)} kW
          </text>
          <text
            x="650"
            y="180"
            textAnchor="middle"
            fill={mutedTextFillColor}
            fontSize="12"
          >
            600V
          </text>
        </g>

        {/* 能量流向箭头 */}
        {isCharging && (
          <g id="charge-arrow">
            {/* 从交流到PCS */}
            <path
              d="M 250 150 L 300 150"
              stroke={arrowColor}
              strokeWidth="4"
              fill="none"
              markerEnd="url(#arrowhead-charge)"
            />
            {/* 从PCS到直流 */}
            <path
              d="M 500 150 L 550 150"
              stroke={arrowColor}
              strokeWidth="4"
              fill="none"
              markerEnd="url(#arrowhead-charge)"
            />
            {/* 箭头定义 */}
            <defs>
              <marker
                id="arrowhead-charge"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3, 0 6"
                  fill={arrowColor}
                />
              </marker>
            </defs>
          </g>
        )}

        {isDischarging && (
          <g id="discharge-arrow">
            {/* 从直流到PCS */}
            <path
              d="M 550 150 L 500 150"
              stroke={arrowColor}
              strokeWidth="4"
              fill="none"
              markerEnd="url(#arrowhead-discharge)"
            />
            {/* 从PCS到交流 */}
            <path
              d="M 300 150 L 250 150"
              stroke={arrowColor}
              strokeWidth="4"
              fill="none"
              markerEnd="url(#arrowhead-discharge)"
            />
            {/* 箭头定义 */}
            <defs>
              <marker
                id="arrowhead-discharge"
                markerWidth="10"
                markerHeight="10"
                refX="1"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="10 0, 0 3, 10 6"
                  fill={arrowColor}
                />
              </marker>
            </defs>
          </g>
        )}

        {isIdle && (
          <g id="idle-line">
            {/* 待机状态 - 虚线连接 */}
            <line
              x1="250"
              y1="150"
              x2="550"
              y2="150"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          </g>
        )}

        {/* 功率标签 */}
        {!isIdle && (
          <g id="power-labels">
            <text
              x={isCharging ? "275" : "325"}
              y="140"
              textAnchor="middle"
              fill={mutedTextFillColor}
              fontSize="11"
            >
              {isCharging ? `${acPower.toFixed(1)}kW` : `${dcPower.toFixed(1)}kW`}
            </text>
            <text
              x={isCharging ? "525" : "475"}
              y="140"
              textAnchor="middle"
              fill={mutedTextFillColor}
              fontSize="11"
            >
              {isCharging ? `${dcPower.toFixed(1)}kW` : `${acPower.toFixed(1)}kW`}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
