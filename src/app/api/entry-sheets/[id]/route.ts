import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { entrySheetSchema } from "@/lib/validators/entry-sheet"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sheet = await prisma.entrySheet.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        questions: { orderBy: { order: "asc" } },
      },
    })
    if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(sheet)
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
    const body = await request.json()
    const parsed = entrySheetSchema.partial().safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const sheet = await prisma.entrySheet.update({
      where: { id },
      data: {
        ...parsed.data,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
        submittedAt: parsed.data.submittedAt ? new Date(parsed.data.submittedAt) : undefined,
      },
      include: {
        company: { select: { id: true, name: true } },
        questions: { orderBy: { order: "asc" } },
      },
    })
    return NextResponse.json(sheet)
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
    await prisma.entrySheet.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error)
  }
}
