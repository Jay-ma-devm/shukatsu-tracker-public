import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { noteSchema } from "@/lib/validators/note"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserId()
    const note = await prisma.note.findFirst({
      where: { id, userId },
      include: { company: { select: { id: true, name: true } } },
    })
    if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(note)
  } catch (error) {
    return apiError(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserId()
    const existing = await prisma.note.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await request.json()
    const parsed = noteSchema.partial().safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const note = await prisma.note.update({
      where: { id },
      data: {
        ...parsed.data,
        companyId: "companyId" in parsed.data
          ? (parsed.data.companyId || null)
          : undefined,
      },
      include: { company: { select: { id: true, name: true } } },
    })
    return NextResponse.json(note)
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
    const existing = await prisma.note.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
    await prisma.note.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error)
  }
}
