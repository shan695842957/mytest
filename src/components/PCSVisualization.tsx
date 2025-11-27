import React, { useRef } from 'react'

/**
 * PCS运行模式
 */
export type PCSMode = 'charging' | 'discharging' | 'idle'

/**
 * 主题模式
 */
export type ThemeMode = 'light' | 'dark'

/**
 * 网侧（交流侧）显示的数据接口
 */
export interface GridSideData {
  /** 电压值（单位：V） */
  voltage?: number | string
  /** 电流值（单位：A） */
  current?: number | string
  /** 功率值（单位：kW） */
  power?: number | string
  /** 频率值（单位：Hz） */
  frequency?: number | string
  /** 自定义标签 */
  label?: string
  /** 自定义显示内容（优先级最高，如果提供则忽略其他字段） */
  customContent?: React.ReactNode
}

/**
 * 直流侧显示的数据接口
 */
export interface DCSideData {
  /** 电压值（单位：V） */
  voltage?: number | string
  /** 电流值（单位：A） */
  current?: number | string
  /** 功率值（单位：kW） */
  power?: number | string
  /** 自定义标签 */
  label?: string
  /** 自定义显示内容（优先级最高，如果提供则忽略其他字段） */
  customContent?: React.ReactNode
}

/**
 * PCS下方显示的数据接口
 */
export interface PCSData {
  /** 效率值（单位：%） */
  efficiency?: number | string
  /** 温度值（单位：℃） */
  temperature?: number | string
  /** 状态文本 */
  status?: string
  /** 自定义标签 */
  label?: string
  /** 自定义显示内容（优先级最高，如果提供则忽略其他字段） */
  customContent?: React.ReactNode
}

/**
 * PCS可视化组件属性
 */
export interface PCSVisualizationProps {
  /** PCS运行模式：充电、放电或空闲 */
  mode: PCSMode
  /** 主题模式：明亮或暗黑 */
  theme?: ThemeMode
  /** 网侧（交流侧）数据 */
  gridSideData?: GridSideData
  /** 直流侧数据 */
  dcSideData?: DCSideData
  /** PCS数据 */
  pcsData?: PCSData
  /** 组件宽度（默认：800px） */
  width?: number | string
  /** 组件高度（默认：400px） */
  height?: number | string
  /** 自定义类名 */
  className?: string
  /** 能量流向动画速度（默认：2000ms，值越大速度越慢） */
  animationDuration?: number
}

/**
 * PCS可视化组件
 * 
 * 功能说明：
 * - 显示储能系统PCS（功率转换系统）的实时状态
 * - 支持充电模式（交流→直流）和放电模式（直流→交流）的动态能量流向示意
 * - 可在网侧、直流侧和PCS图标下方显示实时数据
 * - 支持明暗主题切换，背景透明，可适配网页背景
 * 
 * @param props 组件属性
 */
const PCSVisualization: React.FC<PCSVisualizationProps> = ({
  mode = 'idle',
  theme = 'light',
  gridSideData,
  dcSideData,
  pcsData,
  width = 800,
  height = 400,
  className = '',
  animationDuration = 2000,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)

  // 根据主题确定颜色
  const colors = {
    light: {
      background: 'transparent',
      gridSideBg: '#E3F2FD',
      dcSideBg: '#FFF3E0',
      pcsBg: '#F3E5F5',
      gridSideBorder: '#1976D2',
      dcSideBorder: '#F57C00',
      pcsBorder: '#7B1FA2',
      text: '#212121',
      textSecondary: '#757575',
      flowActive: '#4CAF50',
      flowInactive: '#E0E0E0',
    },
    dark: {
      background: 'transparent',
      gridSideBg: '#1E3A5F',
      dcSideBg: '#4A2C1A',
      pcsBg: '#3D1F4A',
      gridSideBorder: '#64B5F6',
      dcSideBorder: '#FFB74D',
      pcsBorder: '#BA68C8',
      text: '#FFFFFF',
      textSecondary: '#B0B0B0',
      flowActive: '#81C784',
      flowInactive: '#424242',
    },
  }

  const currentColors = colors[theme]

  // 格式化数据显示
  const formatData = (data?: GridSideData | DCSideData | PCSData): React.ReactNode => {
    if (!data) return null
    if (data.customContent) return data.customContent

    const items: React.ReactNode[] = []
    
    if (data.label) {
      items.push(
        <div key="label" className="font-semibold text-sm mb-1">
          {data.label}
        </div>
      )
    }

    if ('voltage' in data && data.voltage !== undefined) {
      items.push(
        <div key="voltage" className="text-xs">
          电压: {data.voltage}V
        </div>
      )
    }
    if ('current' in data && data.current !== undefined) {
      items.push(
        <div key="current" className="text-xs">
          电流: {data.current}A
        </div>
      )
    }
    if ('power' in data && data.power !== undefined) {
      items.push(
        <div key="power" className="text-xs">
          功率: {data.power}kW
        </div>
      )
    }
    if ('frequency' in data && data.frequency !== undefined) {
      items.push(
        <div key="frequency" className="text-xs">
          频率: {data.frequency}Hz
        </div>
      )
    }
    if ('efficiency' in data && data.efficiency !== undefined) {
      items.push(
        <div key="efficiency" className="text-xs">
          效率: {data.efficiency}%
        </div>
      )
    }
    if ('temperature' in data && data.temperature !== undefined) {
      items.push(
        <div key="temperature" className="text-xs">
          温度: {data.temperature}℃
        </div>
      )
    }
    if ('status' in data && data.status) {
      items.push(
        <div key="status" className="text-xs">
          状态: {data.status}
        </div>
      )
    }

    return items.length > 0 ? <div>{items}</div> : null
  }

  // 计算能量流向方向
  const flowDirection = mode === 'charging' ? 'left-to-right' : mode === 'discharging' ? 'right-to-left' : 'none'

  return (
    <div
      className={`pcs-visualization ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        backgroundColor: currentColors.background,
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMid meet"
        style={{ backgroundColor: 'transparent' }}
      >
        {/* 定义渐变和动画 */}
        <defs>
          {/* 能量流向渐变 */}
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={currentColors.flowActive} stopOpacity="0.3">
              {flowDirection !== 'none' && (
                <animate
                  attributeName="stop-opacity"
                  values="0.3;0.8;0.3"
                  dur={`${animationDuration}ms`}
                  repeatCount="indefinite"
                />
              )}
            </stop>
            <stop offset="50%" stopColor={currentColors.flowActive} stopOpacity="0.6">
              {flowDirection !== 'none' && (
                <animate
                  attributeName="stop-opacity"
                  values="0.6;1;0.6"
                  dur={`${animationDuration}ms`}
                  repeatCount="indefinite"
                />
              )}
            </stop>
            <stop offset="100%" stopColor={currentColors.flowActive} stopOpacity="0.3">
              {flowDirection !== 'none' && (
                <animate
                  attributeName="stop-opacity"
                  values="0.3;0.8;0.3"
                  dur={`${animationDuration}ms`}
                  repeatCount="indefinite"
                />
              )}
            </stop>
          </linearGradient>

          {/* 反向能量流向渐变（用于放电模式） */}
          <linearGradient id="flowGradientReverse" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={currentColors.flowActive} stopOpacity="0.3">
              {flowDirection !== 'none' && (
                <animate
                  attributeName="stop-opacity"
                  values="0.3;0.8;0.3"
                  dur={`${animationDuration}ms`}
                  repeatCount="indefinite"
                />
              )}
            </stop>
            <stop offset="50%" stopColor={currentColors.flowActive} stopOpacity="0.6">
              {flowDirection !== 'none' && (
                <animate
                  attributeName="stop-opacity"
                  values="0.6;1;0.6"
                  dur={`${animationDuration}ms`}
                  repeatCount="indefinite"
                />
              )}
            </stop>
            <stop offset="100%" stopColor={currentColors.flowActive} stopOpacity="0.3">
              {flowDirection !== 'none' && (
                <animate
                  attributeName="stop-opacity"
                  values="0.3;0.8;0.3"
                  dur={`${animationDuration}ms`}
                  repeatCount="indefinite"
                />
              )}
            </stop>
          </linearGradient>

          {/* 箭头标记 */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3, 0 6"
              fill={currentColors.flowActive}
            />
          </marker>
        </defs>

        {/* 网侧（交流侧）区域 */}
        <g id="grid-side">
          <rect
            x="20"
            y="50"
            width="200"
            height="300"
            rx="10"
            fill={currentColors.gridSideBg}
            stroke={currentColors.gridSideBorder}
            strokeWidth="2"
            opacity="0.8"
          />
          <text
            x="120"
            y="85"
            textAnchor="middle"
            fontSize="18"
            fontWeight="bold"
            fill={currentColors.text}
          >
            网侧（交流）
          </text>
          {/* 交流电符号 */}
          <path
            d="M 80 120 L 120 120 M 100 110 L 100 130 M 90 115 L 110 125 M 110 115 L 90 125"
            stroke={currentColors.gridSideBorder}
            strokeWidth="2"
            fill="none"
          />
          <circle cx="100" cy="120" r="15" fill="none" stroke={currentColors.gridSideBorder} strokeWidth="2" />
        </g>

        {/* 直流侧区域 */}
        <g id="dc-side">
          <rect
            x="580"
            y="50"
            width="200"
            height="300"
            rx="10"
            fill={currentColors.dcSideBg}
            stroke={currentColors.dcSideBorder}
            strokeWidth="2"
            opacity="0.8"
          />
          <text
            x="680"
            y="85"
            textAnchor="middle"
            fontSize="18"
            fontWeight="bold"
            fill={currentColors.text}
          >
            直流侧
          </text>
          {/* 直流电符号 */}
          <line
            x1="650"
            y1="120"
            x2="710"
            y2="120"
            stroke={currentColors.dcSideBorder}
            strokeWidth="3"
          />
          <line
            x1="655"
            y1="115"
            x2="655"
            y2="125"
            stroke={currentColors.dcSideBorder}
            strokeWidth="2"
          />
          <line
            x1="705"
            y1="115"
            x2="705"
            y2="125"
            stroke={currentColors.dcSideBorder}
            strokeWidth="2"
          />
        </g>

        {/* PCS图标（中间） */}
        <g id="pcs-icon">
          <rect
            x="350"
            y="150"
            width="100"
            height="100"
            rx="8"
            fill={currentColors.pcsBg}
            stroke={currentColors.pcsBorder}
            strokeWidth="3"
            opacity="0.9"
          />
          <text
            x="400"
            y="185"
            textAnchor="middle"
            fontSize="16"
            fontWeight="bold"
            fill={currentColors.text}
          >
            PCS
          </text>
          {/* PCS内部示意：双向箭头 */}
          <path
            d="M 370 200 L 390 200 M 380 190 L 390 200 L 380 210"
            stroke={currentColors.pcsBorder}
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M 430 200 L 410 200 M 420 190 L 410 200 L 420 210"
            stroke={currentColors.pcsBorder}
            strokeWidth="2"
            fill="none"
          />
          <rect
            x="375"
            y="195"
            width="50"
            height="10"
            fill={currentColors.pcsBorder}
            opacity="0.5"
          />
        </g>

        {/* 能量流向箭头（充电模式：网侧→直流侧） */}
        {mode === 'charging' && (
          <g id="charging-flow">
            {/* 主流向线 */}
            <line
              x1="220"
              y1="200"
              x2="350"
              y2="200"
              stroke="url(#flowGradient)"
              strokeWidth="6"
              markerEnd="url(#arrowhead)"
            />
            <line
              x1="450"
              y1="200"
              x2="580"
              y2="200"
              stroke="url(#flowGradient)"
              strokeWidth="6"
              markerEnd="url(#arrowhead)"
            />
            {/* 流动粒子效果 */}
            <circle r="4" fill={currentColors.flowActive}>
              <animateMotion
                dur={`${animationDuration}ms`}
                repeatCount="indefinite"
                path="M 220 200 L 580 200"
              />
            </circle>
            <circle r="4" fill={currentColors.flowActive}>
              <animateMotion
                dur={`${animationDuration}ms`}
                repeatCount="indefinite"
                begin={`${animationDuration / 3}ms`}
                path="M 220 200 L 580 200"
              />
            </circle>
            <circle r="4" fill={currentColors.flowActive}>
              <animateMotion
                dur={`${animationDuration}ms`}
                repeatCount="indefinite"
                begin={`${animationDuration * 2 / 3}ms`}
                path="M 220 200 L 580 200"
              />
            </circle>
          </g>
        )}

        {/* 能量流向箭头（放电模式：直流侧→网侧） */}
        {mode === 'discharging' && (
          <g id="discharging-flow">
            {/* 主流向线 */}
            <line
              x1="580"
              y1="200"
              x2="450"
              y2="200"
              stroke="url(#flowGradientReverse)"
              strokeWidth="6"
              markerEnd="url(#arrowhead)"
            />
            <line
              x1="350"
              y1="200"
              x2="220"
              y2="200"
              stroke="url(#flowGradientReverse)"
              strokeWidth="6"
              markerEnd="url(#arrowhead)"
            />
            {/* 流动粒子效果 */}
            <circle r="4" fill={currentColors.flowActive}>
              <animateMotion
                dur={`${animationDuration}ms`}
                repeatCount="indefinite"
                path="M 580 200 L 220 200"
              />
            </circle>
            <circle r="4" fill={currentColors.flowActive}>
              <animateMotion
                dur={`${animationDuration}ms`}
                repeatCount="indefinite"
                begin={`${animationDuration / 3}ms`}
                path="M 580 200 L 220 200"
              />
            </circle>
            <circle r="4" fill={currentColors.flowActive}>
              <animateMotion
                dur={`${animationDuration}ms`}
                repeatCount="indefinite"
                begin={`${animationDuration * 2 / 3}ms`}
                path="M 580 200 L 220 200"
              />
            </circle>
          </g>
        )}

        {/* 连接线（空闲状态） */}
        {mode === 'idle' && (
          <g id="idle-connections">
            <line
              x1="220"
              y1="200"
              x2="350"
              y2="200"
              stroke={currentColors.flowInactive}
              strokeWidth="3"
              strokeDasharray="5,5"
            />
            <line
              x1="450"
              y1="200"
              x2="580"
              y2="200"
              stroke={currentColors.flowInactive}
              strokeWidth="3"
              strokeDasharray="5,5"
            />
          </g>
        )}
      </svg>

      {/* 数据展示层（使用绝对定位覆盖在SVG上） */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 网侧数据显示 */}
        {gridSideData && (
          <div
            className="absolute"
            style={{
              left: '30px',
              top: '150px',
              width: '180px',
              color: currentColors.text,
              pointerEvents: 'auto',
            }}
          >
            <div
              className="bg-opacity-80 rounded p-2"
              style={{
                backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)',
              }}
            >
              {formatData(gridSideData)}
            </div>
          </div>
        )}

        {/* 直流侧数据显示 */}
        {dcSideData && (
          <div
            className="absolute"
            style={{
              right: '30px',
              top: '150px',
              width: '180px',
              color: currentColors.text,
              pointerEvents: 'auto',
            }}
          >
            <div
              className="bg-opacity-80 rounded p-2"
              style={{
                backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)',
              }}
            >
              {formatData(dcSideData)}
            </div>
          </div>
        )}

        {/* PCS数据显示 */}
        {pcsData && (
          <div
            className="absolute"
            style={{
              left: '50%',
              top: '260px',
              transform: 'translateX(-50%)',
              width: '150px',
              color: currentColors.text,
              pointerEvents: 'auto',
            }}
          >
            <div
              className="bg-opacity-80 rounded p-2 text-center"
              style={{
                backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)',
              }}
            >
              {formatData(pcsData)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PCSVisualization
