import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { meetingSchema } from "@/lib/validators/meeting"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserId()
    const existing = await prisma.meeting.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await request.json()
    const parsed = meetingSchema.partial().safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        ...parsed.data,
        conductedAt: parsed.data.conductedAt ? new Date(parsed.data.conductedAt) : undefined,
        companyId: parsed.data.companyId || undefined,
        contactId: parsed.data.contactId || undefined,
      },
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true, role: true } },
      },
    })

    return NextResponse.json(meeting)
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
    const userId = await getCurrentUserId()
    const existing = await prisma.meeting.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
    await prisma.meeting.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error)
  }
}
