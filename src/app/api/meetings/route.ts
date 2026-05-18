import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { meetingSchema } from "@/lib/validators/meeting"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")
    const search = searchParams.get("search")
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined

    const meetings = await prisma.meeting.findMany({
      where: {
        userId,
        ...(companyId ? { companyId } : {}),
        ...(search ? {
          OR: [
            { title: { contains: search } },
            { topics: { contains: search } },
            { insights: { contains: search } },
          ],
        } : {}),
      },
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true, role: true } },
      },
      orderBy: { conductedAt: "desc" },
      take: limit ?? (search ? 10 : undefined),
    })

    return NextResponse.json(meetings)
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const body = await request.json()
    const parsed = meetingSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const meeting = await prisma.meeting.create({
      data: {
        ...parsed.data,
        userId,
        conductedAt: new Date(parsed.data.conductedAt),
        companyId: parsed.data.companyId || undefined,
        contactId: parsed.data.contactId || undefined,
      },
      include: {
        company: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true, role: true } },
      },
    })

    // 自動タスク生成: お礼メール送信
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const label = meeting.company ? meeting.company.name + " " : ""
      await prisma.task.create({
        data: {
          userId,
          companyId: meeting.companyId || undefined,
          title: `${label}OB訪問後のお礼メール送信`,
          description: `${parsed.data.title}のお礼メールを送る`,
          status: "todo",
          priority: 4,
          dueAt: tomorrow,
          tags: "お礼メール,自動生成",
        },
      })
    } catch {
      // タスク生成は補助的な機能
    }

    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
