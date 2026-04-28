"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header, type HeaderUser, Sidebar } from "@aqualine/ui";
import { api, isAuthenticated, logout } from "@/lib/api";
import { fetchNotifications, globalSearch } from "@/lib/search";
import type { CurrentUser } from "@/lib/types";
import { InstallButton } from "@/lib/InstallButton";
import { PushToggle } from "@/lib/PushToggle";

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"
).replace(/\/api\/?$/, "");

function absolutePhotoUrl(photo: string | null): string | undefined {
  if (!photo) return undefined;
  if (/^https?:\/\//.test(photo)) return photo;
  return `${API_ORIGIN}${photo.startsWith("/") ? "" : "/"}${photo}`;
}

function toHeaderUser(u: CurrentUser): HeaderUser {
  const initials =
    (u.first_name?.charAt(0) ?? "") + (u.last_name?.charAt(0) ?? "");
  return {
    name: u.full_name || u.username,
    role: u.role_display || "Сотрудник",
    initials: initials.toUpperCase() || u.username.charAt(0).toUpperCase(),
    photoUrl: absolutePhotoUrl(u.photo),
  };
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [headerUser, setHeaderUser] = useState<HeaderUser | undefined>();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    setReady(true);
    api<CurrentUser>("/auth/users/me/")
      .then((u) => setHeaderUser(toHeaderUser(u)))
      .catch(() => {});
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center text-ink-soft text-sm">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-6 flex gap-6 bg-slate-50/40">
      <Sidebar
        onLogout={logout}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <main className="flex-1 min-w-0">
        <Header
          user={headerUser}
          onLogout={logout}
          onMobileMenuOpen={() => setMobileSidebarOpen(true)}
          searchFn={globalSearch}
          notificationsFn={fetchNotifications}
          profileHref="/profile"
        />
        {children}
      </main>
      <InstallButton />
      <PushToggle />
    </div>
  );
}
