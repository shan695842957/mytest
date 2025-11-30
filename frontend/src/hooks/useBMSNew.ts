/**
 * BMS数据管理Hook - 新版本
 * 
 * 提供实时数据更新接口
 */

import { useState, useCallback } from 'react';
import type {
  BatteryStack,
  BatteryClusterLevel2,
  DataField,
} from '@/types/bms-new';

/**
 * 三级架构BMS Hook
 */
export function useLevel3BMS(initialData: BatteryStack) {
  const [data, setData] = useState<BatteryStack>(initialData);

  // 更新整个电池堆数据
  const updateData = useCallback((newData: BatteryStack) => {
    setData(newData);
  }, []);

  // 更新总高压箱字段
  const updateMainHighVoltageBoxFields = useCallback((fields: DataField[]) => {
    setData(prev => ({
      ...prev,
      mainHighVoltageBox: {
        ...prev.mainHighVoltageBox,
        fields,
      },
    }));
  }, []);

  // 更新总高压箱断路器
  const updateMainHighVoltageBoxBreaker = useCallback((breaker: BatteryStack['mainHighVoltageBox']['breaker']) => {
    setData(prev => ({
      ...prev,
      mainHighVoltageBox: {
        ...prev.mainHighVoltageBox,
        breaker,
      },
    }));
  }, []);

  // 更新总高压箱故障
  const updateMainHighVoltageBoxFault = useCallback((fault: boolean, faultMessage?: string) => {
    setData(prev => ({
      ...prev,
      mainHighVoltageBox: {
        ...prev.mainHighVoltageBox,
        fault,
        faultMessage,
      },
    }));
  }, []);

  // 更新簇高压箱字段
  const updateClusterHighVoltageBoxFields = useCallback((
    clusterId: string,
    fields: DataField[]
  ) => {
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
    }));
  }, []);

  // 更新簇高压箱断路器
  const updateClusterHighVoltageBoxBreaker = useCallback((
    clusterId: string,
    breaker: BatteryStack['clusters'][0]['highVoltageBox']['breaker']
  ) => {
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
    }));
  }, []);

  // 更新簇高压箱故障
  const updateClusterHighVoltageBoxFault = useCallback((
    clusterId: string,
    fault: boolean,
    faultMessage?: string
  ) => {
    setData(prev => ({
      ...prev,
      clusters: prev.clusters.map(cluster =>
        cluster.id === clusterId
          ? {
              ...cluster,
              highVoltageBox: {
                ...cluster.highVoltageBox,
                fault,
                faultMessage,
              },
            }
          : cluster
      ),
    }));
  }, []);

  // 更新包字段
  const updatePackFields = useCallback((
    clusterId: string,
    packId: string,
    fields: DataField[]
  ) => {
    setData(prev => ({
      ...prev,
      clusters: prev.clusters.map(cluster =>
        cluster.id === clusterId
          ? {
              ...cluster,
              packs: cluster.packs.map(pack =>
                pack.id === packId ? { ...pack, fields } : pack
              ),
            }
          : cluster
      ),
    }));
  }, []);

  // 更新包故障
  const updatePackFault = useCallback((
    clusterId: string,
    packId: string,
    fault: boolean,
    faultMessage?: string
  ) => {
    setData(prev => ({
      ...prev,
      clusters: prev.clusters.map(cluster =>
        cluster.id === clusterId
          ? {
              ...cluster,
              packs: cluster.packs.map(pack =>
                pack.id === packId
                  ? { ...pack, fault, faultMessage }
                  : pack
              ),
            }
          : cluster
      ),
    }));
  }, []);

  // 更新单体字段
  const updateCellFields = useCallback((
    clusterId: string,
    packId: string,
    cellId: string,
    fields: DataField[]
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
                        cell.id === cellId ? { ...cell, fields } : cell
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
    updateMainHighVoltageBoxFields,
    updateMainHighVoltageBoxBreaker,
    updateMainHighVoltageBoxFault,
    updateClusterHighVoltageBoxFields,
    updateClusterHighVoltageBoxBreaker,
    updateClusterHighVoltageBoxFault,
    updatePackFields,
    updatePackFault,
    updateCellFields,
  };
}

/**
 * 二级架构BMS Hook
 */
export function useLevel2BMS(initialData: BatteryClusterLevel2) {
  const [data, setData] = useState<BatteryClusterLevel2>(initialData);

  // 更新整个电池簇数据
  const updateData = useCallback((newData: BatteryClusterLevel2) => {
    setData(newData);
  }, []);

  // 更新簇高压箱字段
  const updateHighVoltageBoxFields = useCallback((fields: DataField[]) => {
    setData(prev => ({
      ...prev,
      highVoltageBox: {
        ...prev.highVoltageBox,
        fields,
      },
    }));
  }, []);

  // 更新簇高压箱断路器
  const updateHighVoltageBoxBreaker = useCallback((breaker: BatteryClusterLevel2['highVoltageBox']['breaker']) => {
    setData(prev => ({
      ...prev,
      highVoltageBox: {
        ...prev.highVoltageBox,
        breaker,
      },
    }));
  }, []);

  // 更新簇高压箱故障
  const updateHighVoltageBoxFault = useCallback((fault: boolean, faultMessage?: string) => {
    setData(prev => ({
      ...prev,
      highVoltageBox: {
        ...prev.highVoltageBox,
        fault,
        faultMessage,
      },
    }));
  }, []);

  // 更新包字段
  const updatePackFields = useCallback((
    packId: string,
    fields: DataField[]
  ) => {
    setData(prev => ({
      ...prev,
      packs: prev.packs.map(pack =>
        pack.id === packId ? { ...pack, fields } : pack
      ),
    }));
  }, []);

  // 更新包故障
  const updatePackFault = useCallback((
    packId: string,
    fault: boolean,
    faultMessage?: string
  ) => {
    setData(prev => ({
      ...prev,
      packs: prev.packs.map(pack =>
        pack.id === packId ? { ...pack, fault, faultMessage } : pack
      ),
    }));
  }, []);

  // 更新单体字段
  const updateCellFields = useCallback((
    packId: string,
    cellId: string,
    fields: DataField[]
  ) => {
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
    }));
  }, []);

  return {
    data,
    updateData,
    updateHighVoltageBoxFields,
    updateHighVoltageBoxBreaker,
    updateHighVoltageBoxFault,
    updatePackFields,
    updatePackFault,
    updateCellFields,
  };
}

