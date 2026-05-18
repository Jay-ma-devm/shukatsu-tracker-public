import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { interviewLogSchema } from "@/lib/validators/interview-log"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = interviewLogSchema.partial().safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const prevOutcome = await prisma.interviewLog.findUnique({ where: { id }, select: { outcome: true } })

    const log = await prisma.interviewLog.update({
      where: { id },
      data: {
        ...parsed.data,
        conductedAt: parsed.data.conductedAt ? new Date(parsed.data.conductedAt) : undefined,
        stageId: parsed.data.stageId || undefined,
      },
      include: {
        company: { select: { id: true, name: true, userId: true } },
        stage: { select: { id: true, name: true } },
      },
    })

    // 面接通過時に次ステップのタスクを自動生成
    if (parsed.data.outcome === "passed" && prevOutcome?.outcome !== "passed") {
      try {
        const userId = (log.company as typeof log.company & { userId?: string })?.userId
        if (userId) {
          const nextWeek = new Date()
          nextWeek.setDate(nextWeek.getDate() + 7)
          await prisma.task.create({
            data: {
              userId,
              companyId: log.companyId,
              title: `${log.company.name} 次回面接準備`,
              description: "面接通過。次のステージに向けて準備を開始しましょう。",
              status: "todo",
              priority: 5,
              dueAt: nextWeek,
              tags: "面接準備,自動生成",
            },
          })
        }
      } catch {
        // 補助的な機能
      }
    }

    return NextResponse.json(log)
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
    await prisma.interviewLog.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error)
  }
}
