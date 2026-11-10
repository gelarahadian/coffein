import { beforeEach, describe, expect, it } from "vitest";
import {
  addToCart,
  clearCart,
  removeFromCart,
  setQuantity,
  type CartItem,
} from "./cart-store";

const KOPI: Omit<CartItem, "quantity"> = {
  productId: "p1",
  name: "Kopi Susu Gula Aren",
  price: 22000,
  imageUrl: null,
};
const MATCHA: Omit<CartItem, "quantity"> = {
  productId: "p2",
  name: "Matcha Latte",
  price: 26000,
  imageUrl: null,
};

function pasangStorage(): void {
  const map = new Map<string, string>();
  (globalThis as Record<string, unknown>).window = {
    localStorage: {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
    },
  };
}

function tersimpan(): CartItem[] {
  const raw = (globalThis as {
    window: { localStorage: { getItem(k: string): string | null } };
  }).window.localStorage.getItem("coffein-cart");
  return JSON.parse(raw ?? "[]") as CartItem[];
}

beforeEach(() => {
  pasangStorage();
  clearCart();
});

describe("cart-store (guard: mutasi keranjang)", () => {
  it("addToCart menambah item baru", () => {
    addToCart(KOPI);
    expect(tersimpan()).toEqual([{ ...KOPI, quantity: 1 }]);
  });

  it("addToCart pada produk yang sama menambah quantity", () => {
    addToCart(KOPI);
    addToCart(KOPI, 2);
    const isi = tersimpan();
    expect(isi).toHaveLength(1);
    expect(isi[0].quantity).toBe(3);
  });

  it("setQuantity mengubah jumlah; <=0 menghapus item", () => {
    addToCart(KOPI);
    addToCart(MATCHA);
    setQuantity("p1", 5);
    expect(tersimpan().find((i) => i.productId === "p1")?.quantity).toBe(5);
    setQuantity("p1", 0);
    expect(tersimpan().map((i) => i.productId)).toEqual(["p2"]);
  });

  it("removeFromCart menghapus tepat satu produk", () => {
    addToCart(KOPI);
    addToCart(MATCHA);
    removeFromCart("p2");
    expect(tersimpan().map((i) => i.productId)).toEqual(["p1"]);
  });

  it("clearCart mengosongkan keranjang", () => {
    addToCart(KOPI);
    clearCart();
    expect(tersimpan()).toEqual([]);
  });
});
