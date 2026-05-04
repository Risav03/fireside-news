import { PrismaClient } from "./generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireEnv } from "@repo/utils";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

let prismaForProd: PrismaClient | undefined;

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: requireEnv("DATABASE_URL"),
    }),
  });
}

function getPrisma(): PrismaClient {
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma ??= createPrismaClient();
    return globalForPrisma.prisma;
  }
  prismaForProd ??= createPrismaClient();
  return prismaForProd;
}

/** Lazily connects so importing `@repo/db` does not require env at module load (e.g. `next build`). */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver) as unknown;
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
}) as PrismaClient;

export * from "./generated/client";
