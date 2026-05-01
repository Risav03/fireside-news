import { PrismaClient } from "./generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireEnv } from "@repo/utils";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: requireEnv("DATABASE_URL"),
    }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "./generated/client";
