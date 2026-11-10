import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateOrderInput, OrderStatus } from "@coffein/shared";
import { PaymentsService } from "../payments/payments.service";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Guest checkout: buat order + item (snapshot harga dari DB, bukan dari client),
   * lalu minta payment link ke provider aktif.
   */
  async create(dto: CreateOrderInput) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map((i) => i.productId) } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(
          `Produk ${item.productId} tidak ditemukan`,
        );
      }
      if (!product.isAvailable) {
        throw new BadRequestException(
          `Produk ${product.name} sedang tidak tersedia`,
        );
      }
    }

    const totalAmount = dto.items.reduce((sum, item) => {
      const product = productMap.get(item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    const orderNumber = await this.generateOrderNumber();

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          orderType: dto.orderType,
          status: "PENDING",
          totalAmount,
          items: {
            create: dto.items.map((item) => {
              const product = productMap.get(item.productId);
              return {
                productId: item.productId,
                productName: product ? product.name : "Produk",
                price: product ? product.price : 0,
                quantity: item.quantity,
              };
            }),
          },
        },
        include: { items: true },
      });
      return created;
    });

    let paymentUrl: string | null = null;
    let providerPaymentId: string | null = null;
    try {
      const link = await this.paymentsService.createPaymentLink({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
      });
      paymentUrl = link.paymentUrl;
      providerPaymentId = link.providerPaymentId;
    } catch (err) {
      // Order tetap dibuat (PENDING) tapi tanpa payment link — admin bisa follow up.
      console.error("Gagal membuat payment link:", err);
    }

    return this.prisma.order.update({
      where: { id: order.id },
      data: { paymentUrl, providerPaymentId },
      include: { items: true },
    });
  }

  async byOrderNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException("Pesanan tidak ditemukan");
    }
    return order;
  }

  listAdmin(status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: status ? { status } : undefined,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException("Pesanan tidak ditemukan");
    }
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
  }

  /** Nomor order pendek, unik, mudah dibagikan ke staff cafe. */
  private async generateOrderNumber(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const ts = Date.now().toString(36).toUpperCase().slice(-5);
      const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
      const candidate = `CF-${ts}${rand}`;
      const exists = await this.prisma.order.findUnique({
        where: { orderNumber: candidate },
      });
      if (!exists) {
        return candidate;
      }
    }
    throw new BadRequestException("Gagal membuat nomor order, coba lagi");
  }
}
