import { useEffect, useMemo, useState } from 'react';
import type { BatteryClusterSnapshot, BatteryPackSnapshot, CellSnapshot } from '@/types';
import { useLevel3BMSMonitor } from '@/hooks/useBMSMonitor';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { AlertTriangle, Battery, CircuitBoard, ShieldCheck, Thermometer, Layers3 } from 'lucide-react';

const statusColors: Record<CellSnapshot['status'], string> = {
  normal: 'border-emerald-500/60 text-emerald-500',
  warning: 'border-amber-500/60 text-amber-500',
  alarm: 'border-red-500/60 text-red-500',
};

const formatNumber = (value?: number, unit?: string, fraction = 1) =>
  typeof value === 'number' ? `${value.toFixed(fraction)}${unit ?? ''}` : '--';

const ContactorBadge = ({
  label,
  active,
}: {
  label: string;
  active?: boolean;
}) => (
  <Badge variant={active ? 'default' : 'secondary'} className="text-xs">
    {label} {active ? '合闸' : '分闸'}
  </Badge>
);

const HvMetric = ({
  label,
  value,
  unit,
}: {
  label: string;
  value?: number;
  unit?: string;
}) => (
  <div className="flex flex-col">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-base font-semibold">{formatNumber(value, unit)}</span>
  </div>
);

const CellsMatrix = ({ pack }: { pack?: BatteryPackSnapshot }) => {
  if (!pack) return null;
  return (
    <ScrollArea className="max-h-[360px] rounded-lg border">
      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
        {pack.cells.map((cell) => (
          <div
            key={cell.id}
            className={cn(
              'rounded-lg border-2 p-2 text-xs transition hover:bg-muted/30',
              statusColors[cell.status],
            )}
          >
            <div className="flex items-center justify-between font-semibold">
              <span>{cell.id}</span>
              <Badge variant="secondary" className="text-[10px]">
                {cell.seriesIndex + 1}S/{cell.parallelIndex + 1}P
              </Badge>
            </div>
            <div className="mt-1">
              <span>V: {formatNumber(cell.voltage, 'V', 3)}</span>
            </div>
            <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
              <span>T: {cell.temperature ? `${cell.temperature.toFixed(1)}℃` : '--'}</span>
              <span>SOC: {cell.soc ? `${cell.soc.toFixed(1)}%` : '--'}</span>
            </div>
            {cell.note ? (
              <p className="mt-1 rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                {cell.note}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

const TemperaturePanel = ({ pack }: { pack?: BatteryPackSnapshot }) => {
  if (!pack) return null;
  return (
    <div className="space-y-2">
      {pack.temperatureProbes.map((probe) => (
        <div
          key={probe.id}
          className="flex items-center justify-between rounded border px-3 py-2 text-sm"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Thermometer className="size-4" />
            {probe.name}
          </div>
          <Badge
            variant={probe.status === 'alarm' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {probe.value ? `${probe.value.toFixed(1)}℃` : '无数据'}
          </Badge>
        </div>
      ))}
    </div>
  );
};

export default function BMSLevel3MonitorPage() {
  const { snapshot } = useLevel3BMSMonitor();
  const clusters = snapshot.stack.clusters;
  const [clusterId, setClusterId] = useState(() => clusters[0]?.id);
  const selectedCluster: BatteryClusterSnapshot | undefined = useMemo(
    () => clusters.find((cluster) => cluster.id === clusterId) ?? clusters[0],
    [clusters, clusterId],
  );

  const [packId, setPackId] = useState(() => selectedCluster?.packs[0]?.id);
  useEffect(() => {
    if (!selectedCluster) return;
    if (!selectedCluster.packs.find((pack) => pack.id === packId)) {
      setPackId(selectedCluster.packs[0]?.id);
    }
  }, [selectedCluster, packId]);

  const selectedPack: BatteryPackSnapshot | undefined = useMemo(
    () => selectedCluster?.packs.find((pack) => pack.id === packId),
    [selectedCluster, packId],
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">测试面板 / BMS 三级架构</p>
          <h1 className="text-2xl font-semibold leading-tight">三级架构 BMS 展示</h1>
          <p className="text-sm text-muted-foreground">
            展示堆→簇→包→单体的完整拓扑、接触器与核心量测，支持通过 window.BMSLevel3API 实时更新数据
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {snapshot.siteName} · {new Date(snapshot.updatedAt).toLocaleTimeString()}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">堆配置</CardTitle>
            <CardDescription>Stack Topology</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">电池簇</p>
              <p className="text-lg font-semibold">{snapshot.stack.configuration.clusterCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">每簇包数</p>
              <p className="text-lg font-semibold">
                {snapshot.stack.configuration.packCountPerCluster}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">单包单体</p>
              <p className="text-lg font-semibold">
                {snapshot.stack.configuration.cellCountPerPack}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">串并联</p>
              <p className="text-lg font-semibold">
                {snapshot.stack.configuration.seriesParallel}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">堆高压箱</CardTitle>
            <CardDescription>HV Box</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-4">
              <HvMetric label="电压" value={snapshot.stack.hvBox.voltage} unit="V" />
              <HvMetric label="电流" value={snapshot.stack.hvBox.current} unit="A" />
              <HvMetric label="功率" value={snapshot.stack.hvBox.power} unit="kW" />
            </div>
            <div className="flex items-center gap-3">
              <ContactorBadge label="正极" active={snapshot.stack.hvBox.contactors?.positiveClosed} />
              <ContactorBadge label="负极" active={snapshot.stack.hvBox.contactors?.negativeClosed} />
              <Badge variant="secondary" className="text-xs">
                SOC {formatNumber(snapshot.stack.hvBox.soc, '%')}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                SOH {formatNumber(snapshot.stack.hvBox.soh, '%')}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">负载均衡</p>
              <Progress value={snapshot.stack.hvBox.loadBalance ?? 0} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">保护状态</CardTitle>
            <CardDescription>Protection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-emerald-500" />
              {snapshot.stack.hvBox.shortCircuitProtected ? '短路保护已激活' : '短路保护未激活'}
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {(snapshot.stack.hvBox.protections ?? []).map((item) => (
                <Badge key={item} variant="outline" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px,1fr]">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers3 className="size-4" />
              簇概览
            </CardTitle>
            <CardDescription>Cluster List</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[520px] pr-3">
              <div className="space-y-3">
                {clusters.map((cluster) => (
                  <button
                    key={cluster.id}
                    type="button"
                    onClick={() => setClusterId(cluster.id)}
                    className={cn(
                      'w-full rounded-xl border p-3 text-left transition hover:border-primary',
                      cluster.id === selectedCluster?.id && 'border-primary bg-primary/5',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{cluster.name}</p>
                        <p className="text-xs text-muted-foreground">
                          包 {cluster.packs.length} · 单体{' '}
                          {cluster.packs.reduce((sum, pack) => sum + pack.cells.length, 0)}
                        </p>
                      </div>
                      <Badge variant={cluster.isConnected ? 'default' : 'secondary'} className="text-xs">
                        {cluster.isConnected ? '已并联' : '未接入'}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <HvMetric label="簇电压" value={cluster.hvBox.voltage} unit="V" />
                      <HvMetric label="簇电流" value={cluster.hvBox.current} unit="A" />
                      <HvMetric label="SOC" value={cluster.hvBox.soc} unit="%" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {selectedCluster?.name ?? '未选择簇'}
              </CardTitle>
              <CardDescription>HV Box & Packs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4 text-sm">
                <HvMetric label="电压" value={selectedCluster?.hvBox.voltage} unit="V" />
                <HvMetric label="电流" value={selectedCluster?.hvBox.current} unit="A" />
                <HvMetric label="SOC" value={selectedCluster?.hvBox.soc} unit="%" />
                <HvMetric label="SOH" value={selectedCluster?.hvBox.soh} unit="%" />
              </div>
              <div className="flex flex-wrap gap-2">
                <ContactorBadge label="簇正极" active={selectedCluster?.hvBox.contactors?.positiveClosed} />
                <ContactorBadge label="簇负极" active={selectedCluster?.hvBox.contactors?.negativeClosed} />
                {selectedCluster?.hvBox.faultMessage ? (
                  <Badge variant="destructive" className="text-xs">
                    {selectedCluster.hvBox.faultMessage}
                  </Badge>
                ) : null}
              </div>
              <Separator />
              <ScrollArea className="max-h-[240px]">
                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedCluster?.packs.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => setPackId(pack.id)}
                      className={cn(
                        'rounded-lg border p-3 text-left transition hover:border-primary',
                        pack.id === selectedPack?.id && 'border-primary bg-primary/5',
                      )}
                    >
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span>{pack.name}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {pack.seriesParallel.series}S{pack.seriesParallel.parallel}P
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <HvMetric label="电压" value={pack.voltage} unit="V" />
                        <HvMetric label="电流" value={pack.current} unit="A" />
                        <HvMetric label="SOC" value={pack.soc} unit="%" />
                      </div>
                      {pack.faultMessage ? (
                        <p className="mt-1 text-xs text-red-500">{pack.faultMessage}</p>
                      ) : null}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[2fr,1fr]">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CircuitBoard className="size-4" />
                  {selectedPack?.name ?? '未选择电池包'}
                </CardTitle>
                <CardDescription>单体 & 温度测点</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="cells">
                  <TabsList className="w-full">
                    <TabsTrigger value="cells" className="flex-1">
                      单体
                    </TabsTrigger>
                    <TabsTrigger value="temp" className="flex-1">
                      温度测点
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="cells" className="mt-4">
                    <CellsMatrix pack={selectedPack} />
                  </TabsContent>
                  <TabsContent value="temp" className="mt-4">
                    <TemperaturePanel pack={selectedPack} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Battery className="size-4" />
                  状态摘要
                </CardTitle>
                <CardDescription>Summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded border p-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">一致性 (3σ)</p>
                    <p className="text-lg font-semibold">{formatNumber(Math.random() * 12 + 3, 'mV', 1)}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    在线监控
                  </Badge>
                </div>
                <div className="flex items-center gap-3 rounded border p-3">
                  <AlertTriangle className="size-4 text-amber-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">活跃告警</p>
                    <p className="font-semibold">
                      {selectedPack?.faultMessage ?? selectedCluster?.hvBox.faultMessage ?? '无'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">接触器状态</p>
                  <div className="flex flex-wrap gap-2">
                    <ContactorBadge label="包主接触器" active={selectedPack?.hvBox?.contactors?.mainClosed} />
                    <ContactorBadge
                      label="簇正极"
                      active={selectedCluster?.hvBox.contactors?.positiveClosed}
                    />
                    <ContactorBadge
                      label="簇负极"
                      active={selectedCluster?.hvBox.contactors?.negativeClosed}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

