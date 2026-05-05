import "../../env.js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** No external market feed wired yet — explicit non-mock unavailable state. */
export async function GET() {
  return NextResponse.json(
    {
      available: false,
      items: [] as Array<{ sym: string; val: string; chg: string; pct: string; up: boolean }>,
      message: "Markets feed offline",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
