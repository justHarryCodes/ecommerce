import { formatCurrency } from "@/lib/utils";

// Static, server-rendered SVG charts for the internal analytics dashboard.
// Single-series data throughout → one hue (the brand accent), no legend
// needed. Chart-form choices: line for a trend over time, bars for a
// magnitude ranking, an ordinal (lightness-stepped) bar list for the
// funnel — never a dual axis, never a rainbow of unrelated hues.

interface RevenuePoint {
  day: string; // ISO date
  revenue: number;
}

export function RevenueLineChart({ points }: { points: RevenuePoint[] }) {
  const W = 800;
  const H = 200;
  const padL = 56;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const max = Math.max(1, ...points.map((p) => p.revenue));
  // Round the axis max up to a clean step
  const magnitude = Math.pow(10, Math.floor(Math.log10(max || 1)));
  const axisMax = Math.ceil(max / magnitude) * magnitude || 1;

  const x = (i: number) => padL + (innerW * i) / Math.max(1, points.length - 1);
  const y = (v: number) => padT + innerH - (innerH * v) / axisMax;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.revenue).toFixed(1)}`)
    .join(" ");
  const areaPath =
    `M ${x(0).toFixed(1)} ${y(0).toFixed(1)} ` +
    points.map((p, i) => `L ${x(i).toFixed(1)} ${y(p.revenue).toFixed(1)}`).join(" ") +
    ` L ${x(points.length - 1).toFixed(1)} ${y(0).toFixed(1)} Z`;

  const last = points[points.length - 1];
  const first = points[0];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Revenue over the last 30 days">
      {/* Gridlines — baseline + max, hairline, recessive */}
      <line x1={padL} y1={y(0)} x2={W - padR} y2={y(0)} stroke="var(--border)" strokeWidth={1} />
      <line x1={padL} y1={y(axisMax)} x2={W - padR} y2={y(axisMax)} stroke="var(--border)" strokeWidth={1} />
      <text x={padL - 8} y={y(0) + 4} textAnchor="end" fontSize={11} fill="var(--text-muted)">₦0</text>
      <text x={padL - 8} y={y(axisMax) + 4} textAnchor="end" fontSize={11} fill="var(--text-muted)">
        {formatCurrency(axisMax)}
      </text>

      {/* Area wash */}
      <path d={areaPath} fill="var(--accent)" opacity={0.1} />
      {/* Line */}
      <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* End dot + direct label */}
      {last && (
        <>
          <circle cx={x(points.length - 1)} cy={y(last.revenue)} r={4} fill="var(--accent)" stroke="var(--bg)" strokeWidth={2} />
          <text
            x={Math.min(x(points.length - 1), W - padR - 90)}
            y={Math.max(y(last.revenue) - 10, padT + 10)}
            fontSize={12}
            fontWeight={700}
            fill="var(--text-primary)"
          >
            {formatCurrency(last.revenue)}
          </text>
        </>
      )}

      {/* X-axis endpoints only, to keep it uncluttered */}
      {first && (
        <text x={x(0)} y={H - 6} fontSize={10} fill="var(--text-muted)" textAnchor="start">
          {new Date(first.day).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
        </text>
      )}
      {last && (
        <text x={x(points.length - 1)} y={H - 6} fontSize={10} fill="var(--text-muted)" textAnchor="end">
          {new Date(last.day).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
        </text>
      )}
    </svg>
  );
}

interface TopProduct {
  product_name: string;
  revenue: number;
}

export function TopProductsBars({ products }: { products: TopProduct[] }) {
  if (products.length === 0) {
    return <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>No paid orders yet.</p>;
  }
  const max = Math.max(...products.map((p) => p.revenue));

  return (
    <div className="space-y-3">
      {products.map((p) => {
        const pct = max > 0 ? (p.revenue / max) * 100 : 0;
        return (
          <div key={p.product_name}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm font-medium truncate pr-2" style={{ color: "var(--text-primary)" }}>
                {p.product_name}
              </span>
              <span className="text-sm font-bold shrink-0" style={{ color: "var(--text-primary)" }}>
                {formatCurrency(p.revenue)}
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(pct, 3)}%`, background: "var(--accent)" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface StatusCount {
  status: string;
  count: number;
}

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
};
// Ordinal ramp on the funnel's forward progression (new → contacted →
// quoted → won); "lost" is the terminal drop-off, called out in the
// muted/negative tone rather than continuing the ramp.
const STATUS_OPACITY: Record<string, number> = {
  new: 0.35,
  contacted: 0.55,
  quoted: 0.75,
  won: 1,
  lost: 0.3,
};

export function LeadsFunnel({ counts }: { counts: StatusCount[] }) {
  const order = ["new", "contacted", "quoted", "won", "lost"];
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.count]));
  const max = Math.max(1, ...order.map((s) => byStatus[s] ?? 0));

  return (
    <div className="space-y-3">
      {order.map((status) => {
        const count = byStatus[status] ?? 0;
        const pct = (count / max) * 100;
        return (
          <div key={status} className="flex items-center gap-3">
            <span className="text-sm font-medium w-24 shrink-0" style={{ color: "var(--text-secondary)" }}>
              {STATUS_LABELS[status]}
            </span>
            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(pct, count > 0 ? 3 : 0)}%`,
                  background: status === "lost" ? "var(--text-muted)" : "var(--accent)",
                  opacity: STATUS_OPACITY[status],
                }}
              />
            </div>
            <span className="text-sm font-bold w-8 text-right shrink-0" style={{ color: "var(--text-primary)" }}>
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
