
import { useEffect, useState } from "react";
import { useParams } from "@/lib/next-shim";
import { Badge, Breadcrumbs, Card } from "@aqualine/ui";
import { api } from "@/lib/api";
import { ORDER_STATUS_TONE, type Order, type Payment } from "@/lib/types";
import { OrderForm } from "./orders/OrderForm";
import { OrderPayments } from "./orders/OrderPayments";

export default function EditOrderPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    api<Order>(`/orders/${id}/`)
      .then((o) => {
        if (alive) setOrder(o);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Ошибка");
      });
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="flex flex-col gap-4 max-w-6xl">
      <Breadcrumbs
        items={[
          { label: "Заказы", href: "/orders" },
          { label: order ? order.number : "Загрузка..." },
        ]}
      />
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-ink tabular-nums">
          {order ? order.number : "Загрузка..."}
        </h1>
        {order ? (
          <Badge tone={ORDER_STATUS_TONE[order.status]}>
            {order.status_display}
          </Badge>
        ) : null}
      </div>
      {order ? (
        <p className="text-sm text-ink-soft -mt-2">
          {order.client_name} ·{" "}
          {new Date(order.created_at).toLocaleString("ru-RU")}
        </p>
      ) : null}

      {error ? (
        <Card className="p-5 text-sm text-accent-pink">{error}</Card>
      ) : order ? (
        <>
          <OrderForm initial={order} />
          <OrderPayments
            orderId={order.id}
            total={order.total}
            initialPayments={(order.payments as Payment[]) ?? []}
            initialPaid={order.paid_amount ?? "0.00"}
            initialBalance={order.balance_due ?? order.total}
          />
        </>
      ) : (
        <Card className="p-10 text-center text-ink-soft text-sm">
          Загрузка...
        </Card>
      )}
    </div>
  );
}
