/**
 * BMS数据管理Hook
 * 提供数据更新接口供外部调用
 * 支持动态字段数组格式
 */

import { useState, useCallback } from 'react';
import {
  BatteryStackData,
  BatteryClusterDataLevel2,
  DataField,
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
   * 更新总高压箱的字段数组
   */
  const updateMainHighVoltageBoxFields = useCallback((fields: DataField[]) => {
    setData(prev => ({
      ...prev,
      mainHighVoltageBox: {
        ...prev.mainHighVoltageBox,
        fields,
      },
    }));
  }, []);

  /**
   * 更新总高压箱的断路器状态
   */
  const updateMainHighVoltageBoxBreaker = useCallback((breaker: BatteryStackData['mainHighVoltageBox']['breaker']) => {
    setData(prev => ({
      ...prev,
      mainHighVoltageBox: {
        ...prev.mainHighVoltageBox,
        breaker,
      },
    }));
  }, []);

  /**
   * 更新总高压箱的故障状态
   */
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

  /**
   * 更新指定簇的高压箱字段数组
   */
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

  /**
   * 更新指定簇的高压箱断路器状态
   */
  const updateClusterHighVoltageBoxBreaker = useCallback((
    clusterId: string,
    breaker: BatteryStackData['clusters'][0]['highVoltageBox']['breaker']
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

  /**
   * 更新指定簇的高压箱故障状态
   */
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

  /**
   * 更新指定包的字段数组
   */
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

  /**
   * 更新指定包的故障状态
   */
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

  /**
   * 更新指定单体的字段数组
   */
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
export function useLevel2BMS(initialData: BatteryClusterDataLevel2) {
  const [data, setData] = useState<BatteryClusterDataLevel2>(initialData);

  /**
   * 更新整个电池簇数据
   */
  const updateData = useCallback((newData: BatteryClusterDataLevel2) => {
    setData(newData);
  }, []);

  /**
   * 更新簇高压箱的字段数组
   */
  const updateHighVoltageBoxFields = useCallback((fields: DataField[]) => {
    setData(prev => ({
      ...prev,
      highVoltageBox: {
        ...prev.highVoltageBox,
        fields,
      },
    }));
  }, []);

  /**
   * 更新簇高压箱的断路器状态
   */
  const updateHighVoltageBoxBreaker = useCallback((breaker: BatteryClusterDataLevel2['highVoltageBox']['breaker']) => {
    setData(prev => ({
      ...prev,
      highVoltageBox: {
        ...prev.highVoltageBox,
        breaker,
      },
    }));
  }, []);

  /**
   * 更新簇高压箱的故障状态
   */
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

  /**
   * 更新指定包的字段数组
   */
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

  /**
   * 更新指定包的故障状态
   */
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

  /**
   * 更新指定单体的字段数组
   */
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
