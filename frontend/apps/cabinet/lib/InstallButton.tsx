"use client";

import { useEffect, useState } from "react";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "aqualine.install.dismissed";

export function InstallButton({ className = "" }: { className?: string }) {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }
    const onBefore = (e: Event) => {
      e.preventDefault();
      if (localStorage.getItem(DISMISSED_KEY) === "1") return;
      setEvt(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onBefore);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBefore);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !evt) return null;

  return (
    <div
      className={`fixed inset-x-3 bottom-20 z-30 flex items-center gap-2 rounded-2xl bg-[#8E7CF8] p-3 text-white shadow-lg sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm ${className}`}
    >
      <span className="flex-1 text-sm">
        Установить AquaLine на главный экран?
      </span>
      <button
        onClick={async () => {
          await evt.prompt();
          await evt.userChoice;
          setEvt(null);
        }}
        className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-[#8E7CF8]"
      >
        Установить
      </button>
      <button
        onClick={() => {
          localStorage.setItem(DISMISSED_KEY, "1");
          setEvt(null);
        }}
        aria-label="Закрыть"
        className="rounded-lg px-2 py-1 text-white/70 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
