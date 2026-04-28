"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List as ListIcon,
  Package,
  Plus,
  Search,
  ShoppingBag,
  User,
  Wallet,
  X,
} from "lucide-react";
import {
  Badge,
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
import {
  ORDER_STATUS_OPTIONS,
  ORDER_STATUS_TONE,
  type Order,
  type OrderStatus,
} from "@/lib/types";

type ViewMode = "grid" | "table";

const STATUS_STRIPE: Record<OrderStatus, string> = {
  lead: "bg-amber-400",
  quoted: "bg-violet-400",
  confirmed: "bg-violet-500",
  shipped: "bg-emerald-400",
  paid: "bg-emerald-500",
  cancelled: "bg-pink-400",
};

const ACTIVE_STATUSES: OrderStatus[] = ["lead", "quoted", "confirmed", "shipped"];

function fmtMoney(v: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function num(v: string | undefined): number {
  if (!v) return 0;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
  });
}

function isOverdue(o: Order): boolean {
  if (!o.due_date) return false;
  if (o.status === "paid" || o.status === "cancelled") return false;
  const due = new Date(o.due_date).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today.getTime();
}

// ─── Order card ───────────────────────────────────────────────────────────

function OrderCard({ o }: { o: Order }) {
  const total = num(o.total);
  const paid = num(o.paid_amount);
  const paidPct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const overdue = isOverdue(o);
  const itemsCount = o.items?.length ?? 0;

  return (
    <Link
      href={`/orders/${o.id}`}
      className="group relative flex flex-col gap-3 p-5 pl-6 bg-white rounded-2xl border border-slate-100 hover:shadow-md hover:-translate-y-0.5 hover:border-slate-200 transition overflow-hidden"
    >
      <span
        className={cn(
          "absolute left-0 top-4 bottom-4 w-1 rounded-r-full",
          STATUS_STRIPE[o.status],
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] text-ink-dim font-mono tabular-nums">
            <span className="truncate">{o.number}</span>
            <span className="text-slate-300">·</span>
            <span className="whitespace-nowrap">{fmtDate(o.created_at)}</span>
          </div>
          <div className="text-sm font-bold text-ink leading-snug truncate group-hover:text-accent-violet transition mt-0.5">
            {o.client_name || "Клиент не указан"}
          </div>
        </div>
        <Badge tone={ORDER_STATUS_TONE[o.status]}>{o.status_display}</Badge>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-ink-soft">
        <span className="inline-flex items-center gap-1">
          <Package size={12} />
          {itemsCount} {itemsCount === 1 ? "поз." : "поз."}
        </span>
        {o.manager_name ? (
          <span className="inline-flex items-center gap-1 truncate">
            <User size={12} />
            <span className="truncate">{o.manager_name}</span>
          </span>
        ) : null}
        {o.due_date ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 ml-auto whitespace-nowrap",
              overdue ? "text-pink-600 font-semibold" : "",
            )}
          >
            {overdue ? <AlertCircle size={12} /> : <CalendarClock size={12} />}
            {fmtDate(o.due_date)}
          </span>
        ) : null}
      </div>

      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-[10px] text-ink-dim uppercase tracking-wider font-semibold">
            Сумма
          </span>
          <span className="text-base font-bold text-ink tabular-nums">
            {fmtMoney(total)} с.
          </span>
        </div>
        {o.paid_amount !== undefined ? (
          <>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  paidPct >= 100 ? "bg-emerald-400" : "bg-violet-400",
                )}
                style={{ width: `${paidPct}%` }}
              />
            </div>
            <div className="flex items-baseline justify-between mt-1.5 text-[11px] tabular-nums">
              <span className="text-ink-soft">
                Оплачено{" "}
                <span className="font-semibold text-ink">{fmtMoney(paid)}</span>
              </span>
              <span
                className={cn(
                  "font-semibold",
                  paidPct >= 100 ? "text-emerald-600" : "text-ink-soft",
                )}
              >
                {paidPct}%
              </span>
            </div>
          </>
        ) : null}
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function OrdersListPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [view, setView] = useState<ViewMode>("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const id = setTimeout(async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      try {
        const data = await api<Paginated<Order>>(
          `/orders/?${params.toString()}`,
        );
        if (!alive) return;
        setItems(data.results);
        setTotal(data.count);
      } catch (err) {
        if (alive)
          setError(err instanceof Error ? err.message : "Ошибка загрузки");
      } finally {
        if (alive) setLoading(false);
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [search, status]);

  const stats = useMemo(() => {
    const sum = items.reduce((s, o) => s + num(o.total), 0);
    const paid = items.reduce((s, o) => s + num(o.paid_amount), 0);
    const inProgress = items.filter((o) =>
      ACTIVE_STATUSES.includes(o.status),
    ).length;
    const overdue = items.filter(isOverdue).length;
    return { sum, paid, inProgress, overdue };
  }, [items]);

  const statusCounts = useMemo(() => {
    const out: Record<OrderStatus, number> = {
      lead: 0,
      quoted: 0,
      confirmed: 0,
      shipped: 0,
      paid: 0,
      cancelled: 0,
    };
    for (const o of items) out[o.status]++;
    return out;
  }, [items]);

  const filtersActive = search !== "" || status !== "";

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs items={[{ label: "Продажи" }, { label: "Заказы" }]} />

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink">Продажи · Заказы</h1>
          <p className="text-sm text-ink-soft mt-0.5">
            {loading ? "Загрузка..." : `Всего: ${total}`}
          </p>
        </div>
        <Link href="/orders/new">
          <Button>
            <Plus size={16} />
            Новый заказ
          </Button>
        </Link>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={ShoppingBag}
          tone="violet"
          label="Всего заказов"
          value={loading ? "..." : total}
          hint="в текущей выборке"
        />
        <StatCard
          icon={Wallet}
          tone="green"
          label="Сумма заказов"
          value={loading ? "..." : `${fmtMoney(stats.sum)} с.`}
          hint="суммарный объём"
        />
        <StatCard
          icon={CheckCircle2}
          tone="blue"
          label="Оплачено"
          value={loading ? "..." : `${fmtMoney(stats.paid)} с.`}
          hint={
            stats.sum > 0
              ? `${Math.round((stats.paid / stats.sum) * 100)}% от суммы`
              : "нет данных"
          }
        />
        <StatCard
          icon={stats.overdue > 0 ? AlertCircle : Clock}
          tone={stats.overdue > 0 ? "pink" : "orange"}
          label="В работе"
          value={loading ? "..." : stats.inProgress}
          hint={
            stats.overdue > 0
              ? `${stats.overdue} просрочено`
              : "активных заказов"
          }
        />
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
              placeholder="Поиск по номеру, клиенту, заметкам..."
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStatus("")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold transition inline-flex items-center gap-1.5",
              status === ""
                ? "bg-ink text-white"
                : "bg-slate-50 text-ink-soft hover:text-ink",
            )}
          >
            Все
            <span
              className={cn(
                "px-1.5 rounded-full text-[10px] tabular-nums",
                status === "" ? "bg-white/20" : "bg-white",
              )}
            >
              {items.length}
            </span>
          </button>
          {ORDER_STATUS_OPTIONS.map((o) => {
            const c = statusCounts[o.value];
            const active = status === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setStatus(o.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition inline-flex items-center gap-1.5",
                  active
                    ? "bg-accent-violet text-white"
                    : "bg-slate-50 text-ink-soft hover:text-ink",
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    STATUS_STRIPE[o.value],
                  )}
                />
                {o.label}
                <span
                  className={cn(
                    "px-1.5 rounded-full text-[10px] tabular-nums",
                    active ? "bg-white/20" : "bg-white",
                  )}
                >
                  {c}
                </span>
              </button>
            );
          })}
          {filtersActive ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatus("");
              }}
              className="ml-auto text-xs text-ink-soft hover:text-ink underline-offset-2 hover:underline transition"
            >
              Сбросить
            </button>
          ) : null}
        </div>
      </div>

      {/* Body */}
      {error ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 text-sm text-accent-pink">
          {error}
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-white border border-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10">
          <EmptyState
            icon={ShoppingBag}
            title={filtersActive ? "Ничего не найдено" : "Заказов пока нет"}
            subtitle={
              filtersActive
                ? "Попробуйте изменить фильтры или сбросить их."
                : "Создайте первый заказ — он появится здесь."
            }
            action={
              filtersActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatus("");
                  }}
                  className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-ink text-sm font-semibold transition"
                >
                  Сбросить фильтры
                </button>
              ) : (
                <Link
                  href="/orders/new"
                  className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-accent-violet text-white text-sm font-semibold hover:bg-bg-deep transition"
                >
                  <Plus size={16} />
                  Новый заказ
                </Link>
              )
            }
          />
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((o) => (
            <OrderCard key={o.id} o={o} />
          ))}
        </div>
      ) : (
        <Table>
          <THead>
            <TH>Номер</TH>
            <TH>Дата</TH>
            <TH>Клиент</TH>
            <TH>Статус</TH>
            <TH>Менеджер</TH>
            <TH>Срок</TH>
            <TH className="text-right">Сумма</TH>
          </THead>
          <TBody>
            {items.map((o) => {
              const overdue = isOverdue(o);
              return (
                <TR key={o.id}>
                  <TD className="tabular-nums">
                    <Link
                      href={`/orders/${o.id}`}
                      className="hover:text-accent-violet transition"
                    >
                      {o.number}
                    </Link>
                  </TD>
                  <TD className="text-ink-soft">
                    {new Date(o.created_at).toLocaleDateString("ru-RU")}
                  </TD>
                  <TD>{o.client_name}</TD>
                  <TD>
                    <Badge tone={ORDER_STATUS_TONE[o.status]}>
                      {o.status_display}
                    </Badge>
                  </TD>
                  <TD>{o.manager_name || "—"}</TD>
                  <TD
                    className={cn(
                      overdue ? "text-pink-600 font-semibold" : "text-ink-soft",
                    )}
                  >
                    {o.due_date ? (
                      <span className="inline-flex items-center gap-1">
                        {overdue ? <AlertCircle size={12} /> : null}
                        {new Date(o.due_date).toLocaleDateString("ru-RU")}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TD>
                  <TD className="text-right tabular-nums font-semibold">
                    {o.total}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}
