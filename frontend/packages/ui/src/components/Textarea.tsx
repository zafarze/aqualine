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
    const errorId = error ? `${tid}-error` : undefined;
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
          aria-invalid={error ? "true" : undefined}
          aria-describedby={errorId}
          {...rest}
          className={cn(
            "w-full px-4 py-3 rounded-neu bg-surface text-ink shadow-neu-in outline-none placeholder:text-ink-dim resize-y",
            "focus-visible:ring-2 focus-visible:ring-accent-violet/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
            error && "ring-2 ring-accent-pink",
            className,
          )}
        />
        {error ? (
          <span id={errorId} role="alert" className="block text-xs text-accent-pink mt-1">
            {error}
          </span>
        ) : null}
      </div>
    );
  },
);
