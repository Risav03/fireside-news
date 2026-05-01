import { createHash } from "node:crypto";

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function contentHash(input: { title: string; url: string }): string {
  const normalized = normalizeText(`${input.title} ${canonicalUrl(input.url)}`);
  return createHash("sha256").update(normalized).digest("hex");
}

export function canonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

export function estimateSpokenDurationSec(text: string): number {
  const words = normalizeText(text).split(" ").filter(Boolean).length;
  return Math.max(5, Math.ceil((words / 150) * 60));
}
