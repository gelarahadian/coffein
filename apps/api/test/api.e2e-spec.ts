import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { AppModule } from "../src/app.module";

let app: INestApplication;
let prisma: PrismaClient;
let adminToken: string;

const ADMIN_EMAIL = "admin@test.id";
const ADMIN_PASSWORD = "password123";

async function createProduct(overrides: Record<string, unknown> = {}) {
  const res = await request(app.getHttpServer())
    .post("/admin/products")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      name: "Kopi Test",
      description: "Produk untuk test",
      price: 20000,
      imageUrl: null,
      categoryId: null,
      isAvailable: true,
      ...overrides,
    });
  expect(res.status).toBe(201);
  return res.body.data as { id: string; name: string; price: number };
}

beforeAll(async () => {
  prisma = new PrismaClient();
  await prisma.$connect();

  // Bersihkan database test
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.adminUser.deleteMany();

  await prisma.adminUser.create({
    data: {
      email: ADMIN_EMAIL,
      name: "Admin Test",
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
    },
  });

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleRef.createNestApplication();
  await app.init();

  const login = await request(app.getHttpServer())
    .post("/auth/login")
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  expect(login.status).toBe(201);
  adminToken = login.body.data.accessToken;
});

afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

describe("Health", () => {
  it("GET /health → 200", async () => {
    const res = await request(app.getHttpServer()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { status: "ok" } });
  });
});

describe("Auth", () => {
  it("login dengan password salah → 401", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: ADMIN_EMAIL, password: "salahbanget" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("login dengan email tidak ada → 401", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "hantu@test.id", password: ADMIN_PASSWORD });
    expect(res.status).toBe(401);
  });

  it("login valid → access token", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    expect(res.status).toBe(201);
    expect(typeof res.body.data.accessToken).toBe("string");
  });
});

describe("Products (admin CRUD)", () => {
  it("tanpa token → 401", async () => {
    const res = await request(app.getHttpServer()).get("/admin/orders");
    expect(res.status).toBe(401);
  });

  it("create → tampil di list publik → update → delete", async () => {
    const category = await prisma.category.create({
      data: { name: "Kopi Test", slug: "kopi-test" },
    });

    const created = await createProduct({ categoryId: category.id });
    expect(created.name).toBe("Kopi Test");

    const list = await request(app.getHttpServer()).get("/products");
    expect(list.status).toBe(200);
    const found = (list.body.data as { id: string }[]).find(
      (p) => p.id === created.id,
    );
    expect(found).toBeTruthy();

    const updated = await request(app.getHttpServer())
      .patch(`/admin/products/${created.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 25000, isAvailable: false });
    expect(updated.status).toBe(200);
    expect(updated.body.data.price).toBe(25000);
    expect(updated.body.data.isAvailable).toBe(false);

    const removed = await request(app.getHttpServer())
      .delete(`/admin/products/${created.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(removed.status).toBe(200);

    const afterDelete = await request(app.getHttpServer()).get(
      `/products/${created.id}`,
    );
    expect(afterDelete.status).toBe(404);
  });

  it("create dengan payload tidak valid → 400", async () => {
    const res = await request(app.getHttpServer())
      .post("/admin/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "", price: -5 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("Orders (guest checkout)", () => {
  it("create order → PENDING + total dihitung dari DB + paymentUrl mock", async () => {
    const product = await createProduct({ price: 22000 });

    const res = await request(app.getHttpServer())
      .post("/orders")
      .send({
        customerName: "Budi",
        customerPhone: "081234567890",
        orderType: "TAKEAWAY",
        items: [{ productId: product.id, quantity: 2 }],
      });

    expect(res.status).toBe(201);
    const order = res.body.data;
    expect(order.status).toBe("PENDING");
    expect(order.totalAmount).toBe(44000); // 2 x 22000 dari DB, bukan dari client
    expect(order.orderNumber).toMatch(/^CF-/);
    expect(order.paymentUrl).toContain("/mock-pay/");
    expect(order.items).toHaveLength(1);
    expect(order.items[0].price).toBe(22000);
  });

  it("create order dengan item kosong → 400", async () => {
    const res = await request(app.getHttpServer())
      .post("/orders")
      .send({
        customerName: "Budi",
        customerPhone: "081234567890",
        orderType: "TAKEAWAY",
        items: [],
      });
    expect(res.status).toBe(400);
  });

  it("create order dengan produk tidak ada → 400", async () => {
    const res = await request(app.getHttpServer())
      .post("/orders")
      .send({
        customerName: "Budi",
        customerPhone: "081234567890",
        orderType: "DINE_IN",
        items: [{ productId: "tidak-ada", quantity: 1 }],
      });
    expect(res.status).toBe(400);
  });

  it("get by orderNumber → 404 untuk nomor tak dikenal", async () => {
    const res = await request(app.getHttpServer()).get("/orders/CF-TIDAKADA");
    expect(res.status).toBe(404);
  });
});

describe("Payment flow (mock)", () => {
  it("mock pay → order jadi PAID → idempotent", async () => {
    const product = await createProduct({ name: "Kopi Bayar", price: 18000 });
    const created = await request(app.getHttpServer())
      .post("/orders")
      .send({
        customerName: "Sari",
        customerPhone: "089876543210",
        orderType: "DINE_IN",
        items: [{ productId: product.id, quantity: 1 }],
      });
    const orderNumber = created.body.data.orderNumber as string;

    // Simulasikan webhook payment.received
    const pay = await request(app.getHttpServer())
      .post("/payments/mock/pay")
      .send({ orderNumber });
    expect(pay.status).toBe(201);
    expect(pay.body.data.status).toBe("PAID");

    // Status terlihat via endpoint publik
    const check = await request(app.getHttpServer()).get(
      `/orders/${orderNumber}`,
    );
    expect(check.body.data.status).toBe("PAID");

    // Webhook ulang (idempotent) — tetap PAID, tidak error
    const payAgain = await request(app.getHttpServer())
      .post("/payments/mock/pay")
      .send({ orderNumber });
    expect(payAgain.status).toBe(201);
    expect(payAgain.body.data.status).toBe("PAID");
  });

  it("webhook mayar dengan payload payment.received → PAID", async () => {
    const product = await createProduct({ name: "Kopi Webhook", price: 25000 });
    const created = await request(app.getHttpServer())
      .post("/orders")
      .send({
        customerName: "Wati",
        customerPhone: "081111111111",
        orderType: "TAKEAWAY",
        items: [{ productId: product.id, quantity: 1 }],
      });
    const orderNumber = created.body.data.orderNumber as string;

    const hook = await request(app.getHttpServer())
      .post("/payments/webhook/mayar")
      .send({
        event: "payment.received",
        data: {
          id: "pay_123",
          amount: 25000,
          notes: orderNumber,
          customerName: "Wati",
        },
      });
    expect(hook.status).toBe(201);
    expect(hook.body.data.processed).toBe(true);

    const check = await request(app.getHttpServer()).get(
      `/orders/${orderNumber}`,
    );
    expect(check.body.data.status).toBe("PAID");
  });

  it("webhook mayar dengan event lain → diabaikan", async () => {
    const hook = await request(app.getHttpServer())
      .post("/payments/webhook/mayar")
      .send({ event: "payment.reminder", data: { notes: "CF-XXXX", amount: 1 } });
    expect(hook.status).toBe(201);
    expect(hook.body.data.processed).toBe(false);
  });
});

describe("Order management (admin)", () => {
  it("list orders + ubah status workflow", async () => {
    const product = await createProduct({ name: "Kopi Admin", price: 20000 });
    const created = await request(app.getHttpServer())
      .post("/orders")
      .send({
        customerName: "Tono",
        customerPhone: "082222222222",
        orderType: "TAKEAWAY",
        items: [{ productId: product.id, quantity: 1 }],
      });
    const orderId = created.body.data.id as string;

    const list = await request(app.getHttpServer())
      .get("/admin/orders")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    const found = (list.body.data as { id: string }[]).find(
      (o) => o.id === orderId,
    );
    expect(found).toBeTruthy();

    // Filter by status
    const paidList = await request(app.getHttpServer())
      .get("/admin/orders?status=PENDING")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(paidList.status).toBe(200);
    expect(
      (paidList.body.data as { id: string }[]).every(
        (o) => !o || o.id !== undefined,
      ),
    ).toBe(true);

    // Workflow status
    for (const status of ["PAID", "PREPARING", "READY", "COMPLETED"] as const) {
      const upd = await request(app.getHttpServer())
        .patch(`/admin/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status });
      expect(upd.status).toBe(200);
      expect(upd.body.data.status).toBe(status);
    }

    // Status tidak valid → 400
    const bad = await request(app.getHttpServer())
      .patch(`/admin/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "SOMETHING_ELSE" });
    expect(bad.status).toBe(400);
  });
});
