type ProgressColor = "yellow" | "green" | "pink" | "violet";

const colorMap: Record<ProgressColor, string> = {
  yellow: "#F5C24A",
  green: "#5DD9A8",
  pink: "#FF6B9D",
  violet: "#8E7CF8",
};

interface ProgressRowProps {
  value: number;
  color: ProgressColor;
  label?: string;
}

export function ProgressRow({ value, color, label }: ProgressRowProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <div className="text-xs text-ink-soft uppercase tracking-wider">
          {label}
        </div>
      ) : null}
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold text-ink w-16 tabular-nums">
          {clamped}%
        </div>
        <div className="flex-1 h-3 rounded-full bg-surface-dim shadow-neu-in overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${clamped}%`,
              background: colorMap[color],
            }}
          />
        </div>
      </div>
    </div>
  );
}
