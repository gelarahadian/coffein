import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import {
  CreateOrderInputSchema,
  OrderStatusSchema,
} from "@coffein/shared";
import { OrdersService } from "./orders.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

const UpdateStatusSchema = z.object({ status: OrderStatusSchema });

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ---------- Public (guest) ----------

  @Post("orders")
  create(
    @Body(new ZodValidationPipe(CreateOrderInputSchema)) dto: { customerName: string; customerPhone: string; orderType: "TAKEAWAY" | "DINE_IN"; items: { productId: string; quantity: number }[] },
  ) {
    return this.ordersService.create(dto);
  }

  @Get("orders/:orderNumber")
  byOrderNumber(@Param("orderNumber") orderNumber: string) {
    return this.ordersService.byOrderNumber(orderNumber);
  }

  // ---------- Admin ----------

  @Get("admin/orders")
  @UseGuards(JwtAuthGuard)
  list(@Query("status") status?: string) {
    const parsed = OrderStatusSchema.safeParse(status);
    return this.ordersService.listAdmin(parsed.success ? parsed.data : undefined);
  }

  @Patch("admin/orders/:id/status")
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateStatusSchema))
    body: { status: "PENDING" | "PAID" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED" },
  ) {
    return this.ordersService.updateStatus(id, body.status);
  }
}
