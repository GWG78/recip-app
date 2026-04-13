-- AddColumn for onboarding fields to ShopSettings
ALTER TABLE "ShopSettings" ADD COLUMN "brandName" TEXT,
ADD COLUMN "logoUrl" TEXT,
ADD COLUMN "brandDescription" TEXT,
ADD COLUMN "productUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "friendlyBrands" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "monthlyVolume" TEXT,
ADD COLUMN "newCustomersOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "participateNetwork" BOOLEAN NOT NULL DEFAULT true;
