import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UsePipes,
} from "@nestjs/common";
import type { Request } from "express";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { PaymentsService } from "./payments.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

const MockPaySchema = z.object({
  orderNumber: z.string().min(1),
});

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Webhook Mayar. Konfigurasi URL ini di dashboard Mayar
   * (Integration → Webhook). Event yang diproses: payment.received.
   */
  @Post("webhook/mayar")
  async mayarWebhook(@Req() req: Request & { rawBody?: Buffer }, @Body() body: unknown) {
    this.verifySignature(req);
    const event = this.paymentsService.parseMayarWebhook(body);
    if (event.event !== "payment.received") {
      return { received: true, processed: false };
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
    if (process.env.PAYMENT_PROVIDER === "mayar") {
      throw new ForbiddenException(
        "Endpoint mock dinonaktifkan saat PAYMENT_PROVIDER=mayar",
      );
    }
    const order = await this.paymentsService.handlePaymentReceived({
      event: "payment.received",
      orderRef: dto.orderNumber,
      raw: { source: "mock" },
    });
    return { orderNumber: order.orderNumber, status: order.status };
  }

  /**
   * Verifikasi signature webhook (best-effort).
   * Docs Mayar klasik belum mempublikasikan skema signing final;
   * aktif hanya jika MAYAR_WEBHOOK_SECRET diisi.
   */
  private verifySignature(req: Request & { rawBody?: Buffer }): void {
    const secret = process.env.MAYAR_WEBHOOK_SECRET;
    if (!secret) {
      return;
    }
    const signature =
      (req.headers["x-mayar-signature"] as string | undefined) ??
      (req.headers["x-callback-signature"] as string | undefined);
    if (!signature || !req.rawBody) {
      throw new ForbiddenException("Signature webhook tidak ada");
    }
    const expected = createHmac("sha256", secret)
      .update(req.rawBody)
      .digest("hex");
    if (expected !== signature) {
      throw new ForbiddenException("Signature webhook tidak valid");
    }
  }
}
