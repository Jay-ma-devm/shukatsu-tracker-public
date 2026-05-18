import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { careerEntrySchema } from "@/lib/validators/career"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    const entries = await prisma.careerEntry.findMany({
      where: {
        userId,
        ...(search ? {
          OR: [
            { title: { contains: search } },
            { organization: { contains: search } },
            { skills: { contains: search } },
          ]
        } : {}),
      },
      orderBy: { startAt: "desc" },
      take: search ? 10 : undefined,
    })
    return NextResponse.json(entries)
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const body = await request.json()
    const parsed = careerEntrySchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const entry = await prisma.careerEntry.create({
      data: {
        ...parsed.data,
        userId,
        startAt: new Date(parsed.data.startAt),
        endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : undefined,
        url: parsed.data.url || undefined,
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
