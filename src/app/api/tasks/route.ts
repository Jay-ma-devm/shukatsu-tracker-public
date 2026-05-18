import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { taskSchema } from "@/lib/validators/task"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const companyId = searchParams.get("companyId")
    const search = searchParams.get("search")
    const dueFilter = searchParams.get("due") // "today" | "week" | "overdue"

    const now = new Date()
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999)
    const endOfWeek = new Date(now); endOfWeek.setDate(now.getDate() + 7); endOfWeek.setHours(23, 59, 59, 999)

    const dueDateFilter = dueFilter === "today"
      ? { dueAt: { gte: startOfToday, lte: endOfToday } }
      : dueFilter === "week"
      ? { dueAt: { gte: startOfToday, lte: endOfWeek } }
      : dueFilter === "overdue"
      ? { dueAt: { lt: startOfToday }, status: { in: ["todo", "doing"] } }
      : {}

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        ...(status && status !== "all" ? { status } : {}),
        ...(companyId ? { companyId } : {}),
        ...(search ? { OR: [{ title: { contains: search } }, { description: { contains: search } }] } : {}),
        ...dueDateFilter,
      },
      include: { company: { select: { id: true, name: true } } },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { dueAt: "asc" }],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const body = await request.json()
    const parsed = taskSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const task = await prisma.task.create({
      data: {
        ...parsed.data,
        userId,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
        companyId: parsed.data.companyId || undefined,
      },
      include: { company: { select: { id: true, name: true } } },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
