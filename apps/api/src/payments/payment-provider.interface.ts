import type { PaymentLink } from "@coffein/shared";

/** Order minimal yang dibutuhkan provider untuk membuat payment link. */
export interface PaymentOrderRef {
  id: string;
  orderNumber: string;
  totalAmount: number;
}

/** Abstraksi payment provider: MockProvider (dev) & MayarProvider (produksi). */
export interface PaymentProvider {
  readonly name: string;
  createPaymentLink(order: PaymentOrderRef): Promise<PaymentLink>;
}
