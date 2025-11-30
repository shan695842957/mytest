export type BreakerState =
  | {
      positiveClosed?: boolean;
      negativeClosed?: boolean;
      mainClosed?: never;
    }
  | {
      mainClosed?: boolean;
      positiveClosed?: never;
      negativeClosed?: never;
    };

export interface HvBoxSnapshot {
  voltage?: number;
  current?: number;
  power?: number;
  soc?: number;
  soh?: number;
  temperature?: number;
  faultMessage?: string | null;
  contactors?: BreakerState;
  protections?: string[];
  isIsolated?: boolean;
}

export interface CellSnapshot {
  id: string;
  seriesIndex: number;
  parallelIndex: number;
  voltage: number;
  temperature?: number;
  soc?: number;
  soh?: number;
  status: 'normal' | 'warning' | 'alarm';
  note?: string;
}

export interface TemperatureProbeSnapshot {
  id: string;
  name: string;
  value?: number;
  status: 'normal' | 'warning' | 'alarm';
}

export interface BatteryPackSnapshot {
  id: string;
  name: string;
  seriesParallel: {
    series: number;
    parallel: number;
  };
  hvBox?: HvBoxSnapshot;
  voltage?: number;
  current?: number;
  power?: number;
  soc?: number;
  soh?: number;
  healthIndex?: number;
  faultMessage?: string | null;
  cells: CellSnapshot[];
  temperatureProbes: TemperatureProbeSnapshot[];
}

export interface BatteryClusterSnapshot {
  id: string;
  name: string;
  hvBox: HvBoxSnapshot;
  isConnected: boolean;
  packs: BatteryPackSnapshot[];
}

export interface BatteryStackSnapshot {
  id: string;
  name: string;
  hvBox: HvBoxSnapshot & {
    loadBalance?: number;
    shortCircuitProtected?: boolean;
  };
  clusters: BatteryClusterSnapshot[];
  configuration: {
    clusterCount: number;
    packCountPerCluster: number;
    cellCountPerPack: number;
    seriesParallel: string;
    supplier: string;
  };
}

export interface Level3BMSSnapshot {
  stack: BatteryStackSnapshot;
  updatedAt: string;
  siteName?: string;
}

export interface Level2BMSSnapshot {
  cluster: BatteryClusterSnapshot;
  metadata: {
    name: string;
    packCount: number;
    cellCount: number;
    supplier: string;
  };
  updatedAt: string;
}

export interface BMSLevel3API {
  /**
   * 覆盖当前全部数据
   */
  setSnapshot(snapshot: Level3BMSSnapshot): void;
}

export interface BMSLevel2API {
  setSnapshot(snapshot: Level2BMSSnapshot): void;
}

declare global {
  interface Window {
    /**
     * AI 供调试使用的接口，可在浏览器控制台调用：
     * window.BMSLevel3API?.setSnapshot({...})
     */
    BMSLevel3API?: BMSLevel3API;
    BMSLevel2API?: BMSLevel2API;
  }
}

export {};
