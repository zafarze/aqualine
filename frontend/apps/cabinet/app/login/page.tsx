"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, ApiError } from "../../lib/api";

export default function CabinetLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
      router.push("/catalog");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Не удалось войти");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F4F2FE] p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-[8px_8px_24px_#d6d2ec,-8px_-8px_24px_#ffffff]"
      >
        <h1 className="text-xl font-semibold text-[#2e2a55] mb-1">
          AquaLine · Кабинет
        </h1>
        <p className="text-sm text-[#7B7AA8] mb-6">
          Войдите, чтобы оформить заказ
        </p>
        <label className="block text-xs text-[#7B7AA8] mb-1">Логин / e-mail</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full rounded-xl bg-[#F4F2FE] px-4 py-3 mb-3 outline-none"
        />
        <label className="block text-xs text-[#7B7AA8] mb-1">Пароль</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-xl bg-[#F4F2FE] px-4 py-3 mb-4 outline-none"
        />
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#8E7CF8] py-3 text-white font-medium disabled:opacity-60"
        >
          {loading ? "Вход..." : "Войти"}
        </button>
      </form>
    </main>
  );
}
