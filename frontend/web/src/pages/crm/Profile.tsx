
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Camera, ShieldCheck } from "lucide-react";
import {
  Breadcrumbs,
  Button,
  Card,
  Input,
} from "@aqualine/ui";
import { ApiError, api } from "@/lib/api";
import type { CurrentUser } from "@/lib/types";

const API_ORIGIN = (
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"
).replace(/\/api\/?$/, "");

function absUrl(p: string | null): string | undefined {
  if (!p) return undefined;
  if (/^https?:\/\//.test(p)) return p;
  return `${API_ORIGIN}${p.startsWith("/") ? "" : "/"}${p}`;
}

export default function ProfilePage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let alive = true;
    api<CurrentUser>("/auth/users/me/")
      .then((u) => alive && setUser(u))
      .catch((e) =>
        alive && setError(e instanceof Error ? e.message : "Ошибка"),
      );
    return () => {
      alive = false;
    };
  }, []);

  function update<K extends keyof CurrentUser>(k: K, v: CurrentUser[K]) {
    setUser((prev) => (prev ? { ...prev, [k]: v } : prev));
  }

  async function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Файл больше 5 МБ");
      return;
    }
    setError(null);
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const updated = await api<CurrentUser>("/auth/users/me/", {
        method: "PATCH",
        body: fd,
      });
      setUser(updated);
      setSuccess("Фото обновлено");
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Не удалось загрузить фото",
      );
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const updated = await api<CurrentUser>("/auth/users/me/", {
        method: "PATCH",
        body: JSON.stringify({
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
        }),
      });
      setUser(updated);
      setSuccess("Профиль сохранён");
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as Record<string, string[]> | null;
        const first = data ? Object.entries(data)[0] : null;
        setError(
          first
            ? `${first[0]}: ${
                Array.isArray(first[1])
                  ? first[1].join(", ")
                  : String(first[1])
              }`
            : err.message,
        );
      } else {
        setError("Не удалось сохранить");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <Breadcrumbs items={[{ label: "Мой профиль" }]} />
      <h1 className="text-2xl font-bold text-ink">Мой профиль</h1>

      {!user ? (
        <Card className="p-10 text-center text-ink-soft text-sm">
          Загрузка...
        </Card>
      ) : (
        <Card className="p-6">
          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            {/* Фото */}
            <div className="flex items-center gap-5">
              <label
                htmlFor="profile-photo"
                className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group bg-violet-50 grid place-items-center"
              >
                {user.photo ? (
                  <img
                    src={absUrl(user.photo)}
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-accent-violet">
                    {(user.first_name?.charAt(0) || user.username.charAt(0))
                      .toUpperCase()}
                  </span>
                )}
                <span className="absolute inset-0 bg-black/45 grid place-items-center opacity-0 group-hover:opacity-100 transition">
                  <Camera className="text-white" size={22} />
                </span>
                <input
                  ref={fileInputRef}
                  id="profile-photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPhotoChange}
                  disabled={uploadingPhoto}
                />
              </label>
              <div>
                <div className="text-base font-semibold text-ink">
                  {user.full_name || user.username}
                </div>
                <div className="text-xs text-ink-soft uppercase tracking-wider mt-0.5">
                  {user.role_display}
                </div>
                <div className="text-xs text-ink-dim mt-2">
                  {uploadingPhoto
                    ? "Загружаем фото..."
                    : "Кликни по аватару, чтобы загрузить фото (до 5 МБ)"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Имя"
                value={user.first_name}
                onChange={(e) => update("first_name", e.target.value)}
              />
              <Input
                label="Фамилия"
                value={user.last_name}
                onChange={(e) => update("last_name", e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={user.email}
                onChange={(e) => update("email", e.target.value)}
              />
              <Input
                label="Телефон"
                value={user.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 px-4 py-2.5 rounded-neu bg-violet-50/60 text-xs text-ink-soft">
              <ShieldCheck size={14} className="text-accent-violet" />
              Логин <span className="font-semibold text-ink">{user.username}</span>{" "}
              и пароль меняются администратором через панель.
            </div>

            {error ? (
              <div className="text-sm text-accent-pink bg-accent-pink/10 rounded-neu px-4 py-2.5">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="text-sm text-emerald-600 bg-emerald-50 rounded-neu px-4 py-2.5">
                {success}
              </div>
            ) : null}

            <div>
              <Button type="submit" disabled={saving}>
                {saving ? "Сохраняем..." : "Сохранить изменения"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
