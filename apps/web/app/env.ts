import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const appDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(appDir, "..");
const workspaceRoot = resolve(webRoot, "../..");

for (const envPath of [resolve(webRoot, ".env"), resolve(workspaceRoot, ".env")]) {
  if (existsSync(envPath)) {
    config({ path: envPath, override: false, quiet: true });
  }
}
