"use client";

import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, className, id, ...rest }, ref) {
    const auto = useId();
    const inputId = id ?? auto;
    return (
      <div className="block">
        {label ? (
          <label
            htmlFor={inputId}
            className="block text-[11px] font-semibold text-ink-soft mb-1.5 uppercase tracking-wider"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          {...rest}
          className={cn(
            "w-full h-11 px-4 rounded-neu bg-surface text-ink shadow-neu-in outline-none placeholder:text-ink-dim",
            "focus:ring-2 focus:ring-accent-violet/40",
            error && "ring-2 ring-accent-pink",
            className,
          )}
        />
        {error ? (
          <span className="block text-xs text-accent-pink mt-1">{error}</span>
        ) : null}
      </div>
    );
  },
);
