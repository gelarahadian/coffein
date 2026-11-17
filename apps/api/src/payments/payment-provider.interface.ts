import type { PaymentLink, PaymentMethod } from "@coffein/shared";

/** Order minimal yang dibutuhkan provider untuk membuat payment link. */
export interface PaymentOrderRef {
  id: string;
  orderNumber: string;
  totalAmount: number;
  paymentMethod?: PaymentMethod;
}

/** Abstraksi payment provider: MockProvider (dev), MidtransProvider, CashProvider. */
export interface PaymentProvider {
  readonly name: string;
  createPaymentLink(order: PaymentOrderRef): Promise<PaymentLink>;
}
