"use client";

import { useEffect, useState } from "react";
import { BarChart3, LineChart, PieChart, Target, Users } from "lucide-react";
import {
  BarsCard,
  Breadcrumbs,
  CircleRow,
  DonutLegend,
  EmptyState,
  MiniArea,
  ProgressRow,
  StatDonut,
  StatList,
} from "@aqualine/ui";
import { api } from "@/lib/api";
import { type DashboardKPI, type DashboardPeriod } from "@/lib/types";

const PERIOD_OPTIONS: { value: DashboardPeriod; label: string; short: string }[] = [
  { value: "month", label: "За месяц", short: "Мес" },
  { value: "year", label: "За год", short: "Год" },
  { value: "all", label: "За всё время", short: "Всё" },
];

type ProgressColor = "yellow" | "green" | "pink" | "violet";

function pickProgressColor(hex: string): ProgressColor {
  const c = hex.toLowerCase();
  if (c.includes("8e7c") || c.includes("6c5c")) return "violet";
  if (c.includes("ff6b") || c.includes("ec4")) return "pink";
  if (c.includes("5dd9") || c.includes("10b")) return "green";
  return "yellow";
}

function pickDonutColor(hex: string): "violet" | "pink" | "green" | "yellow" {
  return pickProgressColor(hex);
}

function CardShell({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
      <div className="flex items-start justify-between mb-5 gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-ink truncate">{title}</h2>
          {subtitle ? (
            <p className="text-xs text-ink-soft mt-0.5 truncate">{subtitle}</p>
          ) : null}
        </div>
        {Icon ? <Icon size={18} className="text-ink-dim shrink-0" /> : null}
      </div>
      {children}
    </div>
  );
}

export default function StatsPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("month");
  const [kpi, setKpi] = useState<DashboardKPI | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setKpi(null);
    setError(null);
    api<DashboardKPI>(`/dashboard/kpi/?period=${period}`)
      .then((d) => alive && setKpi(d))
      .catch((e) =>
        alive && setError(e instanceof Error ? e.message : "Ошибка"),
      );
    return () => {
      alive = false;
    };
  }, [period]);

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <Breadcrumbs items={[{ label: "Статистика" }]} />
        <div className="bg-white rounded-2xl p-5 border border-slate-100 text-sm text-accent-pink">
          Не удалось загрузить статистику: {error}
        </div>
      </div>
    );
  }

  const loading = !kpi;

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs items={[{ label: "Статистика" }]} />

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink">Статистика</h1>
          <p className="text-sm text-ink-soft mt-0.5">
            Глубокая аналитика — менеджеры, склад, клиенты, продажи
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

      {/* Hero: 3 donuts */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        {loading ? (
          <div className="h-44 grid place-items-center text-sm text-ink-dim">
            Загрузка...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatDonut
              value={kpi.deal_conversion}
              color="violet"
              label="Конверсия"
              sub="лид → оплачено"
            />
            <StatDonut
              value={kpi.plan_completion}
              color="pink"
              label="План месяца"
              sub="выполнение цели"
            />
            <StatDonut
              value={kpi.warehouse_kpi.fill_rate}
              color="green"
              label="Заполненность склада"
              sub="свободно vs занято"
            />
          </div>
        )}
      </div>

      {/* Row 2: Менеджеры + Топ-товары */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CardShell
          title="Менеджеры"
          subtitle="Производительность за период"
          icon={Users}
        >
          {loading ? (
            <div className="h-40 grid place-items-center text-sm text-ink-dim">
              Загрузка...
            </div>
          ) : kpi.managers_performance.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Нет данных"
              subtitle="Подключите менеджеров и зафиксируйте оплаты — рейтинг появится."
            />
          ) : (
            <div className="flex flex-col gap-4">
              {kpi.managers_performance.slice(0, 6).map((m) => (
                <ProgressRow
                  key={m.label}
                  value={m.value}
                  color={pickProgressColor(m.color)}
                  label={m.label}
                />
              ))}
            </div>
          )}
        </CardShell>

        <CardShell
          title="Топ-товары"
          subtitle="По проданному объёму"
          icon={BarChart3}
        >
          {loading ? (
            <div className="h-40 grid place-items-center text-sm text-ink-dim">
              Загрузка...
            </div>
          ) : kpi.top_products_units.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Нет продаж"
              subtitle="Создайте первый оплаченный заказ — товары появятся в рейтинге."
            />
          ) : (
            <BarsCard
              bars={kpi.top_products_units.slice(0, 5).map((b) => ({
                label: b.label,
                value: b.value,
                color: pickDonutColor(b.color),
              }))}
            />
          )}
        </CardShell>
      </div>

      {/* Row 3: Динамика выручки + сегменты */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <CardShell
            title="Динамика выручки"
            subtitle="Поступления оплат по дням"
            icon={LineChart}
          >
            {loading ? (
              <div className="h-32 grid place-items-center text-sm text-ink-dim">
                Загрузка...
              </div>
            ) : kpi.revenue_dynamics.every((v) => v === 0) ? (
              <EmptyState
                icon={LineChart}
                title="Нет данных"
                subtitle="Зафиксируйте оплату — кривая появится здесь."
              />
            ) : (
              <MiniArea data={kpi.revenue_dynamics} color="#8E7CF8" height={170} />
            )}
          </CardShell>
        </div>

        <CardShell
          title="Сегменты клиентов"
          subtitle="Распределение по типам"
          icon={PieChart}
        >
          {loading ? (
            <div className="h-32 grid place-items-center text-sm text-ink-dim">
              Загрузка...
            </div>
          ) : kpi.client_segments.length === 0 ? (
            <EmptyState
              icon={PieChart}
              title="Нет данных"
              subtitle="Заведите клиентов — увидите сегментацию."
            />
          ) : (
            <DonutLegend items={kpi.client_segments} />
          )}
        </CardShell>
      </div>

      {/* Row 4: KPI склада */}
      <CardShell
        title="KPI склада"
        subtitle="Оборачиваемость, заполненность, точность учёта"
        icon={Target}
      >
        {loading ? (
          <div className="h-40 grid place-items-center text-sm text-ink-dim">
            Загрузка...
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex justify-center">
              <CircleRow
                values={[
                  kpi.warehouse_kpi.turnover,
                  kpi.warehouse_kpi.fill_rate,
                  kpi.warehouse_kpi.accuracy,
                ]}
                color="#8E7CF8"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
          </div>
        )}
      </CardShell>

      {/* Row 5: Активность по дням */}
      <CardShell
        title="Активность по дням недели"
        subtitle="Число обращений / заказов"
        icon={BarChart3}
      >
        {loading ? (
          <div className="h-32 grid place-items-center text-sm text-ink-dim">
            Загрузка...
          </div>
        ) : kpi.weekly_requests.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Нет данных"
            subtitle="Заявки появятся здесь после первых заказов."
          />
        ) : (
          <StatList items={kpi.weekly_requests} />
        )}
      </CardShell>
    </div>
  );
}
