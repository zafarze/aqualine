"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  PieChart,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect } from "react";
import { cn } from "../lib/cn";

interface SidebarItem {
  icon: LucideIcon;
  label: string;
  href: string;
  hasSubmenu?: boolean;
}

const defaultItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Дашборд", href: "/" },
  { icon: Warehouse, label: "Мой склад", href: "/products" },
  { icon: ShoppingBag, label: "Заказы", href: "/orders" },
  { icon: Users, label: "Клиенты", href: "/clients" },
  { icon: Wallet, label: "Финансы", href: "/finance" },
  { icon: PieChart, label: "Статистика", href: "/stats" },
  { icon: Settings, label: "Настройки", href: "/settings" },
];

interface SidebarProps {
  items?: SidebarItem[];
  onLogout?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  items = defaultItems,
  onLogout,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname() ?? "/";

  // Закрывать мобильный сайдбар при смене маршрута
  useEffect(() => {
    if (mobileOpen && onMobileClose) onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Закрытие по Escape
  useEffect(() => {
    if (!mobileOpen || !onMobileClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onMobileClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, onMobileClose]);

  // Блокируем скролл body на мобильном при открытом сайдбаре
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    return;
  }, [mobileOpen]);

  return (
    <>
      {/* Backdrop для мобильного */}
      <div
        onClick={onMobileClose}
        aria-hidden
        className={cn(
          "lg:hidden fixed inset-0 bg-ink/40 backdrop-blur-sm z-40 transition-opacity",
          mobileOpen
            ? "opacity-100"
            : "opacity-0 pointer-events-none",
        )}
      />

      <aside
        className={cn(
          "shrink-0 bg-white border border-slate-100 flex flex-col overflow-hidden",
          // Mobile: floating card off-canvas
          "fixed top-3 bottom-3 left-3 z-50 w-[min(16rem,calc(100vw-1.5rem))] rounded-2xl shadow-[0_20px_50px_-12px_rgba(108,92,231,0.35)] transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]",
          // Desktop: sticky card
          "lg:static lg:inset-auto lg:w-64 lg:translate-x-0 lg:max-h-[calc(100vh-3rem)] lg:sticky lg:top-6 lg:shadow-[0_4px_24px_-6px_rgba(108,92,231,0.08)]",
        )}
      >
        {/* ───── Лого + закрыть ───── */}
        <div className="relative px-5 pt-6 pb-5">
          <Link href="/" className="flex flex-col items-center gap-2.5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-violet to-accent-pink grid place-items-center text-white font-bold text-3xl shadow-lg shadow-accent-violet/30">
              A
            </div>
            <div className="text-center">
              <div className="text-base font-bold text-ink leading-tight">
                AquaLine
              </div>
              <div className="text-[10px] text-ink-soft uppercase tracking-[0.2em] mt-0.5">
                CRM-портал
              </div>
            </div>
          </Link>

          {/* Кнопка закрытия (моб) */}
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Закрыть меню"
            className="lg:hidden absolute right-3 top-4 w-9 h-9 rounded-full bg-slate-50 grid place-items-center text-ink-soft hover:text-ink transition"
          >
            <X size={16} />
          </button>

          {/* Кнопка свернуть (десктоп) — пока декоративная */}
          <button
            type="button"
            aria-label="Свернуть меню"
            className="hidden lg:grid absolute right-3 top-6 w-7 h-7 rounded-full bg-white border border-slate-200 place-items-center text-ink-soft hover:text-ink shadow-sm transition"
          >
            <ChevronLeft size={13} />
          </button>
        </div>

        <div className="border-t border-slate-100 mx-5" />

        {/* ───── Меню ───── */}
        <nav
          className="flex flex-col gap-1.5 p-4 flex-1 overflow-y-auto"
          aria-label="Главное меню"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 h-12 px-4 rounded-xl transition text-[15px] font-semibold",
                  active
                    ? "bg-gradient-to-r from-indigo-900 to-indigo-800 text-white shadow-md"
                    : "text-ink-soft hover:bg-slate-50 hover:text-ink",
                )}
              >
                <Icon size={20} className="shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.hasSubmenu ? (
                  <ChevronDown
                    size={16}
                    className={cn(
                      "shrink-0 transition-transform",
                      active ? "text-white/70" : "text-ink-dim",
                    )}
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* ───── Выход ───── */}
        {onLogout ? (
          <>
            <div className="border-t border-slate-100 mx-5" />
            <div className="p-4">
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center justify-center gap-3 w-full h-12 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 text-[15px] font-semibold transition"
              >
                <LogOut size={18} />
                Выйти
              </button>
            </div>
          </>
        ) : null}
      </aside>
    </>
  );
}
