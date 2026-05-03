import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  PieChart,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";
import { Header, type HeaderUser, Sidebar } from "@aqualine/ui";
import { logout } from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
import { RouterLink } from "@/components/RouterLink";

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "http://localhost:8000/api")
  .replace(/\/api\/?$/, "");

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Дашборд", href: "/app" },
  { icon: Warehouse, label: "Мой склад", href: "/app/products" },
  { icon: ShoppingBag, label: "Заказы", href: "/app/orders" },
  { icon: Users, label: "Клиенты", href: "/app/clients" },
  { icon: Wallet, label: "Финансы", href: "/app/finance" },
  { icon: PieChart, label: "Статистика", href: "/app/stats" },
  { icon: Settings, label: "Настройки", href: "/app/settings" },
];

function absolutePhotoUrl(photo: string | null | undefined): string | undefined {
  if (!photo) return undefined;
  if (/^https?:\/\//.test(photo)) return photo;
  return `${API_ORIGIN}${photo.startsWith("/") ? "" : "/"}${photo}`;
}

export default function CrmLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: user } = useCurrentUser();

  const headerUser: HeaderUser | undefined = user
    ? {
        name: user.full_name || user.username,
        role: user.role_display || "Сотрудник",
        initials:
          (user.first_name?.charAt(0) ?? "") + (user.last_name?.charAt(0) ?? "")
            ? ((user.first_name?.charAt(0) ?? "") + (user.last_name?.charAt(0) ?? "")).toUpperCase()
            : (user.username.charAt(0).toUpperCase() ?? "?"),
        photoUrl: absolutePhotoUrl(user.photo),
      }
    : undefined;

  return (
    <div className="min-h-screen p-4 lg:p-6 flex gap-6 bg-slate-50/40">
      <Sidebar
        items={SIDEBAR_ITEMS}
        onLogout={logout}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        pathname={location.pathname}
        LinkComponent={RouterLink}
        homeHref="/app"
      />
      <main className="flex-1 min-w-0">
        <Header
          user={headerUser}
          onLogout={logout}
          onMobileMenuOpen={() => setMobileOpen(true)}
          profileHref="/app/profile"
        />
        <Outlet />
      </main>
    </div>
  );
}
