type BarColor = "violet" | "pink" | "green" | "yellow";

interface Bar {
  label: string;
  value: number;
  color: BarColor;
}

const colorMap: Record<BarColor, string> = {
  violet: "#8E7CF8",
  pink: "#FF6B9D",
  green: "#5DD9A8",
  yellow: "#F5C24A",
};

export function BarsCard({ bars }: { bars: Bar[] }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-3 h-36">
        {bars.map((b, i) => (
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-end h-full"
          >
            <div
              className="w-full rounded-t-xl shadow-neu-soft transition-all"
              style={{
                height: `${(b.value / max) * 100}%`,
                background: colorMap[b.color],
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        {bars.map((b, i) => (
          <div
            key={i}
            className="flex-1 text-center text-xs font-semibold text-ink tabular-nums"
          >
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
}
