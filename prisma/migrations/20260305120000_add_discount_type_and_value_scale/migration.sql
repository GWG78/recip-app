-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- AlterTable
ALTER TABLE "ShopSettings"
ADD COLUMN "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE';

-- AlterTable
ALTER TABLE "ShopSettings"
ALTER COLUMN "discountValue" TYPE DECIMAL(10,2)
USING (
  CASE
    WHEN "discountValue" <= 1 THEN "discountValue" * 100
    ELSE "discountValue"
  END
);

-- AlterTable
ALTER TABLE "ShopSettings"
ALTER COLUMN "discountValue" SET DEFAULT 10.00;
