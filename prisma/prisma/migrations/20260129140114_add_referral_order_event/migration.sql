/*
  Warnings:

  - The values [REDEEM] on the enum `ReferralEventType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReferralEventType_new" AS ENUM ('IMPRESSION', 'CLICK', 'INSTALL', 'ORDER_CREATED', 'ACTIVATE');
ALTER TABLE "ReferralEvent" ALTER COLUMN "type" TYPE "ReferralEventType_new" USING ("type"::text::"ReferralEventType_new");
ALTER TYPE "ReferralEventType" RENAME TO "ReferralEventType_old";
ALTER TYPE "ReferralEventType_new" RENAME TO "ReferralEventType";
DROP TYPE "public"."ReferralEventType_old";
COMMIT;
