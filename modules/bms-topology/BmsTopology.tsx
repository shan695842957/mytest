import { useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import './styles.css';

/**
 * 统一的数据展示接口，方便把电压/电流/SOC 等数值传入组件。
 * 保持简单，父组件只需要把 label/value/unit 显示文本传进来即可。
 */
export interface ValueDatum {
  label?: string;
  value?: number | string;
  unit?: string;
  hint?: string;
}

/**
 * BMS 中所有节点（堆、簇、包、单体）都共享的健康状态。
 * 颜色可通过 statusPalette 自定义。
 */
export type NodeStatus = 'normal' | 'warning' | 'fault' | 'offline';

/**
 * 一条简单的状态指示，例如“正极接触器：合闸”。
 * value 可以放布尔、数字或字符串 —— 视觉上只做展示，不做逻辑判断。
 */
export interface NodeIndicator {
  label: string;
  status: NodeStatus;
  value?: number | string;
}

/**
 * 串并联描述。多数 BMS 项目会以 16S2P/2P15S 这类形式呈现。
 * 如果系列/并联信息无法准确表达，也可以直接传 text 来显示自定义内容。
 */
export interface ElectricalTopologyDescriptor {
  series?: number;
  parallel?: number;
  text?: string;
  hint?: string;
}

export interface VoltageRange {
  min?: number;
  max?: number;
}

/**
 * 高压箱信息块。这里会在 UI 中绘制成独立的小卡片，保证肉眼可见。
 */
export interface HvBoxDescriptor {
  title?: string;
  summary?: string;
  indicators?: NodeIndicator[];
  metrics?: ValueDatum[];
}

interface BmsNodeBase {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  badges?: string[];
  status?: NodeStatus;
  icon?: ReactNode;
  metrics?: ValueDatum[];
  indicators?: NodeIndicator[];
}

export interface BatteryCellNode extends BmsNodeBase {
  seriesIndex?: number;
  parallelIndex?: number;
  /** 单体电压，进度条会优先读取此字段；若未提供，会尝试从 metrics 中寻找。 */
  voltage?: number;
  /** 单体电压的告警范围（不同项目上下限不同，因此提供接口）。 */
  voltageRange?: VoltageRange;
}

export interface BatteryPackNode extends BmsNodeBase {
  topology?: ElectricalTopologyDescriptor;
  hvBox?: HvBoxDescriptor;
  temperatureSensors?: ValueDatum[];
  cells?: BatteryCellNode[];
}

export interface BatteryClusterNode extends BmsNodeBase {
  topology?: ElectricalTopologyDescriptor;
  hvBox?: HvBoxDescriptor;
  packs?: BatteryPackNode[];
}

export interface BatteryStackNode extends BmsNodeBase {
  topology?: ElectricalTopologyDescriptor;
  hvBox?: HvBoxDescriptor;
  clusters?: BatteryClusterNode[];
}

export type Variant = 'dark' | 'light';

export type StatusPalette = Partial<Record<NodeStatus, string>>;

interface VariantTokens {
  container: string;
  card: string;
  subtleCard: string;
  muted: string;
  badge: string;
  border: string;
  connectorColor: string;
  seriesColor: string;
  parallelColor: string;
}

const variantTokens: Record<Variant, VariantTokens> = {
  dark: {
    container: 'border-white/10 text-slate-100',
    card: 'bg-white/5 border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.45)]',
    subtleCard: 'bg-white/5 border-white/10',
    muted: 'text-slate-400',
    badge: 'bg-white/10 border-white/20 text-slate-100',
    border: 'border-white/20',
    connectorColor: 'rgba(148,163,184,0.55)',
    seriesColor: '#fb923c',
    parallelColor: '#0ea5e9',
  },
  light: {
    container: 'border-slate-200 text-slate-900',
    card: 'bg-white border-slate-200 shadow-[0_15px_60px_rgba(15,23,42,0.12)]',
    subtleCard: 'bg-slate-50 border-slate-200',
    muted: 'text-slate-500',
    badge: 'bg-slate-100 border-slate-200 text-slate-600',
    border: 'border-slate-300/70',
    connectorColor: 'rgba(148,163,184,0.45)',
    seriesColor: '#f97316',
    parallelColor: '#0ea5e9',
  },
};

const defaultStatusClasses: Record<NodeStatus, string> = {
  normal: 'border-emerald-400/50 bg-emerald-500/10 text-emerald-300',
  warning: 'border-amber-400/60 bg-amber-500/10 text-amber-400',
  fault: 'border-rose-400/60 bg-rose-500/10 text-rose-400',
  offline: 'border-slate-500/40 bg-slate-500/10 text-slate-400',
};

const statusLabel: Record<NodeStatus, string> = {
  normal: '正常',
  warning: '告警',
  fault: '故障',
  offline: '离线',
};

const cx = (...classes: Array<string | boolean | undefined | null>) =>
  classes.filter(Boolean).join(' ');

const defaultFormat = (value?: number | string): string => {
  if (value === undefined || value === null) return '--';
  if (typeof value === 'number') {
    const formatter = new Intl.NumberFormat('zh-CN', {
      maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 1,
      minimumFractionDigits: Math.abs(value) >= 100 ? 0 : 1,
    });
    return formatter.format(value);
  }
  return String(value);
};

/**
 * NodeCard 是所有节点（堆/簇/包/单体）的 UI 容器。
 * 根据 isExpandable/isExpanded 决定是否展示子层级，用 button 控制展开收起。
 */
const NodeCard = <T extends BmsNodeBase>({
  node,
  levelLabel,
  tokens,
  statusPalette,
  valueFormatter,
  isExpandable,
  isExpanded,
  onToggle,
  hvBox,
  topology,
  metaLines = [],
  children,
}: {
  node: T;
  levelLabel: string;
  tokens: VariantTokens;
  statusPalette?: StatusPalette;
  valueFormatter: (value?: number | string) => string;
  isExpandable?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  hvBox?: HvBoxDescriptor;
  topology?: ElectricalTopologyDescriptor;
  metaLines?: string[];
  children?: ReactNode;
}) => (
  <div className={cx('bms-node-card rounded-xl border px-3 py-3 md:px-4 md:py-4 transition-colors', tokens.card)}>
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <p className={cx('text-[11px] uppercase tracking-[0.35em]', tokens.muted)}>{levelLabel}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {node.icon}
          <p className="text-base font-semibold md:text-lg">{node.name}</p>
          {node.badges?.map((badge) => (
            <span
              key={badge}
              className={cx('rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide', tokens.badge)}
            >
              {badge}
            </span>
          ))}
        </div>
        {node.subtitle && <p className={cx('text-xs md:text-sm', tokens.muted)}>{node.subtitle}</p>}
        {topology && (
          <p className="text-xs uppercase tracking-[0.3em] text-current/80">
            {describeTopology(topology)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {node.status && (
          <span
            className={cx(
              'bms-status-chip rounded-full border px-3 py-1 text-xs font-semibold tracking-wide',
              statusPalette?.[node.status] ?? defaultStatusClasses[node.status],
            )}
          >
            {statusLabel[node.status]}
          </span>
        )}
        {isExpandable && (
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full border border-current/20 p-1 text-xs transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/50"
            aria-label={isExpanded ? '折叠节点' : '展开节点'}
          >
            <ChevronIcon direction={isExpanded ? 'up' : 'down'} />
          </button>
        )}
      </div>
    </div>

    {node.description && (
      <p className={cx('mt-2 text-sm leading-relaxed', tokens.muted)}>{node.description}</p>
    )}

    {metaLines.length > 0 && (
      <ul className="mt-3 flex flex-wrap gap-2 text-xs">
        {metaLines.map((line) => (
          <li
            key={line}
            className={cx('rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide', tokens.border)}
          >
            {line}
          </li>
        ))}
      </ul>
    )}

    {node.metrics && node.metrics.length > 0 && (
      <MetricList metrics={node.metrics} tokens={tokens} valueFormatter={valueFormatter} />
    )}

    {/* 高压箱被绘制成单独的彩色小卡片，确保随时能看到 HV 关键信息 */}
    {hvBox && (
      <HvBoxPanel
        descriptor={hvBox}
        tokens={tokens}
        statusPalette={statusPalette}
        valueFormatter={valueFormatter}
      />
    )}

    {node.indicators && node.indicators.length > 0 && (
      <IndicatorRow indicators={node.indicators} statusPalette={statusPalette} />
    )}

    {isExpanded && children && <div className="mt-4 space-y-3">{children}</div>}
  </div>
);

const MetricList = ({
  metrics,
  tokens,
  valueFormatter,
}: {
  metrics: ValueDatum[];
  tokens: VariantTokens;
  valueFormatter: (value?: number | string) => string;
}) => (
  <dl className="mt-3 grid gap-2 sm:grid-cols-2">
    {metrics.map((metric, idx) => (
      <div
        key={`${metric.label ?? idx}-${metric.unit ?? ''}`}
        className={cx('rounded-lg border px-2.5 py-2 text-xs md:text-sm', tokens.border, tokens.subtleCard)}
      >
        {metric.label && <dt className={cx('text-[10px] uppercase tracking-wider', tokens.muted)}>{metric.label}</dt>}
        <dd className="text-sm font-semibold md:text-base">
          {valueFormatter(metric.value)}
          {metric.unit && <span className={cx('ml-1 text-[11px]', tokens.muted)}>{metric.unit}</span>}
        </dd>
        {metric.hint && <p className={cx('text-[11px]', tokens.muted)}>{metric.hint}</p>}
      </div>
    ))}
  </dl>
);

/**
 * 高压箱卡片：包含一个醒目的 HV 徽章和 icon，让设备人员免费确认 HV 单独显示。
 */
const HvBoxPanel = ({
  descriptor,
  tokens,
  statusPalette,
  valueFormatter,
}: {
  descriptor: HvBoxDescriptor;
  tokens: VariantTokens;
  statusPalette?: StatusPalette;
  valueFormatter: (value?: number | string) => string;
}) => (
  <div className={cx('bms-hv-box mt-3 rounded-xl border px-3 py-2.5 text-xs md:text-sm', tokens.subtleCard, tokens.border)}>
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <HvIcon />
        <p className="font-semibold">{descriptor.title ?? '高压箱'}</p>
      </div>
      {descriptor.summary && <span className={cx('text-xs', tokens.muted)}>{descriptor.summary}</span>}
    </div>
    {descriptor.indicators && descriptor.indicators.length > 0 && (
      <IndicatorRow indicators={descriptor.indicators} statusPalette={statusPalette} compact />
    )}
    {descriptor.metrics && descriptor.metrics.length > 0 && (
      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
        {descriptor.metrics.map((metric, idx) => (
          <div key={`${metric.label ?? idx}-hv`} className="flex items-baseline justify-between gap-2">
            {metric.label && <dt className={cx('text-xs', tokens.muted)}>{metric.label}</dt>}
            <dd className="text-sm font-semibold">
              {valueFormatter(metric.value)}
              {metric.unit && <span className={cx('ml-1 text-xs', tokens.muted)}>{metric.unit}</span>}
            </dd>
          </div>
        ))}
      </dl>
    )}
  </div>
);

const IndicatorRow = ({
  indicators,
  statusPalette,
  compact,
}: {
  indicators: NodeIndicator[];
  statusPalette?: StatusPalette;
  compact?: boolean;
}) => (
  <div className={cx('mt-3 flex flex-wrap gap-2', compact && 'mt-2')}>
    {indicators.map((indicator) => (
      <div
        key={indicator.label}
        className={cx(
          'bms-indicator rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide',
          statusPalette?.[indicator.status] ?? defaultStatusClasses[indicator.status],
        )}
      >
        <span>{indicator.label}</span>
        {indicator.value !== undefined && <span className="ml-1 text-xs opacity-80">{indicator.value}</span>}
      </div>
    ))}
  </div>
);

const ConnectionLegend = ({
  label,
  type,
  hint,
}: {
  label: string;
  type: 'parallel' | 'series' | 'hybrid';
  hint?: string;
}) => (
  <div className={cx('bms-connection-legend text-[10px] uppercase tracking-[0.2em] md:text-[11px]', `bms-connection-legend--${type}`)}>
    <span>{label}</span>
    {hint && <span className="text-[10px] normal-case tracking-normal">{hint}</span>}
  </div>
);

const TemperatureList = ({
  sensors,
  tokens,
  valueFormatter,
}: {
  sensors: ValueDatum[];
  tokens: VariantTokens;
  valueFormatter: (value?: number | string) => string;
}) => (
  <div className={cx('rounded-2xl border px-3 py-2 text-xs', tokens.subtleCard, tokens.border)}>
    <p className={cx('text-[10px] uppercase tracking-[0.3em]', tokens.muted)}>温度测点</p>
    <div className="bms-temperature-grid mt-2">
      {sensors.map((sensor, idx) => (
        <div key={`${sensor.label ?? idx}-temp`} className="flex items-center justify-between gap-2">
          {sensor.label && <span className={cx('text-[11px]', tokens.muted)}>{sensor.label}</span>}
          <span className="font-semibold">
            {valueFormatter(sensor.value)}
            {sensor.unit && <span className={cx('ml-1 text-[11px]', tokens.muted)}>{sensor.unit}</span>}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const CellGrid = ({
  cells,
  tokens,
  statusPalette,
  valueFormatter,
}: {
  cells: BatteryCellNode[];
  tokens: VariantTokens;
  statusPalette?: StatusPalette;
  valueFormatter: (value?: number | string) => string;
}) => (
  <div className="bms-cell-grid">
    {cells.map((cell) => (
      <CellVoltageBar
        key={cell.id}
        cell={cell}
        tokens={tokens}
        statusPalette={statusPalette}
        valueFormatter={valueFormatter}
      />
    ))}
  </div>
);

const CellVoltageBar = ({
  cell,
  tokens,
  statusPalette,
  valueFormatter,
}: {
  cell: BatteryCellNode;
  tokens: VariantTokens;
  statusPalette?: StatusPalette;
  valueFormatter: (value?: number | string) => string;
}) => {
  const { min, max } = cell.voltageRange ?? {};
  const voltage = resolveCellVoltage(cell);
  const span = min !== undefined && max !== undefined && max > min ? max - min : undefined;
  const ratio =
    span !== undefined && typeof voltage === 'number'
      ? Math.max(0, Math.min(1, (voltage - (min ?? 0)) / span))
      : undefined;
  const outOfRange =
    typeof voltage === 'number' &&
    ((min !== undefined && voltage < min) || (max !== undefined && voltage > max));

  return (
    <div className={cx('bms-cell-bar rounded-lg border px-2.5 py-2 text-[11px]', tokens.subtleCard, tokens.border)}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{cell.name}</span>
        <div className="flex items-center gap-1">
          {cell.status && (
            <span
              className={cx(
                'bms-status-dot h-2 w-2 rounded-full border',
                statusPalette?.[cell.status] ?? defaultStatusClasses[cell.status],
              )}
            />
          )}
          {typeof voltage !== 'undefined' && (
            <span className="font-semibold">
              {valueFormatter(voltage)}
              <span className={cx('ml-0.5 text-[10px]', tokens.muted)}>V</span>
            </span>
          )}
        </div>
      </div>
      {(cell.seriesIndex !== undefined || cell.parallelIndex !== undefined) && (
        <p className={cx('mt-0.5 text-[10px]', tokens.muted)}>
          {cell.seriesIndex !== undefined && `串 #${cell.seriesIndex + 1}`}
          {cell.parallelIndex !== undefined && <span className="ml-1">并组 #{cell.parallelIndex + 1}</span>}
        </p>
      )}
      <div className="bms-cell-bar__track mt-1.5">
        <div
          className={cx('bms-cell-bar__fill', outOfRange && 'bms-cell-bar__fill--alert')}
          style={{ width: ratio !== undefined ? `${ratio * 100}%` : '100%' }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-current/70">
        <span>{min !== undefined ? `${valueFormatter(min)}V` : '下限未知'}</span>
        <span>{max !== undefined ? `${valueFormatter(max)}V` : '上限未知'}</span>
      </div>
    </div>
  );
};

const resolveCellVoltage = (cell: BatteryCellNode): number | undefined => {
  if (typeof cell.voltage === 'number') return cell.voltage;
  const metric = cell.metrics?.find((item) => {
    const label = item.label?.toLowerCase() ?? '';
    const unit = item.unit?.toLowerCase() ?? '';
    return label.includes('v') || label.includes('压') || unit.includes('v');
  });
  if (!metric) return undefined;
  if (typeof metric.value === 'number') return metric.value;
  const parsed = Number(metric.value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const ChevronIcon = ({ direction }: { direction: 'up' | 'down' }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    className={cx(direction === 'up' ? 'rotate-180' : '', 'transition-transform')}
  >
    <path
      d="M6 9l6 6 6-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HvIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" role="img" aria-hidden="true">
    <path
      d="M13 2L4 14h6l-1 8 9-12h-6z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const describeTopology = (topology?: ElectricalTopologyDescriptor) => {
  if (!topology) return undefined;
  if (topology.text) return topology.text;
  const parts: string[] = [];
  if (topology.series !== undefined) parts.push(`${topology.series}串`);
  if (topology.parallel !== undefined) parts.push(`${topology.parallel}并`);
  return parts.length > 0 ? parts.join(' · ') : undefined;
};

const aggregateThreeLevelTotals = (stacks: BatteryStackNode[]) => {
  let clusters = 0;
  let packs = 0;
  let cells = 0;
  stacks.forEach((stack) => {
    const clusterList = stack.clusters ?? [];
    clusters += clusterList.length;
    clusterList.forEach((cluster) => {
      const packList = cluster.packs ?? [];
      packs += packList.length;
      packList.forEach((pack) => {
        cells += pack.cells?.length ?? 0;
      });
    });
  });
  return { stacks: stacks.length, clusters, packs, cells };
};

const aggregateTwoLevelTotals = (clusters: BatteryClusterNode[]) => {
  let packs = 0;
  let cells = 0;
  clusters.forEach((cluster) => {
    const packList = cluster.packs ?? [];
    packs += packList.length;
    packList.forEach((pack) => {
      cells += pack.cells?.length ?? 0;
    });
  });
  return { clusters: clusters.length, packs, cells };
};

interface TopologyBaseProps {
  className?: string;
  style?: CSSProperties;
  variant?: Variant;
  statusPalette?: StatusPalette;
  defaultExpandedIds?: string[];
  valueFormatter?: (value?: number | string) => string;
  onNodeToggle?: (id: string, expanded: boolean) => void;
}

/**
 * 三级架构：堆 -> 簇 -> 包 -> 单体。
 */
export interface BmsThreeLevelTopologyProps extends TopologyBaseProps {
  title?: string;
  stacks: BatteryStackNode[];
}

export const BmsThreeLevelTopology = ({
  title = '三级 BMS 拓扑',
  stacks,
  className,
  style,
  variant = 'dark',
  statusPalette,
  defaultExpandedIds,
  valueFormatter = defaultFormat,
  onNodeToggle,
}: BmsThreeLevelTopologyProps) => {
  const tokens = variantTokens[variant];
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(defaultExpandedIds ?? []));

  const toggleNode = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      const willExpand = !next.has(id);
      if (willExpand) {
        next.add(id);
      } else {
        next.delete(id);
      }
      onNodeToggle?.(id, willExpand);
      return next;
    });
  };

  const totals = useMemo(() => aggregateThreeLevelTotals(stacks), [stacks]);
  const cssVars: CSSProperties = {
    '--bms-connector-color': tokens.connectorColor,
    '--bms-series-color': tokens.seriesColor,
    '--bms-parallel-color': tokens.parallelColor,
    ...style,
  };

  return (
    <section
      className={cx('bms-topology flex flex-col gap-5 rounded-3xl border bg-transparent p-4 md:p-5', tokens.container, className)}
      style={cssVars}
    >
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">{title}</p>
          <p className={cx('text-sm', tokens.muted)}>点击节点即可展开下一层，所有数据从 props 注入</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <StatBadge label="堆" value={totals.stacks} />
          <StatBadge label="簇" value={totals.clusters} />
          <StatBadge label="包" value={totals.packs} />
          <StatBadge label="单体" value={totals.cells} />
        </div>
      </header>

      <div className="space-y-5">
        {stacks.map((stack) => {
          const expandedStack = expanded.has(stack.id);
          return (
            <NodeCard
              key={stack.id}
              node={stack}
              levelLabel="Battery Stack"
              tokens={tokens}
              statusPalette={statusPalette}
              valueFormatter={valueFormatter}
              hvBox={stack.hvBox}
              topology={stack.topology}
              metaLines={stack.topology?.hint ? [stack.topology.hint] : []}
              isExpandable={(stack.clusters?.length ?? 0) > 0}
              isExpanded={expandedStack}
              onToggle={() => toggleNode(stack.id)}
            >
              {expandedStack && stack.clusters && stack.clusters.length > 0 && (
                <>
                  <ConnectionLegend
                    label="簇 · 并联"
                    type="parallel"
                    hint={stack.topology?.hint ?? '簇之间通过母排并联'}
                  />
                  <div className="bms-branch-grid">
                    {stack.clusters.map((cluster) => {
                      const clusterExpanded = expanded.has(cluster.id);
                      return (
                        <NodeCard
                          key={cluster.id}
                          node={cluster}
                          levelLabel="Battery Cluster"
                          tokens={tokens}
                          statusPalette={statusPalette}
                          valueFormatter={valueFormatter}
                          hvBox={cluster.hvBox}
                          topology={cluster.topology}
                          metaLines={cluster.topology?.hint ? [cluster.topology.hint] : undefined}
                          isExpandable={(cluster.packs?.length ?? 0) > 0}
                          isExpanded={clusterExpanded}
                          onToggle={() => toggleNode(cluster.id)}
                        >
                          {clusterExpanded && cluster.packs && cluster.packs.length > 0 && (
                            <>
                              <ConnectionLegend label="包 · 串联" type="series" hint="簇内部串联提升电压" />
                              <div className="bms-pack-row">
                                {cluster.packs.map((pack) => {
                                  const packExpanded = expanded.has(pack.id);
                                  return (
                                    <NodeCard
                                      key={pack.id}
                                      node={pack}
                                      levelLabel="Battery Pack"
                                      tokens={tokens}
                                      statusPalette={statusPalette}
                                      valueFormatter={valueFormatter}
                                      hvBox={pack.hvBox}
                                      topology={pack.topology}
                                      metaLines={pack.topology?.hint ? [pack.topology.hint] : undefined}
                                      isExpandable={(pack.cells?.length ?? 0) > 0}
                                      isExpanded={packExpanded}
                                      onToggle={() => toggleNode(pack.id)}
                                    >
                                      {pack.temperatureSensors && pack.temperatureSensors.length > 0 && (
                                        <TemperatureList
                                          sensors={pack.temperatureSensors}
                                          tokens={tokens}
                                          valueFormatter={valueFormatter}
                                        />
                                      )}
                                      {packExpanded && pack.cells && pack.cells.length > 0 && (
                                        <>
                                          <ConnectionLegend
                                            label="单体 · 串并"
                                            type="hybrid"
                                            hint={pack.topology?.text ?? '如 2S × 15P 等组合'}
                                          />
                                          <CellGrid
                                            cells={pack.cells}
                                            tokens={tokens}
                                            statusPalette={statusPalette}
                                            valueFormatter={valueFormatter}
                                          />
                                        </>
                                      )}
                                    </NodeCard>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </NodeCard>
                      );
                    })}
                  </div>
                </>
              )}
            </NodeCard>
          );
        })}
      </div>
    </section>
  );
};

/**
 * 二级架构：簇 -> 包 -> 单体。
 */
export interface BmsTwoLevelTopologyProps extends TopologyBaseProps {
  title?: string;
  clusters: BatteryClusterNode[];
}

export const BmsTwoLevelTopology = ({
  title = '二级 BMS 拓扑',
  clusters,
  className,
  style,
  variant = 'dark',
  statusPalette,
  defaultExpandedIds,
  valueFormatter = defaultFormat,
  onNodeToggle,
}: BmsTwoLevelTopologyProps) => {
  const tokens = variantTokens[variant];
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(defaultExpandedIds ?? []));

  const toggleNode = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      const willExpand = !next.has(id);
      if (willExpand) {
        next.add(id);
      } else {
        next.delete(id);
      }
      onNodeToggle?.(id, willExpand);
      return next;
    });
  };

  const totals = useMemo(() => aggregateTwoLevelTotals(clusters), [clusters]);
  const cssVars: CSSProperties = {
    '--bms-connector-color': tokens.connectorColor,
    '--bms-series-color': tokens.seriesColor,
    '--bms-parallel-color': tokens.parallelColor,
    ...style,
  };

  return (
    <section
      className={cx('bms-topology flex flex-col gap-5 rounded-3xl border bg-transparent p-4 md:p-5', tokens.container, className)}
      style={cssVars}
    >
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">{title}</p>
          <p className={cx('text-sm', tokens.muted)}>簇直接对外，包串联，包内再展示单体与温度点</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <StatBadge label="簇" value={totals.clusters} />
          <StatBadge label="包" value={totals.packs} />
          <StatBadge label="单体" value={totals.cells} />
        </div>
      </header>

      <div className="space-y-5">
        {clusters.map((cluster) => {
          const clusterExpanded = expanded.has(cluster.id);
          return (
            <NodeCard
              key={cluster.id}
              node={cluster}
              levelLabel='Cluster HV Box'
              tokens={tokens}
              statusPalette={statusPalette}
              valueFormatter={valueFormatter}
              hvBox={cluster.hvBox}
              topology={cluster.topology}
              metaLines={cluster.topology?.hint ? [cluster.topology.hint] : undefined}
              isExpandable={(cluster.packs?.length ?? 0) > 0}
              isExpanded={clusterExpanded}
              onToggle={() => toggleNode(cluster.id)}
            >
              {clusterExpanded && cluster.packs && cluster.packs.length > 0 && (
                <>
                  <ConnectionLegend label="包 · 串联" type="series" hint="所有包串联抬高电压" />
                  <div className="bms-pack-row">
                    {cluster.packs.map((pack) => {
                      const packExpanded = expanded.has(pack.id);
                      return (
                        <NodeCard
                          key={pack.id}
                          node={pack}
                          levelLabel="Battery Pack"
                          tokens={tokens}
                          statusPalette={statusPalette}
                          valueFormatter={valueFormatter}
                          hvBox={pack.hvBox}
                          topology={pack.topology}
                          metaLines={pack.topology?.hint ? [pack.topology.hint] : undefined}
                          isExpandable={(pack.cells?.length ?? 0) > 0}
                          isExpanded={packExpanded}
                          onToggle={() => toggleNode(pack.id)}
                        >
                          {pack.temperatureSensors && pack.temperatureSensors.length > 0 && (
                            <TemperatureList
                              sensors={pack.temperatureSensors}
                              tokens={tokens}
                              valueFormatter={valueFormatter}
                            />
                          )}
                          {packExpanded && pack.cells && pack.cells.length > 0 && (
                            <>
                              <ConnectionLegend
                                label="单体 · 串并"
                                type="hybrid"
                                hint={pack.topology?.text ?? '串并组合示意'}
                              />
                              <CellGrid
                                cells={pack.cells}
                                tokens={tokens}
                                statusPalette={statusPalette}
                                valueFormatter={valueFormatter}
                              />
                            </>
                          )}
                        </NodeCard>
                      );
                    })}
                  </div>
                </>
              )}
            </NodeCard>
          );
        })}
      </div>
    </section>
  );
};

const StatBadge = ({ label, value }: { label: string; value: number }) => (
  <span className="rounded-full border border-current/20 px-2.5 py-0.5 text-[11px] uppercase tracking-[0.2em]">
    {label} · {value}
  </span>
);
