import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { EnergyFlowPanel } from '@/components/energy-flow';
import {
  Activity,
  AlertTriangle,
  Bolt,
  Gauge,
  ShieldCheck,
  Thermometer,
} from 'lucide-react';

type PCSMode = 'charging' | 'discharging' | 'standby' | 'fault';

interface PCSData {
  mode: PCSMode;
  gridStatus: 'grid-tied' | 'islanded';
  frequency: number;
  acVoltage: {
    ab: number;
    bc: number;
    ca: number;
  };
  acPhaseVoltage: {
    a: number;
    b: number;
    c: number;
  };
  acCurrent: {
    a: number;
    b: number;
    c: number;
  };
  acPower: {
    active: number;
    reactive: number;
    apparent: number;
    factor: number;
  };
  dc: {
    voltage: number;
    bus: number;
    current: number;
    power: number;
    soc: number;
    temperature: number;
  };
  health: {
    availability: number;
    efficiency: number;
    loadFactor: number;
    coolantTemp: number;
    alarms: number;
  };
}

interface DeviceInfo {
  id: string;
  name: string;
  ratedPowerKw: number;
}

interface EventLog {
  id: string;
  deviceId: string;
  level: 'info' | 'warning' | 'alarm';
  message: string;
  timestamp: string;
}

const DEVICES: DeviceInfo[] = [
  { id: 'pcs-east', name: '东区 PCS-01', ratedPowerKw: 500 },
  { id: 'pcs-west', name: '西区 PCS-02', ratedPowerKw: 500 },
  { id: 'pcs-north', name: '北区 PCS-03', ratedPowerKw: 750 },
];

const MODE_LABELS: Record<PCSMode, string> = {
  charging: '充电',
  discharging: '放电',
  standby: '待机',
  fault: '故障',
};

const MODE_BADGE_VARIANT: Record<PCSMode, 'secondary' | 'default' | 'outline' | 'destructive'> = {
  charging: 'default',
  discharging: 'secondary',
  standby: 'outline',
  fault: 'destructive',
};

function generateMockData(prev?: PCSData): PCSData {
  const modePool: PCSMode[] = ['charging', 'discharging', 'charging', 'charging', 'standby'];
  const baseMode = prev?.mode ?? 'charging';
  const nextMode =
    Math.random() > 0.85 ? modePool[Math.floor(Math.random() * modePool.length)] : baseMode;

  const frequency = 50 + (Math.random() - 0.5) * 0.2;
  const acVoltageBase = 380 + (Math.random() - 0.5) * 10;
  const dcVoltageBase = 720 + (Math.random() - 0.5) * 30;
  const dcCurrentBase = nextMode === 'charging' ? -(80 + Math.random() * 40) : 80 + Math.random() * 40;
  const dcPower = (dcVoltageBase * dcCurrentBase) / 1000;

  return {
    mode: nextMode,
    gridStatus: Math.random() > 0.1 ? 'grid-tied' : 'islanded',
    frequency,
    acVoltage: {
      ab: acVoltageBase + (Math.random() - 0.5) * 8,
      bc: acVoltageBase + (Math.random() - 0.5) * 8,
      ca: acVoltageBase + (Math.random() - 0.5) * 8,
    },
    acPhaseVoltage: {
      a: 220 + (Math.random() - 0.5) * 8,
      b: 220 + (Math.random() - 0.5) * 8,
      c: 220 + (Math.random() - 0.5) * 8,
    },
    acCurrent: {
      a: 65 + (Math.random() - 0.5) * 15,
      b: 65 + (Math.random() - 0.5) * 15,
      c: 65 + (Math.random() - 0.5) * 15,
    },
    acPower: {
      active: nextMode === 'charging' ? -550 + Math.random() * -80 : 550 + Math.random() * 80,
      reactive: (Math.random() - 0.5) * 120,
      apparent: 550 + Math.random() * 80,
      factor: 0.94 + (Math.random() - 0.5) * 0.03,
    },
    dc: {
      voltage: dcVoltageBase,
      bus: dcVoltageBase + (Math.random() - 0.5) * 15,
      current: dcCurrentBase,
      power: dcPower,
      soc: Math.min(100, Math.max(0, (prev?.dc.soc ?? 82) + (Math.random() - 0.5) * 1.5)),
      temperature: 28 + Math.random() * 6,
    },
    health: {
      availability: 99.5 + Math.random() * 0.3,
      efficiency: 95 + Math.random() * 2,
      loadFactor: 72 + Math.random() * 15,
      coolantTemp: 32 + Math.random() * 5,
      alarms: Math.random() > 0.92 ? 1 : 0,
    },
  };
}

const formatTime = (date: Date) =>
  `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date
    .getSeconds()
    .toString()
    .padStart(2, '0')}`;

function useMockPCSData(devices: DeviceInfo[]) {
  const [dataMap, setDataMap] = useState<Record<string, PCSData>>(() =>
    Object.fromEntries(devices.map((device) => [device.id, generateMockData()])),
  );
  const [events, setEvents] = useState<EventLog[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDataMap((prev) => {
        const nextEntries = Object.entries(prev).map(([id, snapshot]) => [
          id,
          generateMockData(snapshot),
        ]);
        return Object.fromEntries(nextEntries);
      });

      setEvents((prevEvents) => {
        const randomDevice = devices[Math.floor(Math.random() * devices.length)];
        const eventTypeRoll = Math.random();
        const level = eventTypeRoll > 0.95 ? 'alarm' : eventTypeRoll > 0.8 ? 'warning' : 'info';
        const messages: Record<EventLog['level'], string[]> = {
          info: ['功率调度指令已同步', 'PCS 完成一次周期自检', '直流母线温度正常', '功率平衡稳定'],
          warning: ['AC 相电压出现波动', '频率偏离 0.12Hz，已调节', '冷却循环效率下降'],
          alarm: ['直流电流峰值超限', '系统检测到孤岛模式', 'PCS 故障待人工确认'],
        };
        const messagePool = messages[level];
        const message = messagePool[Math.floor(Math.random() * messagePool.length)];
        const newEvent: EventLog = {
          id: `${Date.now()}`,
          deviceId: randomDevice.id,
          level,
          message,
          timestamp: formatTime(new Date()),
        };
        const updated = [newEvent, ...prevEvents];
        return updated.slice(0, 6);
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [devices]);

  return { dataMap, events };
}

function MetricRow({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 font-semibold">
        <span>{value}</span>
        {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
    </div>
  );
}

export default function PCSEnergyMonitorPage() {
  const [deviceId, setDeviceId] = useState(DEVICES[0].id);
  const { dataMap, events } = useMockPCSData(DEVICES);
  const deviceData = dataMap[deviceId];
  const device = DEVICES.find((item) => item.id === deviceId)!;

  const energyFlowProps = useMemo(() => {
    if (!deviceData) return null;
    return {
      direction: deviceData.mode === 'discharging' ? 'discharge' : 'charge',
      gridSide: {
        title: 'Grid',
        subtitle: 'AC',
        metrics: [
          { label: 'Line Voltage', value: deviceData.acVoltage.ab.toFixed(1), unit: 'V' },
          { label: 'Phase Current', value: deviceData.acCurrent.a.toFixed(1), unit: 'A' },
          { label: 'Frequency', value: deviceData.frequency.toFixed(2), unit: 'Hz' },
          { label: 'Active Power', value: Math.abs(deviceData.acPower.active).toFixed(0), unit: 'kW' },
        ],
      },
      batterySide: {
        title: 'Battery Array',
        subtitle: 'DC',
        metrics: [
          { label: 'Voltage', value: deviceData.dc.voltage.toFixed(1), unit: 'V' },
          { label: 'Current', value: deviceData.dc.current.toFixed(1), unit: 'A' },
          { label: 'SOC', value: deviceData.dc.soc.toFixed(1), unit: '%' },
          { label: 'Temperature', value: deviceData.dc.temperature.toFixed(1), unit: '℃' },
        ],
      },
      pcs: {
        title: 'PCS',
        status: MODE_LABELS[deviceData.mode],
        efficiency: deviceData.health.efficiency,
        metrics: [
          { label: 'Load Factor', value: `${deviceData.health.loadFactor.toFixed(0)}%` },
          { label: 'PF', value: deviceData.acPower.factor.toFixed(2) },
        ],
      },
    };
  }, [deviceData]);

  if (!deviceData || !energyFlowProps) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>PCS 展示</CardTitle>
            <CardDescription>正在准备模拟数据...</CardDescription>
          </CardHeader>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Activity className="mx-auto mb-4 size-8 animate-pulse" />
            初始化中
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredEvents = events.filter((event) => event.deviceId === deviceId);

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">测试面板 / PCS</p>
          <h1 className="text-2xl font-semibold leading-tight">PCS 实时展示</h1>
          <p className="text-sm text-muted-foreground">
            模拟展示储能变流器（PCS）的实时运行态势，包含 AC/ DC 指标、设备健康和事件流
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            机型额定功率
            <div className="text-foreground text-lg font-semibold">{device.ratedPowerKw} kW</div>
          </div>
          <Select value={deviceId} onValueChange={setDeviceId}>
            <SelectTrigger className="w-[210px]">
              <SelectValue placeholder="选择 PCS" />
            </SelectTrigger>
            <SelectContent>
              {DEVICES.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">运行状态</CardTitle>
            <CardDescription>Mode / Grid</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">运行模式</p>
                <div className="flex items-center gap-3">
                  <Badge variant={MODE_BADGE_VARIANT[deviceData.mode]} className="text-sm">
                    {MODE_LABELS[deviceData.mode]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{device.name}</span>
                </div>
              </div>
              <ShieldCheck className="size-5 text-muted-foreground" />
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-xs text-muted-foreground">并网状态</p>
                <span className="font-semibold">
                  {deviceData.gridStatus === 'grid-tied' ? '并网' : '孤岛运行'}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">频率</p>
                <span className="font-semibold">{deviceData.frequency.toFixed(2)} Hz</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">可用容量</CardTitle>
            <CardDescription>负荷 / 效率</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">负荷占比</span>
              <span className="font-semibold">{deviceData.health.loadFactor.toFixed(0)}%</span>
            </div>
            <Progress value={deviceData.health.loadFactor} />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">系统效率</span>
              <span className="font-semibold">{deviceData.health.efficiency.toFixed(1)}%</span>
            </div>
            <Progress value={deviceData.health.efficiency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">冷却与告警</CardTitle>
            <CardDescription>Coolant / Alarm</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Thermometer className="size-4" />
                冷却回路温度
              </div>
              <span className="font-semibold">{deviceData.health.coolantTemp.toFixed(1)} ℃</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="size-4" />
                活动告警
              </div>
              <Badge variant={deviceData.health.alarms ? 'destructive' : 'secondary'}>
                {deviceData.health.alarms ? `${deviceData.health.alarms} 条` : '无'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>能量流向</CardTitle>
          <CardDescription>AC ↔ DC 实时功率流跟踪</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/80 p-4">
            <EnergyFlowPanel
              direction={energyFlowProps.direction}
              gridSide={energyFlowProps.gridSide}
              batterySide={energyFlowProps.batterySide}
              pcs={energyFlowProps.pcs}
              title="PCS Energy Flow"
              flowSpeedMs={2600}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>交流 / 直流指标</CardTitle>
            <CardDescription>关键量测对比</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ac">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ac">交流侧</TabsTrigger>
                <TabsTrigger value="dc">直流侧</TabsTrigger>
              </TabsList>
              <TabsContent value="ac" className="mt-4 space-y-2">
                <MetricRow label="AB 线电压" value={deviceData.acVoltage.ab.toFixed(1)} unit="V" />
                <MetricRow label="BC 线电压" value={deviceData.acVoltage.bc.toFixed(1)} unit="V" />
                <MetricRow label="CA 线电压" value={deviceData.acVoltage.ca.toFixed(1)} unit="V" />
                <Separator />
                <MetricRow label="A 相电流" value={deviceData.acCurrent.a.toFixed(1)} unit="A" />
                <MetricRow label="B 相电流" value={deviceData.acCurrent.b.toFixed(1)} unit="A" />
                <MetricRow label="C 相电流" value={deviceData.acCurrent.c.toFixed(1)} unit="A" />
                <Separator />
                <MetricRow
                  label="有功功率"
                  value={deviceData.acPower.active.toFixed(0)}
                  unit="kW"
                />
                <MetricRow
                  label="无功功率"
                  value={deviceData.acPower.reactive.toFixed(0)}
                  unit="kVar"
                />
                <MetricRow
                  label="功率因数"
                  value={deviceData.acPower.factor.toFixed(2)}
                />
              </TabsContent>
              <TabsContent value="dc" className="mt-4 space-y-2">
                <MetricRow label="电池电压" value={deviceData.dc.voltage.toFixed(1)} unit="V" />
                <MetricRow label="母线电压" value={deviceData.dc.bus.toFixed(1)} unit="V" />
                <Separator />
                <MetricRow label="直流电流" value={deviceData.dc.current.toFixed(1)} unit="A" />
                <MetricRow label="直流功率" value={deviceData.dc.power.toFixed(1)} unit="kW" />
                <Separator />
                <MetricRow label="SOC" value={deviceData.dc.soc.toFixed(1)} unit="%" />
                <MetricRow label="温度" value={deviceData.dc.temperature.toFixed(1)} unit="℃" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>事件流 & 健康洞察</CardTitle>
            <CardDescription>最新 6 条事件</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-xs text-muted-foreground">可用率</p>
                <div className="text-lg font-semibold">
                  {deviceData.health.availability.toFixed(2)}%
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Gauge className="size-4" />
                近 24 小时
              </div>
            </div>
            <div className="space-y-3">
              {filteredEvents.length === 0 ? (
                <div className="flex items-center gap-3 rounded-lg border p-3 text-sm text-muted-foreground">
                  <Bolt className="size-4" />
                  暂无新事件，保持监控
                </div>
              ) : (
                filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 rounded-lg border p-3 text-sm"
                  >
                    <Badge
                      variant={
                        event.level === 'alarm'
                          ? 'destructive'
                          : event.level === 'warning'
                            ? 'default'
                            : 'secondary'
                      }
                      className="shrink-0"
                    >
                      {event.level === 'alarm'
                        ? '告警'
                        : event.level === 'warning'
                          ? '提示'
                          : '信息'}
                    </Badge>
                    <div className="space-y-1">
                      <p className="font-medium leading-snug">{event.message}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Activity className="size-3.5" />
                        {event.timestamp}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

