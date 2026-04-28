"use client";

const CART_KEY = "aqualine.cabinet.cart";

export interface CartItem {
  product_id: number;
  sku: string;
  name: string;
  price: string;
  quantity: number;
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]): void {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cart:change"));
}

export function addToCart(item: CartItem): void {
  const cart = readCart();
  const existing = cart.find((c) => c.product_id === item.product_id);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  writeCart(cart);
}

export function removeFromCart(productId: number): void {
  writeCart(readCart().filter((c) => c.product_id !== productId));
}

export function clearCart(): void {
  writeCart([]);
}

export function setQuantity(productId: number, qty: number): void {
  const cart = readCart();
  const it = cart.find((c) => c.product_id === productId);
  if (it) {
    it.quantity = qty;
    writeCart(cart);
  }
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, it) => sum + Number(it.price) * it.quantity, 0);
}
