"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { QtyStepper } from "@/components/qty-stepper";

interface ProductRef {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
}

export function AddToCart({ product }: { product: ProductRef }) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    add(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <QtyStepper value={quantity} onChange={setQuantity} />
      <button
        type="button"
        onClick={handleAdd}
        className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-accent-hover active:scale-95"
      >
        {added ? "✓ Masuk keranjang" : "Tambah ke Keranjang"}
      </button>
      {added && (
        <Link
          href="/cart"
          className="text-sm font-medium text-accent underline"
        >
          Lihat keranjang
        </Link>
      )}
    </div>
  );
}
