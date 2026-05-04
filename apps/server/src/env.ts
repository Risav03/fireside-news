import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = resolve(serverRoot, "../..");

for (const envPath of [resolve(serverRoot, ".env"), resolve(workspaceRoot, ".env")]) {
  if (existsSync(envPath)) {
    config({ path: envPath, override: false, quiet: true });
  }
}
