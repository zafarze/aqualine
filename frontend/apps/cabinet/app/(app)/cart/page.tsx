"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import {
  cartTotal,
  clearCart,
  readCart,
  removeFromCart,
  setQuantity,
  CartItem,
} from "../../../lib/cart";

interface MeResponse {
  id: number;
  client_profile?: number | null;
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    setItems(readCart());
    api<MeResponse>("/auth/users/me/").then(setMe).catch(() => null);
    const onChange = () => setItems(readCart());
    window.addEventListener("cart:change", onChange);
    return () => window.removeEventListener("cart:change", onChange);
  }, []);

  async function checkout() {
    if (items.length === 0) return;
    if (!me?.client_profile) {
      setError(
        "Ваш аккаунт не связан с карточкой клиента. Обратитесь к менеджеру.",
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api("/orders/", {
        method: "POST",
        body: JSON.stringify({
          client: me.client_profile,
          status: "lead",
          items: items.map((it) => ({
            product: it.product_id,
            quantity: it.quantity,
            price: it.price,
            discount: 0,
          })),
        }),
      });
      clearCart();
      router.push("/orders");
    } catch (e) {
      setError("Не удалось оформить заказ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#2e2a55] mb-4">Корзина</h1>
      {items.length === 0 ? (
        <p className="text-[#7B7AA8]">Корзина пуста</p>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {items.map((it) => (
              <div
                key={it.product_id}
                className="bg-white rounded-2xl p-3 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-medium text-[#2e2a55]">{it.name}</p>
                  <p className="text-xs text-[#7B7AA8]">
                    {it.sku} · {it.price} с.
                  </p>
                </div>
                <input
                  type="number"
                  min={1}
                  value={it.quantity}
                  onChange={(e) =>
                    setQuantity(it.product_id, Math.max(1, Number(e.target.value)))
                  }
                  className="w-16 rounded-lg bg-[#F4F2FE] px-2 py-1 text-center"
                />
                <button
                  onClick={() => removeFromCart(it.product_id)}
                  className="ml-2 text-red-500 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-4 mb-3">
            <div className="flex justify-between mb-3">
              <span className="text-[#7B7AA8]">Итого</span>
              <span className="text-xl font-semibold text-[#2e2a55]">
                {cartTotal(items).toFixed(2)} с.
              </span>
            </div>
            {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
            <button
              onClick={checkout}
              disabled={submitting}
              className="w-full rounded-xl bg-[#8E7CF8] text-white py-3 disabled:opacity-60"
            >
              {submitting ? "Оформляем..." : "Оформить заказ"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
