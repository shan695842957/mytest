/**
 * BMS数据管理Hook
 * 
 * ============================================
 * 使用说明
 * ============================================
 * 
 * 本文件提供了三级架构和二级架构BMS的数据管理Hook。
 * 
 * 集成方式：
 * 1. 在你的组件中使用这些Hook：
 *    ```tsx
 *    import { useLevel3BMS } from '@/hooks/useBMSPage3';
 *    const bms = useLevel3BMS(initialData);
 *    ```
 * 
 * 2. 将更新接口暴露到 window.BMSAPI（可选，用于外部调用）：
 *    ```tsx
 *    useEffect(() => {
 *      window.BMSAPI = {
 *        level3: {
 *          updateMainHighVoltageBoxFields: bms.updateMainHighVoltageBoxFields,
 *          // ... 其他接口
 *        }
 *      };
 *    }, [bms]);
 *    ```
 * 
 * 3. 外部调用示例：
 *    ```javascript
 *    // 更新总高压箱字段数组
 *    window.BMSAPI.level3.updateMainHighVoltageBoxFields([
 *      { name: '总电压', value: 720.5, unit: 'V' },
 *      { name: '总电流', value: 150.3, unit: 'A' },
 *    ]);
 *    
 *    // 更新断路器状态
 *    window.BMSAPI.level3.updateMainHighVoltageBoxBreaker({ closed: true });
 *    
 *    // 更新包的字段数组
 *    window.BMSAPI.level3.updatePackFields('Cluster1', 'C1-P1', [
 *      { name: '包电压', value: 60.05, unit: 'V' },
 *    ]);
 *    
 *    // 更新单体的字段数组
 *    window.BMSAPI.level3.updateCellFields('Cluster1', 'C1-P1', 'C1-P1-Cell1', [
 *      { name: '电压', value: 3.7, unit: 'V' },
 *    ]);
 *    ```
 * 
 * 注意事项：
 * - 所有字段数组都支持多语言字段名
 * - 字段数量和类型完全由外部决定
 * - ID必须与实际数据中的ID匹配
 */

import { useState, useCallback } from 'react';
import {
  BatteryStackData,
  BatteryClusterDataLevel2,
  DataField,
} from '@/types/bms-page3';

/**
 * 三级架构BMS Hook
 * 
 * @param initialData 初始电池堆数据
 * @returns 数据对象和更新函数
 * 
 * @example
 * ```tsx
 * const bms = useLevel3BMS(initialData);
 * 
 * // 更新总高压箱字段
 * bms.updateMainHighVoltageBoxFields([
 *   { name: '总电压', value: 720.5, unit: 'V' },
 * ]);
 * ```
 */
export function useLevel3BMS(initialData: BatteryStackData) {
  const [data, setData] = useState<BatteryStackData>(initialData);

  /**
   * 更新整个电池堆数据
   * 
   * @param newData 新的电池堆数据
   */
  const updateData = useCallback((newData: BatteryStackData) => {
    setData(newData);
  }, []);

  /**
   * 更新总高压箱的字段数组
   * 
   * @param fields 字段数组
   * 
   * @example
   * ```javascript
   * updateMainHighVoltageBoxFields([
   *   { name: '总电压', value: 720.5, unit: 'V' },
   *   { name: '总电流', value: 150.3, unit: 'A' },
   *   { name: 'Grid Voltage', value: 720.5, unit: 'V' },
   * ]);
   * ```
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
   * 
   * @param breaker 断路器状态
   * 
   * @example
   * ```javascript
   * // 单个标志位
   * updateMainHighVoltageBoxBreaker({ closed: true });
   * 
   * // 正负极分别控制
   * updateMainHighVoltageBoxBreaker({
   *   positiveClosed: true,
   *   negativeClosed: true,
   * });
   * ```
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
   * 
   * @param fault 是否故障
   * @param faultMessage 故障信息（可选）
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
   * 
   * @param clusterId 簇ID
   * @param fields 字段数组
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
   * 
   * @param clusterId 簇ID
   * @param breaker 断路器状态
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
   * 
   * @param clusterId 簇ID
   * @param fault 是否故障
   * @param faultMessage 故障信息（可选）
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
   * 
   * @param clusterId 簇ID
   * @param packId 包ID
   * @param fields 字段数组
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
   * 
   * @param clusterId 簇ID
   * @param packId 包ID
   * @param fault 是否故障
   * @param faultMessage 故障信息（可选）
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
   * 
   * @param clusterId 簇ID
   * @param packId 包ID
   * @param cellId 单体ID
   * @param fields 字段数组
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
 * 
 * @param initialData 初始电池簇数据
 * @returns 数据对象和更新函数
 * 
 * @example
 * ```tsx
 * const bms = useLevel2BMS(initialData);
 * 
 * // 更新簇高压箱字段
 * bms.updateHighVoltageBoxFields([
 *   { name: 'Grid Voltage', value: 360.3, unit: 'V' },
 * ]);
 * ```
 */
export function useLevel2BMS(initialData: BatteryClusterDataLevel2) {
  const [data, setData] = useState<BatteryClusterDataLevel2>(initialData);

  /**
   * 更新整个电池簇数据
   * 
   * @param newData 新的电池簇数据
   */
  const updateData = useCallback((newData: BatteryClusterDataLevel2) => {
    setData(newData);
  }, []);

  /**
   * 更新簇高压箱的字段数组
   * 
   * @param fields 字段数组
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
   * 
   * @param breaker 断路器状态
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
   * 
   * @param fault 是否故障
   * @param faultMessage 故障信息（可选）
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
   * 
   * @param packId 包ID
   * @param fields 字段数组
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
   * 
   * @param packId 包ID
   * @param fault 是否故障
   * @param faultMessage 故障信息（可选）
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
   * 
   * @param packId 包ID
   * @param cellId 单体ID
   * @param fields 字段数组
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
