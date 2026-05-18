import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { eventSchema } from "@/lib/validators/event"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = eventSchema.partial().safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...parsed.data,
        startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : undefined,
        endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : undefined,
      },
      include: { company: true },
    })

    return NextResponse.json(event)
  } catch (error) {
    return apiError(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.event.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error)
  }
}
