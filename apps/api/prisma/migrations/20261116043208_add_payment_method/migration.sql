-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MIDTRANS', 'CASH');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'MIDTRANS';
