interface StatDonutProps {
  value: number;
  color?: "violet" | "pink" | "green" | "yellow";
  label: string;
  sub?: string;
}

const colorMap: Record<NonNullable<StatDonutProps["color"]>, string> = {
  violet: "#8E7CF8",
  pink: "#FF6B9D",
  green: "#5DD9A8",
  yellow: "#F5C24A",
};

export function StatDonut({
  value,
  color = "violet",
  label,
  sub,
}: StatDonutProps) {
  const stroke = colorMap[color];
  const r = 52;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = c - (clamped / 100) * c;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="#DDE1ED"
            strokeWidth="10"
          />
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-2xl font-bold text-ink tabular-nums">
          {clamped}%
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-ink">{label}</div>
        {sub ? (
          <div className="text-xs text-ink-soft mt-0.5">{sub}</div>
        ) : null}
      </div>
    </div>
  );
}
