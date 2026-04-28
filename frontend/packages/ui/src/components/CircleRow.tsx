interface CircleRowProps {
  values: number[];
  color?: string;
}

export function CircleRow({ values, color = "#5DD9A8" }: CircleRowProps) {
  const r = 14;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex gap-2">
      {values.map((v, i) => {
        const clamped = Math.max(0, Math.min(100, v));
        const offset = c - (clamped / 100) * c;
        return (
          <svg
            key={i}
            viewBox="0 0 40 40"
            className="w-9 h-9 -rotate-90"
            aria-label={`${clamped}%`}
          >
            <circle
              cx="20"
              cy="20"
              r={r}
              fill="none"
              stroke="#DDE1ED"
              strokeWidth="4"
            />
            <circle
              cx="20"
              cy="20"
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
            />
          </svg>
        );
      })}
    </div>
  );
}
