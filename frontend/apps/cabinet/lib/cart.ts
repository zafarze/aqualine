"use client";
import { api } from "./api";

export interface CartItem {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  product_unit: string;
  price: string;
  quantity: number;
  sum: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total: string;
  updated_at: string;
}

export const CART_EVENT = "cart:change";

function notify() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CART_EVENT));
  }
}

export async function getCart(): Promise<Cart> {
  return api<Cart>("/cart/");
}

export async function addToCart(productId: number, quantity = 1): Promise<void> {
  if (quantity <= 0) throw new Error("Количество должно быть больше нуля");
  await api("/cart/items/", {
    method: "POST",
    body: JSON.stringify({ product: productId, quantity }),
  });
  notify();
}

export async function updateQuantity(itemId: number, quantity: number): Promise<void> {
  if (quantity <= 0) throw new Error("Количество должно быть больше нуля");
  await api(`/cart/items/${itemId}/`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
  notify();
}

export async function removeFromCart(itemId: number): Promise<void> {
  await api(`/cart/items/${itemId}/`, { method: "DELETE" });
  notify();
}

export async function clearCart(): Promise<void> {
  await api("/cart/clear/", { method: "POST" });
  notify();
}

export async function checkout(notes = ""): Promise<{ order_id: number; number: string }> {
  const result = await api<{ order_id: number; number: string }>("/cart/checkout/", {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
  notify();
  return result;
}

export function cartTotal(cart: Cart | null): number {
  return cart ? Number(cart.total) : 0;
}
