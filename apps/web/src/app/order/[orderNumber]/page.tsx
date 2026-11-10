"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getOrder } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";
import { formatRupiah } from "@/lib/format";
import type { Order } from "@coffein/shared";

// Stepper sesuai DESIGN.md §6.6: selesai = coffee-700, aktif = accent, berikutnya = coffee-300.
const STEPS: { status: string; label: string }[] = [
  { status: "PAID", label: "Dibayar" },
  { status: "PREPARING", label: "Disiapkan" },
  { status: "READY", label: "Siap" },
  { status: "COMPLETED", label: "Selesai" },
];

function stepIndex(status: string): number {
  return STEPS.findIndex((s) => s.status === status);
}

function Stepper({ status }: { status: string }) {
  const current = stepIndex(status);
  return (
    <ol className="mt-6 flex items-start" aria-label="Status pesanan">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.status} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <span
                className={`h-0.5 flex-1 ${i === 0 ? "invisible" : done || active ? "bg-coffee-700" : "bg-coffee-300"}`}
                aria-hidden="true"
              />
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-coffee-700 text-white"
                    : active
                      ? "bg-accent text-white"
                      : "border border-coffee-300 bg-white text-coffee-500"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`h-0.5 flex-1 ${i === STEPS.length - 1 ? "invisible" : i < current ? "bg-coffee-700" : "bg-coffee-300"}`}
                aria-hidden="true"
              />
            </div>
            <span
              className={`mt-1.5 text-center text-xs font-medium ${
                active ? "text-accent" : done ? "text-coffee-700" : "text-coffee-500"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function OrderStatusPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = params.orderNumber;

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      try {
        const data = await getOrder(orderNumber);
        if (!active) return;
        setOrder(data);
        setError(null);
        // Polling selagi belum selesai/dibatalkan
        if (
          data.status === "PENDING" ||
          data.status === "PAID" ||
          data.status === "PREPARING"
        ) {
          timer = setTimeout(load, 5000);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Gagal memuat pesanan");
      }
    };

    void load();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [orderNumber]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-lg text-coffee-700">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-coffee-700">
        Memuat pesanan…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div
        className="rounded-lg border border-line bg-white p-6 shadow-card"
        aria-live="polite"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-coffee-700">Nomor pesanan</p>
            <p className="font-display text-2xl font-bold text-coffee-900">
              {order.orderNumber}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {order.status === "PENDING" && (
          <p className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-coffee-700">
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-coffee-300 border-t-accent"
            />
            Menunggu pembayaran…
          </p>
        )}

        {order.status !== "PENDING" && order.status !== "CANCELLED" && (
          <Stepper status={order.status} />
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-coffee-700">Nama</p>
            <p className="font-medium text-coffee-900">{order.customerName}</p>
          </div>
          <div>
            <p className="text-coffee-700">Tipe</p>
            <p className="font-medium text-coffee-900">
              {order.orderType === "TAKEAWAY" ? "Takeaway" : "Dine-in"}
            </p>
          </div>
        </div>

        <ul className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span className="text-coffee-700">
                {item.productName} × {item.quantity}
              </span>
              <span className="font-medium tabular-nums text-coffee-900">
                {formatRupiah(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-line pt-3 font-semibold">
          <span className="text-coffee-700">Total</span>
          <span className="tabular-nums text-coffee-900">
            {formatRupiah(order.totalAmount)}
          </span>
        </div>

        {order.status === "PENDING" && order.paymentUrl && (
          <a
            href={order.paymentUrl}
            className="mt-6 block rounded-md bg-accent py-3 text-center font-semibold text-white transition duration-150 hover:bg-accent-hover"
          >
            Selesaikan Pembayaran
          </a>
        )}
        {order.status === "READY" && (
          <p className="mt-6 rounded-md bg-info-soft px-4 py-3 text-center text-sm font-medium text-info">
            Pesanan siap! Tunjukkan nomor pesanan ke barista. ☕
          </p>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-coffee-700">
        Halaman ini diperbarui otomatis.{" "}
        <Link href="/" className="text-accent underline hover:text-accent-hover">
          Kembali ke menu
        </Link>
      </p>
    </div>
  );
}
