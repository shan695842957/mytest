/**
 * BMS数据管理Hook
 * 提供数据更新接口供外部调用
 */

import { useState, useCallback } from 'react';
import {
  BatteryStackData,
  BatteryClusterDataLevel2,
  BMSConfig,
} from '@/types/bms';

/**
 * 三级架构BMS Hook
 */
export function useLevel3BMS(initialData: BatteryStackData) {
  const [data, setData] = useState<BatteryStackData>(initialData);

  /**
   * 更新整个电池堆数据
   */
  const updateData = useCallback((newData: BatteryStackData) => {
    setData(newData);
  }, []);

  /**
   * 更新总高压箱数据
   */
  const updateMainHighVoltageBox = useCallback((updates: Partial<BatteryStackData['mainHighVoltageBox']>) => {
    setData(prev => ({
      ...prev,
      mainHighVoltageBox: {
        ...prev.mainHighVoltageBox,
        ...updates,
      },
    }));
  }, []);

  /**
   * 更新指定簇的数据
   */
  const updateCluster = useCallback((clusterId: string, updates: Partial<BatteryStackData['clusters'][0]>) => {
    setData(prev => ({
      ...prev,
      clusters: prev.clusters.map(cluster =>
        cluster.id === clusterId ? { ...cluster, ...updates } : cluster
      ),
    }));
  }, []);

  /**
   * 更新指定簇的高压箱数据
   */
  const updateClusterHighVoltageBox = useCallback((
    clusterId: string,
    updates: Partial<BatteryStackData['clusters'][0]['highVoltageBox']>
  ) => {
    setData(prev => ({
      ...prev,
      clusters: prev.clusters.map(cluster =>
        cluster.id === clusterId
          ? {
              ...cluster,
              highVoltageBox: {
                ...cluster.highVoltageBox,
                ...updates,
              },
            }
          : cluster
      ),
    }));
  }, []);

  /**
   * 更新指定包的数据
   */
  const updatePack = useCallback((
    clusterId: string,
    packId: string,
    updates: Partial<BatteryStackData['clusters'][0]['packs'][0]>
  ) => {
    setData(prev => ({
      ...prev,
      clusters: prev.clusters.map(cluster =>
        cluster.id === clusterId
          ? {
              ...cluster,
              packs: cluster.packs.map(pack =>
                pack.id === packId ? { ...pack, ...updates } : pack
              ),
            }
          : cluster
      ),
    }));
  }, []);

  /**
   * 更新指定单体的数据
   */
  const updateCell = useCallback((
    clusterId: string,
    packId: string,
    cellId: string,
    updates: Partial<BatteryStackData['clusters'][0]['packs'][0]['cells'][0]>
  ) => {
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
                        cell.id === cellId ? { ...cell, ...updates } : cell
                      ),
                    }
                  : pack
              ),
            }
          : cluster
      ),
    }));
  }, []);

  return {
    data,
    updateData,
    updateMainHighVoltageBox,
    updateCluster,
    updateClusterHighVoltageBox,
    updatePack,
    updateCell,
  };
}

/**
 * 二级架构BMS Hook
 */
export function useLevel2BMS(initialData: BatteryClusterDataLevel2) {
  const [data, setData] = useState<BatteryClusterDataLevel2>(initialData);

  /**
   * 更新整个电池簇数据
   */
  const updateData = useCallback((newData: BatteryClusterDataLevel2) => {
    setData(newData);
  }, []);

  /**
   * 更新簇高压箱数据
   */
  const updateHighVoltageBox = useCallback((updates: Partial<BatteryClusterDataLevel2['highVoltageBox']>) => {
    setData(prev => ({
      ...prev,
      highVoltageBox: {
        ...prev.highVoltageBox,
        ...updates,
      },
    }));
  }, []);

  /**
   * 更新指定包的数据
   */
  const updatePack = useCallback((
    packId: string,
    updates: Partial<BatteryClusterDataLevel2['packs'][0]>
  ) => {
    setData(prev => ({
      ...prev,
      packs: prev.packs.map(pack =>
        pack.id === packId ? { ...pack, ...updates } : pack
      ),
    }));
  }, []);

  /**
   * 更新指定单体的数据
   */
  const updateCell = useCallback((
    packId: string,
    cellId: string,
    updates: Partial<BatteryClusterDataLevel2['packs'][0]['cells'][0]>
  ) => {
    setData(prev => ({
      ...prev,
      packs: prev.packs.map(pack =>
        pack.id === packId
          ? {
              ...pack,
              cells: pack.cells.map(cell =>
                cell.id === cellId ? { ...cell, ...updates } : cell
              ),
            }
          : pack
      ),
    }));
  }, []);

  return {
    data,
    updateData,
    updateHighVoltageBox,
    updatePack,
    updateCell,
  };
}
