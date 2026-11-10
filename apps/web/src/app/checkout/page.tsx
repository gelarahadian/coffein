"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { createOrder } from "@/lib/api";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

type OrderType = "TAKEAWAY" | "DINE_IN";

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("TAKEAWAY");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-coffee-900">
          Keranjang kosong
        </h1>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-accent-hover"
        >
          Lihat Menu
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const order = await createOrder({
        customerName,
        customerPhone,
        orderType,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });
      clear();
      if (order.paymentUrl) {
        // Bisa berupa hosted page Mayar (eksternal) atau mock-pay (internal).
        window.location.assign(order.paymentUrl);
      } else {
        router.push(`/order/${order.orderNumber}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout gagal");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-coffee-900">
        Checkout
      </h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-8 md:grid-cols-5"
      >
        <div className="space-y-4 md:col-span-3">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-coffee-900">
              Nama
            </label>
            <input
              id="name"
              required
              maxLength={100}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nama kamu"
              className="w-full rounded-md border border-line bg-surface px-4 py-2.5 text-coffee-900 outline-none transition focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-coffee-900">
              Nomor WhatsApp
            </label>
            <input
              id="phone"
              required
              minLength={8}
              maxLength={20}
              inputMode="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full rounded-md border border-line bg-surface px-4 py-2.5 text-coffee-900 outline-none transition focus:border-accent"
            />
          </div>
          <div>
            <span className="mb-1 block text-sm font-medium text-coffee-900">
              Tipe pesanan
            </span>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { value: "TAKEAWAY", label: "Takeaway" },
                  { value: "DINE_IN", label: "Dine-in" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setOrderType(opt.value)}
                  aria-pressed={orderType === opt.value}
                  className={`rounded-md border px-4 py-3 text-sm font-medium transition duration-150 ${
                    orderType === opt.value
                      ? "border-coffee-900 bg-coffee-900 text-white"
                      : "border-line bg-surface text-coffee-700 hover:border-coffee-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="rounded-lg border border-line bg-white p-5 shadow-card">
            <h2 className="mb-3 font-semibold text-coffee-900">Ringkasan</h2>
            <ul className="space-y-2 text-sm">
              {items.map((item) => (
                <li key={item.productId} className="flex justify-between gap-2">
                  <span className="text-coffee-700">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium tabular-nums text-coffee-900">
                    {formatRupiah(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-line pt-3 text-base font-semibold">
              <span className="text-coffee-700">Total</span>
              <span className="tabular-nums text-coffee-900">
                {formatRupiah(total)}
              </span>
            </div>
            {error && (
              <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="mt-4 w-full rounded-md bg-accent py-3 font-semibold text-white transition duration-150 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Memproses…" : "Pesan & Bayar"}
            </button>
            <p className="mt-3 text-center text-xs text-coffee-500">
              Pembayaran via Mayar: QRIS, e-wallet, VA, kartu.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
