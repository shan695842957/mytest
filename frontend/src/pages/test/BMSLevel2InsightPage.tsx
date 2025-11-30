import { useMemo, useState } from 'react';
import { useLevel2BMSFrame } from '@/hooks/useBMSMonitor';
import type { BatteryPackNode } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Activity, Battery, Cable, Layers, Target, Thermometer } from 'lucide-react';

const valueText = (value?: number, unit?: string, fraction = 1) =>
  typeof value === 'number' ? `${value.toFixed(fraction)}${unit ?? ''}` : '--';

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-lg font-semibold">{value}</p>
  </div>
);

const PackCard = ({
  pack,
  active,
  onSelect,
}: {
  pack: BatteryPackNode;
  active: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      'w-full rounded-xl border p-3 text-left transition hover:border-primary',
      active && 'border-primary bg-primary/5',
    )}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold">{pack.name}</p>
        <p className="text-xs text-muted-foreground">
          {pack.layout.series}S{pack.layout.parallel}P · 单体 {pack.cells.length}
        </p>
      </div>
      <Badge variant="secondary" className="text-[10px]">
        {pack.hvBox.contactors?.scheme === 'dual' ? '双接触器' : '单接触器'}
      </Badge>
    </div>
    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
      <Metric label="电压" value={valueText(pack.summary.voltage, 'V')} />
      <Metric label="电流" value={valueText(pack.summary.current, 'A')} />
      <Metric label="健康" value={valueText(pack.summary.healthIndex, '%')} />
    </div>
    {pack.hvBox.fault ? (
      <p className="mt-2 text-xs text-red-500">{pack.hvBox.fault}</p>
    ) : null}
  </button>
);

export default function BMSLevel2InsightPage() {
  const { frame } = useLevel2BMSFrame();
  const packs = frame.cluster.packs;
  const [packId, setPackId] = useState(() => packs[0]?.id);
  const selectedPack: BatteryPackNode | undefined = useMemo(
    () => packs.find((pack) => pack.id === packId) ?? packs[0],
    [packs, packId],
  );

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">BMS Level 2</p>
          <h1 className="text-2xl font-semibold leading-tight">单簇架构运行画板</h1>
          <p className="text-sm text-muted-foreground">
            一个簇、多个串联电池包。通过 window.BMSLevel2Channel.setFrame() 可注入真实数据。
          </p>
        </div>
        <Badge variant="outline" className="space-x-2 text-sm">
          <Activity className="size-3.5" />
          <span>{frame.descriptor.name}</span>
          <span>·</span>
          <span>{new Date(frame.updatedAt).toLocaleTimeString()}</span>
        </Badge>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="size-4" />
              拓扑信息
            </CardTitle>
            <CardDescription>Topology</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <Metric label="电池包数量" value={String(frame.descriptor.packs)} />
            <Metric label="单体数量" value={String(frame.descriptor.cells)} />
            <Metric label="供应商" value={frame.descriptor.vendor} />
            <Metric label="接触模式" value="簇对外" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="size-4" />
              簇高压箱
            </CardTitle>
            <CardDescription>Cluster HV</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-4 gap-3">
              <Metric label="电压" value={valueText(frame.cluster.hvBox.voltage, 'V')} />
              <Metric label="电流" value={valueText(frame.cluster.hvBox.current, 'A')} />
              <Metric label="SOC" value={valueText(frame.cluster.hvBox.soc, '%')} />
              <Metric label="SOH" value={valueText(frame.cluster.hvBox.soh, '%')} />
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge
                variant={
                  frame.cluster.hvBox.contactors?.scheme === 'dual'
                    ? frame.cluster.hvBox.contactors?.positiveClosed
                      ? 'default'
                      : 'secondary'
                    : frame.cluster.hvBox.contactors?.mainClosed
                      ? 'default'
                      : 'secondary'
                }
              >
                正接触器{' '}
                {frame.cluster.hvBox.contactors?.scheme === 'dual'
                  ? frame.cluster.hvBox.contactors?.positiveClosed
                    ? '合闸'
                    : '分闸'
                  : frame.cluster.hvBox.contactors?.mainClosed
                    ? '合闸'
                    : '分闸'}
              </Badge>
              {frame.cluster.hvBox.contactors?.scheme === 'dual' ? (
                <Badge
                  variant={frame.cluster.hvBox.contactors?.negativeClosed ? 'default' : 'secondary'}
                >
                  负接触器 {frame.cluster.hvBox.contactors?.negativeClosed ? '合闸' : '分闸'}
                </Badge>
              ) : null}
            </div>
            {frame.cluster.hvBox.fault ? (
              <div className="rounded border border-red-200 bg-red-50/80 px-3 py-2 text-xs text-red-600">
                {frame.cluster.hvBox.fault}
              </div>
            ) : (
              <div className="rounded border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-700">
                簇状态正常
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Cable className="size-4" />
              输电健康度
            </CardTitle>
            <CardDescription>Delivery</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">健康指数</p>
              <Progress value={selectedPack?.summary.healthIndex ?? 0} className="mt-1" />
              <p className="mt-1 text-right text-xs">
                {valueText(selectedPack?.summary.healthIndex, '%', 1)}
              </p>
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground">
              当前查看：{selectedPack?.name ?? '—'}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[360px,1fr]">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle>电池包列表</CardTitle>
            <CardDescription>Pack Selector</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[420px] pr-2">
              <div className="space-y-3">
                {packs.map((pack) => (
                  <PackCard
                    key={pack.id}
                    pack={pack}
                    active={pack.id === selectedPack?.id}
                    onSelect={() => setPackId(pack.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>包数据</CardTitle>
              <CardDescription>Pack Detail</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-4 gap-3">
                <Metric label="电压" value={valueText(selectedPack?.hvBox.voltage, 'V')} />
                <Metric label="电流" value={valueText(selectedPack?.hvBox.current, 'A')} />
                <Metric label="SOC" value={valueText(selectedPack?.hvBox.soc, '%')} />
                <Metric label="温度" value={valueText(selectedPack?.hvBox.temperature, '℃')} />
              </div>
              <Separator />
              <div className="text-xs text-muted-foreground">
                接触器：{' '}
                {selectedPack?.hvBox.contactors?.scheme === 'dual'
                  ? `正极${selectedPack?.hvBox.contactors?.positiveClosed ? '合' : '分'} / 负极${
                      selectedPack?.hvBox.contactors?.negativeClosed ? '合' : '分'
                    }`
                  : `主接触器${selectedPack?.hvBox.contactors?.mainClosed ? '合' : '分'}`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>单体与温度</CardTitle>
              <CardDescription>Cells & Probes</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="cells">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="cells">单体</TabsTrigger>
                  <TabsTrigger value="temperature">温度测点</TabsTrigger>
                </TabsList>
                <TabsContent value="cells" className="mt-4">
                  <ScrollArea className="max-h-[320px] rounded-lg border">
                    <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4">
                      {selectedPack?.cells.map((cell) => (
                        <div
                          key={cell.id}
                          className={cn(
                            'rounded border p-2 text-xs',
                            cell.status === 'fault'
                              ? 'border-red-400 bg-red-50/70 text-red-700'
                              : cell.status === 'warning'
                                ? 'border-amber-400 bg-amber-50/70 text-amber-700'
                                : 'border-emerald-400 bg-emerald-50/60 text-emerald-700',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{cell.id}</span>
                            <Badge variant="secondary" className="text-[10px]">
                              {cell.series + 1}S/{cell.parallel + 1}P
                            </Badge>
                          </div>
                          <div className="mt-1 space-y-0.5">
                            <span>V: {cell.voltage.toFixed(3)}</span>
                            <span>T: {cell.temperature ? `${cell.temperature.toFixed(1)}℃` : '—'}</span>
                            <span>SOC: {cell.soc ? `${cell.soc.toFixed(1)}%` : '—'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="temperature" className="mt-4">
                  <ScrollArea className="max-h-[320px] rounded-lg border">
                    <div className="space-y-2 p-4">
                      {selectedPack?.temperatureProbes.map((probe) => (
                        <div
                          key={probe.id}
                          className="flex items-center justify-between rounded border px-3 py-2 text-sm"
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
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

