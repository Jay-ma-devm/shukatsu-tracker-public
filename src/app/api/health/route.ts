import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const start = Date.now()
    await prisma.user.count()
    const latency = Date.now() - start
    return NextResponse.json({
      status: "ok",
      db: "connected",
      latencyMs: latency,
    })
  } catch {
    return NextResponse.json({ status: "error", db: "disconnected" }, { status: 503 })
  }
}
