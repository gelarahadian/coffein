import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { MockPaymentProvider } from "./mock-payment.provider";
import { CashPaymentProvider } from "./cash-payment.provider";
import { MidtransPaymentProvider } from "./midtrans-payment.provider";

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, MockPaymentProvider, CashPaymentProvider, MidtransPaymentProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
