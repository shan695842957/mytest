import type {
  Level2BMSSnapshot,
  Level3BMSSnapshot,
  BatteryClusterSnapshot,
  BatteryPackSnapshot,
  CellSnapshot,
} from '@/types';

const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const createCells = (series: number, parallel: number): CellSnapshot[] => {
  const cells: CellSnapshot[] = [];
  for (let s = 0; s < series; s += 1) {
    for (let p = 0; p < parallel; p += 1) {
      const voltage = randomInRange(3.3, 3.6) + (Math.random() > 0.92 ? (Math.random() > 0.5 ? 0.7 : -0.7) : 0);
      const tempAvailable = Math.random() > 0.35;
      const hasSoc = Math.random() > 0.4;

      let status: CellSnapshot['status'] = 'normal';
      if (voltage < 3.0 || voltage > 4.2) status = 'alarm';
      else if (voltage < 3.1 || voltage > 4.1) status = 'warning';

      cells.push({
        id: `C-${s + 1}-${p + 1}`,
        seriesIndex: s,
        parallelIndex: p,
        voltage: Number(voltage.toFixed(3)),
        temperature: tempAvailable ? Number(randomInRange(22, 38).toFixed(1)) : undefined,
        soc: hasSoc ? Number(randomInRange(70, 95).toFixed(1)) : undefined,
        soh: hasSoc ? Number(randomInRange(90, 99).toFixed(1)) : undefined,
        status,
        note: !tempAvailable ? '无温度测点' : undefined,
      });
    }
  }
  return cells;
};

const createPack = (id: number, series: number, parallel: number): BatteryPackSnapshot => {
  const voltage = randomInRange(110, 125);
  const current = randomInRange(-35, 35);
  const health = randomInRange(85, 99);
  const faultMessage = Math.random() > 0.92 ? '单体一致性偏差超过阈值' : null;
  return {
    id: `PACK-${id}`,
    name: `电池包 ${id}`,
    seriesParallel: { series, parallel },
    hvBox: {
      voltage,
      current,
      power: Number((voltage * current).toFixed(1)),
      soc: Number(randomInRange(70, 96).toFixed(1)),
      soh: Number(randomInRange(92, 99).toFixed(1)),
      contactors: { mainClosed: Math.random() > 0.08 },
      protections: ['过压', '欠压', '过流'].slice(0, Math.floor(Math.random() * 3)),
      faultMessage,
    },
    voltage,
    current,
    power: Number((voltage * current).toFixed(1)),
    soc: Number(randomInRange(72, 94).toFixed(1)),
    healthIndex: Number(health.toFixed(1)),
    faultMessage,
    cells: createCells(series, parallel),
    temperatureProbes: Array.from({ length: 6 }).map((_, idx) => {
      const value = Math.random() > 0.15 ? Number(randomInRange(24, 40).toFixed(1)) : undefined;
      return {
        id: `TP-${id}-${idx + 1}`,
        name: `测点 ${idx + 1}`,
        value,
        status: value && value > 45 ? 'alarm' : 'normal',
      };
    }),
  };
};

const createCluster = (
  id: number,
  packCount: number,
  series: number,
  parallel: number,
): BatteryClusterSnapshot => {
  const packs = Array.from({ length: packCount }).map((_, idx) =>
    createPack(idx + 1, series, parallel),
  );
  const voltage = packs.reduce((sum, pack) => sum + (pack.voltage ?? 0), 0);
  const current = randomInRange(-120, 120);

  return {
    id: `CLUSTER-${id}`,
    name: `电池簇 ${id}`,
    isConnected: Math.random() > 0.05,
    hvBox: {
      voltage: Number(voltage.toFixed(1)),
      current: Number(current.toFixed(1)),
      power: Number((voltage * current).toFixed(1)),
      soc: Number(randomInRange(70, 95).toFixed(1)),
      soh: Number(randomInRange(90, 99).toFixed(1)),
      contactors: { positiveClosed: Math.random() > 0.15, negativeClosed: Math.random() > 0.1 },
      faultMessage: Math.random() > 0.9 ? '簇绝缘监测异常' : null,
    },
    packs,
  };
};

export const createMockLevel3Snapshot = (): Level3BMSSnapshot => {
  const clusterCount = 3;
  const packPerCluster = 4;
  const series = 30;
  const parallel = 2;

  const clusters = Array.from({ length: clusterCount }).map((_, idx) =>
    createCluster(idx + 1, packPerCluster, series, parallel),
  );

  const stackVoltage = clusters.reduce((sum, cluster) => sum + (cluster.hvBox.voltage ?? 0), 0);
  const stackCurrent = randomInRange(-200, 200);

  return {
    stack: {
      id: 'STACK-01',
      name: '1# 电池堆',
      hvBox: {
        voltage: Number(stackVoltage.toFixed(1)),
        current: Number(stackCurrent.toFixed(1)),
        power: Number((stackVoltage * stackCurrent).toFixed(1)),
        soc: Number(randomInRange(72, 94).toFixed(1)),
        soh: Number(randomInRange(92, 99).toFixed(1)),
        loadBalance: Number(randomInRange(92, 99).toFixed(1)),
        shortCircuitProtected: Math.random() > 0.02,
        contactors: { positiveClosed: true, negativeClosed: true },
        protections: ['短路保护', '过压保护', '绝缘检测'],
      },
      clusters,
      configuration: {
        clusterCount,
        packCountPerCluster: packPerCluster,
        cellCountPerPack: series * parallel,
        seriesParallel: `${series}S${parallel}P`,
        supplier: pick(['力神', '宁德时代', '远景']),
      },
    },
    updatedAt: new Date().toISOString(),
    siteName: pick(['渝能储能', '交能集团', '东海岸储能']),
  };
};

export const createMockLevel2Snapshot = (): Level2BMSSnapshot => {
  const packCount = 6;
  const series = 28;
  const parallel = 3;
  const cluster = createCluster(1, packCount, series, parallel);
  return {
    cluster,
    metadata: {
      name: '二级架构簇 A',
      packCount,
      cellCount: packCount * series * parallel,
      supplier: pick(['瑞浦兰钧', '蜂巢能源']),
    },
    updatedAt: new Date().toISOString(),
  };
};
