
import { useState, type FormEvent } from "react";
import { useRouter } from "@/lib/next-shim";
import { Button, Card, Input, Select } from "@aqualine/ui";
import { ApiError, api } from "@/lib/api";
import {
  PRODUCT_UNIT_OPTIONS,
  type Product,
  type ProductInput,
} from "@/lib/types";

const empty: ProductInput = {
  sku: "",
  name: "",
  unit: "pcs",
  purchase_price: "0",
  sale_price: "0",
  stock: "0",
};

function fromProduct(p: Product): ProductInput {
  return {
    sku: p.sku,
    name: p.name,
    unit: p.unit,
    purchase_price: p.purchase_price,
    sale_price: p.sale_price,
    stock: p.stock,
  };
}

export function ProductForm({ initial }: { initial?: Product }) {
  const router = useRouter();
  const [form, setForm] = useState<ProductInput>(
    initial ? fromProduct(initial) : empty,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof ProductInput>(k: K, v: ProductInput[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (initial) {
        await api(`/products/${initial.id}/`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
      } else {
        await api("/products/", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }
      router.push("/products");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, string[]> | null;
        const first = data ? Object.entries(data)[0] : null;
        setError(
          first
            ? `${first[0]}: ${Array.isArray(first[1]) ? first[1].join(", ") : String(first[1])}`
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
    if (!confirm(`Удалить товар «${initial.name}»?`)) return;
    setSaving(true);
    try {
      await api(`/products/${initial.id}/`, { method: "DELETE" });
      router.push("/products");
      router.refresh();
    } catch {
      setError("Не удалось удалить");
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        <Input
          label="Артикул"
          value={form.sku}
          onChange={(e) => update("sku", e.target.value)}
          required
        />
        <Input
          label="Наименование"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />
        <Select
          label="Единица"
          value={form.unit}
          onChange={(e) => update("unit", e.target.value as ProductInput["unit"])}
          options={PRODUCT_UNIT_OPTIONS}
        />
        <Input
          label="Остаток"
          type="number"
          step="0.01"
          value={form.stock}
          onChange={(e) => update("stock", e.target.value)}
        />
        <Input
          label="Закупочная цена"
          type="number"
          step="0.01"
          value={form.purchase_price}
          onChange={(e) => update("purchase_price", e.target.value)}
        />
        <Input
          label="Розничная цена"
          type="number"
          step="0.01"
          value={form.sale_price}
          onChange={(e) => update("sale_price", e.target.value)}
        />

        {error ? (
          <div className="md:col-span-2 text-sm text-accent-pink bg-accent-pink/10 rounded-neu px-4 py-2.5">
            {error}
          </div>
        ) : null}

        <div className="md:col-span-2 flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Сохраняем..." : initial ? "Сохранить" : "Создать"}
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
