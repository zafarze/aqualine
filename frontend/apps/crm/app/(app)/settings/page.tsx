"use client";

import Link from "next/link";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Database,
  ExternalLink,
  KeyRound,
  Languages,
  Palette,
  Plug,
  ShieldCheck,
  Tags,
  User as UserIcon,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Breadcrumbs, cn } from "@aqualine/ui";

interface SettingsItem {
  icon: LucideIcon;
  label: string;
  description: string;
  href?: string;
  external?: boolean;
  tone: "violet" | "pink" | "green" | "yellow" | "blue" | "orange";
  status?: "ready" | "soon" | "admin";
}

const TONE: Record<NonNullable<SettingsItem["tone"]>, { bg: string; fg: string }> = {
  violet: { bg: "bg-violet-50", fg: "text-violet-500" },
  pink: { bg: "bg-pink-50", fg: "text-pink-500" },
  green: { bg: "bg-emerald-50", fg: "text-emerald-500" },
  yellow: { bg: "bg-amber-50", fg: "text-amber-500" },
  blue: { bg: "bg-sky-50", fg: "text-sky-500" },
  orange: { bg: "bg-orange-50", fg: "text-orange-500" },
};

const STATUS_BADGE: Record<
  NonNullable<SettingsItem["status"]>,
  { label: string; cls: string }
> = {
  ready: { label: "Доступно", cls: "bg-emerald-50 text-emerald-600" },
  soon: { label: "Скоро", cls: "bg-amber-50 text-amber-600" },
  admin: { label: "Через Admin", cls: "bg-slate-100 text-ink-soft" },
};

interface Section {
  title: string;
  subtitle: string;
  items: SettingsItem[];
}

const SECTIONS: Section[] = [
  {
    title: "Профиль и аккаунт",
    subtitle: "Личные данные и безопасность",
    items: [
      {
        icon: UserIcon,
        label: "Мой профиль",
        description: "ФИО, фото, контактные данные",
        href: "/profile",
        tone: "violet",
        status: "ready",
      },
      {
        icon: KeyRound,
        label: "Пароль",
        description: "Смена пароля и сессии",
        tone: "pink",
        status: "soon",
      },
      {
        icon: ShieldCheck,
        label: "Двухфакторная аутентификация",
        description: "Дополнительный код при входе",
        tone: "green",
        status: "soon",
      },
    ],
  },
  {
    title: "Команда и роли",
    subtitle: "Пользователи системы и их доступ",
    items: [
      {
        icon: Users,
        label: "Пользователи",
        description: "Создание, редактирование, роли",
        href: "/admin/auth/user/",
        external: true,
        tone: "violet",
        status: "admin",
      },
    ],
  },
  {
    title: "Финансы",
    subtitle: "Категории расходов и доходов",
    items: [
      {
        icon: Tags,
        label: "Категории расходов",
        description: "Группы для классификации затрат",
        href: "/admin/finance/category/",
        external: true,
        tone: "pink",
        status: "admin",
      },
      {
        icon: CreditCard,
        label: "Способы оплаты",
        description: "Наличные, карта, перевод и др.",
        tone: "green",
        status: "soon",
      },
    ],
  },
  {
    title: "Уведомления",
    subtitle: "Что и куда присылать",
    items: [
      {
        icon: Bell,
        label: "Push и in-app",
        description: "Новые лиды, оплаты, просрочки",
        tone: "yellow",
        status: "soon",
      },
    ],
  },
  {
    title: "Интерфейс",
    subtitle: "Внешний вид и язык",
    items: [
      {
        icon: Palette,
        label: "Тема оформления",
        description: "Светлая, тёмная, авто",
        tone: "blue",
        status: "soon",
      },
      {
        icon: Languages,
        label: "Язык",
        description: "Русский / английский / узбекский",
        tone: "orange",
        status: "soon",
      },
    ],
  },
  {
    title: "Интеграции",
    subtitle: "Подключения к внешним сервисам",
    items: [
      {
        icon: Plug,
        label: "Telegram-бот",
        description: "Уведомления и быстрые команды",
        tone: "blue",
        status: "soon",
      },
      {
        icon: Database,
        label: "1С / Экспорт",
        description: "Выгрузка заказов и оплат",
        tone: "violet",
        status: "soon",
      },
    ],
  },
];

function SettingRow({ it }: { it: SettingsItem }) {
  const palette = TONE[it.tone];
  const badge = it.status ? STATUS_BADGE[it.status] : null;
  const inner = (
    <>
      <span
        className={cn(
          "w-11 h-11 shrink-0 rounded-xl grid place-items-center transition-transform group-hover:scale-105",
          palette.bg,
        )}
      >
        <it.icon size={20} className={palette.fg} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-ink truncate group-hover:text-accent-violet transition">
            {it.label}
          </span>
          {badge ? (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap",
                badge.cls,
              )}
            >
              {badge.label}
            </span>
          ) : null}
        </div>
        <div className="text-[12px] text-ink-soft mt-0.5 truncate">
          {it.description}
        </div>
      </div>
      {it.href ? (
        it.external ? (
          <ExternalLink size={16} className="text-ink-dim shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-ink-dim shrink-0" />
        )
      ) : null}
    </>
  );

  const className = cn(
    "group flex items-center gap-3 p-4 rounded-xl border border-slate-100 transition",
    it.href
      ? "hover:bg-slate-50 hover:border-slate-200 cursor-pointer"
      : "opacity-70",
  );

  if (it.href) {
    if (it.external) {
      return (
        <a
          href={it.href}
          target="_blank"
          rel="noreferrer"
          className={className}
        >
          {inner}
        </a>
      );
    }
    return (
      <Link href={it.href} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-5">
      <Breadcrumbs items={[{ label: "Настройки" }]} />

      <div>
        <h1 className="text-2xl font-bold text-ink">Настройки</h1>
        <p className="text-sm text-ink-soft mt-0.5">
          Профиль, команда, интеграции и интерфейс
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {SECTIONS.map((s) => (
          <div
            key={s.title}
            className="bg-white rounded-2xl p-6 border border-slate-100"
          >
            <div className="mb-4">
              <h2 className="text-lg font-bold text-ink">{s.title}</h2>
              <p className="text-xs text-ink-soft mt-0.5">{s.subtitle}</p>
            </div>
            <div className="flex flex-col gap-2">
              {s.items.map((it) => (
                <SettingRow key={it.label} it={it} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-100">
        <div className="flex items-start gap-3">
          <span className="w-11 h-11 shrink-0 rounded-xl bg-slate-100 grid place-items-center">
            <Database size={20} className="text-ink-soft" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-ink">
              Расширенное администрирование
            </div>
            <p className="text-xs text-ink-soft mt-1">
              Полный доступ к моделям, миграциям и аудит-логам — через
              Django-админку.
            </p>
          </div>
          <a
            href="/admin/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 h-10 rounded-full bg-accent-violet text-white text-xs font-semibold hover:bg-bg-deep transition shrink-0"
          >
            Открыть Admin
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
