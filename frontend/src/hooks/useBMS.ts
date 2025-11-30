/**
 * BMS 数据管理 Hook
 * 提供数据更新接口
 */

import { useState, useCallback } from 'react'
import type {
  Level3BMSData,
  Level2BMSData,
  DataField,
  HighVoltageBox,
  BatteryPack,
  BatteryCell,
} from '@/types/bms'

/**
 * 三级架构 BMS Hook
 */
export function useLevel3BMS(initialData: Level3BMSData) {
  const [data, setData] = useState<Level3BMSData>(initialData)
  
  // 更新总高压箱字段
  const updateMainHighVoltageBoxFields = useCallback((fields: DataField[]) => {
    setData(prev => ({
      ...prev,
      mainHighVoltageBox: {
        ...prev.mainHighVoltageBox,
        fields,
      },
    }))
  }, [])
  
  // 更新总高压箱断路器
  const updateMainHighVoltageBoxBreaker = useCallback((breaker: HighVoltageBox['breaker']) => {
    setData(prev => ({
      ...prev,
      mainHighVoltageBox: {
        ...prev.mainHighVoltageBox,
        breaker,
      },
    }))
  }, [])
  
  // 更新总高压箱故障
  const updateMainHighVoltageBoxFault = useCallback((fault: boolean, message?: string) => {
    setData(prev => ({
      ...prev,
      mainHighVoltageBox: {
        ...prev.mainHighVoltageBox,
        fault,
        faultMessage: message,
      },
    }))
  }, [])
  
  // 更新簇高压箱字段
  const updateClusterHighVoltageBoxFields = useCallback((clusterId: number, fields: DataField[]) => {
    setData(prev => ({
      ...prev,
      clusters: prev.clusters.map(cluster =>
        cluster.id === clusterId
          ? {
              ...cluster,
              highVoltageBox: {
                ...cluster.highVoltageBox,
                fields,
              },
            }
          : cluster
      ),
    }))
  }, [])
  
  // 更新簇高压箱断路器
  const updateClusterHighVoltageBoxBreaker = useCallback((clusterId: number, breaker: HighVoltageBox['breaker']) => {
    setData(prev => ({
      ...prev,
      clusters: prev.clusters.map(cluster =>
        cluster.id === clusterId
          ? {
              ...cluster,
              highVoltageBox: {
                ...cluster.highVoltageBox,
                breaker,
              },
            }
          : cluster
      ),
    }))
  }, [])
  
  // 更新电池包字段
  const updatePackFields = useCallback((clusterId: number, packId: number, fields: DataField[]) => {
    setData(prev => ({
      ...prev,
      clusters: prev.clusters.map(cluster =>
        cluster.id === clusterId
          ? {
              ...cluster,
              packs: cluster.packs.map(pack =>
                pack.id === packId
                  ? { ...pack, fields }
                  : pack
              ),
            }
          : cluster
      ),
    }))
  }, [])
  
  // 更新电池包故障
  const updatePackFault = useCallback((clusterId: number, packId: number, fault: boolean, message?: string) => {
    setData(prev => ({
      ...prev,
      clusters: prev.clusters.map(cluster =>
        cluster.id === clusterId
          ? {
              ...cluster,
              packs: cluster.packs.map(pack =>
                pack.id === packId
                  ? { ...pack, fault, faultMessage: message }
                  : pack
              ),
            }
          : cluster
      ),
    }))
  }, [])
  
  // 更新单体字段
  const updateCellFields = useCallback((clusterId: number, packId: number, cellId: number, fields: DataField[]) => {
    setData(prev => ({
      ...prev,
      clusters: prev.clusters.map(cluster =>
        cluster.id === clusterId
          ? {
              ...cluster,
              packs: cluster.packs.map(pack =>
                pack.id === packId
                  ? {
                      ...pack,
                      cells: pack.cells.map(cell =>
                        cell.id === cellId ? { ...cell, fields } : cell
                      ),
                    }
                  : pack
              ),
            }
          : cluster
      ),
    }))
  }, [])
  
  // 更新整个数据
  const updateData = useCallback((newData: Level3BMSData) => {
    setData(newData)
  }, [])
  
  return {
    data,
    updateData,
    updateMainHighVoltageBoxFields,
    updateMainHighVoltageBoxBreaker,
    updateMainHighVoltageBoxFault,
    updateClusterHighVoltageBoxFields,
    updateClusterHighVoltageBoxBreaker,
    updatePackFields,
    updatePackFault,
    updateCellFields,
  }
}

/**
 * 二级架构 BMS Hook
 */
export function useLevel2BMS(initialData: Level2BMSData) {
  const [data, setData] = useState<Level2BMSData>(initialData)
  
  // 更新高压箱字段
  const updateHighVoltageBoxFields = useCallback((fields: DataField[]) => {
    setData(prev => ({
      ...prev,
      highVoltageBox: {
        ...prev.highVoltageBox,
        fields,
      },
    }))
  }, [])
  
  // 更新高压箱断路器
  const updateHighVoltageBoxBreaker = useCallback((breaker: HighVoltageBox['breaker']) => {
    setData(prev => ({
      ...prev,
      highVoltageBox: {
        ...prev.highVoltageBox,
        breaker,
      },
    }))
  }, [])
  
  // 更新高压箱故障
  const updateHighVoltageBoxFault = useCallback((fault: boolean, message?: string) => {
    setData(prev => ({
      ...prev,
      highVoltageBox: {
        ...prev.highVoltageBox,
        fault,
        faultMessage: message,
      },
    }))
  }, [])
  
  // 更新电池包字段
  const updatePackFields = useCallback((packId: number, fields: DataField[]) => {
    setData(prev => ({
      ...prev,
      packs: prev.packs.map(pack =>
        pack.id === packId ? { ...pack, fields } : pack
      ),
    }))
  }, [])
  
  // 更新电池包故障
  const updatePackFault = useCallback((packId: number, fault: boolean, message?: string) => {
    setData(prev => ({
      ...prev,
      packs: prev.packs.map(pack =>
        pack.id === packId ? { ...pack, fault, faultMessage: message } : pack
      ),
    }))
  }, [])
  
  // 更新单体字段
  const updateCellFields = useCallback((packId: number, cellId: number, fields: DataField[]) => {
    setData(prev => ({
      ...prev,
      packs: prev.packs.map(pack =>
        pack.id === packId
          ? {
              ...pack,
              cells: pack.cells.map(cell =>
                cell.id === cellId ? { ...cell, fields } : cell
              ),
            }
          : pack
      ),
    }))
  }, [])
  
  // 更新整个数据
  const updateData = useCallback((newData: Level2BMSData) => {
    setData(newData)
  }, [])
  
  return {
    data,
    updateData,
    updateHighVoltageBoxFields,
    updateHighVoltageBoxBreaker,
    updateHighVoltageBoxFault,
    updatePackFields,
    updatePackFault,
    updateCellFields,
  }
}
