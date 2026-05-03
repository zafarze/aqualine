
import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/next-shim";
import {
  Briefcase,
  Building2,
  Crown,
  LayoutGrid,
  List as ListIcon,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldOff,
  Sparkles,
  User as UserIcon,
  Users,
  X,
  type LucideIcon,
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
  CLIENT_SEGMENT_OPTIONS,
  CLIENT_STATUS_OPTIONS,
  type Client,
  type ClientSegment,
  type ClientStatus,
  type ClientType,
} from "@/lib/types";

type ViewMode = "grid" | "table";

const STATUS_TONE: Record<ClientStatus, "violet" | "green" | "yellow" | "pink" | "neutral"> = {
  lead: "yellow",
  active: "green",
  vip: "violet",
  blocked: "pink",
};

const SEGMENT_TONE: Record<ClientSegment, "violet" | "green" | "pink" | "neutral"> = {
  retail: "violet",
  b2b: "green",
  dealer: "pink",
  other: "neutral",
};

const STATUS_DOT: Record<ClientStatus, string> = {
  lead: "bg-amber-400",
  active: "bg-emerald-400",
  vip: "bg-violet-500",
  blocked: "bg-pink-400",
};

const TYPE_ICON: Record<ClientType, LucideIcon> = {
  physical: UserIcon,
  legal: Building2,
  entrepreneur: Briefcase,
};

const TYPE_TONE: Record<ClientType, { bg: string; fg: string }> = {
  physical: { bg: "bg-violet-50", fg: "text-violet-500" },
  legal: { bg: "bg-sky-50", fg: "text-sky-500" },
  entrepreneur: { bg: "bg-amber-50", fg: "text-amber-500" },
};

function initials(name: string): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Client card ──────────────────────────────────────────────────────────

function ClientCard({ c }: { c: Client }) {
  const Icon = TYPE_ICON[c.type] ?? UserIcon;
  const tone = TYPE_TONE[c.type] ?? TYPE_TONE.physical;

  return (
    <Link
      href={`/clients/${c.id}`}
      className="group flex flex-col gap-3 p-5 bg-white rounded-2xl border border-slate-100 hover:shadow-md hover:-translate-y-0.5 hover:border-slate-200 transition"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "w-12 h-12 shrink-0 rounded-2xl grid place-items-center font-bold text-base relative",
            tone.bg,
            tone.fg,
          )}
        >
          {initials(c.name)}
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white",
              STATUS_DOT[c.status],
            )}
            title={c.status_display}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-ink truncate group-hover:text-accent-violet transition">
            {c.name}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-ink-soft mt-0.5">
            <Icon size={12} />
            <span className="truncate">{c.type_display}</span>
          </div>
        </div>
        {c.status === "vip" ? (
          <Crown size={14} className="text-violet-500 shrink-0" />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge tone={SEGMENT_TONE[c.segment]}>{c.segment_display}</Badge>
        <Badge tone={STATUS_TONE[c.status]}>{c.status_display}</Badge>
      </div>

      <div className="flex flex-col gap-1 pt-3 border-t border-slate-100 text-[12px]">
        {c.phone ? (
          <div className="flex items-center gap-2 text-ink-soft tabular-nums truncate">
            <Phone size={12} className="text-ink-dim shrink-0" />
            <span className="truncate">{c.phone}</span>
          </div>
        ) : null}
        {c.email ? (
          <div className="flex items-center gap-2 text-ink-soft truncate">
            <Mail size={12} className="text-ink-dim shrink-0" />
            <span className="truncate">{c.email}</span>
          </div>
        ) : null}
        {!c.phone && !c.email ? (
          <span className="text-ink-dim text-[11px]">Контакты не указаны</span>
        ) : null}
      </div>

      {c.manager_name ? (
        <div className="text-[11px] text-ink-dim">
          Менеджер: <span className="text-ink-soft font-semibold">{c.manager_name}</span>
        </div>
      ) : null}
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function ClientsListPage() {
  const [items, setItems] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<ClientSegment | "">("");
  const [status, setStatus] = useState<ClientStatus | "">("");
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
      if (segment) params.set("segment", segment);
      if (status) params.set("status", status);
      try {
        const data = await api<Paginated<Client>>(
          `/clients/?${params.toString()}`,
        );
        if (!alive) return;
        setItems(data.results);
        setTotal(data.count);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Ошибка загрузки");
      } finally {
        if (alive) setLoading(false);
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [search, segment, status]);

  const stats = useMemo(() => {
    const leads = items.filter((c) => c.status === "lead").length;
    const active = items.filter((c) => c.status === "active").length;
    const vip = items.filter((c) => c.status === "vip").length;
    const blocked = items.filter((c) => c.status === "blocked").length;
    return { leads, active, vip, blocked };
  }, [items]);

  const statusCounts = useMemo(() => {
    const out: Record<ClientStatus, number> = {
      lead: 0,
      active: 0,
      vip: 0,
      blocked: 0,
    };
    for (const c of items) out[c.status]++;
    return out;
  }, [items]);

  const segmentCounts = useMemo(() => {
    const out: Record<ClientSegment, number> = {
      retail: 0,
      b2b: 0,
      dealer: 0,
      other: 0,
    };
    for (const c of items) out[c.segment]++;
    return out;
  }, [items]);

  const filtersActive = search !== "" || segment !== "" || status !== "";

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs items={[{ label: "Клиенты" }]} />

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink">Клиенты</h1>
          <p className="text-sm text-ink-soft mt-0.5">
            {loading ? "Загрузка..." : `Всего: ${total}`}
          </p>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus size={16} />
            Добавить клиента
          </Button>
        </Link>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          tone="violet"
          label="Всего клиентов"
          value={loading ? "..." : total}
          hint="в базе"
        />
        <StatCard
          icon={Sparkles}
          tone="yellow"
          label="Лиды"
          value={loading ? "..." : stats.leads}
          hint="новых обращений"
        />
        <StatCard
          icon={UserIcon}
          tone="green"
          label="Активные"
          value={loading ? "..." : stats.active}
          hint="регулярные клиенты"
        />
        <StatCard
          icon={Crown}
          tone="pink"
          label="VIP"
          value={loading ? "..." : stats.vip}
          hint={
            stats.blocked > 0
              ? `${stats.blocked} заблокировано`
              : "ключевые клиенты"
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
              placeholder="Поиск по имени, ИНН, телефону, email..."
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

        {/* Status chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-ink-dim uppercase tracking-wider font-semibold mr-1">
            Статус
          </span>
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
          </button>
          {CLIENT_STATUS_OPTIONS.map((o) => {
            const active = status === o.value;
            const c = statusCounts[o.value];
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
                <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT[o.value])} />
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
        </div>

        {/* Segment chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-ink-dim uppercase tracking-wider font-semibold mr-1">
            Сегмент
          </span>
          <button
            type="button"
            onClick={() => setSegment("")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold transition",
              segment === ""
                ? "bg-ink text-white"
                : "bg-slate-50 text-ink-soft hover:text-ink",
            )}
          >
            Все
          </button>
          {CLIENT_SEGMENT_OPTIONS.map((o) => {
            const active = segment === o.value;
            const c = segmentCounts[o.value];
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setSegment(o.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition inline-flex items-center gap-1.5",
                  active
                    ? "bg-accent-violet text-white"
                    : "bg-slate-50 text-ink-soft hover:text-ink",
                )}
              >
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
                setSegment("");
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
              className="h-44 rounded-2xl bg-white border border-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10">
          <EmptyState
            icon={filtersActive ? Search : Users}
            title={filtersActive ? "Ничего не найдено" : "Клиентов пока нет"}
            subtitle={
              filtersActive
                ? "Попробуйте изменить или сбросить фильтры."
                : "Нажмите «Добавить клиента», чтобы создать первого."
            }
            action={
              filtersActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSegment("");
                    setStatus("");
                  }}
                  className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-ink text-sm font-semibold transition"
                >
                  Сбросить фильтры
                </button>
              ) : (
                <Link
                  href="/clients/new"
                  className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-accent-violet text-white text-sm font-semibold hover:bg-bg-deep transition"
                >
                  <Plus size={16} />
                  Добавить клиента
                </Link>
              )
            }
          />
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((c) => (
            <ClientCard key={c.id} c={c} />
          ))}
        </div>
      ) : (
        <Table>
          <THead>
            <TH>Клиент</TH>
            <TH>Тип</TH>
            <TH>Сегмент</TH>
            <TH>Статус</TH>
            <TH>Телефон</TH>
            <TH>Менеджер</TH>
          </THead>
          <TBody>
            {items.map((c) => (
              <TR key={c.id}>
                <TD>
                  <Link
                    href={`/clients/${c.id}`}
                    className="hover:text-accent-violet transition"
                  >
                    {c.name}
                  </Link>
                </TD>
                <TD>{c.type_display}</TD>
                <TD>
                  <Badge tone={SEGMENT_TONE[c.segment]}>{c.segment_display}</Badge>
                </TD>
                <TD>
                  <Badge tone={STATUS_TONE[c.status]}>{c.status_display}</Badge>
                </TD>
                <TD className="tabular-nums">{c.phone || "—"}</TD>
                <TD>{c.manager_name || "—"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
