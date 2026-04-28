interface StatItem {
  label: string;
  value: string;
  color: string;
}

export function StatList({ items }: { items: StatItem[] }) {
  return (
    <ul className="space-y-3.5">
      {items.map((it, i) => (
        <li key={i} className="flex items-center gap-3">
          <span
            className="w-3 h-3 rounded-full shrink-0 shadow-neu-soft"
            style={{ background: it.color }}
          />
          <span className="flex-1 text-sm text-ink-soft truncate">
            {it.label}
          </span>
          <span className="text-lg font-bold text-ink tabular-nums">
            {it.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
