export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new ConfigError(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function optionalEnv(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export function toEpochMs(date: Date | string | number): number {
  return date instanceof Date ? date.getTime() : new Date(date).getTime();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
