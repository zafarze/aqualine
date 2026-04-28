const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

const ACCESS_KEY = "aqualine.access";
const REFRESH_KEY = "aqualine.refresh";

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

function getAccess(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

function getRefresh(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string): void {
  window.localStorage.setItem(ACCESS_KEY, access);
  window.localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

export function isAuthenticated(): boolean {
  return getAccess() !== null;
}

async function refreshAccess(): Promise<string | null> {
  const refresh = getRefresh();
  if (!refresh) return null;
  const r = await fetch(`${API_BASE}/auth/jwt/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!r.ok) {
    clearTokens();
    return null;
  }
  const data = (await r.json()) as { access: string };
  window.localStorage.setItem(ACCESS_KEY, data.access);
  return data.access;
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const access = getAccess();
  const headers = new Headers(init.headers);
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (access) headers.set("Authorization", `Bearer ${access}`);

  const r = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (r.status === 401 && retry) {
    const newAccess = await refreshAccess();
    if (newAccess) return api<T>(path, init, false);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Сессия истекла", null);
  }

  if (!r.ok) {
    let data: unknown = null;
    let text = "";
    try {
      text = await r.text();
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    throw new ApiError(r.status, `HTTP ${r.status}`, data);
  }

  if (r.status === 204) return undefined as T;
  return (await r.json()) as T;
}

export async function login(
  username: string,
  password: string,
): Promise<{ access: string; refresh: string }> {
  const r = await fetch(`${API_BASE}/auth/jwt/create/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!r.ok) {
    throw new ApiError(r.status, "Неверный логин или пароль", null);
  }
  const data = (await r.json()) as { access: string; refresh: string };
  setTokens(data.access, data.refresh);
  return data;
}

export function logout(): void {
  clearTokens();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}
