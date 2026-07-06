"use client";

import { useState } from "react";
import type { DashboardCardVisual, DashboardNumberCard } from "@/lib/dashboard-explanations-adapter";

const MINI_PALETTE = ["#064e4a", "#d97706", "#dc2626", "#0f766e", "#92400e", "#991b1b"];

function MiniPie({ visual }: { visual: Extract<DashboardCardVisual, { kind: "pie" }> }) {
  const [active, setActive] = useState<number | null>(null);
  const size = 88;
  const center = size / 2;
  const radius = 36;
  const segments = visual.segments.filter((segment) => segment.value > 0);
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;

  let cumulative = -90;
  const arcs = segments.map((segment, i) => {
    const angle = (segment.value / total) * 360;
    const start = cumulative;
    const end = cumulative + angle;
    cumulative = end;
    const startRad = (start * Math.PI) / 180;
    const endRad = (end * Math.PI) / 180;
    const x1 = Math.round((center + radius * Math.cos(startRad)) * 100) / 100;
    const y1 = Math.round((center + radius * Math.sin(startRad)) * 100) / 100;
    const x2 = Math.round((center + radius * Math.cos(endRad)) * 100) / 100;
    const y2 = Math.round((center + radius * Math.sin(endRad)) * 100) / 100;
    const largeArc = angle > 180 ? 1 : 0;
    const single = segments.length === 1;
    const path = single
      ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center - 0.01} ${center - radius} Z`
      : `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { ...segment, path, color: MINI_PALETTE[i % MINI_PALETTE.length], share: (segment.value / total) * 100 };
  });

  return (
    <div className="flex items-center gap-3">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-16 w-16 shrink-0" role="img" aria-label="Mini pie chart">
        <g>
          {arcs.map((arc, i) => (
            <path
              key={arc.label}
              d={arc.path}
              fill={arc.color}
              stroke="#ffffff"
              strokeWidth="2"
              className="dash-pie-slice cursor-pointer"
              style={{ animationDelay: `${i * 0.06}s`, opacity: visual.isPlaceholder ? 0.45 : active === null || active === i ? 1 : 0.4 }}
              onClick={() => setActive(active === i ? null : i)}
            >
              <title>{`${arc.label}: ${visual.isPlaceholder ? "Placeholder" : `${arc.share.toFixed(0)}%`}`}</title>
            </path>
          ))}
        </g>
        <circle cx={center} cy={center} r={16} fill="#ffffff" />
      </svg>
      <div className="min-w-0 flex-1 space-y-0.5">
        {arcs.map((arc, i) => (
          <div
            key={arc.label}
            className="flex items-center gap-1.5 text-[11px] font-normal text-slate-500"
            style={{ opacity: active !== null && active !== i ? 0.5 : 1 }}
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: arc.color }} />
            <span className="truncate">{arc.label}</span>
            <span className="ml-auto shrink-0 text-slate-400">{visual.isPlaceholder ? "—" : `${arc.share.toFixed(0)}%`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniLine({ visual }: { visual: Extract<DashboardCardVisual, { kind: "line" }> }) {
  const width = 220;
  const height = 64;
  const pad = { top: 6, right: 6, bottom: 6, left: 6 };
  const all = visual.series.flatMap((series) => series.values);
  const min = Math.min(...all, 0);
  const max = Math.max(...all, 1);
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const count = visual.labels.length;
  const x = (i: number) => Math.round((pad.left + (i / Math.max(count - 1, 1)) * plotW) * 100) / 100;
  const y = (v: number) => Math.round((pad.top + (1 - (v - min) / (max - min || 1)) * plotH) * 100) / 100;
  const colors = ["#064e4a", "#d97706"];

  return (
    <div className="flex items-center gap-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full max-w-[160px] shrink-0" role="img" aria-label="Mini trend line">
        {visual.series.map((series, si) => {
          const points = series.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
          return (
            <polyline
              key={series.name}
              className="dash-line-path"
              points={points}
              fill="none"
              stroke={colors[si % colors.length]}
              strokeWidth={si === 0 ? 2 : 2.5}
              strokeDasharray={si === 0 ? "4 4" : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ animationDelay: `${si * 0.2}s`, opacity: visual.isPlaceholder ? 0.45 : 1 }}
            />
          );
        })}
      </svg>
      <div className="min-w-0 flex-1 space-y-0.5">
        {visual.series.map((series, si) => (
          <div key={series.name} className="flex items-center gap-1.5 text-[11px] font-normal text-slate-500">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colors[si % colors.length] }} />
            <span className="truncate">{series.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardVisual({ visual }: { visual: DashboardCardVisual }) {
  if (visual.kind === "pie") return <MiniPie visual={visual} />;
  return <MiniLine visual={visual} />;
}

function NumberCard({ card }: { card: DashboardNumberCard }) {
  return (
    <div className="flex flex-col rounded-xl border border-line bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <h4 className="text-sm font-semibold text-ink">{card.title}</h4>
      <p className="mt-1 text-xl font-medium text-ink">{card.value}</p>
      <ul className="mt-2 space-y-1">
        {card.points.map((point, index) => (
          <li key={index} className="flex gap-2 text-xs font-normal leading-5 text-slate-600">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#064e4a]" />
            {point}
          </li>
        ))}
      </ul>
      {card.visual && (
        <div className="mt-3 border-t border-line pt-3">
          <CardVisual visual={card.visual} />
        </div>
      )}
    </div>
  );
}

export function DashboardNumberCards({ cards, hasRealData }: { cards: DashboardNumberCard[]; hasRealData: boolean }) {
  return (
    <section className="rounded-xl border border-line bg-gradient-to-br from-white via-white to-teal-soft p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink">Your Numbers</h3>
          <p className="mt-0.5 text-xs font-normal text-slate-500">What each number means, where it comes from, and how to improve it.</p>
        </div>
        {!hasRealData && (
          <div className="flex items-center gap-2 text-sm font-normal text-[#b91c1c]">
            <span className="blink-alert flex items-center gap-2 font-medium">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#dc2626]" />
              Enter your data
            </span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <NumberCard key={card.key} card={card} />
        ))}
      </div>
    </section>
  );
}
