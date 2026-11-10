import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { PaymentLink } from "@coffein/shared";
import type { PaymentOrderRef, PaymentProvider } from "./payment-provider.interface";

interface MayarCreateLinkResponse {
  id?: string;
  link?: string;
  data?: { id?: string; link?: string };
}

/**
 * Adapter Mayar Headless API V2.
 * Docs: https://docs.mayar.id/api-reference-v2/genericlink/createpaymentlink
 * POST /hl/v2/products/payment-link/create → { id, link }
 */
@Injectable()
export class MayarPaymentProvider implements PaymentProvider {
  readonly name = "mayar";

  async createPaymentLink(order: PaymentOrderRef): Promise<PaymentLink> {
    const apiKey = process.env.MAYAR_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        "MAYAR_API_KEY belum dikonfigurasi",
      );
    }
    const baseUrl = process.env.MAYAR_BASE_URL ?? "https://api.mayar.id";
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/hl/v2/products/payment-link/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: order.orderNumber,
          amount: order.totalAmount,
          description: `Pembayaran pesanan ${order.orderNumber} - Coffein`,
          redirectUrl: `${appUrl}/order/${order.orderNumber}`,
          notes: order.orderNumber,
        }),
      });
    } catch {
      throw new ServiceUnavailableException("Gagal menghubungi Mayar");
    }

    if (!res.ok) {
      throw new ServiceUnavailableException(
        `Mayar menolak request (HTTP ${res.status})`,
      );
    }

    const json = (await res.json()) as MayarCreateLinkResponse;
    const link = json.data?.link ?? json.link;
    const id = json.data?.id ?? json.id;
    if (!link || !id) {
      throw new ServiceUnavailableException("Respons Mayar tidak dikenali");
    }
    return { paymentUrl: link, providerPaymentId: id };
  }
}
