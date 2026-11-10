"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { QtyStepper } from "@/components/qty-stepper";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function CartPage() {
  const { items, total, setQuantity, remove } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p aria-hidden="true" className="text-5xl">
          🛒
        </p>
        <h1 className="mt-4 font-display text-2xl font-bold text-coffee-900">
          Keranjang masih kosong
        </h1>
        <p className="mt-2 text-coffee-700">Yuk, pilih kopi favoritmu dulu.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-accent-hover"
        >
          Lihat Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 font-display text-3xl font-bold text-coffee-900">
        Keranjang
      </h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-4 rounded-lg border border-line bg-white p-4 shadow-card"
          >
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt={item.name}
                width={128}
                height={128}
                loading="lazy"
                decoding="async"
                className="h-16 w-16 rounded-md object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-16 w-16 items-center justify-center rounded-md bg-coffee-100 text-2xl"
              >
                ☕
              </div>
            )}
            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${item.productId}`}
                className="font-semibold text-coffee-900 hover:text-accent"
              >
                {item.name}
              </Link>
              <p className="text-sm tabular-nums text-coffee-700">
                {formatRupiah(item.price)} × {item.quantity}
              </p>
            </div>
            <QtyStepper
              value={item.quantity}
              onChange={(next) => setQuantity(item.productId, next)}
            />
            <button
              type="button"
              aria-label={`Hapus ${item.name}`}
              onClick={() => remove(item.productId)}
              className="text-coffee-500 transition hover:text-danger"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-line bg-white p-6 shadow-card">
        <div className="flex items-center justify-between text-lg">
          <span className="font-medium text-coffee-700">Total</span>
          <span className="font-display text-2xl font-bold tabular-nums text-coffee-900">
            {formatRupiah(total)}
          </span>
        </div>
        <Link
          href="/checkout"
          className="mt-4 block rounded-md bg-accent py-3 text-center font-semibold text-white transition duration-150 hover:bg-accent-hover"
        >
          Lanjut ke Checkout
        </Link>
      </div>
    </div>
  );
}
