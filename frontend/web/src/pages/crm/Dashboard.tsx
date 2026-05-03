
import { useEffect, useState } from "react";
import { Link } from "@/lib/next-shim";
import {
  Boxes,
  DollarSign,
  LineChart,
  Plus,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { EmptyState, ProgressRow, StatCard } from "@aqualine/ui";
import { api, type Paginated } from "@/lib/api";
import {
  type DashboardKPI,
  type DashboardPeriod,
  type FunnelStage,
  type Order,
  type TopClient,
} from "@/lib/types";

const PERIOD_OPTIONS: {
  value: DashboardPeriod;
  label: string;
  short: string;
}[] = [
  { value: "month", label: "За месяц", short: "Месяц" },
  { value: "year", label: "За год", short: "Год" },
  { value: "all", label: "За всё время", short: "Всё" },
];

function fmtMoney(v: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

// ─── Quick Actions ────────────────────────────────────────────────────────

interface QuickAction {
  icon: LucideIcon;
  label: string;
  short: string;
  href: string;
  iconBg: string;
  iconFg: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: ShoppingBag,
    label: "Новый заказ",
    short: "Заказ",
    href: "/orders/new",
    iconBg: "bg-violet-50",
    iconFg: "text-violet-500",
  },
  {
    icon: UserPlus,
    label: "Новый клиент",
    short: "Клиент",
    href: "/clients/new",
    iconBg: "bg-emerald-50",
    iconFg: "text-emerald-500",
  },
  {
    icon: Boxes,
    label: "Новый товар",
    short: "Товар",
    href: "/products/new",
    iconBg: "bg-pink-50",
    iconFg: "text-pink-500",
  },
  {
    icon: Wallet,
    label: "Новый расход",
    short: "Расход",
    href: "/finance/expenses/new",
    iconBg: "bg-orange-50",
    iconFg: "text-orange-500",
  },
];

function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {QUICK_ACTIONS.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.href}
            href={a.href}
            className="group flex flex-col sm:flex-row items-center sm:items-start sm:gap-3 gap-1.5 p-3 sm:p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-md hover:-translate-y-0.5 hover:border-slate-200 transition text-center sm:text-left"
          >
            <span
              className={`w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-xl ${a.iconBg} grid place-items-center group-hover:scale-110 transition`}
            >
              <Icon size={18} className={a.iconFg} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-semibold text-ink leading-tight">
                <span className="sm:hidden">{a.short}</span>
                <span className="hidden sm:inline">{a.label}</span>
              </div>
              <div className="hidden sm:flex text-[11px] text-ink-soft items-center gap-1 mt-0.5">
                <Plus size={10} />
                быстрое создание
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Funnel ───────────────────────────────────────────────────────────────

function FunnelCard({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(...stages.map((s) => s.count), 1);
  const total = stages.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-ink">Воронка сделок</h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Распределение заказов по статусам
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-ink tabular-nums">
            {total}
          </div>
          <div className="text-[11px] text-ink-soft">всего</div>
        </div>
      </div>
      {total === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Заказов пока нет"
          subtitle="Создайте первый заказ — он появится в воронке."
        />
      ) : (
        <div className="space-y-2.5">
          {stages.map((s) => {
            const widthPct = Math.max(8, (s.count / max) * 100);
            return (
              <div key={s.status} className="flex items-center gap-3">
                <div className="text-xs text-ink-soft w-24 truncate font-medium">
                  {s.label}
                </div>
                <div className="flex-1 h-9 bg-slate-50 rounded-lg relative overflow-hidden">
                  <div
                    className="h-full rounded-lg flex items-center justify-end px-3 transition-all"
                    style={{
                      width: `${widthPct}%`,
                      background: s.color,
                    }}
                  >
                    <span className="text-white text-sm font-bold tabular-nums">
                      {s.count}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Top Clients ──────────────────────────────────────────────────────────

function TopClientsCard({ items }: { items: TopClient[] }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-ink">Топ-клиенты</h2>
          <p className="text-xs text-ink-soft mt-0.5">по сумме оплат</p>
        </div>
        <Users size={18} className="text-ink-dim" />
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Пока пусто"
          subtitle="Топ появится, когда у клиентов будут оплаты."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((c, i) => {
            const rankColors = [
              "bg-amber-50 text-amber-600",
              "bg-slate-100 text-slate-600",
              "bg-orange-50 text-orange-600",
              "bg-violet-50 text-violet-600",
              "bg-violet-50 text-violet-600",
            ];
            return (
              <li key={c.id} className="flex items-center gap-3">
                <span
                  className={`w-8 h-8 rounded-full grid place-items-center font-bold text-xs shrink-0 ${rankColors[i] ?? rankColors[4]}`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/clients/${c.id}`}
                    className="text-sm font-semibold text-ink truncate hover:text-accent-violet block transition"
                  >
                    {c.name}
                  </Link>
                  <div className="text-[11px] text-ink-soft tabular-nums">
                    {c.orders} {c.orders === 1 ? "заказ" : "заказов"}
                  </div>
                </div>
                <div className="text-sm font-bold text-ink tabular-nums">
                  {fmtMoney(c.amount)} с.
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Smooth chart ─────────────────────────────────────────────────────────

function SmoothLine({ data }: { data: number[] }) {
  const w = 700;
  const h = 280;
  const pad = { top: 30, right: 20, bottom: 36, left: 50 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;

  const allZero = data.every((v) => v === 0);
  if (data.length < 2 || allZero) {
    return (
      <div className="h-[280px]">
        <EmptyState
          icon={LineChart}
          title="Нет данных за период"
          subtitle="Зафиксируйте оплату в любом заказе — кривая появится здесь."
        />
      </div>
    );
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = pad.left + (i * innerW) / (data.length - 1);
    const y = pad.top + innerH - ((v - min) / range) * innerH;
    return [x, y] as const;
  });

  let path = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const cx = (x0 + x1) / 2;
    path += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => {
    const v = min + ((max - min) * i) / ticks;
    const y = pad.top + innerH - ((v - min) / range) * innerH;
    return { v: Math.round(v), y };
  });

  const labels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const xCount = Math.min(data.length, labels.length);
  const xLabels = Array.from({ length: xCount }, (_, i) => {
    const x = pad.left + (i * innerW) / (data.length - 1 || 1);
    return { x, label: labels[i] ?? "" };
  });

  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-[280px]"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="line-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6C5CE7" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#6C5CE7" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line
            x1={pad.left}
            x2={w - pad.right}
            y1={t.y}
            y2={t.y}
            stroke="#E2E8F0"
            strokeDasharray="3 4"
          />
          <text
            x={pad.left - 10}
            y={t.y + 4}
            textAnchor="end"
            fill="#94A3B8"
            fontSize="11"
          >
            {t.v}
          </text>
        </g>
      ))}
      <path
        d={`${path} L ${last[0]},${pad.top + innerH} L ${points[0][0]},${pad.top + innerH} Z`}
        fill="url(#line-grad)"
      />
      <path
        d={path}
        fill="none"
        stroke="#6C5CE7"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="5" fill="#6C5CE7" />
      {xLabels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={h - 12}
          textAnchor="middle"
          fill="#94A3B8"
          fontSize="11"
        >
          {l.label}
        </text>
      ))}
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [kpi, setKpi] = useState<DashboardKPI | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setKpi(null);
    api<DashboardKPI>(`/dashboard/kpi/?period=${period}`)
      .then((d) => alive && setKpi(d))
      .catch((e) =>
        alive && setError(e instanceof Error ? e.message : "Ошибка"),
      );
    return () => {
      alive = false;
    };
  }, [period]);

  useEffect(() => {
    let alive = true;
    api<Paginated<Order>>("/orders/?ordering=-created_at&page_size=5")
      .then((d) => alive && setRecentOrders(d.results))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-100 text-sm text-accent-pink">
        Не удалось загрузить дашборд: {error}
      </div>
    );
  }

  const loading = !kpi;

  return (
    <div className="flex flex-col gap-5">
      {/* Заголовок + период */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink">Дашборд</h1>
          <p className="text-sm text-ink-soft mt-0.5">
            Сводка по бизнесу в реальном времени
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

      {/* Quick actions */}
      <QuickActions />

      {/* Стат-карточки с дельтами */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          tone="green"
          label="Выручка"
          value={loading ? "..." : `${fmtMoney(kpi.total_sales)} с.`}
          hint="за выбранный период"
          href="/finance"
          delta={loading ? null : kpi.deltas.sales}
        />
        <StatCard
          icon={ShoppingBag}
          tone="violet"
          label="Всего заказов"
          value={loading ? "..." : kpi.orders_count}
          hint="заведено в системе"
          href="/orders"
          delta={loading ? null : kpi.deltas.orders}
        />
        <StatCard
          icon={TrendingUp}
          tone="orange"
          label="Конверсия"
          value={loading ? "..." : `${kpi.deal_conversion}%`}
          hint="лид → оплачено"
          href="/orders"
          delta={loading ? null : kpi.deltas.conversion}
        />
        <StatCard
          icon={Boxes}
          tone="pink"
          label="Активные товары"
          value={loading ? "..." : kpi.stock_units}
          hint="ед. на складе"
          href="/products"
        />
      </div>

      {/* График + последние заказы */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-ink">Динамика выручки</h2>
              <p className="text-xs text-ink-soft mt-0.5">
                {loading
                  ? "Загрузка..."
                  : `сумма поступлений · ${fmtMoney(kpi.total_sales)} с.`}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-soft">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-violet" />
              Выручка
            </div>
          </div>
          {loading ? (
            <div className="h-[280px] grid place-items-center text-sm text-ink-dim">
              Загрузка...
            </div>
          ) : (
            <SmoothLine data={kpi.revenue_dynamics} />
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-ink">Последние заказы</h2>
          </div>

          {recentOrders.length === 0 ? (
            <div className="flex-1 grid place-items-center py-10">
              <div className="text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-50 grid place-items-center mb-3">
                  <ShoppingCart size={24} className="text-ink-dim" />
                </div>
                <div className="text-sm text-ink-soft">Заказов пока нет</div>
              </div>
            </div>
          ) : (
            <ul className="flex-1 flex flex-col gap-3">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/orders/${o.id}`}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-slate-50 transition"
                  >
                    <span
                      className={`w-1.5 h-10 rounded-full ${
                        o.status === "paid"
                          ? "bg-emerald-400"
                          : o.status === "cancelled"
                            ? "bg-pink-400"
                            : "bg-violet-400"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-ink truncate">
                        {o.client_name}
                      </div>
                      <div className="text-[11px] text-ink-soft tabular-nums">
                        {o.number} · {o.status_display}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-ink tabular-nums">
                      {o.total}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/orders"
            className="mt-4 h-10 grid place-items-center rounded-xl bg-slate-50 hover:bg-slate-100 text-sm font-semibold text-ink transition"
          >
            Посмотреть все заказы
          </Link>
        </div>
      </div>

      {/* Воронка + Топ-клиенты */}
      {!loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <FunnelCard stages={kpi.funnel} />
          <TopClientsCard items={kpi.top_clients} />
        </div>
      ) : null}

      {/* KPI склада */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-ink">KPI склада</h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Оборачиваемость, заполненность, точность учёта
            </p>
          </div>
        </div>
        {loading ? null : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ProgressRow
              value={kpi.warehouse_kpi.turnover}
              color="yellow"
              label="Оборачиваемость"
            />
            <ProgressRow
              value={kpi.warehouse_kpi.fill_rate}
              color="green"
              label="Заполненность"
            />
            <ProgressRow
              value={kpi.warehouse_kpi.accuracy}
              color="pink"
              label="Точность учёта"
            />
          </div>
        )}
      </div>
    </div>
  );
}
