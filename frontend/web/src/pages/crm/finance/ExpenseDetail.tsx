
import { useEffect, useState } from "react";
import { useParams } from "@/lib/next-shim";
import { Breadcrumbs, Card } from "@aqualine/ui";
import { api } from "@/lib/api";
import type { Expense } from "@/lib/types";
import { ExpenseForm } from "./ExpenseForm";

export default function EditExpensePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [expense, setExpense] = useState<Expense | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    api<Expense>(`/finance/expenses/${id}/`)
      .then((e) => alive && setExpense(e))
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Ошибка"));
    return () => {
      alive = false;
    };
  }, [id]);

  const dateLabel = expense
    ? `Расход от ${new Date(expense.date).toLocaleDateString("ru-RU")}`
    : "Загрузка...";

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <Breadcrumbs
        items={[
          { label: "Финансы", href: "/finance" },
          { label: dateLabel },
        ]}
      />
      <h1 className="text-2xl font-bold text-ink">{dateLabel}</h1>
      {error ? (
        <Card className="p-5 text-sm text-accent-pink">{error}</Card>
      ) : expense ? (
        <ExpenseForm initial={expense} />
      ) : (
        <Card className="p-10 text-center text-ink-soft text-sm">
          Загрузка...
        </Card>
      )}
    </div>
  );
}
