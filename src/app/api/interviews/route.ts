import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { interviewLogSchema } from "@/lib/validators/interview-log"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    const search = searchParams.get("search")

    const logs = await prisma.interviewLog.findMany({
      where: {
        ...(companyId ? { companyId } : { company: { userId } }),
        ...(search ? {
          OR: [
            { questions: { contains: search } },
            { feedback: { contains: search } },
            { company: { name: { contains: search } } },
          ]
        } : {}),
      },
      include: {
        company: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
      },
      orderBy: { conductedAt: "desc" },
      take: search ? 10 : undefined,
    })

    return NextResponse.json(logs)
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = interviewLogSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const userId = await getCurrentUserId()

    const log = await prisma.interviewLog.create({
      data: {
        ...parsed.data,
        conductedAt: new Date(parsed.data.conductedAt),
        stageId: parsed.data.stageId || undefined,
      },
      include: {
        company: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
      },
    })

    // 自動タスク生成: お礼メール送信
    try {
      const company = await prisma.company.findUnique({ where: { id: parsed.data.companyId } })
      if (company) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        await prisma.task.create({
          data: {
            userId,
            companyId: parsed.data.companyId,
            title: `${company.name} 面接後のお礼メール送信`,
            description: `${parsed.data.type === "casual" ? "カジュアル面談" : parsed.data.type + "次面接"}後のお礼メールを送る`,
            status: "todo",
            priority: 4,
            dueAt: tomorrow,
            tags: "お礼メール,自動生成",
          },
        })
      }
    } catch {
      // タスク生成は補助的な機能なので失敗しても無視
    }

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
