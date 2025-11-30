import { useMemo, useState } from 'react';
import { useLevel3BMSFrame } from '@/hooks/useBMSMonitor';
import type { BatteryClusterNode, BatteryPackNode, CellTelemetry } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Activity,
  Battery,
  Hexagon,
  Map,
  Share2,
  Thermometer,
  Zap,
  ShieldCheck,
} from 'lucide-react';

const formatValue = (value?: number, unit?: string, fraction = 1) =>
  typeof value === 'number' ? `${value.toFixed(fraction)}${unit ?? ''}` : '--';

const Pill = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
    {label} · {value}
  </span>
);

const ContactorLegend = ({ description }: { description: string }) => (
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <span className="size-2 rounded-full bg-emerald-400" />
    {description}
  </div>
);

const CellsBoard = ({ pack }: { pack?: BatteryPackNode }) => {
  if (!pack) return (
    <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
      请选择电池包
    </div>
  );
  return (
    <ScrollArea className="max-h-[360px] rounded-xl border">
      <div
        className="grid gap-2 p-4"
        style={{ gridTemplateColumns: `repeat(${Math.min(pack.layout.series, 10)}, minmax(72px, 1fr))` }}
      >
        {pack.cells.map((cell) => (
          <div
            key={cell.id}
            className={cn(
              'rounded-lg border p-2 text-[11px] transition',
              cell.status === 'fault'
                ? 'border-red-400 bg-red-50/70 text-red-700'
                : cell.status === 'warning'
                  ? 'border-amber-400 bg-amber-50/70 text-amber-700'
                  : 'border-emerald-400 bg-emerald-50/70 text-emerald-700',
            )}
          >
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>{cell.id}</span>
              <Badge variant="secondary" className="text-[10px]">
                {cell.series + 1}S/{cell.parallel + 1}P
              </Badge>
            </div>
            <div className="mt-1 space-y-0.5">
              <p>V: {cell.voltage.toFixed(3)}</p>
              <p>T: {cell.temperature ? `${cell.temperature.toFixed(1)}℃` : '—'}</p>
              <p>SOC: {cell.soc ? `${cell.soc.toFixed(1)}%` : '—'}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

const TemperatureBoard = ({ pack }: { pack?: BatteryPackNode }) => {
  if (!pack) return null;
  return (
    <div className="space-y-2">
      {pack.temperatureProbes.map((probe) => (
        <div
          key={probe.id}
          className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Thermometer className="size-4" />
            <div>
              <p className="font-medium leading-tight">{probe.label}</p>
              <p className="text-xs">{probe.position ?? '未知位置'}</p>
            </div>
          </div>
          <Badge
            variant={probe.status === 'fault' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {probe.value ? `${probe.value.toFixed(1)}℃` : '无数据'}
          </Badge>
        </div>
      ))}
    </div>
  );
};

export default function BMSLevel3InsightPage() {
  const { frame } = useLevel3BMSFrame();
  const clusters = frame.stack.clusters;
  const [clusterId, setClusterId] = useState(() => clusters[0]?.id);
  const selectedCluster: BatteryClusterNode | undefined = useMemo(
    () => clusters.find((cluster) => cluster.id === clusterId) ?? clusters[0],
    [clusters, clusterId],
  );

  const [packId, setPackId] = useState(() => selectedCluster?.packs[0]?.id);
  const selectedPack: BatteryPackNode | undefined = useMemo(
    () => selectedCluster?.packs.find((pack) => pack.id === packId) ?? selectedCluster?.packs[0],
    [selectedCluster, packId],
  );

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">BMS Level 3</p>
          <h1 className="text-2xl font-semibold leading-tight">电池堆分层总览</h1>
          <p className="text-sm text-muted-foreground">
            堆→簇→包→单体的串并联逻辑与高压箱状态。一切指标可通过 window.BMSLevel3Channel.setFrame() 实时刷新。
          </p>
        </div>
        <Badge variant="outline" className="space-x-2 text-sm">
          <Activity className="size-3.5" />
          <span>{frame.site ?? '未知站点'}</span>
          <span>·</span>
          <span>{new Date(frame.updatedAt).toLocaleTimeString()}</span>
        </Badge>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Map className="size-4" />
              拓扑摘要
            </CardTitle>
            <CardDescription>Stack Layout</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Pill label="簇" value={`${frame.stack.topology.clusterCount}`} />
              <Pill label="每簇包" value={`${frame.stack.topology.packsPerCluster}`} />
              <Pill label="单包单体" value={`${frame.stack.topology.cellsPerPack}`} />
              <Pill label="串并联" value={frame.stack.topology.seriesParallel} />
            </div>
            <div className="text-xs text-muted-foreground">
              供应商：{frame.stack.topology.vendor}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="size-4" />
              堆高压箱
            </CardTitle>
            <CardDescription>Stack HV Box</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">电压</p>
                <p className="text-lg font-semibold">{formatValue(frame.stack.hvBox.voltage, 'V')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">电流</p>
                <p className="text-lg font-semibold">{formatValue(frame.stack.hvBox.current, 'A')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">功率</p>
                <p className="text-lg font-semibold">{formatValue(frame.stack.hvBox.power, 'kW')}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <ContactorLegend description="正极接触器恒定闭合" />
              <ContactorLegend description="负极接触器恒定闭合" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">负载均衡</p>
              <Progress value={frame.stack.hvBox.loadBalance ?? 0} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="size-4" />
              保护状态
            </CardTitle>
            <CardDescription>Safety Matrix</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              {(frame.stack.hvBox.protections ?? []).map((item) => (
                <Badge key={item} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
            {frame.stack.hvBox.shortCircuitGuard === false ? (
              <div className="rounded border border-red-200 bg-red-50/80 px-3 py-2 text-xs text-red-600">
                短路保护未激活
              </div>
            ) : (
              <div className="rounded border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-700">
                短路保护在线
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[360px,1fr]">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Hexagon className="size-4" />
              簇选择
            </CardTitle>
            <CardDescription>Cluster Navigator</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[540px] pr-3">
              <div className="space-y-3">
                {clusters.map((cluster) => (
                  <button
                    key={cluster.id}
                    type="button"
                    onClick={() => {
                      setClusterId(cluster.id);
                      setPackId(cluster.packs[0]?.id);
                    }}
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
                      <Badge variant={cluster.connectionMode === 'connected' ? 'default' : 'secondary'}>
                        {cluster.connectionMode === 'connected' ? '已并联' : '已隔离'}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">簇压</p>
                        <p className="font-semibold">{formatValue(cluster.hvBox.voltage, 'V')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">簇流</p>
                        <p className="font-semibold">{formatValue(cluster.hvBox.current, 'A')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">SOH</p>
                        <p className="font-semibold">{formatValue(cluster.hvBox.soh, '%')}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">簇数据</CardTitle>
              <CardDescription>Selected Cluster</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">电压</p>
                  <p className="text-lg font-semibold">
                    {formatValue(selectedCluster?.hvBox.voltage, 'V')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">电流</p>
                  <p className="text-lg font-semibold">
                    {formatValue(selectedCluster?.hvBox.current, 'A')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">SOC</p>
                  <p className="text-lg font-semibold">
                    {formatValue(selectedCluster?.hvBox.soc, '%')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">SOH</p>
                  <p className="text-lg font-semibold">
                    {formatValue(selectedCluster?.hvBox.soh, '%')}
                  </p>
                </div>
              </div>
              <Separator />
              <ScrollArea className="max-h-[220px]">
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
                          {pack.layout.series}S{pack.layout.parallel}P
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">电压</p>
                          <p className="font-semibold">
                            {formatValue(pack.summary.voltage, 'V')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">电流</p>
                          <p className="font-semibold">
                            {formatValue(pack.summary.current, 'A')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">健康</p>
                          <p className="font-semibold">
                            {formatValue(pack.summary.healthIndex, '%')}
                          </p>
                        </div>
                      </div>
                      {pack.hvBox.fault ? (
                        <p className="mt-2 text-xs text-red-500">{pack.hvBox.fault}</p>
                      ) : null}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Share2 className="size-4" />
                包明细
              </CardTitle>
              <CardDescription>Pack Detail</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="cells">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="cells">单体矩阵</TabsTrigger>
                  <TabsTrigger value="temperature">温度测点</TabsTrigger>
                </TabsList>
                <TabsContent value="cells" className="mt-4">
                  <CellsBoard pack={selectedPack} />
                </TabsContent>
                <TabsContent value="temperature" className="mt-4">
                  <TemperatureBoard pack={selectedPack} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

