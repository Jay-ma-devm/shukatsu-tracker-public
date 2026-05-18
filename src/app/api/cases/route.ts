import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { caseLogSchema } from "@/lib/validators/case"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const cases = await prisma.caseLog.findMany({
      where: {
        userId,
        ...(category && category !== "all" ? { category } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { category: { contains: search } },
                { tags: { contains: search } },
                { prompt: { contains: search } },
                { feedback: { contains: search } },
              ],
            }
          : {}),
      },
      include: { company: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(cases)
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const body = await request.json()
    const parsed = caseLogSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const caseLog = await prisma.caseLog.create({
      data: { ...parsed.data, userId },
      include: { company: true },
    })

    return NextResponse.json(caseLog, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
