import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

// 他のESから類似設問と回答を検索
export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q") ?? ""
    const excludeSheetId = searchParams.get("excludeSheet") ?? ""

    const questions = await prisma.esQuestion.findMany({
      where: {
        answer: { not: null },
        entrySheet: {
          company: { userId },
          ...(excludeSheetId ? { id: { not: excludeSheetId } } : {}),
        },
        ...(q ? { question: { contains: q } } : {}),
      },
      include: {
        entrySheet: {
          select: {
            id: true,
            title: true,
            company: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { entrySheet: { createdAt: "desc" } },
      take: 10,
    })

    return NextResponse.json(questions)
  } catch (error) {
    return apiError(error)
  }
}
