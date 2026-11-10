"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { formatRupiah } from "@/lib/format";

// Bar keranjang melayang di bawah (mobile) — DESIGN.md §6.3.
// Total + tombol Checkout accent; hanya tampil saat keranjang berisi.
export function CartBar() {
  const { count, total } = useCart();
  if (count === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 p-3 shadow-card backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div>
          <p className="text-xs text-coffee-700">
            {count} item di keranjang
          </p>
          <p className="font-semibold tabular-nums text-coffee-900">
            {formatRupiah(total)}
          </p>
        </div>
        <Link
          href="/checkout"
          className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-accent-hover"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
