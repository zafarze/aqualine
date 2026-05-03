
import { useEffect, useState } from "react";
import { useRouter } from "@/lib/next-shim";
import {
  CART_EVENT,
  Cart,
  cartTotal,
  checkout as checkoutCart,
  getCart,
  removeFromCart,
  updateQuantity,
} from "@/lib/cart";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [pendingId, setPendingId] = useState<number | null>(null);

  async function reload() {
    try {
      setCart(await getCart());
    } catch (e) {
      setError("Не удалось загрузить корзину");
    }
  }

  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener(CART_EVENT, onChange);
    return () => window.removeEventListener(CART_EVENT, onChange);
  }, []);

  async function onQty(itemId: number, qty: number) {
    if (qty < 1) return;
    setPendingId(itemId);
    try {
      await updateQuantity(itemId, qty);
    } catch {
      setError("Не удалось обновить количество");
    } finally {
      setPendingId(null);
    }
  }

  async function onRemove(itemId: number) {
    setPendingId(itemId);
    try {
      await removeFromCart(itemId);
    } finally {
      setPendingId(null);
    }
  }

  async function onCheckout() {
    if (!cart || cart.items.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await checkoutCart(notes);
      router.push(`/orders?new=${encodeURIComponent(res.number)}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось оформить заказ";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const items = cart?.items ?? [];

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
                key={it.id}
                className="bg-white rounded-2xl p-3 flex items-center justify-between"
              >
                <div className="flex-1">
                  <p className="font-medium text-[#2e2a55]">{it.product_name}</p>
                  <p className="text-xs text-[#7B7AA8]">
                    {it.product_sku} · {it.price} с.
                  </p>
                </div>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={it.quantity}
                  disabled={pendingId === it.id}
                  onChange={(e) =>
                    onQty(it.id, Math.max(1, Number(e.target.value)))
                  }
                  className="w-16 rounded-lg bg-[#F4F2FE] px-2 py-1 text-center disabled:opacity-50"
                  aria-label={`Количество для ${it.product_name}`}
                />
                <button
                  type="button"
                  onClick={() => onRemove(it.id)}
                  disabled={pendingId === it.id}
                  className="ml-2 text-red-500 text-sm disabled:opacity-50"
                  aria-label={`Удалить ${it.product_name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-4 mb-3">
            <label className="block text-sm text-[#7B7AA8] mb-1" htmlFor="cart-notes">
              Комментарий к заказу
            </label>
            <textarea
              id="cart-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl bg-[#F4F2FE] px-3 py-2 text-sm mb-3"
              placeholder="Например: доставить в первой половине дня"
            />
            <div className="flex justify-between mb-3">
              <span className="text-[#7B7AA8]">Итого</span>
              <span className="text-xl font-semibold text-[#2e2a55]">
                {cartTotal(cart).toFixed(2)} с.
              </span>
            </div>
            {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
            <button
              type="button"
              onClick={onCheckout}
              disabled={submitting}
              className="w-full rounded-xl bg-[#8E7CF8] text-white py-3 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B47C9]"
            >
              {submitting ? "Оформляем..." : "Оформить заказ"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
