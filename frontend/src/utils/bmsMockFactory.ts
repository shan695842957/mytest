import type {
  BatteryClusterNode,
  BatteryPackNode,
  CellTelemetry,
  Level2BMSFrame,
  Level3BMSFrame,
} from '@/types';

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

const pickOne = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

const buildCells = (series: number, parallel: number): CellTelemetry[] => {
  const cells: CellTelemetry[] = [];
  for (let s = 0; s < series; s += 1) {
    for (let p = 0; p < parallel; p += 1) {
      const voltage = randomRange(3.32, 3.58);
      const noisy = Math.random() > 0.92 ? (Math.random() > 0.5 ? 0.35 : -0.35) : 0;
      const value = Number((voltage + noisy).toFixed(3));
      let status: CellTelemetry['status'] = 'normal';
      if (value < 3.0 || value > 4.2) status = 'fault';
      else if (value < 3.1 || value > 4.1) status = 'warning';

      cells.push({
        id: `S${s + 1}-P${p + 1}`,
        series: s,
        parallel: p,
        voltage: value,
        temperature: Math.random() > 0.4 ? Number(randomRange(25, 42).toFixed(1)) : undefined,
        soc: Math.random() > 0.35 ? Number(randomRange(68, 94).toFixed(1)) : undefined,
        soh: Math.random() > 0.35 ? Number(randomRange(92, 99).toFixed(1)) : undefined,
        status,
      });
    }
  }
  return cells;
};

const buildPack = (index: number, series: number, parallel: number): BatteryPackNode => {
  const voltage = randomRange(110, 124);
  const current = randomRange(-35, 35);
  return {
    id: `PACK-${index}`,
    name: `电池包 ${index}`,
    layout: { series, parallel },
    hvBox: {
      voltage,
      current,
      power: Number((voltage * current).toFixed(1)),
      soc: Number(randomRange(72, 95).toFixed(1)),
      soh: Number(randomRange(92, 99).toFixed(1)),
      temperature: Number(randomRange(28, 38).toFixed(1)),
      contactors:
        Math.random() > 0.5
          ? { scheme: 'dual', positiveClosed: Math.random() > 0.1, negativeClosed: Math.random() > 0.1 }
          : { scheme: 'single', mainClosed: Math.random() > 0.12 },
      fault: Math.random() > 0.94 ? '包压异常波动' : null,
    },
    summary: { voltage, current, healthIndex: Number(randomRange(86, 99).toFixed(1)) },
    temperatureProbes: Array.from({ length: 6 }).map((_, idx) => {
      const value = Math.random() > 0.2 ? Number(randomRange(24, 44).toFixed(1)) : undefined;
      return {
        id: `TP-${index}-${idx + 1}`,
        label: `T${idx + 1}`,
        position: pickOne(['顶部', '中部', '底部']),
        value,
        status: value && value > 45 ? 'fault' : 'normal',
      };
    }),
    cells: buildCells(series, parallel),
  };
};

const buildCluster = (
  index: number,
  packCount: number,
  series: number,
  parallel: number,
): BatteryClusterNode => {
  const packs = Array.from({ length: packCount }).map((_, packIdx) =>
    buildPack(packIdx + 1, series, parallel),
  );
  const totalVoltage = packs.reduce((sum, pack) => sum + (pack.hvBox.voltage ?? 0), 0);
  const current = randomRange(-120, 120);
  return {
    id: `CLUSTER-${index}`,
    name: `电池簇 ${index}`,
    connectionMode: Math.random() > 0.05 ? 'connected' : 'isolated',
    hvBox: {
      voltage: Number(totalVoltage.toFixed(1)),
      current: Number(current.toFixed(1)),
      power: Number((totalVoltage * current).toFixed(1)),
      soc: Number(randomRange(70, 95).toFixed(1)),
      soh: Number(randomRange(90, 99).toFixed(1)),
      contactors: { scheme: 'dual', positiveClosed: Math.random() > 0.1, negativeClosed: Math.random() > 0.08 },
      fault: Math.random() > 0.9 ? '簇绝缘告警' : null,
    },
    packs,
  };
};

export const createMockLevel3Frame = (): Level3BMSFrame => {
  const clusterCount = 3;
  const packsPerCluster = 4;
  const series = 30;
  const parallel = 2;
  const clusters = Array.from({ length: clusterCount }).map((_, idx) =>
    buildCluster(idx + 1, packsPerCluster, series, parallel),
  );
  const stackVoltage = clusters.reduce((sum, cluster) => sum + (cluster.hvBox.voltage ?? 0), 0);
  const stackCurrent = randomRange(-220, 220);
  return {
    stack: {
      id: 'STACK-01',
      name: '一号电池堆',
      hvBox: {
        voltage: Number(stackVoltage.toFixed(1)),
        current: Number(stackCurrent.toFixed(1)),
        power: Number((stackVoltage * stackCurrent).toFixed(1)),
        soc: Number(randomRange(72, 94).toFixed(1)),
        soh: Number(randomRange(92, 99).toFixed(1)),
        loadBalance: Number(randomRange(90, 99).toFixed(1)),
        shortCircuitGuard: Math.random() > 0.03,
        contactors: { scheme: 'dual', positiveClosed: true, negativeClosed: true },
        protections: ['短路', '过压', '绝缘巡检'],
      },
      clusters,
      topology: {
        clusterCount,
        packsPerCluster,
        cellsPerPack: series * parallel,
        seriesParallel: `${series}S${parallel}P`,
        vendor: pickOne(['宁德时代', '中创新航', '蜂巢能源']),
      },
    },
    site: pickOne(['西南储能#1', '华东示范站', '渝能试验场']),
    updatedAt: new Date().toISOString(),
  };
};

export const createMockLevel2Frame = (): Level2BMSFrame => {
  const packs = 6;
  const series = 28;
  const parallel = 3;
  const cluster = buildCluster(1, packs, series, parallel);
  return {
    cluster,
    descriptor: {
      name: 'A01 簇',
      packs,
      cells: packs * series * parallel,
      vendor: pickOne(['鹏辉能源', '瑞浦兰钧']),
    },
    updatedAt: new Date().toISOString(),
  };
};
