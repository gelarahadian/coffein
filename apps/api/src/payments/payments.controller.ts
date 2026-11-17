import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  UsePipes,
} from "@nestjs/common";
import { z } from "zod";
import { PaymentsService } from "./payments.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

const MockPaySchema = z.object({
  orderNumber: z.string().min(1),
});

const MidtransWebhookSchema = z.object({
  order_id: z.string().min(1),
  transaction_status: z.string().min(1),
  gross_amount: z.union([z.string(), z.number()]),
  transaction_id: z.string().optional(),
  payment_type: z.string().optional(),
  fraud_status: z.string().optional(),
  status_code: z.string().optional(),
  signature_key: z.string().optional(),
});

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Webhook Midtrans. Konfigurasi URL ini di dashboard Midtrans
   * (Settings → Configuration → Payment Notification URL).
   * Event yang diproses: settlement, capture → PAID.
   */
  @Post("webhook/midtrans")
  @UsePipes(new ZodValidationPipe(MidtransWebhookSchema))
  async midtransWebhook(@Body() body: unknown) {
    // Verifikasi signature key
    if (!this.paymentsService.verifyMidtransSignature(body as Record<string, unknown>)) {
      throw new ForbiddenException("Signature webhook tidak valid");
    }

    const event = this.paymentsService.parseMidtransWebhook(body);

    // Hanya proses payment.received (settlement/capture)
    if (event.event !== "payment.received") {
      return { received: true, processed: false, status: event.event };
    }

    const order = await this.paymentsService.handlePaymentReceived(event);
    return { received: true, processed: true, orderNumber: order.orderNumber, status: order.status };
  }

  /**
   * Endpoint dev-only untuk mensimulasikan pembayaran saat PAYMENT_PROVIDER=mock.
   */
  @Post("mock/pay")
  @UsePipes(new ZodValidationPipe(MockPaySchema))
  async mockPay(@Body() dto: { orderNumber: string }) {
    if (process.env.PAYMENT_PROVIDER !== "mock") {
      throw new ForbiddenException(
        "Endpoint mock hanya aktif saat PAYMENT_PROVIDER=mock",
      );
    }
    const order = await this.paymentsService.handlePaymentReceived({
      event: "payment.received",
      orderRef: dto.orderNumber,
      raw: { source: "mock" },
    });
    return { orderNumber: order.orderNumber, status: order.status };
  }
}