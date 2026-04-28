interface DonutItem {
  label: string;
  value: number;
  color: string;
}

export function DonutLegend({ items }: { items: DonutItem[] }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  const r = 46;
  const c = 2 * Math.PI * r;

  if (total <= 0) {
    return (
      <div className="flex items-center gap-5">
        <svg viewBox="0 0 120 120" className="w-32 h-32">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#DDE1ED" strokeWidth="14" />
        </svg>
        <div className="text-sm text-ink-soft">Нет данных</div>
      </div>
    );
  }

  let acc = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90 shrink-0">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="#DDE1ED"
          strokeWidth="14"
        />
        {items.map((it, i) => {
          const fraction = it.value / total;
          const len = fraction * c;
          const rotate = (acc / total) * 360;
          acc += it.value;
          return (
            <circle
              key={i}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={it.color}
              strokeWidth="14"
              strokeDasharray={`${len} ${c - len}`}
              transform={`rotate(${rotate} 60 60)`}
            />
          );
        })}
      </svg>
      <ul className="flex-1 space-y-2 text-sm">
        {items.map((it, i) => (
          <li
            key={i}
            className="flex items-center gap-2 text-ink-soft"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: it.color }}
            />
            <span className="flex-1 truncate">{it.label}</span>
            <span className="font-semibold text-ink tabular-nums">
              {it.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
