import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";
import { cn } from "../lib/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Хлебные крошки"
      className={cn(
        "flex items-center gap-1.5 text-sm text-ink-soft mb-4 flex-wrap",
        className,
      )}
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 hover:text-ink transition"
      >
        <Home size={14} />
        <span className="sr-only">Главная</span>
      </Link>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <Fragment key={i}>
            <ChevronRight size={14} className="text-ink-dim shrink-0" />
            {!isLast && item.href ? (
              <Link
                href={item.href}
                className="hover:text-ink transition truncate max-w-[180px]"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "truncate max-w-[260px]",
                  isLast && "text-ink font-semibold",
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
