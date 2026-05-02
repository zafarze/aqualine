import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Skeleton({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      {...rest}
      className={cn(
        "animate-pulse rounded-neu bg-surface-dim/70",
        className,
      )}
    >
      <span className="sr-only">Загрузка…</span>
    </div>
  );
}
