import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { MockPaymentProvider } from "./mock-payment.provider";
import { MayarPaymentProvider } from "./mayar-payment.provider";

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, MockPaymentProvider, MayarPaymentProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
