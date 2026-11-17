"use client";

import { API_URL, apiPost } from "./api";
import type {
  AdminLoginInput,
  Category,
  Order,
  OrderStatus,
  Product,
} from "@coffein/shared";

export const ADMIN_TOKEN_COOKIE = "coffein_admin_token";

export function getAdminToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${ADMIN_TOKEN_COOKIE}=([^;]*)`),
  );
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function setAdminToken(token: string): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ADMIN_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; SameSite=Lax${secure}; max-age=43200`;
}

export function clearAdminToken(): void {
  document.cookie = `${ADMIN_TOKEN_COOKIE}=; path=/; SameSite=Lax; max-age=0`;
}

export async function adminLogin(input: AdminLoginInput): Promise<void> {
  const { accessToken } = await apiPost<{ accessToken: string }>(
    "/auth/login",
    input,
  );
  setAdminToken(accessToken);
}

interface AdminRequestInit {
  method: "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

export async function adminFetch<T>(
  path: string,
  init?: AdminRequestInit,
): Promise<T> {
  const token = getAdminToken();
  const method = init?.method ?? "GET";
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(init?.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const json: unknown = await res.json();
  if (res.status === 401) {
    clearAdminToken();
    throw new Error("Sesi berakhir. Silakan login ulang.");
  }
  if (
    typeof json === "object" &&
    json !== null &&
    "success" in json &&
    (json as { success: unknown }).success === true &&
    "data" in json
  ) {
    return (json as { data: T }).data;
  }
  const err = json as { error?: { message?: string } };
  throw new Error(err?.error?.message ?? `Request gagal (HTTP ${res.status})`);
}

// ---------- Admin endpoints ----------

export function adminListOrders(status?: OrderStatus): Promise<Order[]> {
  const query = status ? `?status=${status}` : "";
  return adminFetch<Order[]>(`/admin/orders${query}`);
}

export function adminUpdateStatus(
  id: string,
  status: OrderStatus,
): Promise<Order> {
  return adminFetch<Order>(`/admin/orders/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}

// ---------- Admin payment endpoints ----------

export function adminMarkCashPaid(
  id: string,
): Promise<{ success: boolean; orderNumber: string; status: OrderStatus }> {
  return adminFetch<{ success: boolean; orderNumber: string; status: OrderStatus }>(
    `/admin/orders/${id}/cash-paid`,
    { method: "POST" }
  );
}

export function adminListProducts(): Promise<Product[]> {
  return adminFetch<Product[]>("/products");
}

export interface ProductPayload {
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  categoryId: string | null;
  isAvailable: boolean;
}

export function adminCreateProduct(
  payload: ProductPayload,
): Promise<Product> {
  return adminFetch<Product>("/admin/products", {
    method: "POST",
    body: payload,
  });
}

export function adminUpdateProduct(
  id: string,
  payload: Partial<ProductPayload>,
): Promise<Product> {
  return adminFetch<Product>(`/admin/products/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function adminDeleteProduct(id: string): Promise<{ id: string }> {
  return adminFetch<{ id: string }>(`/admin/products/${id}`, {
    method: "DELETE",
  });
}

export function adminListCategories(): Promise<Category[]> {
  return adminFetch<Category[]>("/categories");
}

export function adminCreateCategory(name: string): Promise<Category> {
  return adminFetch<Category>("/admin/categories", {
    method: "POST",
    body: { name },
  });
}

export function adminDeleteCategory(id: string): Promise<{ id: string }> {
  return adminFetch<{ id: string }>(`/admin/categories/${id}`, {
    method: "DELETE",
  });
}
