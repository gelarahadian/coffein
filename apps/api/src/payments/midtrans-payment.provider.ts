import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import type { PaymentLink } from "@coffein/shared";
import type { PaymentOrderRef, PaymentProvider } from "./payment-provider.interface";
import { MockPaymentProvider } from "./mock-payment.provider";

interface MidtransSnapResponse {
  redirect_url?: string;
  token?: string;
  error_messages?: string[];
}

/**
 * Adapter Midtrans Snap API.
 * Docs: https://docs.midtrans.com/reference/snap-api
 * POST /v1/transactions → { redirect_url, token }
 * 
 * Catatan: Endpoint Midtrans menggunakan /snap/v1/transactions (bukan /v1/aja).
 * Sandbox: https://app.sandbox.midtrans.com/snap/v1/transactions
 * Production: https://app.midtrans.com/snap/v1/transactions
 * 
 * Jika MIDTRANS_SERVER_KEY tidak diinisialisasi, provider akan
 * secara otomatis menggunakan MockPaymentProvider untuk development/testing.
 * 
 * Jika server key diisi tetapi response JSON-nya invalid,
 * error akan dilempar dengan pesan yang jelas (bukan JSON parse error).
 */
@Injectable()
export class MidtransPaymentProvider implements PaymentProvider {
  readonly name = "midtrans";

  async createPaymentLink(order: PaymentOrderRef): Promise<PaymentLink> {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    // Jika server key belum diatur, gunakan MockProvider untuk testing
    if (!serverKey) {
      const mock = new MockPaymentProvider();
      return mock.createPaymentLink(order);
    }

    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    // ✅ PERBAIKAN: Gunakan endpoint /snap/v1/transactions sesuai dokumentasi Midtrans
    const baseUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";

    const auth = Buffer.from(`${serverKey}:`).toString("base64");

    const payload = {
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: order.totalAmount,
      },
      callbacks: {
        finish: `${appUrl}/order/${order.orderNumber}`,
        error: `${appUrl}/order/${order.orderNumber}`,
        pending: `${appUrl}/order/${order.orderNumber}`,
      },
    };

    let res: Response;
    try {
      res = await fetch(`${baseUrl}`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // Jaringan gagal total
      throw new HttpException(
        "Gagal menghubungi Midtrans (jaringan/Tidak bisa terkoneksi)",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // Parsing JSON dengan try-catch untuk menangkap error "Unexpected end of JSON input"
    let json: unknown;
    try {
      json = (await res.json()) as MidtransSnapResponse;
    } catch (parseError) {
      // Ini yang menyebabkan error "Unexpected end of JSON input" sebelumnya
      throw new HttpException(
        `Midtrans merespons tetapi body-nya bukan format JSON yang valid (HTTP ${res.status}). 
        Kemungkinan: Server Key salah, sandbox sedang error, atau API Midtrans sedang down.
        Periksa kembali konfigurasi MIDTRANS_SERVER_KEY dan MIDTRANS_IS_PRODUCTION di .env.`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // Type casting setelah parse sukses
    const jsonResp = json as MidtransSnapResponse;

    if (!res.ok) {
      const msg = jsonResp.error_messages?.join(", ") ?? `HTTP ${res.status}`;
      throw new HttpException(
        `Midtrans menolak request: ${msg}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const redirectUrl = jsonResp.redirect_url;
    const token = jsonResp.token;

    if (!redirectUrl && !token) {
      throw new HttpException(
        "Respons Midtrans tidak dikenali (tidak ada redirect_url/token di body JSON)",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // Midtrans Snap: gunakan redirect_url jika ada, fallback ke token URL
    const paymentUrl = redirectUrl ?? `https://app.sandbox.midtrans.com/snap/v2/vtweb/${token}`;

    return {
      paymentUrl,
      providerPaymentId: order.orderNumber,
    };
  }
}