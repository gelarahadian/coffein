import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { PaymentEvent, PaymentLink } from "@coffein/shared";
import type { PaymentOrderRef, PaymentProvider } from "./payment-provider.interface";
import { MockPaymentProvider } from "./mock-payment.provider";
import { MayarPaymentProvider } from "./mayar-payment.provider";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mockProvider: MockPaymentProvider,
    private readonly mayarProvider: MayarPaymentProvider,
  ) {}

  get provider(): PaymentProvider {
    return process.env.PAYMENT_PROVIDER === "mayar"
      ? this.mayarProvider
      : this.mockProvider;
  }

  async createPaymentLink(order: PaymentOrderRef): Promise<PaymentLink> {
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
      throw new NotFoundException(
        `Order ${event.orderRef} tidak ditemukan`,
      );
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

  /** Parse payload webhook Mayar menjadi PaymentEvent. */
  parseMayarWebhook(body: unknown): PaymentEvent {
    if (typeof body !== "object" || body === null) {
      throw new BadRequestException("Payload webhook tidak valid");
    }
    const { event, data } = body as {
      event?: unknown;
      data?: Record<string, unknown> | undefined;
    };
    if (typeof event !== "string" || event.length === 0) {
      throw new BadRequestException("Field 'event' wajib ada");
    }

    const customField = data?.custom_field;
    const orderRef =
      (typeof customField === "object" && customField !== null
        ? (customField as Record<string, unknown>).order_ref
        : undefined) ??
      data?.notes ??
      data?.productName;

    if (typeof orderRef !== "string" || orderRef.length === 0) {
      throw new BadRequestException(
        "Tidak dapat menentukan referensi order dari webhook",
      );
    }

    const amount =
      typeof data?.amount === "number" ? Math.round(data.amount) : undefined;
    const providerPaymentId =
      typeof data?.id === "string" ? data.id : undefined;

    return {
      event,
      orderRef,
      amount,
      providerPaymentId,
      raw: body as Record<string, unknown>,
    };
  }
}
