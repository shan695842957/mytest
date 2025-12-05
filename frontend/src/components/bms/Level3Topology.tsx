/**
 * 三级架构 BMS 拓扑图组件
 * 使用 SVG 绘制，展示电池堆 → 簇 → 包 → 单体的层级关系和串并联结构
 */

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { Level3BMSData, Level3BMSConfig } from '@/types/bms'

interface Level3TopologyProps {
  data: Level3BMSData
  config: Level3BMSConfig
  className?: string
}

export function Level3Topology({ data, config, className }: Level3TopologyProps) {
  const { clusterCount, packCountPerCluster, cellCountPerPack, cellConfiguration } = config
  
  // 计算布局尺寸
  const layout = useMemo(() => {
    const clusterWidth = 200
    const clusterHeight = 150
    const packWidth = 80
    const packHeight = 60
    const cellSize = 8
    const spacing = 20
    
    const totalWidth = clusterCount * (clusterWidth + spacing) + spacing
    const totalHeight = 400
    
    return {
      totalWidth,
      totalHeight,
      clusterWidth,
      clusterHeight,
      packWidth,
      packHeight,
      cellSize,
      spacing,
      mainBoxY: 50,
      clusterY: 150,
      packY: 250,
      cellY: 320,
    }
  }, [clusterCount])
  
  // 获取状态颜色
  const getStatusColor = (fault?: boolean) => {
    return fault ? '#ef4444' : '#10b981'
  }
  
  // 获取边框颜色
  const getBorderColor = (fault?: boolean) => {
    return fault ? '#dc2626' : '#059669'
  }
  
  return (
    <div className={cn('w-full overflow-auto', className)}>
      <svg
        viewBox={`0 0 ${layout.totalWidth} ${layout.totalHeight}`}
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 总高压箱 */}
        <g id="main-high-voltage-box">
          <rect
            x={layout.totalWidth / 2 - 100}
            y={layout.mainBoxY}
            width={200}
            height={60}
            rx="8"
            fill="#1f2937"
            stroke={getBorderColor(data.mainHighVoltageBox.fault)}
            strokeWidth="3"
          />
          <text
            x={layout.totalWidth / 2}
            y={layout.mainBoxY + 25}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="14"
            fontWeight="600"
          >
            总高压箱
          </text>
          <text
            x={layout.totalWidth / 2}
            y={layout.mainBoxY + 45}
            textAnchor="middle"
            fill="#9ca3af"
            fontSize="11"
          >
            {data.mainHighVoltageBox.fields.find(f => f.name === '总电压')?.value.toFixed(1) || '--'}V
          </text>
          
          {/* 断路器指示 */}
          {data.mainHighVoltageBox.breaker.positiveClosed !== undefined && (
            <>
              <circle
                cx={layout.totalWidth / 2 - 60}
                cy={layout.mainBoxY + 30}
                r="4"
                fill={data.mainHighVoltageBox.breaker.positiveClosed ? '#10b981' : '#ef4444'}
              />
              <circle
                cx={layout.totalWidth / 2 + 60}
                cy={layout.mainBoxY + 30}
                r="4"
                fill={data.mainHighVoltageBox.breaker.negativeClosed ? '#10b981' : '#ef4444'}
              />
            </>
          )}
        </g>
        
        {/* 从总高压箱到各簇的连接线 */}
        {data.clusters.map((cluster, clusterIdx) => {
          const clusterX = layout.spacing + clusterIdx * (layout.clusterWidth + layout.spacing) + layout.clusterWidth / 2
          const mainBoxY = layout.mainBoxY + 60
          const clusterTopY = layout.clusterY
          
          return (
            <line
              key={`main-to-cluster-${cluster.id}`}
              x1={layout.totalWidth / 2}
              y1={mainBoxY}
              x2={clusterX}
              y2={clusterTopY}
              stroke="#6b7280"
              strokeWidth="2"
              strokeDasharray="3,3"
            />
          )
        })}
        
        {/* 电池簇 */}
        {data.clusters.map((cluster, clusterIdx) => {
          const clusterX = layout.spacing + clusterIdx * (layout.clusterWidth + layout.spacing)
          const clusterCenterX = clusterX + layout.clusterWidth / 2
          
          return (
            <g key={`cluster-${cluster.id}`} id={`cluster-${cluster.id}`}>
              {/* 簇高压箱 */}
              <rect
                x={clusterX}
                y={layout.clusterY}
                width={layout.clusterWidth}
                height={50}
                rx="6"
                fill="#374151"
                stroke={getBorderColor(cluster.highVoltageBox.fault)}
                strokeWidth="2"
              />
              <text
                x={clusterCenterX}
                y={layout.clusterY + 20}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="12"
                fontWeight="600"
              >
                {cluster.name}
              </text>
              <text
                x={clusterCenterX}
                y={layout.clusterY + 35}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize="10"
              >
                {cluster.highVoltageBox.fields.find(f => f.name === '簇电压')?.value.toFixed(1) || '--'}V
              </text>
              
              {/* 簇断路器指示 */}
              {cluster.highVoltageBox.breaker.positiveClosed !== undefined && (
                <>
                  <circle
                    cx={clusterCenterX - 30}
                    cy={layout.clusterY + 25}
                    r="3"
                    fill={cluster.highVoltageBox.breaker.positiveClosed ? '#10b981' : '#ef4444'}
                  />
                  <circle
                    cx={clusterCenterX + 30}
                    cy={layout.clusterY + 25}
                    r="3"
                    fill={cluster.highVoltageBox.breaker.negativeClosed ? '#10b981' : '#ef4444'}
                  />
                </>
              )}
              
              {/* 电池包（串联） */}
              {cluster.packs.map((pack, packIdx) => {
                const packX = clusterX + (packIdx + 1) * (layout.clusterWidth / (packCountPerCluster + 1)) - layout.packWidth / 2
                const packCenterX = packX + layout.packWidth / 2
                
                return (
                  <g key={`pack-${pack.id}`} id={`pack-${cluster.id}-${pack.id}`}>
                    {/* 包之间的串联线 */}
                    {packIdx > 0 && (
                      <line
                        x1={cluster.packs[packIdx - 1].id === pack.id - 1 ? packX : packX - layout.packWidth / 2}
                        y1={layout.packY + layout.packHeight / 2}
                        x2={packX}
                        y2={layout.packY + layout.packHeight / 2}
                        stroke="#6b7280"
                        strokeWidth="2"
                      />
                    )}
                    
                    {/* 从簇到包的连接线 */}
                    <line
                      x1={clusterCenterX}
                      y1={layout.clusterY + 50}
                      x2={packCenterX}
                      y2={layout.packY}
                      stroke="#6b7280"
                      strokeWidth="1.5"
                      strokeDasharray="2,2"
                    />
                    
                    {/* 电池包框 */}
                    <rect
                      x={packX}
                      y={layout.packY}
                      width={layout.packWidth}
                      height={layout.packHeight}
                      rx="4"
                      fill={pack.fault ? '#7f1d1d' : '#1e3a8a'}
                      stroke={getBorderColor(pack.fault)}
                      strokeWidth="2"
                    />
                    <text
                      x={packCenterX}
                      y={layout.packY + 15}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="600"
                    >
                      {pack.name}
                    </text>
                    <text
                      x={packCenterX}
                      y={layout.packY + 30}
                      textAnchor="middle"
                      fill="#9ca3af"
                      fontSize="9"
                    >
                      {pack.fields.find(f => f.name === '包电压')?.value.toFixed(1) || '--'}V
                    </text>
                    
                    {/* 单体展示（简化：显示串并联结构） */}
                    <g id={`cells-${cluster.id}-${pack.id}`}>
                      {/* 串联组（2串） */}
                      {Array.from({ length: cellConfiguration.series }).map((_, seriesIdx) => {
                        const seriesX = packX + (seriesIdx + 1) * (layout.packWidth / (cellConfiguration.series + 1)) - layout.cellSize / 2
                        const displayParallelCount = Math.min(cellConfiguration.parallel, 8) // 最多显示8个
                        
                        return (
                          <g key={`series-${seriesIdx}`}>
                            {/* 并联的单体（显示前8个） */}
                            {Array.from({ length: displayParallelCount }).map((_, parallelIdx) => {
                              const cellY = layout.cellY + parallelIdx * (layout.cellSize + 2)
                              const cellIndex = seriesIdx * cellConfiguration.parallel + parallelIdx
                              const cell = pack.cells[cellIndex]
                              const voltageField = cell?.fields.find(f => f.name === '电压')
                              const isAbnormal = voltageField && (voltageField.value < 2.8 || voltageField.value > 4.3)
                              
                              return (
                                <rect
                                  key={`cell-${seriesIdx}-${parallelIdx}`}
                                  x={seriesX}
                                  y={cellY}
                                  width={layout.cellSize}
                                  height={layout.cellSize}
                                  fill={isAbnormal ? '#ef4444' : '#10b981'}
                                  stroke={isAbnormal ? '#dc2626' : '#059669'}
                                  strokeWidth="1"
                                />
                              )
                            })}
                            
                            {/* 如果并联数超过显示数，显示省略号 */}
                            {cellConfiguration.parallel > displayParallelCount && (
                              <text
                                x={seriesX + layout.cellSize / 2}
                                y={layout.cellY + displayParallelCount * (layout.cellSize + 2) + 5}
                                textAnchor="middle"
                                fill="#6b7280"
                                fontSize="8"
                              >
                                ...
                              </text>
                            )}
                            
                            {/* 并联连接线 */}
                            {cellConfiguration.parallel > 1 && (
                              <line
                                x1={seriesX}
                                y1={layout.cellY}
                                x2={seriesX}
                                y2={layout.cellY + (displayParallelCount - 1) * (layout.cellSize + 2)}
                                stroke="#6b7280"
                                strokeWidth="1"
                              />
                            )}
                          </g>
                        )
                      })}
                      
                      {/* 串联连接线 */}
                      {cellConfiguration.series > 1 && (
                        <>
                          {Array.from({ length: cellConfiguration.series - 1 }).map((_, idx) => {
                            const x1 = packX + (idx + 1) * (layout.packWidth / (cellConfiguration.series + 1))
                            const x2 = packX + (idx + 2) * (layout.packWidth / (cellConfiguration.series + 1))
                            const midY = layout.cellY + Math.min(cellConfiguration.parallel - 1, 7) * (layout.cellSize + 2) / 2
                            
                            return (
                              <line
                                key={`series-line-${idx}`}
                                x1={x1}
                                y1={midY}
                                x2={x2}
                                y2={midY}
                                stroke="#6b7280"
                                strokeWidth="1.5"
                              />
                            )
                          })}
                        </>
                      )}
                      
                      {/* 串并联标注 */}
                      <text
                        x={packCenterX}
                        y={layout.cellY + Math.min(cellConfiguration.parallel, 8) * (layout.cellSize + 2) + 15}
                        textAnchor="middle"
                        fill="#6b7280"
                        fontSize="9"
                      >
                        {cellConfiguration.series}串{cellConfiguration.parallel}并
                      </text>
                    </g>
                    
                    {/* 温度测点指示 */}
                    {pack.temperaturePoints.length > 0 && (
                      <circle
                        cx={packX + layout.packWidth - 8}
                        cy={layout.packY + 8}
                        r="3"
                        fill="#f59e0b"
                      />
                    )}
                  </g>
                )
              })}
              
              {/* 簇内包之间的串联标注 */}
              {packCountPerCluster > 1 && (
                <text
                  x={clusterCenterX}
                  y={layout.packY + layout.packHeight + 10}
                  textAnchor="middle"
                  fill="#6b7280"
                  fontSize="9"
                >
                  串联
                </text>
              )}
            </g>
          )
        })}
        
        {/* 簇之间的并联标注 */}
        {clusterCount > 1 && (
          <text
            x={layout.totalWidth / 2}
            y={layout.clusterY + 70}
            textAnchor="middle"
            fill="#6b7280"
            fontSize="10"
            fontWeight="600"
          >
            并联
          </text>
        )}
        
        {/* 图例 */}
        <g id="legend" transform={`translate(${layout.totalWidth - 120}, ${layout.totalHeight - 80})`}>
          <rect
            x="0"
            y="0"
            width="110"
            height="70"
            rx="4"
            fill="#f9fafb"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          <text x="55" y="15" textAnchor="middle" fill="#111827" fontSize="10" fontWeight="600">
            图例
          </text>
          <rect x="5" y="22" width="8" height="8" fill="#10b981" stroke="#059669" />
          <text x="16" y="29" fill="#111827" fontSize="9">正常</text>
          <rect x="5" y="35" width="8" height="8" fill="#ef4444" stroke="#dc2626" />
          <text x="16" y="42" fill="#111827" fontSize="9">异常</text>
          <circle cx="9" cy="52" r="3" fill="#10b981" />
          <text x="16" y="55" fill="#111827" fontSize="9">合闸</text>
          <circle cx="9" cy="62" r="3" fill="#ef4444" />
          <text x="16" y="65" fill="#111827" fontSize="9">分闸</text>
        </g>
      </svg>
    </div>
  )
}
