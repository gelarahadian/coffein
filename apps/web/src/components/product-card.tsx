"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@coffein/shared";
import { useCart } from "@/lib/cart-store";
import { formatRupiah } from "@/lib/format";

// Kartu produk sesuai DESIGN.md §6.2: putih, border line, foto 4:3,
// harga coffee-900 tabular-nums, tombol Tambah accent di kanan bawah.
export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    add({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-white shadow-card">
      <Link href={`/product/${product.id}`} className="block">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            width={640}
            height={480}
            loading="lazy"
            decoding="async"
            className={`h-40 w-full object-cover ${
              product.isAvailable ? "" : "grayscale"
            }`}
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-40 w-full items-center justify-center bg-surface text-5xl"
          >
            ☕
          </div>
        )}
      </Link>
      {product.isAvailable ? null : (
        <p className="mx-4 mt-3 self-start rounded-full bg-danger-soft px-3 py-0.5 text-xs font-semibold text-danger">
          Habis
        </p>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link
          href={`/product/${product.id}`}
          className="font-display text-lg font-semibold text-coffee-900 hover:text-accent"
        >
          {product.name}
        </Link>
        <p className="line-clamp-2 flex-1 text-sm text-coffee-700">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-semibold tabular-nums text-coffee-900">
            {formatRupiah(product.price)}
          </span>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!product.isAvailable}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition duration-150 hover:bg-accent-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {!product.isAvailable ? "Habis" : added ? "✓ Ditambah" : "Tambah"}
          </button>
        </div>
      </div>
    </div>
  );
}
