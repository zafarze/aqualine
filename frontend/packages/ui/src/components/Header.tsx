"use client";

import {
  Bell,
  Boxes,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  User as UserIcon,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../lib/cn";

// ─── Types ────────────────────────────────────────────────────────────────

export interface HeaderUser {
  name: string;
  role: string;
  initials?: string;
  photoUrl?: string | null;
}

export type HeaderSearchType = "client" | "order" | "product";

export interface HeaderSearchItem {
  type: HeaderSearchType;
  title: string;
  subtitle: string;
  url: string;
}

export type HeaderNotificationTone =
  | "violet"
  | "pink"
  | "green"
  | "yellow"
  | "blue";

export interface HeaderNotificationItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  url: string;
  tone: HeaderNotificationTone;
  created_at: string;
}

export interface HeaderNotificationsResponse {
  items: HeaderNotificationItem[];
  unread_count: number;
}

interface HeaderProps {
  user?: HeaderUser;
  onLogout?: () => void;
  onMobileMenuOpen?: () => void;
  searchFn?: (query: string) => Promise<HeaderSearchItem[]>;
  notificationsFn?: () => Promise<HeaderNotificationsResponse>;
  profileHref?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function useClickOutside<T extends HTMLElement>(
  active: boolean,
  onOutside: () => void,
) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOutside();
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [active, onOutside]);
  return ref;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, (Date.now() - then) / 1000);
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч`;
  return `${Math.floor(diff / 86400)} д`;
}

const SEARCH_TYPE_META: Record<
  HeaderSearchType,
  { label: string; icon: LucideIcon; bg: string; fg: string }
> = {
  client: {
    label: "Клиенты",
    icon: Users,
    bg: "bg-emerald-50",
    fg: "text-emerald-500",
  },
  order: {
    label: "Заказы",
    icon: ShoppingBag,
    bg: "bg-violet-50",
    fg: "text-violet-500",
  },
  product: {
    label: "Товары",
    icon: Boxes,
    bg: "bg-pink-50",
    fg: "text-pink-500",
  },
};

const NOTIFICATION_TONE_BG: Record<HeaderNotificationTone, string> = {
  violet: "bg-violet-50 text-violet-500",
  pink: "bg-pink-50 text-pink-500",
  green: "bg-emerald-50 text-emerald-500",
  yellow: "bg-amber-50 text-amber-500",
  blue: "bg-sky-50 text-sky-500",
};

const NOTIFICATION_LAST_OPENED_KEY = "aqualine.notifications.last-opened";

// ─── SearchBox ────────────────────────────────────────────────────────────

function SearchBox({
  searchFn,
  className,
}: {
  searchFn?: HeaderProps["searchFn"];
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<HeaderSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));

  useEffect(() => {
    if (!searchFn || q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let alive = true;
    const t = setTimeout(() => {
      searchFn(q.trim())
        .then((r) => {
          if (!alive) return;
          setResults(r);
          setOpen(true);
        })
        .catch(() => {})
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, 280);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q, searchFn]);

  const grouped = useMemo(() => {
    const out: Record<HeaderSearchType, HeaderSearchItem[]> = {
      client: [],
      order: [],
      product: [],
    };
    for (const r of results) out[r.type].push(r);
    return out;
  }, [results]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-dim pointer-events-none">
        <Search size={18} />
      </span>
      <input
        type="text"
        placeholder="Поиск по клиентам, заказам, товарам..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => q.trim().length >= 2 && setOpen(true)}
        className="w-full h-11 pl-11 pr-9 rounded-full bg-slate-50 text-ink text-sm outline-none placeholder:text-ink-dim focus:bg-white focus:ring-2 focus:ring-accent-violet/20 transition"
      />
      {q ? (
        <button
          type="button"
          onClick={() => {
            setQ("");
            setOpen(false);
          }}
          aria-label="Очистить"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center rounded-full text-ink-soft hover:text-ink hover:bg-slate-100 transition"
        >
          <X size={14} />
        </button>
      ) : null}

      {open && q.trim().length >= 2 ? (
        <div className="absolute top-12 left-0 right-0 bg-white rounded-2xl border border-slate-100 shadow-[0_12px_40px_-8px_rgba(108,92,231,0.18)] z-30 max-h-[440px] overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-sm text-ink-soft">
              Поиск...
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-sm text-ink-soft">
              По запросу <span className="font-semibold">«{q}»</span> ничего не
              найдено
            </div>
          ) : (
            <div className="py-2">
              {(
                Object.entries(grouped) as [
                  HeaderSearchType,
                  HeaderSearchItem[],
                ][]
              ).map(([type, items]) =>
                items.length === 0 ? null : (
                  <div key={type}>
                    <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-ink-dim">
                      {SEARCH_TYPE_META[type].label}
                    </div>
                    {items.map((r) => {
                      const meta = SEARCH_TYPE_META[r.type];
                      const Icon = meta.icon;
                      return (
                        <a
                          key={r.url}
                          href={r.url}
                          onClick={() => {
                            setOpen(false);
                            setQ("");
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition"
                        >
                          <span
                            className={cn(
                              "w-9 h-9 shrink-0 rounded-xl grid place-items-center",
                              meta.bg,
                            )}
                          >
                            <Icon size={16} className={meta.fg} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-ink truncate">
                              {r.title}
                            </div>
                            <div className="text-xs text-ink-soft truncate">
                              {r.subtitle}
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ─── NotificationsButton ──────────────────────────────────────────────────

function NotificationsButton({
  notificationsFn,
}: {
  notificationsFn?: HeaderProps["notificationsFn"];
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<HeaderNotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const computeUnread = useCallback(
    (list: HeaderNotificationItem[]): number => {
      if (typeof window === "undefined") return list.length;
      const last = window.localStorage.getItem(
        NOTIFICATION_LAST_OPENED_KEY,
      );
      if (!last) return list.length;
      const lastTs = new Date(last).getTime();
      return list.filter((i) => new Date(i.created_at).getTime() > lastTs)
        .length;
    },
    [],
  );

  useEffect(() => {
    if (!notificationsFn) return;
    let alive = true;
    const load = () => {
      notificationsFn()
        .then((d) => {
          if (!alive) return;
          setItems(d.items);
          setUnreadCount(computeUnread(d.items));
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [notificationsFn, computeUnread]);

  function toggleOpen() {
    if (!open) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          NOTIFICATION_LAST_OPENED_KEY,
          new Date().toISOString(),
        );
      }
      setUnreadCount(0);
      if (notificationsFn && !loading) {
        setLoading(true);
        notificationsFn()
          .then((d) => setItems(d.items))
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    }
    setOpen(!open);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Уведомления"
        className="relative w-10 h-10 grid place-items-center rounded-full text-ink-soft hover:text-ink hover:bg-slate-50 transition"
      >
        <Bell size={20} />
        {unreadCount > 0 ? (
          <span className="absolute top-1.5 right-2 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-accent-pink text-white text-[10px] font-bold ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed left-3 right-3 top-[68px] sm:left-auto sm:right-0 sm:top-12 sm:w-max sm:min-w-[240px] sm:max-w-[min(360px,calc(100vw-1.5rem))] bg-white rounded-2xl border border-slate-100 shadow-[0_12px_40px_-8px_rgba(108,92,231,0.18)] z-30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-ink">Уведомления</h3>
            <span className="text-[11px] text-ink-soft">
              {items.length > 0 ? `${items.length} событий` : "пусто"}
            </span>
          </div>
          <div className="max-h-[440px] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="p-6 text-center text-sm text-ink-soft">
                Загрузка...
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-50 grid place-items-center mb-3">
                  <Bell size={20} className="text-ink-dim" />
                </div>
                <div className="text-sm text-ink-soft">
                  Пока нет новых событий
                </div>
              </div>
            ) : (
              <ul className="py-1">
                {items.map((n) => (
                  <li key={n.id}>
                    <a
                      href={n.url}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition"
                    >
                      <span
                        className={cn(
                          "w-9 h-9 shrink-0 rounded-xl grid place-items-center",
                          NOTIFICATION_TONE_BG[n.tone],
                        )}
                      >
                        <Bell size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-ink truncate">
                          {n.title}
                        </div>
                        <div className="text-xs text-ink-soft truncate">
                          {n.subtitle}
                        </div>
                        <div className="text-[10px] text-ink-dim mt-0.5">
                          {timeAgo(n.created_at)} назад
                        </div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── ProfileMenu ──────────────────────────────────────────────────────────

function ProfileMenu({
  user,
  onLogout,
  profileHref = "/profile",
}: {
  user: HeaderUser;
  onLogout?: () => void;
  profileHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));
  const initials =
    user.initials ?? user.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="group flex items-center gap-2.5 h-10 pl-1 pr-1 sm:pr-2 rounded-full hover:bg-slate-50 transition"
      >
        {user.photoUrl ? (
          <img
            src={user.photoUrl}
            alt={user.name}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <span className="w-9 h-9 rounded-full bg-violet-50 grid place-items-center text-accent-violet font-bold text-sm">
            {initials}
          </span>
        )}
        <span className="hidden sm:block text-left max-w-[160px]">
          <span className="block text-sm font-semibold text-ink leading-tight truncate">
            {user.name}
          </span>
          <span className="block text-[10px] text-ink-soft uppercase tracking-wider leading-tight truncate">
            {user.role}
          </span>
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "hidden sm:block text-ink-soft transition-transform ml-1",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 w-60 bg-white rounded-2xl border border-slate-100 shadow-[0_12px_40px_-8px_rgba(108,92,231,0.18)] z-30 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="w-10 h-10 rounded-full bg-violet-50 grid place-items-center text-accent-violet font-bold">
                  {initials}
                </span>
              )}
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink truncate">
                  {user.name}
                </div>
                <div className="text-[10px] text-ink-soft uppercase tracking-wider">
                  {user.role}
                </div>
              </div>
            </div>
          </div>
          <div className="py-1">
            <a
              href={profileHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-slate-50 transition"
            >
              <UserIcon size={16} className="text-ink-soft" />
              Мой профиль
            </a>
            {onLogout ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
              >
                <LogOut size={16} />
                Выйти
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────

export function Header({
  user,
  onLogout,
  onMobileMenuOpen,
  searchFn,
  notificationsFn,
  profileHref,
}: HeaderProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_24px_-6px_rgba(108,92,231,0.06)] flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 mb-5 sm:mb-6 relative">
      {/* Бургер */}
      {onMobileMenuOpen && !mobileSearchOpen ? (
        <button
          type="button"
          onClick={onMobileMenuOpen}
          aria-label="Открыть меню"
          className="lg:hidden w-10 h-10 shrink-0 grid place-items-center rounded-full text-ink-soft hover:text-ink hover:bg-slate-50 transition"
        >
          <Menu size={20} />
        </button>
      ) : null}

      {/* Кнопка поиска (моб) */}
      {!mobileSearchOpen ? (
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          aria-label="Поиск"
          className="sm:hidden w-10 h-10 shrink-0 grid place-items-center rounded-full text-ink-soft hover:text-ink hover:bg-slate-50 transition"
        >
          <Search size={20} />
        </button>
      ) : null}

      {/* Поиск моб (open) */}
      {mobileSearchOpen ? (
        <div className="sm:hidden flex items-center gap-2 flex-1">
          <SearchBox searchFn={searchFn} className="flex-1" />
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            aria-label="Закрыть поиск"
            className="w-10 h-10 shrink-0 grid place-items-center rounded-full text-ink-soft hover:text-ink hover:bg-slate-50 transition"
          >
            <X size={20} />
          </button>
        </div>
      ) : null}

      {/* Поиск десктоп (always) */}
      <SearchBox
        searchFn={searchFn}
        className="hidden sm:block flex-1 min-w-0 max-w-2xl"
      />

      {!mobileSearchOpen ? (
        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          <NotificationsButton notificationsFn={notificationsFn} />
          {user ? (
            <ProfileMenu
              user={user}
              onLogout={onLogout}
              profileHref={profileHref}
            />
          ) : (
            <span
              aria-hidden
              className="w-10 h-10 rounded-full bg-slate-100 animate-pulse"
            />
          )}
        </div>
      ) : null}
    </header>
  );
}
