"use client";

import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, className, id, rows = 4, ...rest }, ref) {
    const auto = useId();
    const tid = id ?? auto;
    return (
      <div className="block">
        {label ? (
          <label
            htmlFor={tid}
            className="block text-[11px] font-semibold text-ink-soft mb-1.5 uppercase tracking-wider"
          >
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={tid}
          rows={rows}
          {...rest}
          className={cn(
            "w-full px-4 py-3 rounded-neu bg-surface text-ink shadow-neu-in outline-none placeholder:text-ink-dim resize-y",
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
