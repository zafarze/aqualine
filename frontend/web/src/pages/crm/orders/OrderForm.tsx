
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "@/lib/next-shim";
import { Trash2, Plus } from "lucide-react";
import {
  Button,
  Card,
  Input,
  Select,
  Textarea,
} from "@aqualine/ui";
import { ApiError, api, type Paginated } from "@/lib/api";
import {
  ORDER_STATUS_OPTIONS,
  type Client,
  type Order,
  type OrderInput,
  type OrderItem,
  type Product,
} from "@/lib/types";

const emptyItem = (): OrderItem => ({
  product: 0,
  quantity: "1",
  price: "0",
  discount: "0",
});

const emptyForm: OrderInput = {
  client: "",
  status: "lead",
  due_date: null,
  notes: "",
  items: [],
};

function fromOrder(o: Order): OrderInput {
  return {
    client: o.client,
    manager: o.manager,
    status: o.status,
    due_date: o.due_date,
    notes: o.notes,
    items: o.items.map((it) => ({
      id: it.id,
      product: it.product,
      product_name: it.product_name,
      product_unit: it.product_unit,
      quantity: it.quantity,
      price: it.price,
      discount: it.discount,
    })),
  };
}

function calcSum(it: OrderItem): number {
  const q = Number(it.quantity) || 0;
  const p = Number(it.price) || 0;
  const d = Number(it.discount) || 0;
  return q * p * (1 - d / 100);
}

export function OrderForm({ initial }: { initial?: Order }) {
  const router = useRouter();
  const [form, setForm] = useState<OrderInput>(
    initial ? fromOrder(initial) : emptyForm,
  );
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([
      api<Paginated<Client>>("/clients/?ordering=name&page_size=200"),
      api<Paginated<Product>>("/products/?ordering=name&page_size=500"),
    ])
      .then(([c, p]) => {
        if (!alive) return;
        setClients(c.results);
        setProducts(p.results);
      })
      .catch((e) => {
        if (alive)
          setError(e instanceof Error ? e.message : "Не удалось загрузить справочники");
      });
    return () => {
      alive = false;
    };
  }, []);

  const total = useMemo(
    () => form.items.reduce((s, it) => s + calcSum(it), 0),
    [form.items],
  );

  function setField<K extends keyof OrderInput>(k: K, v: OrderInput[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function updateItem(idx: number, patch: Partial<OrderItem>) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));
  }

  function pickProduct(idx: number, productId: number) {
    const product = products.find((p) => p.id === productId);
    updateItem(idx, {
      product: productId,
      price: product ? product.sale_price : "0",
      product_name: product?.name,
      product_unit: product?.unit_display,
    });
  }

  function addItem() {
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  }

  function removeItem(idx: number) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (form.client === "") {
      setError("Выберите клиента");
      return;
    }
    if (form.items.length === 0) {
      setError("Добавьте хотя бы одну позицию");
      return;
    }
    if (form.items.some((it) => !it.product)) {
      setError("В каждой позиции выберите товар");
      return;
    }
    setSaving(true);
    const payload = {
      client: form.client,
      manager: form.manager ?? null,
      status: form.status,
      due_date: form.due_date || null,
      notes: form.notes,
      items: form.items.map((it) => ({
        product: it.product,
        quantity: it.quantity,
        price: it.price,
        discount: it.discount,
      })),
    };
    try {
      if (initial) {
        await api(`/orders/${initial.id}/`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/orders/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      router.push("/orders");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, unknown> | null;
        const first = data ? Object.entries(data)[0] : null;
        setError(
          first
            ? `${first[0]}: ${JSON.stringify(first[1])}`
            : err.message,
        );
      } else {
        setError("Не удалось сохранить");
      }
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!initial) return;
    if (!confirm(`Удалить заказ ${initial.number}?`)) return;
    setSaving(true);
    try {
      await api(`/orders/${initial.id}/`, { method: "DELETE" });
      router.push("/orders");
      router.refresh();
    } catch {
      setError("Не удалось удалить");
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Клиент"
            value={String(form.client)}
            onChange={(e) =>
              setField(
                "client",
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            placeholder="— выберите —"
            options={clients.map((c) => ({
              value: String(c.id),
              label: c.name,
            }))}
            required
          />
          <Select
            label="Статус"
            value={form.status}
            onChange={(e) =>
              setField("status", e.target.value as OrderInput["status"])
            }
            options={ORDER_STATUS_OPTIONS}
          />
          <Input
            label="Срок"
            type="date"
            value={form.due_date ?? ""}
            onChange={(e) => setField("due_date", e.target.value || null)}
          />
        </div>

        <div className="rounded-neu-lg bg-surface-soft shadow-neu-in p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-ink-soft">
              Позиции заказа
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={addItem}>
              <Plus size={14} />
              Добавить позицию
            </Button>
          </div>

          {form.items.length === 0 ? (
            <div className="text-sm text-ink-soft text-center py-6">
              Позиции не добавлены
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="hidden md:grid grid-cols-12 gap-2 px-2 text-[10px] uppercase tracking-wider text-ink-dim font-semibold">
                <div className="col-span-5">Товар</div>
                <div className="col-span-2 text-right">Кол-во</div>
                <div className="col-span-2 text-right">Цена</div>
                <div className="col-span-1 text-right">%</div>
                <div className="col-span-1 text-right">Сумма</div>
                <div className="col-span-1" />
              </div>
              {form.items.map((it, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center bg-surface rounded-neu shadow-neu-soft p-2"
                >
                  <div className="col-span-12 md:col-span-5">
                    <Select
                      value={String(it.product || "")}
                      onChange={(e) =>
                        pickProduct(idx, Number(e.target.value))
                      }
                      placeholder="— товар —"
                      options={products.map((p) => ({
                        value: String(p.id),
                        label: `${p.sku} · ${p.name}`,
                      }))}
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={it.quantity}
                      onChange={(e) =>
                        updateItem(idx, { quantity: e.target.value })
                      }
                      className="text-right"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={it.price}
                      onChange={(e) =>
                        updateItem(idx, { price: e.target.value })
                      }
                      className="text-right"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <Input
                      type="number"
                      step="0.01"
                      value={it.discount}
                      onChange={(e) =>
                        updateItem(idx, { discount: e.target.value })
                      }
                      className="text-right"
                    />
                  </div>
                  <div className="col-span-1 text-right text-sm font-semibold tabular-nums text-ink">
                    {calcSum(it).toFixed(2)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="w-9 h-9 grid place-items-center rounded-full bg-surface text-ink-soft hover:text-accent-pink shadow-neu-soft"
                      aria-label="Удалить позицию"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end mt-4 pt-3 border-t border-surface-dim">
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-ink-soft">
                Итого
              </div>
              <div className="text-3xl font-bold text-ink tabular-nums">
                {total.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <Textarea
          label="Заметки"
          rows={3}
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
        />

        {error ? (
          <div className="text-sm text-accent-pink bg-accent-pink/10 rounded-neu px-4 py-2.5">
            {error}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Сохраняем..." : initial ? "Сохранить" : "Создать заказ"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={saving}
          >
            Отмена
          </Button>
          {initial ? (
            <Button
              type="button"
              variant="danger"
              onClick={onDelete}
              disabled={saving}
              className="ml-auto"
            >
              Удалить
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
