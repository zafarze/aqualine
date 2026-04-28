import { Breadcrumbs } from "@aqualine/ui";
import { OrderForm } from "../OrderForm";

export default function NewOrderPage() {
  return (
    <div className="flex flex-col gap-4 max-w-6xl">
      <Breadcrumbs
        items={[
          { label: "Заказы", href: "/orders" },
          { label: "Новый заказ" },
        ]}
      />
      <h1 className="text-2xl font-bold text-ink">Новый заказ</h1>
      <OrderForm />
    </div>
  );
}
