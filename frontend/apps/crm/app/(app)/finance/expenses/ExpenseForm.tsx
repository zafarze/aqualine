"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select, Textarea } from "@aqualine/ui";
import { ApiError, api, type Paginated } from "@/lib/api";
import type { Category, Expense, ExpenseInput } from "@/lib/types";

const today = (): string => new Date().toISOString().slice(0, 10);

const empty: ExpenseInput = {
  category: "",
  amount: "0",
  date: today(),
  description: "",
};

function fromExpense(e: Expense): ExpenseInput {
  return {
    category: e.category,
    amount: e.amount,
    date: e.date,
    description: e.description,
  };
}

export function ExpenseForm({ initial }: { initial?: Expense }) {
  const router = useRouter();
  const [form, setForm] = useState<ExpenseInput>(
    initial ? fromExpense(initial) : empty,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    api<Paginated<Category>>("/finance/categories/?type=expense&page_size=200")
      .then((d) => alive && setCategories(d.results))
      .catch((e) =>
        alive && setError(e instanceof Error ? e.message : "Ошибка"),
      );
    return () => {
      alive = false;
    };
  }, []);

  function update<K extends keyof ExpenseInput>(k: K, v: ExpenseInput[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (form.category === "") {
      setError("Выберите категорию");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, category: Number(form.category) };
      if (initial) {
        await api(`/finance/expenses/${initial.id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/finance/expenses/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      router.push("/finance");
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
    if (!confirm(`Удалить расход на сумму ${initial.amount}?`)) return;
    setSaving(true);
    try {
      await api(`/finance/expenses/${initial.id}/`, { method: "DELETE" });
      router.push("/finance");
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
        <Select
          label="Категория"
          value={String(form.category)}
          onChange={(e) =>
            update(
              "category",
              e.target.value === "" ? "" : Number(e.target.value),
            )
          }
          placeholder="— выберите —"
          options={categories.map((c) => ({
            value: String(c.id),
            label: c.name,
          }))}
          required
        />
        <Input
          label="Сумма"
          type="number"
          step="0.01"
          value={form.amount}
          onChange={(e) => update("amount", e.target.value)}
          required
        />
        <Input
          label="Дата"
          type="date"
          value={form.date}
          onChange={(e) => update("date", e.target.value)}
          required
        />
        <div />
        <div className="md:col-span-2">
          <Textarea
            label="Описание"
            rows={3}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>

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
