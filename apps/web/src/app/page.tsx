import { getCategories, getProducts } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { CartBar } from "@/components/cart-bar";
import type { Product } from "@coffein/shared";

export const dynamic = "force-dynamic";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export default async function MenuPage() {
  let sections: { name: string; products: Product[] }[] = [];
  let error: string | null = null;

  try {
    const [products, categories] = await Promise.all([
      getProducts(),
      getCategories(),
    ]);

    const byCategory = new Map<string, Product[]>();
    for (const product of products) {
      const key = product.categoryId ?? "lainnya";
      const arr = byCategory.get(key) ?? [];
      arr.push(product);
      byCategory.set(key, arr);
    }

    sections = [];
    for (const category of categories) {
      const items = byCategory.get(category.id);
      if (items && items.length > 0) {
        sections.push({ name: category.name, products: items });
      }
    }
    const rest = byCategory.get("lainnya");
    if (rest && rest.length > 0) {
      sections.push({ name: "Lainnya", products: rest });
    }
  } catch (err) {
    error = err instanceof Error ? err.message : "Gagal memuat menu";
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <p className="text-lg text-coffee-700">Gagal memuat menu: {error}</p>
        <p className="mt-2 text-sm text-coffee-500">
          Pastikan API berjalan di localhost:4000.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-10 md:pb-10">
      <section className="mb-8 text-center">
        <h1 className="font-display text-4xl font-bold text-coffee-900 sm:text-5xl">
          Menu Coffein
        </h1>
        <p className="mt-3 text-coffee-700">
          Pilih favoritmu, tambah ke keranjang, bayar tanpa antre.
        </p>
      </section>

      {sections.length > 1 && (
        <nav aria-label="Kategori menu" className="mb-10 flex flex-wrap justify-center gap-2">
          {sections.map((section) => (
            <a
              key={section.name}
              href={`#${slugify(section.name)}`}
              className="rounded-full bg-coffee-100 px-4 py-2 text-sm font-medium text-coffee-700 transition duration-150 hover:bg-coffee-900 hover:text-white"
            >
              {section.name}
            </a>
          ))}
        </nav>
      )}

      <div className="space-y-12">
        {sections.map((section) => (
          <section
            key={section.name}
            id={slugify(section.name)}
            className="scroll-mt-20"
          >
            <h2 className="mb-4 font-display text-2xl font-semibold text-coffee-900">
              {section.name}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {section.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ))}
        {sections.length === 0 && (
          <p className="py-10 text-center text-coffee-700">
            Belum ada produk. Tambahkan lewat panel admin.
          </p>
        )}
      </div>

      <CartBar />
    </div>
  );
}
