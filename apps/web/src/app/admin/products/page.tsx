"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminCreateCategory,
  adminCreateProduct,
  adminDeleteCategory,
  adminDeleteProduct,
  adminListCategories,
  adminListProducts,
  adminUpdateProduct,
  type ProductPayload,
} from "@/lib/admin-api";
import { formatRupiah } from "@/lib/format";
import type { Category, Product } from "@coffein/shared";

interface FormState {
  id: string | null; // null = create baru
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  categoryId: string;
  isAvailable: boolean;
}

const EMPTY_FORM: FormState = {
  id: null,
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  categoryId: "",
  isAvailable: true,
};

const INPUT_CLASS =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-coffee-900 outline-none transition focus:border-accent";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([
        adminListProducts(),
        adminListCategories(),
      ]);
      setProducts(p);
      setCategories(c);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startEdit = (product: Product) => {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description,
      price: String(product.price),
      imageUrl: product.imageUrl ?? "",
      categoryId: product.categoryId ?? "",
      isAvailable: product.isAvailable,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const price = Number(form.price);
    if (!Number.isInteger(price) || price < 0) {
      setError("Harga harus bilangan bulat rupiah (mis. 22000)");
      setSaving(false);
      return;
    }
    const payload: ProductPayload = {
      name: form.name,
      description: form.description,
      price,
      imageUrl: form.imageUrl.trim() === "" ? null : form.imageUrl.trim(),
      categoryId: form.categoryId === "" ? null : form.categoryId,
      isAvailable: form.isAvailable,
    };
    try {
      if (form.id) {
        await adminUpdateProduct(form.id, payload);
      } else {
        await adminCreateProduct(payload);
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan produk");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus produk ini?")) return;
    try {
      await adminDeleteProduct(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus produk");
    }
  };

  const handleToggleAvailability = async (product: Product) => {
    try {
      await adminUpdateProduct(product.id, {
        isAvailable: !product.isAvailable,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah produk");
    }
  };

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (name === "") return;
    try {
      await adminCreateCategory(name);
      setNewCategory("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah kategori");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Hapus kategori ini? Produk tidak ikut terhapus.")) return;
    try {
      await adminDeleteCategory(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus kategori");
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-coffee-900">
          Produk
        </h1>
        <button
          type="button"
          onClick={() => {
            setForm(EMPTY_FORM);
            setShowForm((v) => !v);
          }}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition duration-150 hover:bg-accent-hover"
        >
          {showForm ? "Tutup Form" : "+ Produk Baru"}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSave}
          className="mb-6 grid grid-cols-1 gap-4 rounded-lg border border-line bg-white p-5 shadow-card sm:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-coffee-900">
              Nama
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-coffee-900">
              Harga (rupiah)
            </label>
            <input
              required
              inputMode="numeric"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="22000"
              className={INPUT_CLASS}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-coffee-900">
              Deskripsi
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-coffee-900">
              URL Foto (opsional)
            </label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://…"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-coffee-900">
              Kategori
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className={INPUT_CLASS}
            >
              <option value="">Tanpa kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-coffee-900">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) =>
                setForm({ ...form, isAvailable: e.target.checked })
              }
              className="h-4 w-4 accent-[#B8531C]"
            />
            Tersedia
          </label>
          <div className="flex items-end justify-end gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-accent px-6 py-2 text-sm font-semibold text-white transition duration-150 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Menyimpan…" : form.id ? "Simpan Perubahan" : "Tambah Produk"}
            </button>
          </div>
        </form>
      )}

      {/* Kategori */}
      <div className="mb-6 rounded-lg border border-line bg-white p-5 shadow-card">
        <h2 className="mb-3 font-semibold text-coffee-900">Kategori</h2>
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-2 rounded-full bg-coffee-100 px-3 py-1 text-sm text-coffee-700"
            >
              {c.name}
              <button
                type="button"
                aria-label={`Hapus kategori ${c.name}`}
                onClick={() => handleDeleteCategory(c.id)}
                className="text-coffee-500 transition hover:text-danger"
              >
                ✕
              </button>
            </span>
          ))}
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Kategori baru"
            className="w-40 rounded-full border border-line bg-surface px-3 py-1 text-sm text-coffee-900 outline-none transition focus:border-accent"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="rounded-full border border-line bg-white px-3 py-1 text-sm font-medium text-coffee-700 transition duration-150 hover:border-coffee-300"
          >
            Tambah
          </button>
        </div>
      </div>

      {/* Daftar produk */}
      <div className="space-y-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex flex-wrap items-center gap-4 rounded-lg border border-line bg-white p-4 shadow-card"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-coffee-900">
                {product.name}{" "}
                {product.categoryId && (
                  <span className="text-sm font-normal text-coffee-700">
                    ·{" "}
                    {categories.find((c) => c.id === product.categoryId)?.name ??
                      ""}
                  </span>
                )}
              </p>
              <p className="text-sm tabular-nums text-coffee-700">
                {formatRupiah(product.price)}
                {!product.isAvailable && (
                  <span className="ml-2 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
                    Habis
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleAvailability(product)}
              className="rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-coffee-700 transition duration-150 hover:border-coffee-300"
            >
              {product.isAvailable ? "Set Habis" : "Set Tersedia"}
            </button>
            <button
              type="button"
              onClick={() => startEdit(product)}
              className="rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-coffee-700 transition duration-150 hover:border-coffee-300"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => handleDelete(product.id)}
              className="rounded-md border border-danger px-3 py-2 text-sm font-medium text-danger transition duration-150 hover:bg-danger-soft"
            >
              Hapus
            </button>
          </div>
        ))}
        {products.length === 0 && !error && (
          <p className="py-10 text-center text-coffee-700">Belum ada produk.</p>
        )}
      </div>
    </div>
  );
}
