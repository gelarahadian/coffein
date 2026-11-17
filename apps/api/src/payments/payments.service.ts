import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { PaymentEvent, PaymentLink, PaymentMethod } from "@coffein/shared";
import type { PaymentOrderRef, PaymentProvider } from "./payment-provider.interface";
import { MockPaymentProvider } from "./mock-payment.provider";
import { CashPaymentProvider } from "./cash-payment.provider";
import { MidtransPaymentProvider } from "./midtrans-payment.provider";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mockProvider: MockPaymentProvider,
    private readonly cashProvider: CashPaymentProvider,
    private readonly midtransProvider: MidtransPaymentProvider,
  ) {}

  get provider(): PaymentProvider {
    switch (process.env.PAYMENT_PROVIDER) {
      case "midtrans":
        return this.midtransProvider;
      case "cash":
        return this.cashProvider;
      default:
        return this.mockProvider;
    }
  }

  async createPaymentLink(order: PaymentOrderRef): Promise<PaymentLink> {
    if (order.paymentMethod === "CASH") {
      return this.cashProvider.createPaymentLink(order);
    }

    return this.provider.createPaymentLink(order);
  }

  /**
   * Menandai order PAID. Idempotent: hanya PENDING yang berubah.
   * orderRef = orderNumber kita.
   */
  async handlePaymentReceived(event: PaymentEvent) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: event.orderRef },
    });
    if (!order) {
      throw new NotFoundException(`Order ${event.orderRef} tidak ditemukan`);
    }
    if (order.status !== "PENDING") {
      // Sudah diproses — webhook bisa datang lebih dari sekali.
      return order;
    }
    return this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        providerPaymentId: event.providerPaymentId ?? order.providerPaymentId,
      },
      include: { items: true },
    });
  }

  /** Parse payload webhook Midtrans menjadi PaymentEvent. */
  parseMidtransWebhook(body: unknown): PaymentEvent {
    if (typeof body !== "object" || body === null) {
      throw new BadRequestException("Payload webhook tidak valid");
    }
    const data = body as Record<string, unknown>;

    const orderRef = data.order_id as string | undefined;
    if (!orderRef) {
      throw new BadRequestException("Field 'order_id' wajib ada");
    }

    const transactionStatus = data.transaction_status as string | undefined;
    if (!transactionStatus) {
      throw new BadRequestException("Field 'transaction_status' wajib ada");
    }

    // Hanya proses status yang berarti pembayaran berhasil
    const successStatuses = ["settlement", "capture"];
    const event = successStatuses.includes(transactionStatus)
      ? "payment.received"
      : `payment.${transactionStatus}`;

    const amount =
      typeof data.gross_amount === "string"
        ? Math.round(Number(data.gross_amount))
        : typeof data.gross_amount === "number"
          ? data.gross_amount
          : undefined;

    const providerPaymentId = data.transaction_id as string | undefined;

    return {
      event,
      orderRef,
      amount,
      providerPaymentId,
      raw: data,
    };
  }

  /** Verifikasi signature key Midtrans. */
  verifyMidtransSignature(body: Record<string, unknown>): boolean {
    const serverKey = process.env.MIDTRANS_SIGNATURE_SERVER_KEY;
    if (!serverKey) {
      this.logger.error(
        JSON.stringify({
          event: "midtrans.signature.configuration_missing",
          variable: "MIDTRANS_SIGNATURE_SERVER_KEY",
        }),
      );
      return false;
    }

    const orderId = body.order_id as string;
    const statusCode = body.status_code as string;
    const grossAmount = body.gross_amount as string;
    const signatureKey = body.signature_key as string;

    if (!orderId || !statusCode || !grossAmount || !signatureKey) {
      this.logger.warn(
        JSON.stringify({
          event: "midtrans.signature.invalid_payload",
          orderId: orderId || undefined,
          hasStatusCode: Boolean(statusCode),
          grossAmountType: typeof body.gross_amount,
          hasSignatureKey: Boolean(signatureKey),
        }),
      );
      return false;
    }

    const crypto = require("node:crypto");
    // Midtrans uses SHA-512 over the concatenated values, not HMAC-SHA512.
    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest("hex");

    const isValid = expectedSignature === signatureKey;
    if (!isValid) {
      this.logger.warn(
        JSON.stringify({
          event: "midtrans.signature.mismatch",
          orderId,
          statusCode,
          grossAmountType: typeof body.gross_amount,
          signatureLength: signatureKey.length,
        }),
      );
    }

    return isValid;
  }
}
