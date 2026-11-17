import { z } from "zod";

// ---------- Enums ----------

export const OrderStatusSchema = z.enum([
  "PENDING",
  "PAID",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderTypeSchema = z.enum(["TAKEAWAY", "DINE_IN"]);
export type OrderType = z.infer<typeof OrderTypeSchema>;

// ---------- Payment Method ----------

export const PaymentMethodSchema = z.enum(["MIDTRANS", "CASH"]);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

// ---------- Category ----------

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1),
});
export type Category = z.infer<typeof CategorySchema>;

// ---------- Product ----------

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  /** Harga dalam rupiah (integer, tanpa desimal). */
  price: z.number().int().nonnegative(),
  imageUrl: z.string().nullable(),
  categoryId: z.string().nullable(),
  isAvailable: z.boolean(),
  createdAt: z.string(),
});
export type Product = z.infer<typeof ProductSchema>;

// ---------- Order ----------

export const OrderItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  productId: z.string(),
  /** Snapshot nama & harga produk saat order dibuat. */
  productName: z.string().min(1),
  price: z.number().int().nonnegative(),
  quantity: z.number().int().min(1),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  orderType: OrderTypeSchema,
  status: OrderStatusSchema,
  paymentMethod: PaymentMethodSchema,
  items: z.array(OrderItemSchema),
  /** Total dalam rupiah (integer). */
  totalAmount: z.number().int().nonnegative(),
  paymentUrl: z.string().nullable(),
  createdAt: z.string(),
});
export type Order = z.infer<typeof OrderSchema>;

// ---------- DTO: create order (guest checkout) ----------

export const CreateOrderItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
});

export const CreateOrderInputSchema = z.object({
  customerName: z.string().min(1).max(100),
  /** Nomor WhatsApp, format bebas tapi wajib diisi. */
  customerPhone: z.string().min(8).max(20),
  orderType: OrderTypeSchema,
  paymentMethod: PaymentMethodSchema.default("MIDTRANS"),
  items: z.array(CreateOrderItemInputSchema).min(1).max(50),
});
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;

// ---------- DTO: admin auth ----------

export const AdminLoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});
export type AdminLoginInput = z.infer<typeof AdminLoginInputSchema>;

export const AdminUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
});
export type AdminUser = z.infer<typeof AdminUserSchema>;

// ---------- DTO: product create/update (admin) ----------

export const CreateProductInputSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(2000).default(""),
  price: z.number().int().nonnegative(),
  imageUrl: z.string().url().nullable().default(null),
  categoryId: z.string().nullable().default(null),
  isAvailable: z.boolean().default(true),
});
export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;

export const UpdateProductInputSchema = CreateProductInputSchema.partial();
export type UpdateProductInput = z.infer<typeof UpdateProductInputSchema>;

// ---------- Payment ----------

/** Event webhook dari payment provider (Mayar / mock). */
export const PaymentEventSchema = z.object({
  event: z.string().min(1),
  /** Referensi order kita (orderNumber), dikirim via custom_field / notes. */
  orderRef: z.string().min(1),
  amount: z.number().int().nonnegative().optional(),
  providerPaymentId: z.string().optional(),
  /** Payload mentah untuk audit. */
  raw: z.record(z.string(), z.unknown()),
});
export type PaymentEvent = z.infer<typeof PaymentEventSchema>;

/** Hasil pembuatan payment link oleh provider. */
export const PaymentLinkSchema = z.object({
  paymentUrl: z.string().url(),
  providerPaymentId: z.string(),
});
export type PaymentLink = z.infer<typeof PaymentLinkSchema>;

// ---------- API response envelope ----------

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: { message: string; code?: string };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
