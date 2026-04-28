import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

type Variant = "light" | "purple" | "purple-inset";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export function Card({ variant = "light", className, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={cn(
        "rounded-neu-lg p-5",
        variant === "light" && "bg-surface text-ink shadow-neu-soft",
        variant === "purple" && "bg-bg-deep text-white shadow-neu-purple",
        variant === "purple-inset" &&
          "bg-bg-deep text-white shadow-neu-purple-in",
        className,
      )}
    />
  );
}
