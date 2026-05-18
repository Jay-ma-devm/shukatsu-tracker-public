import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { eventSchema } from "@/lib/validators/event"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const companyId = searchParams.get("companyId")

    const where = {
      ...(companyId
        ? { companyId }
        : {
            OR: [
              { company: { userId } },
              { companyId: null },
            ],
          }),
      ...(from || to
        ? {
            startAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    }

    const events = await prisma.event.findMany({
      where,
      include: { company: true },
      orderBy: { startAt: "asc" },
    })

    return NextResponse.json(events)
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  try {
    await getCurrentUserId()
    const body = await request.json()
    const parsed = eventSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const event = await prisma.event.create({
      data: {
        ...parsed.data,
        startAt: new Date(parsed.data.startAt),
        endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : undefined,
        reminderAt: parsed.data.reminderAt ? new Date(parsed.data.reminderAt) : undefined,
      },
      include: { company: true },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
