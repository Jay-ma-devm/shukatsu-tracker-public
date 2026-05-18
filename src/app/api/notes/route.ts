import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { noteSchema } from "@/lib/validators/note"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    const search = searchParams.get("search")

    const notes = await prisma.note.findMany({
      where: {
        userId,
        ...(companyId ? { companyId } : {}),
        ...(search ? {
          OR: [
            { title: { contains: search } },
            { content: { contains: search } },
            { tags: { contains: search } },
          ],
        } : {}),
      },
      include: { company: { select: { id: true, name: true } } },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    })

    return NextResponse.json(notes)
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const body = await request.json()
    const parsed = noteSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const note = await prisma.note.create({
      data: {
        ...parsed.data,
        userId,
        companyId: parsed.data.companyId || undefined,
      },
      include: { company: { select: { id: true, name: true } } },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
