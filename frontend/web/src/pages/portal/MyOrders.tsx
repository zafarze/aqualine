
import { useEffect, useState } from "react";
import { api, Paginated } from "@/lib/api";

interface Order {
  id: number;
  number: string;
  status: string;
  status_display: string;
  total: string;
  paid_amount: string;
  balance_due: string;
  created_at: string;
}

const TONE: Record<string, string> = {
  lead: "bg-yellow-100 text-yellow-700",
  quoted: "bg-violet-100 text-violet-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-green-100 text-green-700",
  paid: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-700",
};

export default function MyOrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Paginated<Order>>("/orders/")
      .then((d) => setItems(d.results))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#2e2a55] mb-4">Мои заказы</h1>
      {loading && <p className="text-[#7B7AA8]">Загрузка...</p>}
      <div className="space-y-2">
        {items.map((o) => (
          <article key={o.id} className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{o.number}</span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${TONE[o.status] || "bg-gray-100"}`}
              >
                {o.status_display}
              </span>
            </div>
            <div className="text-sm text-[#7B7AA8] flex justify-between">
              <span>{new Date(o.created_at).toLocaleDateString("ru")}</span>
              <span>
                {o.total} с. · к доплате {o.balance_due} с.
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              <a
                href={`/api/documents/orders/${o.id}/invoice/`}
                className="text-xs text-[#8E7CF8] underline"
              >
                Скачать счёт
              </a>
              <a
                href={`/api/documents/orders/${o.id}/waybill/`}
                className="text-xs text-[#8E7CF8] underline"
              >
                Накладная
              </a>
            </div>
          </article>
        ))}
        {!loading && items.length === 0 && (
          <p className="text-[#7B7AA8] text-center py-8">У вас пока нет заказов</p>
        )}
      </div>
    </div>
  );
}
