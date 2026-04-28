"use client";

import { useEffect, useState } from "react";
import { api, Paginated } from "../../../../lib/api";

interface Order {
  id: number;
  number: string;
  status: string;
  client_name: string;
  total: string;
  due_date: string | null;
}

const COLUMNS: { status: string; label: string; color: string }[] = [
  { status: "lead", label: "Заявка", color: "#F5C24A" },
  { status: "quoted", label: "Предложение", color: "#A78BFA" },
  { status: "confirmed", label: "Подтверждён", color: "#8E7CF8" },
  { status: "shipped", label: "Отгружен", color: "#34D399" },
  { status: "paid", label: "Оплачен", color: "#10B981" },
  { status: "cancelled", label: "Отменён", color: "#EF4444" },
];

export default function OrdersKanbanPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const all: Order[] = [];
    let url: string | null = "/orders/?page_size=200";
    while (url) {
      const data: Paginated<Order> = await api(url);
      all.push(...data.results);
      url = data.next ? data.next.replace(/^.*\/api/, "") : null;
    }
    setOrders(all);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function moveTo(id: number, status: string) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o)),
    );
    try {
      await api(`/orders/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch {
      load();
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-[#2e2a55] mb-4">
        Воронка заказов
      </h1>
      {loading && <p className="text-[#7B7AA8]">Загрузка...</p>}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const items = orders.filter((o) => o.status === col.status);
          const total = items.reduce((s, o) => s + Number(o.total || 0), 0);
          return (
            <div
              key={col.status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId !== null) moveTo(dragId, col.status);
                setDragId(null);
              }}
              className="min-w-[260px] bg-white rounded-2xl p-3 shadow-[6px_6px_18px_#e5e2f5,-6px_-6px_18px_#ffffff]"
            >
              <header className="flex items-center justify-between mb-3">
                <span
                  className="text-xs font-medium px-2 py-1 rounded-full text-white"
                  style={{ backgroundColor: col.color }}
                >
                  {col.label}
                </span>
                <span className="text-xs text-[#7B7AA8]">
                  {items.length} · {total.toFixed(0)} с.
                </span>
              </header>
              <div className="space-y-2">
                {items.map((o) => (
                  <article
                    key={o.id}
                    draggable
                    onDragStart={() => setDragId(o.id)}
                    className="bg-[#F4F2FE] rounded-xl p-3 cursor-grab active:cursor-grabbing"
                  >
                    <p className="font-medium text-sm text-[#2e2a55]">
                      {o.number}
                    </p>
                    <p className="text-xs text-[#7B7AA8] mb-1">{o.client_name}</p>
                    <p className="text-xs text-[#2e2a55] font-medium">
                      {o.total} с.
                    </p>
                  </article>
                ))}
                {items.length === 0 && (
                  <p className="text-xs text-[#B5B2C8] text-center py-4">
                    Пусто
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
