"use client";

import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { cn } from "../lib/cn";

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, error, options, placeholder, className, id, ...rest },
    ref,
  ) {
    const auto = useId();
    const selectId = id ?? auto;
    const errorId = error ? `${selectId}-error` : undefined;
    return (
      <div className="block">
        {label ? (
          <label
            htmlFor={selectId}
            className="block text-[11px] font-semibold text-ink-soft mb-1.5 uppercase tracking-wider"
          >
            {label}
          </label>
        ) : null}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={errorId}
          {...rest}
          className={cn(
            "w-full h-11 px-4 rounded-neu bg-surface text-ink shadow-neu-in outline-none appearance-none",
            "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 12 12%22><path fill=%22none%22 stroke=%22%236B6890%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M3 4.5l3 3 3-3%22/></svg>')]",
            "bg-no-repeat bg-[right_1rem_center] pr-9",
            "focus-visible:ring-2 focus-visible:ring-accent-violet/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
            error && "ring-2 ring-accent-pink",
            className,
          )}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error ? (
          <span id={errorId} role="alert" className="block text-xs text-accent-pink mt-1">
            {error}
          </span>
        ) : null}
      </div>
    );
  },
);
