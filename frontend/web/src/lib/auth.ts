import { useQuery } from "@tanstack/react-query";
import { api, isAuthenticated } from "./api";
import type { CurrentUser } from "./types";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api<CurrentUser>("/auth/users/me/"),
    enabled: isAuthenticated(),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function isClientRole(role?: string | null): boolean {
  return role === "client";
}

export function isStaffRole(role?: string | null): boolean {
  return !!role && role !== "client";
}
