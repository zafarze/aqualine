/**
 * Шим для совместимости со страницами, портированными из Next.js.
 * Link/useRouter автоматически добавляют префикс /app или /portal в зависимости от того,
 * откуда вызвано — чтобы существующий код со ссылками "/clients", "/orders" работал
 * без правок внутри роутов /app/* и /portal/*.
 */
import {
  Link as RRLink,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import type { ComponentProps } from "react";

interface LinkProps extends Omit<ComponentProps<"a">, "href"> {
  href: string;
  replace?: boolean;
}

const NO_PREFIX_PREFIXES = ["/login", "/portal", "/app", "/api/", "http://", "https://", "mailto:", "tel:"];

function getCurrentPrefix(pathname: string): "/app" | "/portal" | "" {
  if (pathname.startsWith("/portal")) return "/portal";
  if (pathname.startsWith("/app")) return "/app";
  return "";
}

function resolvePath(href: string, pathname: string): string {
  if (!href || !href.startsWith("/")) return href;
  const prefix = getCurrentPrefix(pathname);
  if (!prefix) return href;
  if (NO_PREFIX_PREFIXES.some((p) => href.startsWith(p))) return href;
  if (href === "/") return prefix;
  return prefix + href;
}

export function Link({ href, replace, ...rest }: LinkProps) {
  const { pathname } = useLocation();
  const to = resolvePath(href, pathname);
  return <RRLink to={to} replace={replace} {...rest} />;
}

export function useRouter() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const wrap = (path: string) => resolvePath(path, pathname);
  return {
    push: (path: string) => navigate(wrap(path)),
    replace: (path: string) => navigate(wrap(path), { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => {
      /* no-op в SPA */
    },
    prefetch: (_path: string) => {
      /* no-op */
    },
  };
}

export function usePathname(): string {
  return useLocation().pathname;
}

export { useParams, useSearchParams };

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
