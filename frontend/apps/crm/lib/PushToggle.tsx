"use client";

import { useEffect, useState } from "react";
import {
  getPushSupportStatus,
  isPushSubscribed,
  subscribePush,
} from "./push";

const SHOWN_KEY = "aqualine.crm.push.dismissed";

export function PushToggle() {
  const [hidden, setHidden] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await getPushSupportStatus();
      if (!alive) return;
      const dismissed = localStorage.getItem(SHOWN_KEY) === "1";
      if (
        s === "unsupported" ||
        s === "denied" ||
        dismissed ||
        (s === "granted" && (await isPushSubscribed()))
      ) {
        setHidden(true);
        return;
      }
      setHidden(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (hidden) return null;

  return (
    <div className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-2xl bg-white p-3 shadow-lg max-w-sm border border-slate-200">
      <span className="flex-1 text-sm text-ink">
        Включить уведомления о новых заказах и оплатах?
      </span>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const ok = await subscribePush();
          setBusy(false);
          if (!ok) localStorage.setItem(SHOWN_KEY, "1");
          setHidden(true);
        }}
        className="rounded-lg bg-accent-violet px-3 py-1.5 text-sm text-white disabled:opacity-60"
      >
        Включить
      </button>
      <button
        onClick={() => {
          localStorage.setItem(SHOWN_KEY, "1");
          setHidden(true);
        }}
        aria-label="Закрыть"
        className="rounded-lg px-2 py-1 text-ink-soft"
      >
        ✕
      </button>
    </div>
  );
}
