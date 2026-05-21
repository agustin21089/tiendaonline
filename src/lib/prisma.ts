import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  // pg ≥ 8.12 emits a SECURITY WARNING when the connection string contains
  // sslmode=require/prefer/verify-ca because those are now treated as aliases
  // for verify-full. Making the mode explicit suppresses the warning while
  // keeping identical behaviour (require was already verify-full in pg < 9).
  const connectionString = (process.env.DATABASE_URL ?? "").replace(
    /sslmode=(prefer|require|verify-ca)\b/,
    "sslmode=verify-full"
  );
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter } as never);
}

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createPrismaClient> };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
