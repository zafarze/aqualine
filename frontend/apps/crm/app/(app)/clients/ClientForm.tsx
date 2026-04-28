"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Input,
  Select,
  Textarea,
} from "@aqualine/ui";
import { ApiError, api } from "@/lib/api";
import {
  CLIENT_SEGMENT_OPTIONS,
  CLIENT_STATUS_OPTIONS,
  CLIENT_TYPE_OPTIONS,
  type Client,
  type ClientInput,
} from "@/lib/types";

interface ClientFormProps {
  initial?: Client;
}

const empty: ClientInput = {
  name: "",
  type: "physical",
  inn: "",
  phone: "",
  email: "",
  address: "",
  segment: "retail",
  status: "lead",
  notes: "",
};

export function ClientForm({ initial }: ClientFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ClientInput>(initial ?? empty);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof ClientInput>(k: K, v: ClientInput[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (initial) {
        await api<Client>(`/clients/${initial.id}/`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
      } else {
        await api<Client>("/clients/", {
          method: "POST",
          body: JSON.stringify(form),
        });
      }
      router.push("/clients");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, string[]> | null;
        const first = data && typeof data === "object"
          ? Object.entries(data)[0]
          : null;
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
    if (!confirm(`Удалить клиента «${initial.name}»?`)) return;
    setSaving(true);
    try {
      await api(`/clients/${initial.id}/`, { method: "DELETE" });
      router.push("/clients");
      router.refresh();
    } catch {
      setError("Не удалось удалить");
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <Input
            label="Наименование"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
        </div>

        <Select
          label="Тип"
          value={form.type}
          onChange={(e) => update("type", e.target.value as ClientInput["type"])}
          options={CLIENT_TYPE_OPTIONS}
        />
        <Input
          label="ИНН"
          value={form.inn ?? ""}
          onChange={(e) => update("inn", e.target.value)}
        />

        <Input
          label="Телефон"
          value={form.phone ?? ""}
          onChange={(e) => update("phone", e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          value={form.email ?? ""}
          onChange={(e) => update("email", e.target.value)}
        />

        <Select
          label="Сегмент"
          value={form.segment}
          onChange={(e) =>
            update("segment", e.target.value as ClientInput["segment"])
          }
          options={CLIENT_SEGMENT_OPTIONS}
        />
        <Select
          label="Статус"
          value={form.status}
          onChange={(e) =>
            update("status", e.target.value as ClientInput["status"])
          }
          options={CLIENT_STATUS_OPTIONS}
        />

        <div className="md:col-span-2">
          <Textarea
            label="Адрес"
            rows={2}
            value={form.address ?? ""}
            onChange={(e) => update("address", e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Textarea
            label="Заметки"
            rows={4}
            value={form.notes ?? ""}
            onChange={(e) => update("notes", e.target.value)}
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
