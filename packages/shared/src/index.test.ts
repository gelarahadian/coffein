import { describe, expect, it } from "vitest";
import {
  AdminLoginInputSchema,
  CreateOrderInputSchema,
  OrderSchema,
  OrderStatusSchema,
  ProductSchema,
} from "./index";

describe("OrderStatusSchema", () => {
  it("menerima status valid", () => {
    expect(OrderStatusSchema.parse("PENDING")).toBe("PENDING");
    expect(OrderStatusSchema.parse("PAID")).toBe("PAID");
  });

  it("menolak status tidak valid", () => {
    expect(() => OrderStatusSchema.parse("SHIPPED")).toThrow();
  });
});

describe("CreateOrderInputSchema", () => {
  const validInput = {
    customerName: "Budi",
    customerPhone: "081234567890",
    orderType: "TAKEAWAY",
    items: [{ productId: "p1", quantity: 2 }],
  };

  it("menerima input valid", () => {
    expect(CreateOrderInputSchema.parse(validInput)).toMatchObject(validInput);
  });

  it("menolak keranjang kosong", () => {
    expect(() =>
      CreateOrderInputSchema.parse({ ...validInput, items: [] }),
    ).toThrow();
  });

  it("menolak quantity 0", () => {
    expect(() =>
      CreateOrderInputSchema.parse({
        ...validInput,
        items: [{ productId: "p1", quantity: 0 }],
      }),
    ).toThrow();
  });

  it("menolak nomor telepon terlalu pendek", () => {
    expect(() =>
      CreateOrderInputSchema.parse({ ...validInput, customerPhone: "123" }),
    ).toThrow();
  });
});

describe("ProductSchema", () => {
  it("menerima produk valid", () => {
    const product = {
      id: "p1",
      name: "Kopi Susu",
      description: "Kopi susu gula aren",
      price: 22000,
      imageUrl: null,
      categoryId: null,
      isAvailable: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    expect(ProductSchema.parse(product)).toMatchObject(product);
  });

  it("menolak harga desimal", () => {
    expect(() =>
      ProductSchema.parse({
        id: "p1",
        name: "Kopi",
        description: "",
        price: 1500.5,
        imageUrl: null,
        categoryId: null,
        isAvailable: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toThrow();
  });
});

describe("OrderSchema", () => {
  it("menerima order valid", () => {
    const order = {
      id: "o1",
      orderNumber: "CF-0001",
      customerName: "Budi",
      customerPhone: "081234567890",
      orderType: "DINE_IN",
      status: "PENDING",
      items: [
        {
          id: "i1",
          orderId: "o1",
          productId: "p1",
          productName: "Kopi Susu",
          price: 22000,
          quantity: 1,
        },
      ],
      totalAmount: 22000,
      paymentUrl: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    expect(OrderSchema.parse(order)).toMatchObject(order);
  });
});

describe("AdminLoginInputSchema", () => {
  it("menerima email valid", () => {
    expect(
      AdminLoginInputSchema.parse({
        email: "admin@coffein.id",
        password: "rahasia123",
      }),
    ).toBeTruthy();
  });

  it("menolak email tidak valid", () => {
    expect(() =>
      AdminLoginInputSchema.parse({ email: "bukan-email", password: "rahasia123" }),
    ).toThrow();
  });

  it("menolak password pendek", () => {
    expect(() =>
      AdminLoginInputSchema.parse({ email: "admin@coffein.id", password: "123" }),
    ).toThrow();
  });
});
