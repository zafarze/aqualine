import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { CART_EVENT, getCart } from "@/lib/cart";
import { logout } from "@/lib/api";

const NAV = [
  { to: "/portal/catalog", label: "Каталог" },
  { to: "/portal/cart", label: "Корзина" },
  { to: "/portal/orders", label: "Мои заказы" },
  { to: "/portal/profile", label: "Профиль" },
];

export default function PortalLayout() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
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
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F2FE]">
      <header className="sticky top-0 z-10 bg-white border-b border-[#e5e2f5] px-4 py-3 flex items-center justify-between">
        <Link to="/portal/catalog" className="font-semibold text-[#2e2a55]">
          AquaLine · Кабинет
        </Link>
        <button
          type="button"
          onClick={() => logout()}
          className="text-sm text-[#7B7AA8] hover:text-[#2e2a55]"
        >
          Выйти
        </button>
      </header>
      <main className="max-w-5xl mx-auto p-4 pb-24">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-[#e5e2f5] flex justify-around py-2 z-20">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `text-xs flex flex-col items-center gap-1 ${
                isActive ? "text-[#8E7CF8] font-medium" : "text-[#7B7AA8]"
              }`
            }
          >
            <span>{n.label}</span>
            {n.to === "/portal/cart" && cartCount > 0 && (
              <span className="text-[10px] bg-[#8E7CF8] text-white rounded-full px-1.5">
                {cartCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
