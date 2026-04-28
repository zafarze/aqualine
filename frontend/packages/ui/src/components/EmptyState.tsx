import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-10 px-4",
        className,
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-50 grid place-items-center mb-3">
        <Icon size={24} className="text-ink-dim" />
      </div>
      <div className="text-sm font-semibold text-ink">{title}</div>
      {subtitle ? (
        <div className="text-xs text-ink-soft mt-1 max-w-xs">{subtitle}</div>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
