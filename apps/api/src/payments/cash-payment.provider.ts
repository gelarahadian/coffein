import { Injectable } from "@nestjs/common";
import type { PaymentLink } from "@coffein/shared";
import type { PaymentOrderRef, PaymentProvider } from "./payment-provider.interface";

/**
 * Provider pembayaran Cash (bayar di tempat).
 * Tidak ada redirect ke payment gateway eksternal.
 * paymentUrl mengarah ke halaman status order; admin akan konfirmasi manual.
 */
@Injectable()
export class CashPaymentProvider implements PaymentProvider {
  readonly name = "cash";

  async createPaymentLink(order: PaymentOrderRef): Promise<PaymentLink> {
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    return {
      paymentUrl: `${appUrl}/order/${order.orderNumber}`,
      providerPaymentId: `cash_${order.id}`,
    };
  }
}