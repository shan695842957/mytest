export type ContactorSchema =
  | {
      scheme: 'dual';
      positiveClosed?: boolean;
      negativeClosed?: boolean;
    }
  | {
      scheme: 'single';
      mainClosed?: boolean;
    };

export interface HvBoxReading {
  voltage?: number;
  current?: number;
  power?: number;
  soc?: number;
  soh?: number;
  temperature?: number;
  fault?: string | null;
  protections?: string[];
  contactors?: ContactorSchema;
  remarks?: string;
}

export interface CellTelemetry {
  id: string;
  series: number;
  parallel: number;
  voltage: number;
  temperature?: number;
  soc?: number;
  soh?: number;
  status: 'normal' | 'warning' | 'fault';
}

export interface TemperatureProbe {
  id: string;
  label: string;
  value?: number;
  position?: string;
  status: 'normal' | 'warning' | 'fault';
}

export interface BatteryPackNode {
  id: string;
  name: string;
  layout: {
    series: number;
    parallel: number;
  };
  hvBox: HvBoxReading;
  summary: {
    voltage?: number;
    current?: number;
    healthIndex?: number;
  };
  temperatureProbes: TemperatureProbe[];
  cells: CellTelemetry[];
}

export interface BatteryClusterNode {
  id: string;
  name: string;
  hvBox: HvBoxReading;
  packs: BatteryPackNode[];
  connectionMode: 'connected' | 'isolated';
}

export interface BatteryStackNode {
  id: string;
  name: string;
  hvBox: HvBoxReading & {
    loadBalance?: number;
    shortCircuitGuard?: boolean;
  };
  clusters: BatteryClusterNode[];
  topology: {
    clusterCount: number;
    packsPerCluster: number;
    cellsPerPack: number;
    seriesParallel: string;
    vendor: string;
  };
}

export interface Level3BMSFrame {
  stack: BatteryStackNode;
  site?: string;
  updatedAt: string;
}

export interface Level2BMSFrame {
  cluster: BatteryClusterNode;
  descriptor: {
    name: string;
    packs: number;
    cells: number;
    vendor: string;
  };
  updatedAt: string;
}

export interface Level3BMSChannel {
  setFrame(frame: Level3BMSFrame): void;
}

export interface Level2BMSChannel {
  setFrame(frame: Level2BMSFrame): void;
}

declare global {
  interface Window {
    BMSLevel3Channel?: Level3BMSChannel;
    BMSLevel2Channel?: Level2BMSChannel;
  }
}

export {};
