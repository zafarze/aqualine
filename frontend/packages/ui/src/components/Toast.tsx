"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "../lib/cn";

export type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastApi {
  show: (t: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastCtx = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    throw new Error("useToast: оберните дерево в <ToastProvider>");
  }
  return ctx;
}

const TONE_CLASSES: Record<ToastTone, string> = {
  success: "border-accent-green/40 bg-surface text-ink",
  error: "border-accent-pink/40 bg-surface text-ink",
  info: "border-accent-violet/40 bg-surface text-ink",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, ...t }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, description) => show({ tone: "success", title, description }),
      error: (title, description) => show({ tone: "error", title, description }),
      info: (title, description) => show({ tone: "info", title, description }),
    }),
    [show],
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div
        role="region"
        aria-label="Уведомления"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={cn(
              "rounded-neu px-4 py-3 shadow-neu-soft border animate-fade-in-up",
              TONE_CLASSES[t.tone],
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description ? (
                  <p className="text-xs text-ink-soft mt-0.5">{t.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-ink-dim hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-violet rounded"
                aria-label="Закрыть уведомление"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
