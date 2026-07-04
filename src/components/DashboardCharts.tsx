"use client";

import { useState } from "react";
import type { DashboardCharts as DashboardChartsData, DashboardChartKey } from "@/lib/dashboard-chart-adapter";
import type { CurrencyCode } from "@/lib/types";

// Dark teal / bright dark red / bright dark gold palette (display layer only), each paired
// with a near-black shade for gradient fills that give bars/slices a subtle 3D depth.
const BRIGHT_PALETTE: [string, string][] = [
  ["#064e4a", "#021f1e"], // dark teal -> almost black teal
  ["#dc2626", "#450a0a"], // bright dark red -> near black
  ["#d97706", "#3d1f02"], // bright dark gold -> near black
  ["#991b1b", "#1a0505"], // dark red -> near black
  ["#92400e", "#241004"], // deep gold -> near black
  ["#0f766e", "#020202"] // secondary teal -> black
];
// Grouped series (e.g. previous vs current) colors — dark teal vs bright dark gold.
const SERIES_COLORS: [string, string][] = [
  ["#064e4a", "#021f1e"],
  ["#d97706", "#3d1f02"]
];

type ChartData = DashboardChartsData[DashboardChartKey];
type LineData = Extract<ChartData, { kind: "line" }>;
type BarData = Extract<ChartData, { kind: "bar" }>;
type PieData = Extract<ChartData, { kind: "pie" }>;

const CHART_DEFS: Record<DashboardChartKey, { label: string; subtitle: string }> = {
  "revenue-vs-equilibrium": { label: "Revenue vs Equilibrium", subtitle: "Current revenue against the safe equilibrium line." },
  "profit-composition": { label: "Cost & Profit Composition", subtitle: "Where revenue goes — costs, salary, incentives, and what's left." },
  "monthly-payout-comparison": { label: "Payout Trend", subtitle: "Previous vs current incentive payouts by month." },
  "exposure-or-incentive-split": { label: "Exposure by Department / Incentive Split", subtitle: "Department exposure share, or bonus vs salary increment mix." }
};

function formatChartMoney(value: number, currencyDisplay: CurrencyCode): string {
  if (currencyDisplay === "KSH") {
    return `KSh ${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

// Round SVG coordinates to a fixed precision so server and client render byte-identical
// path strings (avoids float last-digit hydration mismatches from trig/division).
const r = (value: number) => Math.round(value * 100) / 100;

function LineChart({ data, currencyDisplay }: { data: LineData; currencyDisplay: CurrencyCode }) {
  const [active, setActive] = useState<{ series: number; index: number } | null>(null);
  const width = 520;
  const height = 220;
  const pad = { top: 18, right: 18, bottom: 30, left: 18 };
  const all = data.series.flatMap((series) => series.values);
  const min = Math.min(...all, 0);
  const max = Math.max(...all, 1);
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const count = data.labels.length;
  const x = (i: number) => r(pad.left + (i / Math.max(count - 1, 1)) * plotW);
  const y = (v: number) => r(pad.top + (1 - (v - min) / (max - min || 1)) * plotH);

  const areaValues = data.series[0]?.values ?? [];
  const areaPoints = areaValues.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const areaPath = areaValues.length
    ? `M ${x(0)},${height - pad.bottom} L ${areaPoints.replace(/ /g, " L ")} L ${x(areaValues.length - 1)},${height - pad.bottom} Z`
    : "";

  return (
    <div className="flex h-full flex-col">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[170px] w-full" role="img" aria-label="Line chart">
        <defs>
          <linearGradient id="dash-line-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={SERIES_COLORS[0][0]} stopOpacity="0.32" />
            <stop offset="100%" stopColor={SERIES_COLORS[0][0]} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const gy = pad.top + (line / 3) * plotH;
          return <line key={line} x1={pad.left} x2={width - pad.right} y1={gy} y2={gy} stroke="#eef1ec" strokeWidth="1" />;
        })}
        {areaPath && <path className="dash-area" d={areaPath} fill="url(#dash-line-area)" stroke="none" />}
        {data.series.map((series, si) => {
          const color = SERIES_COLORS[si % SERIES_COLORS.length][0];
          const points = series.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
          return (
            <polyline
              key={series.name}
              className="dash-line-path"
              points={points}
              fill="none"
              stroke={color}
              strokeWidth={si === 0 ? 3.5 : 2.5}
              strokeDasharray={si === 0 ? undefined : "7 6"}
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{
                animationDelay: `${si * 0.25}s`,
                opacity: data.isPlaceholder ? 0.45 : 1,
                filter: `drop-shadow(0 3px 3px ${color}55)`
              }}
            />
          );
        })}
        {data.series.map((series, si) =>
          series.values.map((v, i) => {
            const isActive = active?.series === si && active?.index === i;
            const color = SERIES_COLORS[si % SERIES_COLORS.length][0];
            return (
              <circle
                key={`${series.name}-${i}`}
                cx={x(i)}
                cy={y(v)}
                r={isActive ? 7 : 4}
                fill={color}
                stroke="#ffffff"
                strokeWidth={isActive ? 2.5 : 1.5}
                className="cursor-pointer"
                style={{
                  transition: "r 0.2s ease, cx 0.4s ease, cy 0.4s ease",
                  opacity: data.isPlaceholder ? 0.45 : 1,
                  filter: isActive ? `drop-shadow(0 0 8px ${color}) drop-shadow(0 3px 4px rgba(0,0,0,0.35))` : `drop-shadow(0 2px 2px rgba(0,0,0,0.25))`
                }}
                onClick={() => setActive(isActive ? null : { series: si, index: i })}
              >
                <title>{`${series.name} · ${data.labels[i]}: ${data.isPlaceholder ? "Placeholder" : formatChartMoney(v, currencyDisplay)}`}</title>
              </circle>
            );
          })
        )}
        {data.labels.map((label, i) =>
          i % 2 === 0 ? (
            <text key={label} x={x(i)} y={height - 8} textAnchor="middle" className="fill-slate-400 text-[9px]">
              {label}
            </text>
          ) : null
        )}
      </svg>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-normal text-slate-500">
          {data.series.map((series, si) => (
            <span key={series.name} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES_COLORS[si % SERIES_COLORS.length][0] }} />
              {series.name}
            </span>
          ))}
        </div>
        {active && (
          <span className="text-[11px] font-medium text-ink">
            {data.labels[active.index]}:{" "}
            {data.isPlaceholder ? "Placeholder" : formatChartMoney(data.series[active.series].values[active.index], currencyDisplay)}
          </span>
        )}
      </div>
    </div>
  );
}

function BarChart({ data, currencyDisplay }: { data: BarData; currencyDisplay: CurrencyCode }) {
  const [active, setActive] = useState<{ bar: number; value: number } | null>(null);
  const max = Math.max(...data.bars.flatMap((bar) => bar.values.map((v) => v.value)), 1);
  const grouped = data.bars.some((bar) => bar.values.length > 1);

  return (
    <div className="flex h-full flex-col">
      {/* gap-2 spaces out different month/category groups; the pair within each group (below) has no gap. */}
      <div className="flex flex-1 items-end justify-around gap-2 px-1 pb-1 pt-2" style={{ minHeight: 168 }}>
        {data.bars.map((bar, bi) => (
          <div key={bar.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
            <div className={`flex h-[150px] w-full items-end justify-center ${grouped ? "gap-0" : "gap-1.5"}`}>
              {bar.values.map((v, vi) => {
                const isActive = active?.bar === bi && active?.value === vi;
                const dimmed = active !== null && !isActive;
                const paletteIndex = grouped ? vi % SERIES_COLORS.length : bi % BRIGHT_PALETTE.length;
                const [topColor, bottomColor] = grouped ? SERIES_COLORS[paletteIndex] : BRIGHT_PALETTE[paletteIndex];
                return (
                  <button
                    key={v.name}
                    type="button"
                    title={`${v.name}: ${data.isPlaceholder ? "Placeholder" : formatChartMoney(v.value, currencyDisplay)}`}
                    onClick={() => setActive(isActive ? null : { bar: bi, value: vi })}
                    className="dash-bar-el w-5 rounded-t-md"
                    style={{
                      height: `${Math.max(4, (v.value / max) * 100)}%`,
                      background: `linear-gradient(to bottom, ${topColor}, ${bottomColor})`,
                      animationDelay: `${(bi * bar.values.length + vi) * 0.06}s`,
                      opacity: dimmed ? 0.5 : data.isPlaceholder ? 0.45 : 1,
                      filter: isActive ? "brightness(1.15)" : "brightness(1)",
                      boxShadow: isActive
                        ? `0 0 0 3px ${topColor}59, 0 10px 18px ${topColor}77`
                        : `0 4px 8px ${topColor}33`,
                      transform: isActive ? "scaleY(1.02)" : undefined,
                      transformOrigin: "bottom",
                      transition: "height 0.4s ease, opacity 0.2s ease, box-shadow 0.25s ease, filter 0.25s ease, transform 0.2s ease"
                    }}
                    aria-label={`${bar.label} ${v.name}`}
                  />
                );
              })}
            </div>
            <span className="w-full truncate text-center text-[10px] font-normal text-slate-500">{bar.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        {grouped ? (
          <div className="flex items-center gap-3 text-[11px] font-normal text-slate-500">
            {["Previous", "Current"].map((name, i) => (
              <span key={name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES_COLORS[i][0] }} />
                {name}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[11px] font-normal text-slate-400">Tap a bar to inspect</span>
        )}
        {active && (
          <span className="text-[11px] font-medium text-ink">
            {data.bars[active.bar].label}:{" "}
            {data.isPlaceholder ? "Placeholder" : formatChartMoney(data.bars[active.bar].values[active.value].value, currencyDisplay)}
          </span>
        )}
      </div>
    </div>
  );
}

function PieChart({ data, chartId }: { data: PieData; chartId: string }) {
  const [active, setActive] = useState<number | null>(null);
  const size = 200;
  const center = size / 2;
  const radius = 76;
  const inner = 46;
  const segments = data.segments.filter((segment) => segment.value > 0);
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;

  let cumulative = -90;
  const arcs = segments.map((segment, i) => {
    const angle = (segment.value / total) * 360;
    const start = cumulative;
    const end = cumulative + angle;
    cumulative = end;
    const startRad = (start * Math.PI) / 180;
    const endRad = (end * Math.PI) / 180;
    const midRad = ((start + end) / 2) * (Math.PI / 180);
    const x1 = r(center + radius * Math.cos(startRad));
    const y1 = r(center + radius * Math.sin(startRad));
    const x2 = r(center + radius * Math.cos(endRad));
    const y2 = r(center + radius * Math.sin(endRad));
    const largeArc = angle > 180 ? 1 : 0;
    const single = segments.length === 1;
    const path = single
      ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center - 0.01} ${center - radius} Z`
      : `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const [topColor] = BRIGHT_PALETTE[i % BRIGHT_PALETTE.length];
    return {
      ...segment,
      path,
      color: topColor,
      gradientId: `${chartId}-slice-${i}`,
      share: (segment.value / total) * 100,
      dx: r(Math.cos(midRad)),
      dy: r(Math.sin(midRad))
    };
  });

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-[168px] w-full max-w-[210px]" role="img" aria-label="Pie chart">
        <defs>
          {arcs.map((arc, i) => {
            const [top, bottom] = BRIGHT_PALETTE[i % BRIGHT_PALETTE.length];
            return (
              <radialGradient key={arc.gradientId} id={arc.gradientId} cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor={top} />
                <stop offset="100%" stopColor={bottom} />
              </radialGradient>
            );
          })}
        </defs>
        {/* 3D base — a darker duplicate of the pie shifted down, giving a cylinder/cake-like depth. */}
        <g transform="translate(0, 9)" opacity={data.isPlaceholder ? 0.35 : 0.85}>
          {arcs.map((arc, i) => {
            const [, bottomColor] = BRIGHT_PALETTE[i % BRIGHT_PALETTE.length];
            return <path key={`base-${arc.label}`} d={arc.path} fill={bottomColor} stroke="none" />;
          })}
        </g>
        <g className="dash-pie-group">
          {arcs.map((arc, i) => {
            const isActive = active === i;
            const offset = isActive ? 10 : 0;
            return (
              <path
                key={arc.label}
                d={arc.path}
                fill={`url(#${arc.gradientId})`}
                stroke="#ffffff"
                strokeWidth="3"
                className="dash-pie-slice cursor-pointer"
                style={{
                  animationDelay: `${i * 0.08}s`,
                  transform: `translate(${arc.dx * offset}px, ${arc.dy * offset}px)`,
                  transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                  opacity: data.isPlaceholder ? 0.45 : 1,
                  filter: isActive
                    ? `brightness(1.1) drop-shadow(0 6px 10px rgba(0,0,0,0.35))`
                    : `drop-shadow(0 3px 5px rgba(0,0,0,0.2))`
                }}
                onClick={() => setActive(isActive ? null : i)}
              >
                <title>{`${arc.label}: ${data.isPlaceholder ? "Placeholder" : `${arc.share.toFixed(1)}%`}`}</title>
              </path>
            );
          })}
        </g>
        <circle cx={center} cy={center} r={inner} fill="#ffffff" />
        {active !== null && arcs[active] ? (
          <>
            <text x={center} y={center - 2} textAnchor="middle" className="fill-ink text-[18px] font-medium">
              {arcs[active].share.toFixed(0)}%
            </text>
            <text x={center} y={center + 14} textAnchor="middle" className="fill-slate-500 text-[8px]">
              {arcs[active].label}
            </text>
          </>
        ) : (
          <text x={center} y={center + 4} textAnchor="middle" className="fill-slate-400 text-[9px]">
            Tap a slice
          </text>
        )}
      </svg>
      <div className="mt-3 grid w-full grid-cols-2 gap-x-3 gap-y-1.5">
        {arcs.map((arc, i) => (
          <button
            key={arc.label}
            type="button"
            onClick={() => setActive(active === i ? null : i)}
            className="flex items-center gap-1.5 text-left text-[11px] font-normal text-slate-500 transition-opacity"
            style={{ opacity: active !== null && active !== i ? 0.5 : 1 }}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: arc.color }} />
            <span className="truncate">
              {arc.label} <span className="text-slate-400">{arc.share.toFixed(0)}%</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChartBody({ chartKey, data, currencyDisplay }: { chartKey: DashboardChartKey; data: ChartData; currencyDisplay: CurrencyCode }) {
  if (data.kind === "line") return <LineChart data={data} currencyDisplay={currencyDisplay} />;
  if (data.kind === "bar") return <BarChart data={data} currencyDisplay={currencyDisplay} />;
  return <PieChart data={data} chartId={chartKey} />;
}

function ChartCard({ chartKey, data, currencyDisplay }: { chartKey: DashboardChartKey; data: ChartData; currencyDisplay: CurrencyCode }) {
  const def = CHART_DEFS[chartKey];

  return (
    <div
      className="flex min-h-[360px] flex-col rounded-xl border border-line bg-gradient-to-br from-white via-white to-teal-soft p-5 shadow-[0_10px_24px_-8px_rgba(6,78,74,0.18)] transition-all duration-300 hover:[transform:perspective(900px)_rotateX(2deg)_translateY(-4px)] hover:shadow-[0_20px_36px_-8px_rgba(6,78,74,0.32)]"
      style={{ perspective: "900px" }}
    >
      <div className="mb-4 min-w-0">
        <h3 className="truncate text-sm font-semibold text-ink">{def.label}</h3>
        <p className="mt-0.5 truncate text-[11px] font-normal text-slate-500">{def.subtitle}</p>
      </div>
      {/* key remounts the body when data changes shape so entrance animations replay. */}
      <div key={chartKey} className="flex flex-1 flex-col">
        <ChartBody chartKey={chartKey} data={data} currencyDisplay={currencyDisplay} />
      </div>
    </div>
  );
}

export function DashboardCharts({
  charts,
  currencyDisplay,
  hasRealData
}: {
  charts: DashboardChartsData;
  currencyDisplay: CurrencyCode;
  hasRealData: boolean;
}) {
  // Mandatory desktop layout: exactly 4 chart cards in one row — line, pie, trend, pie.
  const order: DashboardChartKey[] = [
    "revenue-vs-equilibrium",
    "profit-composition",
    "monthly-payout-comparison",
    "exposure-or-incentive-split"
  ];

  return (
    <div className="space-y-3">
      {!hasRealData && (
        <div className="flex items-center gap-2 rounded-xl border border-[#dc2626]/30 bg-[#dc2626]/10 px-4 py-2.5 text-sm font-normal text-[#b91c1c]">
          <span className="blink-alert flex items-center gap-2 font-medium">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#dc2626]" />
            Enter your data
          </span>
          <span className="text-[#b91c1c]/70">— charts below are showing placeholder visuals.</span>
        </div>
      )}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:[grid-template-columns:repeat(4,minmax(0,1fr))]">
        {order.map((key) => (
          <ChartCard key={key} chartKey={key} data={charts[key]} currencyDisplay={currencyDisplay} />
        ))}
      </section>
    </div>
  );
}
