
import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Card, Input, Select } from "@aqualine/ui";
import { ApiError, api } from "@/lib/api";
import {
  PAYMENT_METHOD_OPTIONS,
  type Payment,
  type PaymentMethod,
} from "@/lib/types";

interface OrderPaymentsProps {
  orderId: number;
  total: string;
  initialPayments: Payment[];
  initialPaid: string;
  initialBalance: string;
}

const today = (): string => new Date().toISOString().slice(0, 10);

export function OrderPayments({
  orderId,
  total,
  initialPayments,
  initialPaid,
  initialBalance,
}: OrderPaymentsProps) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [paid, setPaid] = useState(initialPaid);
  const [balance, setBalance] = useState(initialBalance);
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState("0");
  const [date, setDate] = useState(today());
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function recalc(next: Payment[]) {
    const sum = next.reduce((s, p) => s + Number(p.amount || 0), 0);
    setPaid(sum.toFixed(2));
    setBalance((Number(total) - sum).toFixed(2));
  }

  async function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const created = await api<Payment>("/finance/payments/", {
        method: "POST",
        body: JSON.stringify({
          order: orderId,
          amount,
          date,
          method,
          notes,
        }),
      });
      const next = [created, ...payments];
      setPayments(next);
      recalc(next);
      setAmount("0");
      setNotes("");
      setAdding(false);
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
      setBusy(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Удалить эту оплату?")) return;
    try {
      await api(`/finance/payments/${id}/`, { method: "DELETE" });
      const next = payments.filter((p) => p.id !== id);
      setPayments(next);
      recalc(next);
    } catch {
      setError("Не удалось удалить");
    }
  }

  const balanceNum = Number(balance);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-ink">Оплаты</h2>
        {!adding ? (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus size={14} />
            Добавить оплату
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="rounded-neu bg-surface-soft shadow-neu-in p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-ink-soft">
            Сумма заказа
          </div>
          <div className="text-xl font-bold text-ink tabular-nums mt-1">
            {total}
          </div>
        </div>
        <div className="rounded-neu bg-surface-soft shadow-neu-in p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-ink-soft">
            Оплачено
          </div>
          <div className="text-xl font-bold text-[#1f9b6a] tabular-nums mt-1">
            {paid}
          </div>
        </div>
        <div className="rounded-neu bg-surface-soft shadow-neu-in p-3 text-center">
          <div className="text-[10px] uppercase tracking-wider text-ink-soft">
            Остаток
          </div>
          <div
            className={`text-xl font-bold tabular-nums mt-1 ${balanceNum > 0 ? "text-accent-pink" : "text-ink"}`}
          >
            {balance}
          </div>
        </div>
      </div>

      {adding ? (
        <form
          onSubmit={onAdd}
          className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end mb-5 p-4 rounded-neu bg-surface-soft shadow-neu-in"
        >
          <Input
            label="Сумма"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Input
            label="Дата"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Select
            label="Метод"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            options={PAYMENT_METHOD_OPTIONS}
          />
          <Input
            label="Заметки"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="md:col-span-4 flex gap-2 mt-1">
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? "Сохраняем..." : "Сохранить"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setAdding(false)}
              disabled={busy}
            >
              Отмена
            </Button>
          </div>
        </form>
      ) : null}

      {error ? (
        <div className="text-sm text-accent-pink bg-accent-pink/10 rounded-neu px-4 py-2.5 mb-4">
          {error}
        </div>
      ) : null}

      {payments.length === 0 ? (
        <div className="text-sm text-ink-soft text-center py-6">
          Оплат пока нет
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {payments.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 bg-surface rounded-neu shadow-neu-soft px-4 py-3"
            >
              <div className="text-sm text-ink-soft tabular-nums w-24">
                {new Date(p.date).toLocaleDateString("ru-RU")}
              </div>
              <div className="text-sm text-ink-soft w-24">
                {p.method_display}
              </div>
              <div className="flex-1 text-sm text-ink-soft truncate">
                {p.notes || "—"}
              </div>
              <div className="text-base font-bold text-ink tabular-nums">
                {p.amount}
              </div>
              <button
                type="button"
                onClick={() => onDelete(p.id)}
                className="w-8 h-8 grid place-items-center rounded-full text-ink-soft hover:text-accent-pink"
                aria-label="Удалить оплату"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
