"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import {
  getPushSupportStatus,
  isPushSubscribed,
  subscribePush,
  unsubscribePush,
} from "../../../lib/push";

interface Me {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
}

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [pushStatus, setPushStatus] = useState<
    "unsupported" | "denied" | "default" | "granted"
  >("unsupported");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Me>("/auth/users/me/").then(setMe).catch(() => null);
    refreshPush();
  }, []);

  async function refreshPush() {
    const s = await getPushSupportStatus();
    setPushStatus(s);
    if (s === "granted") setSubscribed(await isPushSubscribed());
    else setSubscribed(false);
  }

  async function toggle() {
    setBusy(true);
    if (subscribed) {
      await unsubscribePush();
    } else {
      await subscribePush();
    }
    await refreshPush();
    setBusy(false);
  }

  if (!me) return <p className="text-[#7B7AA8]">Загрузка...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#2e2a55] mb-4">Профиль</h1>

      <div className="bg-white rounded-2xl p-4 space-y-2 mb-4">
        <Field label="Имя" value={`${me.first_name} ${me.last_name}`.trim() || "—"} />
        <Field label="Логин" value={me.username} />
        <Field label="Email" value={me.email || "—"} />
        <Field label="Телефон" value={me.phone || "—"} />
        <Field label="Роль" value={me.role} />
      </div>

      <div className="bg-white rounded-2xl p-4">
        <h2 className="font-medium text-[#2e2a55] mb-1">Push-уведомления</h2>
        <p className="text-xs text-[#7B7AA8] mb-3">
          {pushStatus === "unsupported" &&
            "Этот браузер не поддерживает push-уведомления."}
          {pushStatus === "denied" &&
            "Уведомления заблокированы в настройках браузера. Разрешите их вручную, чтобы включить."}
          {pushStatus !== "unsupported" && pushStatus !== "denied" && (
            subscribed
              ? "Вы получаете push-уведомления о статусе заказов и поступлениях оплат."
              : "Не пропускайте важные обновления — включите уведомления."
          )}
        </p>
        <button
          disabled={busy || pushStatus === "unsupported" || pushStatus === "denied"}
          onClick={toggle}
          className={`w-full rounded-xl py-2.5 font-medium disabled:opacity-50 ${
            subscribed
              ? "bg-[#F4F2FE] text-[#8E7CF8]"
              : "bg-[#8E7CF8] text-white"
          }`}
        >
          {busy
            ? "..."
            : subscribed
              ? "Отключить уведомления"
              : "Включить уведомления"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[#7B7AA8]">{label}</span>
      <span className="text-[#2e2a55] font-medium">{value}</span>
    </div>
  );
}
