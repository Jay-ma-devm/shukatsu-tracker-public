import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { esQuestionSchema } from "@/lib/validators/entry-sheet"
import { z } from "zod"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: entrySheetId } = await params
    const body = await request.json()
    const parsed = esQuestionSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const question = await prisma.esQuestion.create({
      data: { ...parsed.data, entrySheetId },
    })
    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}

// 複数設問の一括更新
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: entrySheetId } = await params
    const body = await request.json()
    const questions = z.array(
      z.object({
        id: z.string().optional(),
        question: z.string(),
        answer: z.string().optional(),
        charLimit: z.number().optional(),
        charCount: z.number().optional(),
        order: z.number(),
      })
    ).parse(body)

    // 全削除して再作成（シンプルな実装）
    await prisma.esQuestion.deleteMany({ where: { entrySheetId } })
    await prisma.esQuestion.createMany({
      data: questions.map((q) => ({ ...q, entrySheetId, id: undefined })),
    })

    const result = await prisma.esQuestion.findMany({
      where: { entrySheetId },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(result)
  } catch (error) {
    return apiError(error)
  }
}
