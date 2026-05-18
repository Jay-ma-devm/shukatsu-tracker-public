import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { entrySheetSchema } from "@/lib/validators/entry-sheet"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    const search = searchParams.get("search")

    const sheets = await prisma.entrySheet.findMany({
      where: {
        ...(companyId ? { companyId } : { company: { userId } }),
        ...(search ? {
          OR: [
            { title: { contains: search } },
            { company: { name: { contains: search } } },
          ]
        } : {}),
      },
      include: {
        company: { select: { id: true, name: true } },
        questions: { orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: search ? 10 : undefined,
    })

    return NextResponse.json(sheets)
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = entrySheetSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const sheet = await prisma.entrySheet.create({
      data: {
        ...parsed.data,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
        submittedAt: parsed.data.submittedAt ? new Date(parsed.data.submittedAt) : undefined,
      },
      include: {
        company: { select: { id: true, name: true } },
        questions: true,
      },
    })

    return NextResponse.json(sheet, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
