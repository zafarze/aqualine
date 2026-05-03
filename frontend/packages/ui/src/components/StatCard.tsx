import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";

type Tone = "violet" | "pink" | "green" | "yellow" | "blue" | "orange";

const toneMap: Record<Tone, { bg: string; fg: string }> = {
  violet: { bg: "bg-violet-50", fg: "text-violet-500" },
  pink: { bg: "bg-pink-50", fg: "text-pink-500" },
  green: { bg: "bg-emerald-50", fg: "text-emerald-500" },
  yellow: { bg: "bg-amber-50", fg: "text-amber-500" },
  blue: { bg: "bg-sky-50", fg: "text-sky-500" },
  orange: { bg: "bg-orange-50", fg: "text-orange-500" },
};

interface StatCardProps {
  icon: LucideIcon;
  tone?: Tone;
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  /** % изменения относительно предыдущего периода. null = нет данных. */
  delta?: number | null;
}

function DeltaBadge({ delta }: { delta: number }) {
  const positive = delta >= 0;
  const Icon = positive ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
        positive
          ? "bg-emerald-50 text-emerald-600"
          : "bg-pink-50 text-pink-600",
      )}
      title={`${positive ? "+" : ""}${delta.toFixed(1)}% к прошлому периоду`}
    >
      <Icon size={10} />
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

export function StatCard({
  icon: Icon,
  tone = "violet",
  label,
  value,
  hint,
  href,
  delta,
}: StatCardProps) {
  const palette = toneMap[tone];
  const inner = (
    <>
      <div
        className={cn(
          "w-12 h-12 shrink-0 rounded-xl grid place-items-center transition-transform",
          palette.bg,
          href && "group-hover:scale-105",
        )}
      >
        <Icon size={22} className={palette.fg} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-ink-soft uppercase tracking-wider font-semibold truncate">
          {label}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="text-2xl font-bold text-ink tabular-nums truncate">
            {value}
          </div>
          {delta !== null && delta !== undefined ? (
            <DeltaBadge delta={delta} />
          ) : null}
        </div>
        {hint ? (
          <div className="text-[11px] text-ink-dim mt-0.5">{hint}</div>
        ) : null}
      </div>
    </>
  );

  const className = cn(
    "bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4 transition",
    href
      ? "group hover:shadow-md hover:-translate-y-0.5 hover:border-slate-200 cursor-pointer"
      : "hover:shadow-sm",
  );

  if (href) {
    return (
      <a href={href} className={className}>
        {inner}
      </a>
    );
  }

  return <div className={className}>{inner}</div>;
}
