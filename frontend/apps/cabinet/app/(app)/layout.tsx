"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated, logout } from "../../lib/api";
import { CART_EVENT, getCart } from "../../lib/cart";
import { InstallButton } from "../../lib/InstallButton";
import { PushToggle } from "../../lib/PushToggle";

const NAV = [
  { href: "/catalog", label: "Каталог" },
  { href: "/cart", label: "Корзина" },
  { href: "/orders", label: "Мои заказы" },
  { href: "/profile", label: "Профиль" },
];

export default function CabinetAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    const update = () => {
      getCart()
        .then((c) =>
          setCartCount(c.items.reduce((s, i) => s + Number(i.quantity), 0))
        )
        .catch(() => setCartCount(0));
    };
    update();
    window.addEventListener(CART_EVENT, update);
    return () => window.removeEventListener(CART_EVENT, update);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F4F2FE]">
      <header className="sticky top-0 z-10 bg-white border-b border-[#e5e2f5] px-4 py-3 flex items-center justify-between">
        <Link href="/catalog" className="font-semibold text-[#2e2a55]">
          AquaLine · Кабинет
        </Link>
        <button
          onClick={() => logout()}
          className="text-sm text-[#7B7AA8] hover:text-[#2e2a55]"
        >
          Выйти
        </button>
      </header>
      <main className="max-w-5xl mx-auto p-4 pb-24">{children}</main>
      <InstallButton />
      <PushToggle />
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-[#e5e2f5] flex justify-around py-2 z-20">
        {NAV.map((n) => {
          const active = pathname?.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`text-xs flex flex-col items-center gap-1 ${
                active ? "text-[#8E7CF8] font-medium" : "text-[#7B7AA8]"
              }`}
            >
              <span>{n.label}</span>
              {n.href === "/cart" && cartCount > 0 && (
                <span className="text-[10px] bg-[#8E7CF8] text-white rounded-full px-1.5">
                  {cartCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
