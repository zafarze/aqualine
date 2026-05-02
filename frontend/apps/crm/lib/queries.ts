"use client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api, type Paginated } from "./api";
import type { Client, ClientInput, Order, OrderInput, Product, ProductInput } from "./types";

// ─── Clients ─────────────────────────────────────────────────────────────

export const clientsKeys = {
  all: ["clients"] as const,
  list: (params?: Record<string, string>) => [...clientsKeys.all, "list", params ?? {}] as const,
  detail: (id: number) => [...clientsKeys.all, "detail", id] as const,
};

function qs(params?: Record<string, string>): string {
  if (!params) return "";
  const filtered = Object.entries(params).filter(([, v]) => v !== "" && v != null);
  if (!filtered.length) return "";
  return "?" + new URLSearchParams(filtered as [string, string][]).toString();
}

export function useClients(params?: Record<string, string>) {
  return useQuery({
    queryKey: clientsKeys.list(params),
    queryFn: () => api<Paginated<Client>>(`/clients/${qs(params)}`),
  });
}

export function useClient(id: number | null) {
  return useQuery({
    queryKey: clientsKeys.detail(id ?? -1),
    queryFn: () => api<Client>(`/clients/${id}/`),
    enabled: id != null && id > 0,
  });
}

export function useSaveClient(id?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ClientInput) =>
      api<Client>(id ? `/clients/${id}/` : "/clients/", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientsKeys.all }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api(`/clients/${id}/`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientsKeys.all }),
  });
}

// ─── Products ────────────────────────────────────────────────────────────

export const productsKeys = {
  all: ["products"] as const,
  list: (params?: Record<string, string>) => [...productsKeys.all, "list", params ?? {}] as const,
  detail: (id: number) => [...productsKeys.all, "detail", id] as const,
};

export function useProducts(params?: Record<string, string>) {
  return useQuery({
    queryKey: productsKeys.list(params),
    queryFn: () => api<Paginated<Product>>(`/products/${qs(params)}`),
  });
}

export function useSaveProduct(id?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) =>
      api<Product>(id ? `/products/${id}/` : "/products/", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: productsKeys.all }),
  });
}

// ─── Orders ──────────────────────────────────────────────────────────────

export const ordersKeys = {
  all: ["orders"] as const,
  list: (params?: Record<string, string>) => [...ordersKeys.all, "list", params ?? {}] as const,
  detail: (id: number) => [...ordersKeys.all, "detail", id] as const,
};

export function useOrders(params?: Record<string, string>) {
  return useQuery({
    queryKey: ordersKeys.list(params),
    queryFn: () => api<Paginated<Order>>(`/orders/${qs(params)}`),
  });
}

export function useSaveOrder(id?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OrderInput) =>
      api<Order>(id ? `/orders/${id}/` : "/orders/", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ordersKeys.all }),
  });
}

// ─── Generic debounce hook ───────────────────────────────────────────────

export function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
