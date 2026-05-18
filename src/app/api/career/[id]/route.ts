import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { careerEntrySchema } from "@/lib/validators/career"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserId()
    const existing = await prisma.careerEntry.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await request.json()
    const parsed = careerEntrySchema.partial().safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const entry = await prisma.careerEntry.update({
      where: { id },
      data: {
        ...parsed.data,
        startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : undefined,
        endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : undefined,
        url: parsed.data.url || undefined,
      },
    })
    return NextResponse.json(entry)
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
    const existing = await prisma.careerEntry.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
    await prisma.careerEntry.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error)
  }
}
