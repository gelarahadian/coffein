import { Injectable } from "@nestjs/common";
import type { PaymentLink } from "@coffein/shared";
import type { PaymentOrderRef, PaymentProvider } from "./payment-provider.interface";

/**
 * Provider mock untuk development & e2e test tanpa API key Mayar.
 * paymentUrl menunjuk ke halaman mock-pay di web; pembayaran disimulasikan
 * lewat POST /payments/mock/pay.
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async createPaymentLink(order: PaymentOrderRef): Promise<PaymentLink> {
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    return {
      paymentUrl: `${appUrl}/mock-pay/${order.orderNumber}`,
      providerPaymentId: `mock_${order.id}`,
    };
  }
}
