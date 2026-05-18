import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { taskSchema } from "@/lib/validators/task"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserId()
    const existing = await prisma.task.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await request.json()
    const parsed = taskSchema.partial().safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...parsed.data,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : parsed.data.dueAt === null ? null : undefined,
        completedAt: parsed.data.status === "done" ? new Date() : parsed.data.status === "todo" || parsed.data.status === "doing" ? null : undefined,
        companyId: parsed.data.companyId || undefined,
      },
      include: { company: { select: { id: true, name: true } } },
    })

    return NextResponse.json(task)
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
    const userId = await getCurrentUserId()
    const existing = await prisma.task.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
    await prisma.task.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error)
  }
}
