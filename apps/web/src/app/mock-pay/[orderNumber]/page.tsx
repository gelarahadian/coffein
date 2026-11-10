"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getOrder, mockPay } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import type { Order } from "@coffein/shared";

/**
 * Halaman simulasi pembayaran (hanya aktif saat PAYMENT_PROVIDER=mock).
 * Meniru hosted checkout Mayar: tampilkan total + tombol bayar.
 */
export default function MockPayPage() {
  const params = useParams<{ orderNumber: string }>();
  const router = useRouter();
  const orderNumber = params.orderNumber;

  const [order, setOrder] = useState<Order | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOrder(orderNumber)
      .then(setOrder)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Pesanan tidak ditemukan"),
      );
  }, [orderNumber]);

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      await mockPay(orderNumber);
      router.push(`/thanks/${orderNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pembayaran gagal");
      setPaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-lg border border-line bg-white p-8 text-center shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-coffee-500">
          Simulasi Pembayaran (mode mock)
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tabular-nums text-coffee-900">
          {order ? formatRupiah(order.totalAmount) : "…"}
        </h1>
        <p className="mt-1 text-sm text-coffee-700">Pesanan {orderNumber}</p>

        {error && (
          <p className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handlePay}
          disabled={paying || !order || order.status !== "PENDING"}
          className="mt-6 w-full rounded-md bg-accent py-3 font-semibold text-white transition duration-150 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {paying
            ? "Memproses…"
            : order && order.status !== "PENDING"
              ? "Sudah dibayar ✓"
              : "Bayar Sekarang (QRIS/e-wallet)"}
        </button>
        <p className="mt-4 text-xs text-coffee-500">
          Di produksi, halaman ini digantikan hosted checkout Mayar.
        </p>
      </div>
    </div>
  );
}
