"use client";

import { api, type Paginated } from "./api";
import type {
  Client,
  NotificationsResponse,
  Order,
  Product,
  SearchResultItem,
} from "./types";

/**
 * Глобальный поиск — параллельно опрашивает /clients/, /orders/, /products/
 * и возвращает максимум 5 результатов на тип.
 */
export async function globalSearch(
  query: string,
): Promise<SearchResultItem[]> {
  const q = encodeURIComponent(query.trim());
  if (!q) return [];

  const [clientsR, ordersR, productsR] = await Promise.allSettled([
    api<Paginated<Client>>(`/clients/?search=${q}&page_size=5`),
    api<Paginated<Order>>(`/orders/?search=${q}&page_size=5`),
    api<Paginated<Product>>(`/products/?search=${q}&page_size=5`),
  ]);

  const out: SearchResultItem[] = [];

  if (clientsR.status === "fulfilled") {
    for (const c of clientsR.value.results) {
      out.push({
        type: "client",
        title: c.name,
        subtitle: c.phone || c.email || c.type_display,
        url: `/clients/${c.id}`,
      });
    }
  }
  if (ordersR.status === "fulfilled") {
    for (const o of ordersR.value.results) {
      out.push({
        type: "order",
        title: o.number,
        subtitle: `${o.client_name} · ${o.total} с. · ${o.status_display}`,
        url: `/orders/${o.id}`,
      });
    }
  }
  if (productsR.status === "fulfilled") {
    for (const p of productsR.value.results) {
      out.push({
        type: "product",
        title: p.name,
        subtitle: `${p.sku} · ${p.sale_price} с.`,
        url: `/products/${p.id}`,
      });
    }
  }

  return out;
}

export async function fetchNotifications(): Promise<NotificationsResponse> {
  return api<NotificationsResponse>("/dashboard/notifications/");
}
