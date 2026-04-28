import { cn } from "../lib/cn";
import type { ReactNode } from "react";

type Tone = "violet" | "pink" | "green" | "yellow" | "neutral";

const toneMap: Record<Tone, string> = {
  violet: "bg-accent-violet/15 text-accent-violet",
  pink: "bg-accent-pink/15 text-accent-pink",
  green: "bg-accent-green/15 text-[#1f9b6a]",
  yellow: "bg-accent-yellow/20 text-[#a4761a]",
  neutral: "bg-surface-dim text-ink-soft",
};

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide",
        toneMap[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
