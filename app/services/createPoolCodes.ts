import prisma from "../db.server";

import { randomBytes } from 'crypto';

const POOL_SIZE = 3;

function generateCode(prefix: string) {
  return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function createPoolCodes({
  toShopId,
  prefix = 'RECIP',
  count = POOL_SIZE,
}: {
  toShopId: string;
  prefix?: string;
  count?: number;
}) {
  const codes = Array.from({ length: count }).map(() => ({
    toShopId,
    code: generateCode(prefix),
    state: 'POOL' as const,
  }));

  await prisma.discountCode.createMany({
    data: codes,
  });
}