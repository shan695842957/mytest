import { useEffect, useMemo, useState } from 'react';
import type { BatteryPackSnapshot } from '@/types';
import { useLevel2BMSMonitor } from '@/hooks/useBMSMonitor';
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
import { AlertCircle, Battery, Thermometer, Cable, Target } from 'lucide-react';

const formatNumber = (value?: number, unit?: string, fraction = 1) =>
  typeof value === 'number' ? `${value.toFixed(fraction)}${unit ?? ''}` : '--';

const PackMetric = ({
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

export default function BMSLevel2MonitorPage() {
  const { snapshot } = useLevel2BMSMonitor();
  const packs = snapshot.cluster.packs;
  const [packId, setPackId] = useState(() => packs[0]?.id);

  useEffect(() => {
    if (!packs.find((pack) => pack.id === packId)) {
      setPackId(packs[0]?.id);
    }
  }, [packs, packId]);

  const selectedPack: BatteryPackSnapshot | undefined = useMemo(
    () => packs.find((pack) => pack.id === packId),
    [packs, packId],
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">测试面板 / BMS 二级架构</p>
          <h1 className="text-2xl font-semibold leading-tight">二级架构 BMS 展示</h1>
          <p className="text-sm text-muted-foreground">
            对外呈现为单簇架构，展示簇高压箱、电池包、单体与温度测点数据
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {snapshot.metadata.name} · {new Date(snapshot.updatedAt).toLocaleTimeString()}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Cable className="size-4" />
              架构概览
            </CardTitle>
            <CardDescription>Architecture</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">电池包</p>
              <p className="text-lg font-semibold">{snapshot.metadata.packCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">总单体</p>
              <p className="text-lg font-semibold">{snapshot.metadata.cellCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">供应商</p>
              <p className="text-lg font-semibold">{snapshot.metadata.supplier}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="size-4" />
              簇高压箱
            </CardTitle>
            <CardDescription>Cluster HV</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-4 gap-3">
              <PackMetric label="电压" value={snapshot.cluster.hvBox.voltage} unit="V" />
              <PackMetric label="电流" value={snapshot.cluster.hvBox.current} unit="A" />
              <PackMetric label="SOC" value={snapshot.cluster.hvBox.soc} unit="%" />
              <PackMetric label="SOH" value={snapshot.cluster.hvBox.soh} unit="%" />
            </div>
            <Separator />
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  snapshot.cluster.hvBox.contactors?.positiveClosed ? 'default' : 'secondary'
                }
              >
                正接触器 {snapshot.cluster.hvBox.contactors?.positiveClosed ? '合闸' : '分闸'}
              </Badge>
              <Badge
                variant={
                  snapshot.cluster.hvBox.contactors?.negativeClosed ? 'default' : 'secondary'
                }
              >
                负接触器 {snapshot.cluster.hvBox.contactors?.negativeClosed ? '合闸' : '分闸'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="size-4" />
              告警
            </CardTitle>
            <CardDescription>Alarms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {snapshot.cluster.hvBox.faultMessage ? (
              <div className="rounded border border-red-200 bg-red-50/80 p-3 text-red-600">
                {snapshot.cluster.hvBox.faultMessage}
              </div>
            ) : (
              <div className="rounded border p-3 text-muted-foreground">无簇级告警</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>电池包列表</CardTitle>
          <CardDescription>Pack Overview</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[280px]">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {packs.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => setPackId(pack.id)}
                  className={cn(
                    'rounded-xl border p-3 text-left transition hover:border-primary',
                    pack.id === selectedPack?.id && 'border-primary bg-primary/5',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{pack.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {pack.seriesParallel.series}S{pack.seriesParallel.parallel}P
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {pack.cells.length} 单体
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <PackMetric label="电压" value={pack.voltage} unit="V" />
                    <PackMetric label="电流" value={pack.current} unit="A" />
                    <PackMetric label="SOC" value={pack.soc} unit="%" />
                  </div>
                  {pack.faultMessage ? (
                    <p className="mt-2 text-xs text-red-500">{pack.faultMessage}</p>
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
              <Battery className="size-4" />
              {selectedPack?.name ?? '未选择电池包'}
            </CardTitle>
            <CardDescription>Cells & Temperature</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="cells">
              <TabsList className="w-full">
                <TabsTrigger value="cells" className="flex-1">
                  单体
                </TabsTrigger>
                <TabsTrigger value="temperature" className="flex-1">
                  温度测点
                </TabsTrigger>
              </TabsList>
              <TabsContent value="cells" className="mt-4">
                <ScrollArea className="max-h-[360px] rounded-lg border">
                  <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-5">
                    {selectedPack?.cells.map((cell) => (
                      <div
                        key={cell.id}
                        className={cn(
                          'rounded border p-2 text-xs',
                          cell.status === 'alarm'
                            ? 'border-red-400 bg-red-50/60 text-red-600'
                            : cell.status === 'warning'
                              ? 'border-amber-400 bg-amber-50/60 text-amber-600'
                              : 'border-emerald-400 bg-emerald-50/60 text-emerald-700',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{cell.id}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {cell.seriesIndex + 1}S/{cell.parallelIndex + 1}P
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-col gap-0.5">
                          <span>V: {formatNumber(cell.voltage, 'V', 3)}</span>
                          <span>T: {cell.temperature ? `${cell.temperature.toFixed(1)}℃` : '--'}</span>
                          <span>SOC: {cell.soc ? `${cell.soc.toFixed(1)}%` : '--'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="temperature" className="mt-4">
                <ScrollArea className="max-h-[360px] rounded-lg border">
                  <div className="space-y-2 p-4">
                    {selectedPack?.temperatureProbes.map((probe) => (
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
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>健康与效率</CardTitle>
            <CardDescription>Health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">健康指数</p>
              <Progress value={selectedPack?.healthIndex ?? 0} className="mt-1" />
              <p className="mt-1 text-right text-xs">
                {formatNumber(selectedPack?.healthIndex, '%', 1)}
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">接触器</p>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedPack?.hvBox?.contactors?.mainClosed ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  主接触器 {selectedPack?.hvBox?.contactors?.mainClosed ? '合' : '分'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

