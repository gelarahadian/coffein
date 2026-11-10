"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getOrder } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import type { Order } from "@coffein/shared";

export default function ThanksPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = params.orderNumber;
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    getOrder(orderNumber)
      .then(setOrder)
      .catch(() => setOrder(null));
  }, [orderNumber]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p aria-hidden="true" className="text-6xl">
        🎉
      </p>
      <h1 className="mt-4 font-display text-3xl font-bold text-coffee-900">
        Terima kasih!
      </h1>
      <p className="mt-2 text-coffee-700">
        Pesanan{" "}
        <span className="font-semibold text-coffee-900">{orderNumber}</span>{" "}
        sudah kami terima.
      </p>

      {order && (
        <div className="mt-8 rounded-lg border border-line bg-white p-6 text-left shadow-card">
          <ul className="space-y-2 text-sm">
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
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href={`/order/${orderNumber}`}
          className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-accent-hover"
        >
          Lacak Status Pesanan
        </Link>
        <Link
          href="/"
          className="rounded-md border border-line bg-white px-6 py-3 text-sm font-semibold text-coffee-700 transition duration-150 hover:border-coffee-300"
        >
          Kembali ke Menu
        </Link>
      </div>
    </div>
  );
}
