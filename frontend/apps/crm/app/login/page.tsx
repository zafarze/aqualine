"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react";
import { Card, Input } from "@aqualine/ui";
import { ApiError, login } from "@/lib/api";

const REMEMBER_KEY = "aqualine.remember-username";

function pickGreeting(): { title: string; subtitle: string } {
  const h = new Date().getHours();
  if (h >= 5 && h < 12)
    return {
      title: "Доброе утро, бизнесмен ☀️",
      subtitle: "Кофе налит — пора зарабатывать.",
    };
  if (h >= 12 && h < 17)
    return {
      title: "Привет, бизнесмен 👋",
      subtitle: "День в разгаре — давай делать продажи.",
    };
  if (h >= 17 && h < 22)
    return {
      title: "Добрый вечер, шеф 🌆",
      subtitle: "Закрываем сделки красиво.",
    };
  return {
    title: "Поздний час, босс 🌙",
    subtitle: "Тоже не спишь? Уважаем.",
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Считаем приветствие один раз на маунт — иначе будет SSR-mismatch.
  const [greeting, setGreeting] = useState({
    title: "Привет, бизнесмен 👋",
    subtitle: "Войдите, чтобы продолжить.",
  });

  useEffect(() => {
    setGreeting(pickGreeting());
    const saved = window.localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setUsername(saved);
      setRemember(true);
    }
  }, []);

  const year = useMemo(() => new Date().getFullYear(), []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const u = username.trim();
      await login(u, password);
      if (remember) {
        window.localStorage.setItem(REMEMBER_KEY, u);
      } else {
        window.localStorage.removeItem(REMEMBER_KEY);
      }
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Не удалось войти. Проверьте подключение к серверу.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-violet-50 grid place-items-center p-6">
      {/* Плавающие градиентные блобы */}
      <div
        aria-hidden
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <div className="absolute -top-32 -left-20 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-accent-violet/30 to-accent-pink/25 blur-3xl animate-blob-1" />
        <div className="absolute top-1/3 -right-32 w-[560px] h-[560px] rounded-full bg-gradient-to-br from-accent-pink/25 to-accent-yellow/20 blur-3xl animate-blob-2" />
        <div className="absolute -bottom-32 left-1/4 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-accent-mint/25 to-accent-violet/20 blur-3xl animate-blob-3" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        <Card className="p-8 lg:p-10 bg-white/85 backdrop-blur-md">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-violet/10 text-accent-violet text-[11px] font-semibold uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-violet animate-pulse" />
              AquaLine CRM
            </div>
            <h1 className="text-3xl font-bold text-ink tracking-tight leading-snug">
              {greeting.title}
            </h1>
            <p className="text-sm text-ink-soft mt-1.5">
              {greeting.subtitle}
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-4"
            autoComplete="on"
          >
            {/* Логин */}
            <div className="relative">
              <Input
                label="Логин"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="pl-11"
              />
              <span className="absolute left-3.5 top-[34px] text-ink-soft pointer-events-none">
                <User size={18} />
              </span>
            </div>

            {/* Пароль */}
            <div className="relative">
              <Input
                label="Пароль"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-11 pr-12"
              />
              <span className="absolute left-3.5 top-[34px] text-ink-soft pointer-events-none">
                <Lock size={18} />
              </span>
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((s) => !s)}
                aria-label={
                  showPassword ? "Скрыть пароль" : "Показать пароль"
                }
                className="absolute right-2 top-[28px] w-9 h-9 grid place-items-center rounded-full text-ink-soft hover:text-ink hover:bg-surface-dim/60 transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 select-none cursor-pointer text-ink-soft hover:text-ink transition">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer accent-[#8E7CF8]"
                />
                Запомнить логин
              </label>
              <button
                type="button"
                className="text-accent-violet hover:underline font-medium"
                onClick={() =>
                  alert(
                    "Обратитесь к администратору для сброса пароля.",
                  )
                }
              >
                Забыли пароль?
              </button>
            </div>

            {error ? (
              <div className="text-sm text-accent-pink bg-accent-pink/10 border border-accent-pink/20 rounded-neu px-4 py-2.5 animate-fade-in-up">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="group relative h-12 w-full rounded-neu font-semibold text-white overflow-hidden bg-gradient-to-r from-accent-violet via-bg to-accent-pink shadow-[0_10px_30px_-10px_rgba(108,92,231,0.6)] hover:shadow-[0_18px_40px_-12px_rgba(108,92,231,0.8)] transition-shadow active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-r from-accent-pink via-bg to-accent-violet opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <span className="relative inline-flex items-center justify-center gap-2">
                {loading ? "Входим..." : "Войти в систему"}
                {!loading ? (
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                ) : null}
              </span>
            </button>
          </form>

          <div className="flex items-center gap-2 justify-center mt-6 text-xs text-ink-dim">
            <ShieldCheck size={14} />
            Защищённое JWT-подключение
          </div>
        </Card>

        <div className="text-center mt-4 text-xs text-ink-dim">
          © {year} AquaLine · г. Душанбе
        </div>
      </div>
    </div>
  );
}
