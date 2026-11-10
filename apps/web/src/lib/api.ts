import type { ApiResponse, Category, Order, Product } from "@coffein/shared";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ApiErrorShape {
  success: false;
  error: { message: string };
}

async function parse<T>(res: Response): Promise<T> {
  const json: unknown = await res.json();
  if (
    typeof json === "object" &&
    json !== null &&
    "success" in json &&
    (json as { success: unknown }).success === true &&
    "data" in json
  ) {
    return (json as { data: T }).data;
  }
  const err = json as ApiErrorShape;
  throw new Error(err?.error?.message ?? `Request gagal (HTTP ${res.status})`);
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  return parse<T>(res);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parse<T>(res);
}

// ---------- Typed helpers ----------

export function getProducts(): Promise<Product[]> {
  return apiGet<Product[]>("/products");
}

export function getProduct(id: string): Promise<Product> {
  return apiGet<Product>(`/products/${id}`);
}

export function getCategories(): Promise<Category[]> {
  return apiGet<Category[]>("/categories");
}

export function getOrder(orderNumber: string): Promise<Order> {
  return apiGet<Order>(`/orders/${orderNumber}`);
}

export interface CreateOrderPayload {
  customerName: string;
  customerPhone: string;
  orderType: "TAKEAWAY" | "DINE_IN";
  items: { productId: string; quantity: number }[];
}

export function createOrder(payload: CreateOrderPayload): Promise<Order> {
  return apiPost<Order>("/orders", payload);
}

export function mockPay(orderNumber: string): Promise<{ status: string }> {
  return apiPost<{ status: string }>("/payments/mock/pay", { orderNumber });
}
