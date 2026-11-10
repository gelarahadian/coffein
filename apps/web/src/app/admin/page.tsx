"use client";

import { useCallback, useEffect, useState } from "react";
import { adminListOrders, adminUpdateStatus } from "@/lib/admin-api";
import { StatusBadge } from "@/components/status-badge";
import { formatRupiah } from "@/lib/format";
import type { Order, OrderStatus } from "@coffein/shared";

const FILTERS: { value: OrderStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "PENDING", label: "Menunggu Bayar" },
  { value: "PAID", label: "Dibayar" },
  { value: "PREPARING", label: "Disiapkan" },
  { value: "READY", label: "Siap" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

/** Aksi status berikutnya yang wajar per status saat ini. */
const NEXT_ACTIONS: Record<string, { status: OrderStatus; label: string }[]> = {
  PENDING: [
    { status: "PAID", label: "Tandai Dibayar" },
    { status: "CANCELLED", label: "Batalkan" },
  ],
  PAID: [
    { status: "PREPARING", label: "Mulai Siapkan" },
    { status: "CANCELLED", label: "Batalkan" },
  ],
  PREPARING: [{ status: "READY", label: "Siap Diambil" }],
  READY: [{ status: "COMPLETED", label: "Selesaikan" }],
  COMPLETED: [],
  CANCELLED: [],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await adminListOrders(
        filter === "ALL" ? undefined : filter,
      );
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pesanan");
    }
  }, [filter]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 10000);
    return () => clearInterval(timer);
  }, [load]);

  const handleStatus = async (id: string, status: OrderStatus) => {
    setBusyId(id);
    try {
      await adminUpdateStatus(id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-bold text-coffee-900">
        Pesanan
      </h1>

      {/* Chip filter — DESIGN.md §6.4 */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition duration-150 ${
              filter === f.value
                ? "bg-coffee-900 text-white"
                : "bg-coffee-100 text-coffee-700 hover:bg-coffee-900 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-lg border border-line bg-white p-5 shadow-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-lg font-bold text-coffee-900">
                  {order.orderNumber}
                </p>
                <p className="text-sm text-coffee-700">
                  {order.customerName} · {order.customerPhone} ·{" "}
                  {order.orderType === "TAKEAWAY" ? "Takeaway" : "Dine-in"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                <span className="font-semibold tabular-nums text-coffee-900">
                  {formatRupiah(order.totalAmount)}
                </span>
              </div>
            </div>

            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-coffee-700">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.productName} × {item.quantity}
                </li>
              ))}
            </ul>

            {(NEXT_ACTIONS[order.status]?.length ?? 0) > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {NEXT_ACTIONS[order.status].map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    disabled={busyId === order.id}
                    onClick={() => handleStatus(order.id, action.status)}
                    className={`rounded-md px-4 py-2 text-sm font-semibold transition duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
                      action.status === "CANCELLED"
                        ? "border border-danger text-danger hover:bg-danger-soft"
                        : "bg-accent text-white hover:bg-accent-hover"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {orders.length === 0 && !error && (
          <p className="py-10 text-center text-coffee-700">
            Tidak ada pesanan pada filter ini.
          </p>
        )}
      </div>
    </div>
  );
}
