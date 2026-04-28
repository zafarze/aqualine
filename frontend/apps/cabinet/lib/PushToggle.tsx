"use client";

import { useEffect, useState } from "react";
import {
  getPushSupportStatus,
  isPushSubscribed,
  subscribePush,
  unsubscribePush,
} from "./push";

const SHOWN_KEY = "aqualine.push.banner.dismissed";

export function PushToggle() {
  const [status, setStatus] = useState<
    "unsupported" | "denied" | "default" | "granted"
  >("unsupported");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await getPushSupportStatus();
      if (!alive) return;
      setStatus(s);
      if (s === "granted") setSubscribed(await isPushSubscribed());
      const dismissed = localStorage.getItem(SHOWN_KEY) === "1";
      setHidden(dismissed || s === "unsupported" || s === "denied");
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (hidden || status === "unsupported" || status === "denied") return null;
  if (subscribed) return null;

  return (
    <div className="fixed inset-x-3 bottom-36 z-30 flex items-center gap-2 rounded-2xl bg-white p-3 shadow-lg sm:bottom-20 sm:right-4 sm:left-auto sm:max-w-sm border border-[#e5e2f5]">
      <span className="flex-1 text-sm text-[#2e2a55]">
        Получать уведомления о статусе заказа?
      </span>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const ok = await subscribePush();
          setSubscribed(ok);
          setBusy(false);
          if (!ok) localStorage.setItem(SHOWN_KEY, "1");
          setHidden(true);
        }}
        className="rounded-lg bg-[#8E7CF8] px-3 py-1.5 text-sm text-white disabled:opacity-60"
      >
        Включить
      </button>
      <button
        onClick={() => {
          localStorage.setItem(SHOWN_KEY, "1");
          setHidden(true);
        }}
        aria-label="Закрыть"
        className="rounded-lg px-2 py-1 text-[#7B7AA8]"
      >
        ✕
      </button>
    </div>
  );
}

export async function disablePush(): Promise<void> {
  await unsubscribePush();
}
