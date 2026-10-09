import { NextResponse } from "next/server";

/** GET /v1 — health check (mirrors the original apiHealth controller) */
export async function GET() {
  return NextResponse.json({
    message: "Up and Running fine",
    version: "v1",
  });
}
