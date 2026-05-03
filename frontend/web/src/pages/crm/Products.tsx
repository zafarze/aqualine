
import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/next-shim";
import {
  Boxes,
  Droplet,
  LayoutGrid,
  List as ListIcon,
  Package,
  Plus,
  Ruler,
  Scale,
  Search,
  Tags,
  TrendingUp,
  Wallet,
  X,
  type LucideIcon,
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
import { type Product, type ProductUnit } from "@/lib/types";

type ViewMode = "grid" | "table";
type StockFilter = "all" | "ok" | "low" | "out";

const UNIT_ICON: Record<ProductUnit, LucideIcon> = {
  pcs: Package,
  m: Ruler,
  kg: Scale,
  l: Droplet,
  pack: Boxes,
};

const UNIT_TONE: Record<ProductUnit, { bg: string; fg: string }> = {
  pcs: { bg: "bg-violet-50", fg: "text-violet-500" },
  m: { bg: "bg-sky-50", fg: "text-sky-500" },
  kg: { bg: "bg-amber-50", fg: "text-amber-500" },
  l: { bg: "bg-emerald-50", fg: "text-emerald-500" },
  pack: { bg: "bg-pink-50", fg: "text-pink-500" },
};

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

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function stockLevel(stock: number, ref: number): {
  level: StockFilter;
  pct: number;
  color: string;
  label: string;
} {
  if (stock <= 0)
    return { level: "out", pct: 0, color: "#FF6B9D", label: "Нет в наличии" };
  const denom = Math.max(ref, 1);
  const pct = Math.min(100, Math.round((stock / (denom * 2)) * 100));
  if (stock < denom * 0.4)
    return { level: "low", pct: Math.max(8, pct), color: "#F5C24A", label: "Мало" };
  return { level: "ok", pct: Math.max(30, pct), color: "#5DD9A8", label: "В наличии" };
}

const UNIT_FILTER_OPTIONS: { value: ProductUnit | "all"; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "l", label: "Литры" },
  { value: "pcs", label: "Штуки" },
  { value: "pack", label: "Упаковки" },
  { value: "kg", label: "Кг" },
  { value: "m", label: "Метры" },
];

const STOCK_FILTER_OPTIONS: { value: StockFilter; label: string; tone: string }[] = [
  { value: "all", label: "Все", tone: "bg-slate-100 text-ink-soft" },
  { value: "ok", label: "В наличии", tone: "bg-emerald-50 text-emerald-600" },
  { value: "low", label: "Мало", tone: "bg-amber-50 text-amber-600" },
  { value: "out", label: "Нет", tone: "bg-pink-50 text-pink-600" },
];

// ─── Product card ─────────────────────────────────────────────────────────

function ProductCard({ p, refStock }: { p: Product; refStock: number }) {
  const Icon = UNIT_ICON[p.unit] ?? Package;
  const tone = UNIT_TONE[p.unit] ?? UNIT_TONE.pcs;
  const stock = num(p.stock);
  const purchase = num(p.purchase_price);
  const sale = num(p.sale_price);
  const margin = purchase > 0 ? Math.round(((sale - purchase) / purchase) * 100) : 0;
  const sl = stockLevel(stock, refStock);

  return (
    <Link
      href={`/products/${p.id}`}
      className="group flex flex-col gap-4 p-5 bg-white rounded-2xl border border-slate-100 hover:shadow-md hover:-translate-y-0.5 hover:border-slate-200 transition"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "w-12 h-12 shrink-0 rounded-xl grid place-items-center transition-transform group-hover:scale-105",
            tone.bg,
          )}
        >
          <Icon size={22} className={tone.fg} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] text-ink-dim font-mono tabular-nums truncate">
            {p.sku}
          </div>
          <div className="text-sm font-bold text-ink leading-snug line-clamp-2 group-hover:text-accent-violet transition">
            {p.name}
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap",
            sl.level === "out" && "bg-pink-50 text-pink-600",
            sl.level === "low" && "bg-amber-50 text-amber-600",
            sl.level === "ok" && "bg-emerald-50 text-emerald-600",
          )}
        >
          {sl.label}
        </span>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-[11px] text-ink-soft uppercase tracking-wider font-semibold">
            Остаток
          </span>
          <span className="text-sm font-bold text-ink tabular-nums">
            {p.stock} {p.unit_display}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${sl.pct}%`, background: sl.color }}
          />
        </div>
      </div>

      <div className="flex items-end justify-between gap-3 pt-3 border-t border-slate-100">
        <div>
          <div className="text-[10px] text-ink-dim uppercase tracking-wider font-semibold">
            Закупка
          </div>
          <div className="text-sm text-ink-soft tabular-nums">
            {fmtMoney(purchase)} с.
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-ink-dim uppercase tracking-wider font-semibold">
            Розница
          </div>
          <div className="text-base font-bold text-ink tabular-nums">
            {fmtMoney(sale)} с.
          </div>
        </div>
        {margin !== 0 ? (
          <span
            className={cn(
              "shrink-0 inline-flex items-center gap-0.5 px-2 py-1 rounded-full text-[11px] font-bold",
              margin > 0
                ? "bg-emerald-50 text-emerald-600"
                : "bg-pink-50 text-pink-600",
            )}
          >
            <TrendingUp size={11} />
            {margin > 0 ? "+" : ""}
            {margin}%
          </span>
        ) : null}
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function ProductsListPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [unit, setUnit] = useState<ProductUnit | "all">("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
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
      try {
        const data = await api<Paginated<Product>>(
          `/products/?${params.toString()}`,
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
  }, [search]);

  const refStock = useMemo(
    () => median(items.map((p) => num(p.stock)).filter((v) => v > 0)),
    [items],
  );

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (unit !== "all" && p.unit !== unit) return false;
      if (stockFilter !== "all") {
        const sl = stockLevel(num(p.stock), refStock).level;
        if (sl !== stockFilter) return false;
      }
      return true;
    });
  }, [items, unit, stockFilter, refStock]);

  const stats = useMemo(() => {
    const stockValue = items.reduce(
      (s, p) => s + num(p.purchase_price) * num(p.stock),
      0,
    );
    const totalUnits = items.reduce((s, p) => s + num(p.stock), 0);
    const margins = items
      .map((p) => {
        const pp = num(p.purchase_price);
        const sp = num(p.sale_price);
        return pp > 0 ? ((sp - pp) / pp) * 100 : null;
      })
      .filter((v): v is number => v !== null);
    const avgMargin =
      margins.length > 0
        ? Math.round(margins.reduce((s, m) => s + m, 0) / margins.length)
        : 0;
    const lowCount = items.filter((p) => {
      const s = num(p.stock);
      return s > 0 && s < refStock * 0.4;
    }).length;
    const outCount = items.filter((p) => num(p.stock) <= 0).length;
    return { stockValue, totalUnits, avgMargin, lowCount, outCount };
  }, [items, refStock]);

  const filtersActive = unit !== "all" || stockFilter !== "all" || search !== "";

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs items={[{ label: "Склад" }, { label: "Товары" }]} />

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink">Склад · Товары</h1>
          <p className="text-sm text-ink-soft mt-0.5">
            {loading ? "Загрузка..." : `Всего позиций: ${total}`}
          </p>
        </div>
        <Link href="/products/new">
          <Button>
            <Plus size={16} />
            Добавить товар
          </Button>
        </Link>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Tags}
          tone="violet"
          label="Позиций"
          value={loading ? "..." : total}
          hint="в каталоге"
        />
        <StatCard
          icon={Wallet}
          tone="green"
          label="Стоимость склада"
          value={loading ? "..." : `${fmtMoney(stats.stockValue)} с.`}
          hint="по закупочной цене"
        />
        <StatCard
          icon={Boxes}
          tone="blue"
          label="Единиц на складе"
          value={loading ? "..." : fmtMoney(stats.totalUnits)}
          hint="суммарный остаток"
        />
        <StatCard
          icon={TrendingUp}
          tone={stats.avgMargin >= 0 ? "orange" : "pink"}
          label="Средняя маржа"
          value={loading ? "..." : `${stats.avgMargin}%`}
          hint={
            stats.lowCount + stats.outCount > 0
              ? `${stats.outCount} нет · ${stats.lowCount} мало`
              : "запасы в норме"
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
              placeholder="Поиск по артикулу или названию..."
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
          <span className="text-[11px] text-ink-dim uppercase tracking-wider font-semibold mr-1">
            Ед.
          </span>
          {UNIT_FILTER_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setUnit(o.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition",
                unit === o.value
                  ? "bg-accent-violet text-white"
                  : "bg-slate-50 text-ink-soft hover:text-ink",
              )}
            >
              {o.label}
            </button>
          ))}
          <span className="hidden sm:block w-px h-5 bg-slate-200 mx-1" />
          <span className="text-[11px] text-ink-dim uppercase tracking-wider font-semibold mr-1">
            Остаток
          </span>
          {STOCK_FILTER_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setStockFilter(o.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition",
                stockFilter === o.value
                  ? "bg-ink text-white"
                  : `${o.tone} hover:opacity-80`,
              )}
            >
              {o.label}
            </button>
          ))}
          {filtersActive ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setUnit("all");
                setStockFilter("all");
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
              className="h-44 rounded-2xl bg-white border border-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10">
          <EmptyState
            icon={Package}
            title={filtersActive ? "Ничего не найдено" : "Товаров пока нет"}
            subtitle={
              filtersActive
                ? "Попробуйте изменить или сбросить фильтры."
                : "Добавьте первую позицию — она появится в каталоге."
            }
            action={
              filtersActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setUnit("all");
                    setStockFilter("all");
                  }}
                  className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-ink text-sm font-semibold transition"
                >
                  Сбросить фильтры
                </button>
              ) : (
                <Link
                  href="/products/new"
                  className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-accent-violet text-white text-sm font-semibold hover:bg-bg-deep transition"
                >
                  <Plus size={16} />
                  Добавить товар
                </Link>
              )
            }
          />
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} p={p} refStock={refStock} />
          ))}
        </div>
      ) : (
        <Table>
          <THead>
            <TH>Артикул</TH>
            <TH>Название</TH>
            <TH>Ед.</TH>
            <TH className="text-right">Закуп.</TH>
            <TH className="text-right">Розница</TH>
            <TH className="text-right">Маржа</TH>
            <TH className="text-right">Остаток</TH>
          </THead>
          <TBody>
            {filtered.map((p) => {
              const purchase = num(p.purchase_price);
              const sale = num(p.sale_price);
              const margin =
                purchase > 0
                  ? Math.round(((sale - purchase) / purchase) * 100)
                  : 0;
              const sl = stockLevel(num(p.stock), refStock);
              return (
                <TR key={p.id}>
                  <TD className="tabular-nums">
                    <Link
                      href={`/products/${p.id}`}
                      className="hover:text-accent-violet transition"
                    >
                      {p.sku}
                    </Link>
                  </TD>
                  <TD>{p.name}</TD>
                  <TD>{p.unit_display}</TD>
                  <TD className="text-right tabular-nums">{p.purchase_price}</TD>
                  <TD className="text-right tabular-nums font-semibold">
                    {p.sale_price}
                  </TD>
                  <TD className="text-right tabular-nums">
                    <span
                      className={cn(
                        margin > 0
                          ? "text-emerald-600"
                          : margin < 0
                            ? "text-pink-600"
                            : "text-ink-soft",
                        "font-semibold",
                      )}
                    >
                      {margin > 0 ? "+" : ""}
                      {margin}%
                    </span>
                  </TD>
                  <TD className="text-right tabular-nums">
                    <span
                      className="inline-flex items-center gap-1.5"
                      title={sl.label}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: sl.color }}
                      />
                      {p.stock}
                    </span>
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
