import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { z } from "zod"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  order: z.number().int().min(0).optional(),
  status: z.enum(["pending", "scheduled", "passed", "failed", "cancelled"]).optional(),
  scheduledAt: z.string().optional().nullable(),
  result: z.string().optional(),
  feedback: z.string().optional(),
  duration: z.number().optional(),
  interviewer: z.string().optional(),
  completedAt: z.string().optional().nullable(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id: companyId, stageId } = await params
    const userId = await getCurrentUserId()

    const stage = await prisma.stage.findFirst({
      where: { id: stageId, companyId, company: { userId } },
    })
    if (!stage) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const updated = await prisma.stage.update({
      where: { id: stageId },
      data: {
        ...parsed.data,
        scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : parsed.data.scheduledAt === null ? null : undefined,
        completedAt: parsed.data.completedAt ? new Date(parsed.data.completedAt) : parsed.data.completedAt === null ? null : undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return apiError(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id: companyId, stageId } = await params
    const userId = await getCurrentUserId()

    const stage = await prisma.stage.findFirst({
      where: { id: stageId, companyId, company: { userId } },
    })
    if (!stage) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.stage.delete({ where: { id: stageId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error)
  }
}
