import type { CSSProperties, ReactNode } from 'react';
import React, { useMemo } from 'react';
import './energy-flow.css';

/**
 * 交直流能量流向
 */
export type FlowDirection = 'charge' | 'discharge';

/**
 * 单条关键指标信息
 */
export interface EnergyFlowMetric {
  /** 指示信息，例如 "AC Power" */
  label: string;
  /** 数值内容（可直接传字符串，方便格式化） */
  value: string | number;
  /** 单位，可选 */
  unit?: string;
  /** 额外提示文字（例如"实时"/"预测"） */
  hint?: string;
}

export interface EnergySideConfig {
  /** 节点名称：例如"Grid""Battery Array" */
  title: string;
  /** 节点副标题，可用于展示"AC"/"DC"一类说明 */
  subtitle?: string;
  /** 自定义图标，若未传入则使用默认图标 */
  icon?: ReactNode;
  /** 节点下方需要渲染的指标列表 */
  metrics: EnergyFlowMetric[];
}

export interface PcsConfig {
  /** 中央 PCS 名称 */
  title?: string;
  /** 运行状态，如"待机""反送电" */
  status?: string;
  /** 效率（0-100），用于展示百分比 */
  efficiency?: number;
  /** 自定义图标 */
  icon?: ReactNode;
  /** 指标列表（展示在 PCS 下方） */
  metrics: EnergyFlowMetric[];
}

export interface EnergyFlowTheme {
  panelBackground: string;
  panelBorder: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  connectorTrack: string;
  nodeBackground: string;
  nodeBorder: string;
  badgeBackground: string;
}

export interface EnergyFlowPanelProps {
  /** 电能流动方向：charge 表示 AC->DC，discharge 表示 DC->AC */
  direction: FlowDirection;
  /** 网侧（交流侧）数据 */
  gridSide: EnergySideConfig;
  /** 直流侧（电池侧）数据 */
  batterySide: EnergySideConfig;
  /** PCS 中央节点数据 */
  pcs: PcsConfig;
  /** 模块标题，可不传 */
  title?: string;
  /** 自定义主题 token，未传部分会走默认值 */
  theme?: Partial<EnergyFlowTheme>;
  /** 自定义 class，用于追加 Tailwind/自定义样式 */
  className?: string;
  /** 内联 style，透传到根节点 */
  style?: CSSProperties;
  /** 控制流向动画速度（毫秒），默认 3200 */
  flowSpeedMs?: number;
}

const DEFAULT_THEME: EnergyFlowTheme = {
  panelBackground: 'rgba(8, 15, 40, 0.65)',
  panelBorder: 'rgba(79, 109, 155, 0.35)',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  accent: '#12F3C9',
  connectorTrack: 'rgba(148, 163, 184, 0.25)',
  nodeBackground: 'rgba(15, 23, 42, 0.65)',
  nodeBorder: 'rgba(148, 163, 184, 0.3)',
  badgeBackground: 'rgba(18, 243, 201, 0.12)',
};

const cx = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(' ');

const GridDefaultIcon = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" role="img" aria-hidden="true">
    <rect
      x="4.5"
      y="4.5"
      width="39"
      height="39"
      rx="9"
      fill="none"
      stroke="currentColor"
      strokeOpacity="0.4"
      strokeWidth="2"
    />
    <path
      d="M18 12v24M30 12v24M12 18h24M12 30h24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.8"
    />
  </svg>
);

const BatteryDefaultIcon = () => (
  <svg width="40" height="40" viewBox="0 0 48 48" role="img" aria-hidden="true">
    <rect
      x="9"
      y="11"
      width="30"
      height="26"
      rx="4"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <rect x="20" y="5" width="8" height="4" rx="1" fill="currentColor" />
    <path
      d="M17 17h14M17 23h14M17 29h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PcsDefaultIcon = () => (
  <svg width="56" height="56" viewBox="0 0 64 64" role="img" aria-hidden="true">
    <rect
      x="6"
      y="6"
      width="52"
      height="52"
      rx="12"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M20 44L44 20M32 40l12 4-4-12"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MetricList = ({ metrics }: { metrics: EnergyFlowMetric[] }) => {
  if (!metrics?.length) return null;
  return (
    <dl className="energy-flow-metric-list">
      {metrics.map((metric) => (
        <div key={metric.label} className="energy-flow-metric">
          <dt>{metric.label}</dt>
          <dd>
            <span className="metric-value">{metric.value}</span>
            {metric.unit ? <span className="metric-unit">{metric.unit}</span> : null}
          </dd>
          {metric.hint ? <span className="metric-hint">{metric.hint}</span> : null}
        </div>
      ))}
    </dl>
  );
};

export function EnergyFlowPanel({
  direction,
  gridSide,
  batterySide,
  pcs,
  title = 'Real-time Energy Flow',
  theme,
  className,
  style,
  flowSpeedMs = 3200,
}: EnergyFlowPanelProps) {
  const resolvedTheme = useMemo(
    () => ({
      ...DEFAULT_THEME,
      ...theme,
    }),
    [theme],
  );

  const cssVars: CSSProperties = useMemo(
    () => ({
      '--panel-bg': resolvedTheme.panelBackground,
      '--panel-border': resolvedTheme.panelBorder,
      '--text-primary': resolvedTheme.textPrimary,
      '--text-secondary': resolvedTheme.textSecondary,
      '--accent': resolvedTheme.accent,
      '--connector-track': resolvedTheme.connectorTrack,
      '--node-bg': resolvedTheme.nodeBackground,
      '--node-border': resolvedTheme.nodeBorder,
      '--badge-bg': resolvedTheme.badgeBackground,
      '--flow-speed': `${flowSpeedMs}ms`,
    }),
    [resolvedTheme, flowSpeedMs],
  );

  const directionLabel =
    direction === 'charge' ? '充电 · AC → DC' : '放电 · DC → AC';

  return (
    <section
      className={cx('energy-flow-panel', className)}
      style={{ ...cssVars, ...style }}
      aria-live="polite"
    >
      <header className="energy-flow-header">
        <div>
          <p className="energy-flow-eyebrow">Energy Management</p>
          <h3>{title}</h3>
        </div>
        <span className="energy-flow-pill" data-direction={direction}>
          {directionLabel}
        </span>
      </header>

      <div className="energy-flow-diagram">
        <SideNode
          config={gridSide}
          align="start"
          className="energy-flow-node"
          defaultIcon={<GridDefaultIcon />}
        />

        <Connector direction={direction} accessibilityLabel={directionLabel} />

        <SideNode
          config={{
            title: pcs.title ?? 'PCS',
            subtitle: pcs.status ?? 'Idle',
            icon: pcs.icon,
            metrics: pcs.metrics,
          }}
          align="center"
          className="energy-flow-node energy-flow-node--pcs"
          defaultIcon={<PcsDefaultIcon />}
          efficiency={pcs.efficiency}
        />

        <Connector direction={direction} accessibilityLabel={directionLabel} />

        <SideNode
          config={batterySide}
          align="end"
          className="energy-flow-node"
          defaultIcon={<BatteryDefaultIcon />}
        />
      </div>
    </section>
  );
}

interface SideNodeProps {
  config: EnergySideConfig;
  align: 'start' | 'center' | 'end';
  className?: string;
  defaultIcon: ReactNode;
  efficiency?: number;
}

const SideNode = ({
  config,
  align,
  className,
  defaultIcon,
  efficiency,
}: SideNodeProps) => {
  return (
    <div className={cx(className, `energy-flow-node--${align}`)}>
      <div className="energy-flow-node-icon">
        <span aria-hidden="true">{config.icon ?? defaultIcon}</span>
      </div>
      <div className="energy-flow-node-text">
        <p className="node-title">{config.title}</p>
        {config.subtitle ? <p className="node-subtitle">{config.subtitle}</p> : null}
        {typeof efficiency === 'number' ? (
          <p className="node-eff">
            Eff. <span>{efficiency.toFixed(1)}%</span>
          </p>
        ) : null}
      </div>
      <MetricList metrics={config.metrics} />
    </div>
  );
};

const Connector = ({
  direction,
  accessibilityLabel,
}: {
  direction: FlowDirection;
  accessibilityLabel: string;
}) => (
  <div
    className="energy-flow-connector"
    data-direction={direction}
    role="img"
    aria-label={`Energy direction: ${accessibilityLabel}`}
  />
);

export default EnergyFlowPanel;

