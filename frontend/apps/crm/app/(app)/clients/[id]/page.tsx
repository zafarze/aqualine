"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Breadcrumbs, Card } from "@aqualine/ui";
import { api } from "@/lib/api";
import type { Client } from "@/lib/types";
import { ClientForm } from "../ClientForm";

export default function EditClientPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    api<Client>(`/clients/${id}/`)
      .then((c) => {
        if (alive) setClient(c);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Ошибка");
      });
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      <Breadcrumbs
        items={[
          { label: "Клиенты", href: "/clients" },
          { label: client?.name ?? "Загрузка..." },
        ]}
      />
      <h1 className="text-2xl font-bold text-ink">
        {client?.name ?? "Загрузка..."}
      </h1>
      {error ? (
        <Card className="p-5 text-sm text-accent-pink">{error}</Card>
      ) : client ? (
        <ClientForm initial={client} />
      ) : (
        <Card className="p-10 text-center text-ink-soft text-sm">
          Загрузка...
        </Card>
      )}
    </div>
  );
}
