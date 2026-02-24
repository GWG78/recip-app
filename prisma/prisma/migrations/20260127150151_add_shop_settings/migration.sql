/*
  Warnings:

  - You are about to alter the column `discountValue` on the `ShopSettings` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(5,4)`.
  - You are about to alter the column `commissionRate` on the `ShopSettings` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(5,4)`.

*/
-- AlterTable
ALTER TABLE "ShopSettings" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "discountValue" SET DEFAULT 0.10,
ALTER COLUMN "discountValue" SET DATA TYPE DECIMAL(5,4),
ALTER COLUMN "expiryDays" SET DEFAULT 2,
ALTER COLUMN "maxDiscounts" SET DEFAULT 100,
ALTER COLUMN "allowedCountries" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "allowedMemberTypes" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "commissionRate" SET DEFAULT 0.05,
ALTER COLUMN "commissionRate" SET DATA TYPE DECIMAL(5,4);
