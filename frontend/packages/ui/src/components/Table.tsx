import type { HTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Table({ className, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table
        {...rest}
        className={cn("w-full border-separate border-spacing-y-2", className)}
      />
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr>{children}</tr>
    </thead>
  );
}

export function TH({
  className,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...rest}
      className={cn(
        "text-left text-[11px] font-semibold text-ink-soft uppercase tracking-wider px-4 pb-2",
        className,
      )}
    />
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TR({
  className,
  ...rest
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      {...rest}
      className={cn(
        "bg-surface shadow-neu-soft [&>td:first-child]:rounded-l-neu [&>td:last-child]:rounded-r-neu transition hover:shadow-neu-out",
        className,
      )}
    />
  );
}

export function TD({
  className,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...rest}
      className={cn("px-4 py-3 text-sm text-ink first:font-medium", className)}
    />
  );
}
