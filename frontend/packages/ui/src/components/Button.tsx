"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type Variant = "primary" | "ghost" | "danger";
type Size = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", className, type = "button", ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        {...rest}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-neu font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet/50",
          size === "md" && "h-11 px-5 text-sm",
          size === "sm" && "h-9 px-4 text-xs",
          variant === "primary" &&
            "bg-bg text-white shadow-neu-purple hover:bg-bg-deep",
          variant === "ghost" &&
            "bg-surface text-ink shadow-neu-soft hover:shadow-neu-out",
          variant === "danger" &&
            "bg-accent-pink text-white shadow-neu-soft hover:opacity-90",
          className,
        )}
      />
    );
  },
);
