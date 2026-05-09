import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
// Prisma CLI runs with cwd `packages/db`; repo `.env` lives at monorepo root.
loadEnv({ path: path.resolve(packageRoot, "../../.env") });
loadEnv({ path: path.resolve(packageRoot, ".env"), override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
