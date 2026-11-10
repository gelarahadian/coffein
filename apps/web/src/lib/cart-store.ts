"use client";

import { useSyncExternalStore } from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

const STORAGE_KEY = "coffein-cart";
const EMPTY: CartItem[] = [];

let items: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage penuh / diblokir — biarkan state in-memory saja.
  }
}

function ensureLoaded(): void {
  if (loaded || typeof window === "undefined") {
    return;
  }
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        items = parsed as CartItem[];
      }
    }
  } catch {
    // Keranjang korup → mulai kosong.
  }
}

function subscribe(listener: () => void): () => void {
  ensureLoaded();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): CartItem[] {
  return items;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY;
}

// ---------- Mutations ----------

export function addToCart(
  item: Omit<CartItem, "quantity">,
  quantity = 1,
): void {
  const existing = items.find((i) => i.productId === item.productId);
  items = existing
    ? items.map((i) =>
        i.productId === item.productId
          ? { ...i, quantity: i.quantity + quantity }
          : i,
      )
    : [...items, { ...item, quantity }];
  emit();
  persist();
}

export function setQuantity(productId: string, quantity: number): void {
  items =
    quantity <= 0
      ? items.filter((i) => i.productId !== productId)
      : items.map((i) =>
          i.productId === productId ? { ...i, quantity } : i,
        );
  emit();
  persist();
}

export function removeFromCart(productId: string): void {
  items = items.filter((i) => i.productId !== productId);
  emit();
  persist();
}

export function clearCart(): void {
  items = EMPTY;
  emit();
  persist();
}

// ---------- Hook ----------

export interface Cart {
  items: CartItem[];
  total: number;
  count: number;
  add: typeof addToCart;
  setQuantity: typeof setQuantity;
  remove: typeof removeFromCart;
  clear: typeof clearCart;
}

export function useCart(): Cart {
  const currentItems = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const total = currentItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0,
  );
  const count = currentItems.reduce((sum, i) => sum + i.quantity, 0);
  return {
    items: currentItems,
    total,
    count,
    add: addToCart,
    setQuantity,
    remove: removeFromCart,
    clear: clearCart,
  };
}
