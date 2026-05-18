import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { z } from "zod"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

const stageSchema = z.object({
  name: z.string().min(1),
  order: z.number().int().min(0),
  status: z.enum(["pending", "scheduled", "passed", "failed", "cancelled"]).default("pending"),
  scheduledAt: z.string().optional(),
  result: z.string().optional(),
  feedback: z.string().optional(),
  duration: z.number().optional(),
  interviewer: z.string().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params
    const userId = await getCurrentUserId()

    const company = await prisma.company.findFirst({ where: { id: companyId, userId } })
    if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await request.json()
    const parsed = stageSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const stage = await prisma.stage.create({
      data: {
        ...parsed.data,
        companyId,
        scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
      },
    })

    return NextResponse.json(stage, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
