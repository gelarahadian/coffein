import { getProduct } from "@/lib/api";
import { AddToCart } from "./add-to-cart";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const product = await getProduct(id);
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                width={800}
                height={800}
                className={`aspect-square w-full rounded-lg object-cover ${
                  product.isAvailable ? "" : "grayscale"
                }`}
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex aspect-square w-full items-center justify-center rounded-lg bg-surface text-8xl"
              >
                ☕
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-3xl font-bold text-coffee-900">
              {product.name}
            </h1>
            <p className="text-xl font-semibold tabular-nums text-coffee-900">
              {formatRupiah(product.price)}
            </p>
            <p className="text-coffee-700">{product.description}</p>
            <div className="mt-2">
              {product.isAvailable ? (
                <AddToCart
                  product={{
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    imageUrl: product.imageUrl,
                  }}
                />
              ) : (
                <p className="rounded-md bg-surface px-4 py-3 text-sm font-medium text-coffee-700">
                  Produk sedang tidak tersedia.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-lg text-coffee-700">Produk tidak ditemukan.</p>
      </div>
    );
  }
}
