import { decimalText } from './ui';

export interface ChartPoint {
  date: string; // AAAA-MM-DD
  value: number;
}

const shortDate = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

const INK = '#6b7a70';
const GRID = '#e4ebe2';
const GREEN = '#2f6b52';
const GOLD = '#c49a4a';

/** Evolução do peso, com linha tracejada para o peso desejado. */
export function WeightChart({ points, target }: { points: ChartPoint[]; target: number | null }) {
  if (!points.length) return null;
  const W = 640, H = 240, L = 46, R = 16, T = 16, B = 32;
  const sorted = [...points].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const values = sorted.map((p) => p.value).concat(target !== null ? [target] : []);
  let min = Math.min(...values);
  let max = Math.max(...values);
  const pad = Math.max(0.5, (max - min) * 0.15);
  min -= pad;
  max += pad;
  const t0 = Date.parse(sorted[0].date);
  const t1 = Date.parse(sorted[sorted.length - 1].date);
  const x = (d: string) =>
    sorted.length === 1 || t1 === t0 ? L + (W - L - R) / 2 : L + ((Date.parse(d) - t0) / (t1 - t0)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - min) / (max - min)) * (H - T - B);
  const ticks = [0, 1, 2, 3].map((i) => min + ((max - min) * i) / 3);
  const path = sorted.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.date).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfico da evolução do peso">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill={INK}>{decimalText(t)}</text>
        </g>
      ))}
      {target !== null && (
        <g>
          <line x1={L} x2={W - R} y1={y(target)} y2={y(target)} stroke={GOLD} strokeWidth="1.5" strokeDasharray="6 5" />
          <text x={W - R} y={y(target) - 6} textAnchor="end" fontSize="11" fill={GOLD} fontWeight="600">
            meta {decimalText(target)} kg
          </text>
        </g>
      )}
      <path d={path} fill="none" stroke={GREEN} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {sorted.map((p) => (
        <circle key={p.date + p.value} cx={x(p.date)} cy={y(p.value)} r="4" fill={GREEN} stroke="#ffffff" strokeWidth="1.5" />
      ))}
      <text x={L} y={H - 8} fontSize="11" fill={INK}>{shortDate(sorted[0].date)}</text>
      {sorted.length > 1 && (
        <text x={W - R} y={H - 8} textAnchor="end" fontSize="11" fill={INK}>{shortDate(sorted[sorted.length - 1].date)}</text>
      )}
    </svg>
  );
}

/** Barras por dia, com linha tracejada para a meta. */
export function BarChart({
  days,
  goal,
  label,
  color = GREEN,
}: {
  days: ChartPoint[];
  goal: number | null;
  label: string;
  color?: string;
}) {
  const n = days.length;
  if (!n) return null;
  const W = 640, H = 220, L = 46, R = 10, T = 14, B = 28;
  const maxValue = Math.max(...days.map((d) => d.value), goal ?? 0, 1) * 1.1;
  const slot = (W - L - R) / n;
  const barW = Math.max(4, slot * 0.68);
  const y = (v: number) => T + (1 - v / maxValue) * (H - T - B);
  const step = n > 14 ? 5 : n > 7 ? 2 : 1;
  const ticks = [0, maxValue / 2, maxValue];

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill={INK}>{decimalText(Math.round(t))}</text>
        </g>
      ))}
      {days.map((d, i) => {
        const cx = L + slot * i + slot / 2;
        const h = (H - T - B) - (y(d.value) - T);
        return (
          <g key={d.date}>
            {d.value > 0 && (
              <rect x={cx - barW / 2} y={y(d.value)} width={barW} height={Math.max(1, h)} rx="3" fill={color} />
            )}
            {(i % step === 0 || i === n - 1) && (
              <text x={cx} y={H - 9} textAnchor="middle" fontSize="11" fill={INK}>{d.date.slice(8, 10)}</text>
            )}
          </g>
        );
      })}
      {goal !== null && (
        <g>
          <line x1={L} x2={W - R} y1={y(goal)} y2={y(goal)} stroke={GOLD} strokeWidth="1.5" strokeDasharray="6 5" />
          <text x={W - R} y={y(goal) - 6} textAnchor="end" fontSize="11" fill={GOLD} fontWeight="600">
            meta {decimalText(goal)}
          </text>
        </g>
      )}
    </svg>
  );
}
