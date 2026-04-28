"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  CalendarDays,
  CreditCard,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Receipt,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import {
  Breadcrumbs,
  Button,
  EmptyState,
  StatCard,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  cn,
} from "@aqualine/ui";
import { api, type Paginated } from "@/lib/api";
import type {
  Category,
  DashboardKPI,
  DashboardPeriod,
  Expense,
} from "@/lib/types";

type ViewMode = "grid" | "table";

const PERIOD_OPTIONS: { value: DashboardPeriod; label: string; short: string }[] = [
  { value: "month", label: "За месяц", short: "Мес" },
  { value: "year", label: "За год", short: "Год" },
  { value: "all", label: "За всё время", short: "Всё" },
];

function fmtMoney(v: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

// ─── Expense card ─────────────────────────────────────────────────────────

function ExpenseCard({ ex }: { ex: Expense }) {
  return (
    <Link
      href={`/finance/expenses/${ex.id}`}
      className="group relative flex flex-col gap-3 p-5 pl-6 bg-white rounded-2xl border border-slate-100 hover:shadow-md hover:-translate-y-0.5 hover:border-slate-200 transition overflow-hidden"
    >
      <span
        className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full"
        style={{ background: ex.category_color }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] text-ink-soft">
            <CalendarDays size={12} className="text-ink-dim" />
            <span className="tabular-nums">{fmtDate(ex.date)}</span>
          </div>
          <div className="mt-1 inline-flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: ex.category_color }}
            />
            <span className="text-sm font-bold text-ink truncate group-hover:text-accent-violet transition">
              {ex.category_name}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-ink-dim uppercase tracking-wider font-semibold">
            Сумма
          </div>
          <div className="text-base font-bold text-accent-pink tabular-nums">
            −{fmtMoney(num(ex.amount))} с.
          </div>
        </div>
      </div>

      {ex.description ? (
        <div className="text-[12px] text-ink-soft line-clamp-2 pt-3 border-t border-slate-100">
          {ex.description}
        </div>
      ) : null}

      {ex.created_by_name ? (
        <div className="text-[11px] text-ink-dim">
          Создал:{" "}
          <span className="text-ink-soft font-semibold">{ex.created_by_name}</span>
        </div>
      ) : null}
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function FinancePage() {
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [kpi, setKpi] = useState<DashboardKPI | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [view, setView] = useState<ViewMode>("grid");
  const [loadingKpi, setLoadingKpi] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoadingKpi(true);
    api<DashboardKPI>(`/dashboard/kpi/?period=${period}`)
      .then((d) => {
        if (!alive) return;
        setKpi(d);
      })
      .catch((e) =>
        alive && setError(e instanceof Error ? e.message : "Ошибка"),
      )
      .finally(() => alive && setLoadingKpi(false));
    return () => {
      alive = false;
    };
  }, [period]);

  useEffect(() => {
    let alive = true;
    api<Paginated<Category>>("/finance/categories/?type=expense&page_size=100")
      .then((d) => alive && setCategories(d.results))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const id = setTimeout(async () => {
      setLoadingExpenses(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("category", categoryFilter);
      try {
        const data = await api<Paginated<Expense>>(
          `/finance/expenses/?${params.toString()}`,
        );
        if (!alive) return;
        setExpenses(data.results);
        setTotal(data.count);
      } catch (err) {
        if (alive)
          setError(err instanceof Error ? err.message : "Ошибка загрузки");
      } finally {
        if (alive) setLoadingExpenses(false);
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [search, categoryFilter]);

  const margin = useMemo(() => {
    if (!kpi || kpi.total_sales <= 0) return 0;
    return Math.round((kpi.net_profit / kpi.total_sales) * 100);
  }, [kpi]);

  const categoryCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const e of expenses) {
      const k = String(e.category);
      out[k] = (out[k] ?? 0) + 1;
    }
    return out;
  }, [expenses]);

  const filtersActive = search !== "" || categoryFilter !== "";

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs items={[{ label: "Финансы" }]} />

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink">Финансы</h1>
          <p className="text-sm text-ink-soft mt-0.5">
            Доходы, расходы и прибыль
          </p>
        </div>
        <div className="inline-flex p-1 bg-white border border-slate-100 rounded-full">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={
                period === opt.value
                  ? "px-3 sm:px-4 py-1.5 rounded-full bg-accent-violet text-white text-xs sm:text-sm font-semibold transition whitespace-nowrap"
                  : "px-3 sm:px-4 py-1.5 rounded-full text-ink-soft text-xs sm:text-sm font-medium hover:text-ink transition whitespace-nowrap"
              }
            >
              <span className="sm:hidden">{opt.short}</span>
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Wallet}
          tone="green"
          label="Выручка"
          value={loadingKpi ? "..." : `${fmtMoney(kpi?.total_sales ?? 0)} с.`}
          hint="сумма поступлений"
          delta={kpi?.deltas.sales ?? null}
        />
        <StatCard
          icon={TrendingDown}
          tone="pink"
          label="Расходы"
          value={
            loadingKpi ? "..." : `${fmtMoney(kpi?.total_expenses ?? 0)} с.`
          }
          hint="операционные затраты"
        />
        <StatCard
          icon={TrendingUp}
          tone={kpi && kpi.net_profit < 0 ? "pink" : "green"}
          label="Чистая прибыль"
          value={loadingKpi ? "..." : `${fmtMoney(kpi?.net_profit ?? 0)} с.`}
          hint="выручка − расходы"
        />
        <StatCard
          icon={Activity}
          tone={margin < 0 ? "pink" : "violet"}
          label="Маржа"
          value={loadingKpi ? "..." : `${margin}%`}
          hint="прибыль / выручка"
        />
      </div>

      {/* Header for expenses */}
      <div className="flex items-end justify-between gap-4 flex-wrap mt-2">
        <div>
          <h2 className="text-xl font-bold text-ink">Расходы</h2>
          <p className="text-xs text-ink-soft mt-0.5">
            {loadingExpenses ? "Загрузка..." : `Всего записей: ${total}`}
          </p>
        </div>
        <Link href="/finance/expenses/new">
          <Button>
            <Plus size={16} />
            Добавить расход
          </Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по описанию..."
              className="w-full h-11 pl-10 pr-9 rounded-full bg-slate-50 text-ink text-sm outline-none placeholder:text-ink-dim focus:bg-white focus:ring-2 focus:ring-accent-violet/20 transition"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Очистить"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center rounded-full text-ink-soft hover:text-ink hover:bg-slate-100 transition"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
          <div className="hidden sm:inline-flex p-1 bg-slate-50 rounded-full">
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-label="Сетка"
              className={cn(
                "w-9 h-9 grid place-items-center rounded-full transition",
                view === "grid"
                  ? "bg-white text-accent-violet shadow-sm"
                  : "text-ink-soft hover:text-ink",
              )}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              aria-label="Таблица"
              className={cn(
                "w-9 h-9 grid place-items-center rounded-full transition",
                view === "table"
                  ? "bg-white text-accent-violet shadow-sm"
                  : "text-ink-soft hover:text-ink",
              )}
            >
              <ListIcon size={16} />
            </button>
          </div>
        </div>

        {categories.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-ink-dim uppercase tracking-wider font-semibold mr-1">
              Категория
            </span>
            <button
              type="button"
              onClick={() => setCategoryFilter("")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition",
                categoryFilter === ""
                  ? "bg-ink text-white"
                  : "bg-slate-50 text-ink-soft hover:text-ink",
              )}
            >
              Все
            </button>
            {categories.map((c) => {
              const active = categoryFilter === String(c.id);
              const cnt = categoryCounts[String(c.id)] ?? 0;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryFilter(String(c.id))}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold transition inline-flex items-center gap-1.5",
                    active
                      ? "bg-accent-violet text-white"
                      : "bg-slate-50 text-ink-soft hover:text-ink",
                  )}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: c.color }}
                  />
                  {c.name}
                  {cnt > 0 ? (
                    <span
                      className={cn(
                        "px-1.5 rounded-full text-[10px] tabular-nums",
                        active ? "bg-white/20" : "bg-white",
                      )}
                    >
                      {cnt}
                    </span>
                  ) : null}
                </button>
              );
            })}
            {filtersActive ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("");
                }}
                className="ml-auto text-xs text-ink-soft hover:text-ink underline-offset-2 hover:underline transition"
              >
                Сбросить
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Body */}
      {error ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 text-sm text-accent-pink">
          {error}
        </div>
      ) : loadingExpenses ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="h-36 rounded-2xl bg-white border border-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10">
          <EmptyState
            icon={Receipt}
            title={filtersActive ? "Ничего не найдено" : "Расходов пока нет"}
            subtitle={
              filtersActive
                ? "Попробуйте изменить фильтры или сбросить их."
                : categories.length === 0
                  ? "Сначала создайте категории через Django-админку, затем добавьте первый расход."
                  : "Нажмите «Добавить расход», чтобы внести первую запись."
            }
            action={
              filtersActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("");
                  }}
                  className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-ink text-sm font-semibold transition"
                >
                  Сбросить фильтры
                </button>
              ) : (
                <Link
                  href="/finance/expenses/new"
                  className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-accent-violet text-white text-sm font-semibold hover:bg-bg-deep transition"
                >
                  <Plus size={16} />
                  Добавить расход
                </Link>
              )
            }
          />
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenses.map((ex) => (
            <ExpenseCard key={ex.id} ex={ex} />
          ))}
        </div>
      ) : (
        <Table>
          <THead>
            <TH>Дата</TH>
            <TH>Категория</TH>
            <TH>Описание</TH>
            <TH>Создал</TH>
            <TH className="text-right">Сумма</TH>
          </THead>
          <TBody>
            {expenses.map((ex) => (
              <TR key={ex.id}>
                <TD className="text-ink-soft tabular-nums">
                  <Link
                    href={`/finance/expenses/${ex.id}`}
                    className="hover:text-accent-violet transition"
                  >
                    {new Date(ex.date).toLocaleDateString("ru-RU")}
                  </Link>
                </TD>
                <TD>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: ex.category_color }}
                    />
                    {ex.category_name}
                  </span>
                </TD>
                <TD className="text-ink-soft">{ex.description || "—"}</TD>
                <TD className="text-ink-soft">{ex.created_by_name || "—"}</TD>
                <TD className="text-right tabular-nums font-semibold text-accent-pink">
                  −{ex.amount}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
