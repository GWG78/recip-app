/*
  Warnings:

  - You are about to drop the column `targetShopId` on the `FriendlyBrand` table. All the data in the column will be lost.
  - You are about to drop the column `targetUrl` on the `FriendlyBrand` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shopId,brandDomain]` on the table `FriendlyBrand` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `brandDomain` to the `FriendlyBrand` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FriendlyBrand" DROP COLUMN "targetShopId",
DROP COLUMN "targetUrl",
ADD COLUMN     "brandDomain" TEXT NOT NULL,
ADD COLUMN     "resolvedShopId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FriendlyBrand_shopId_brandDomain_key" ON "FriendlyBrand"("shopId", "brandDomain");
