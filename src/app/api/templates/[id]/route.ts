import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { z } from "zod"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  subject: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  tags: z.string().optional(),
  usageCount: z.number().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserId()
    const existing = await prisma.emailTemplate.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const template = await prisma.emailTemplate.update({ where: { id }, data: parsed.data })
    return NextResponse.json(template)
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
    const existing = await prisma.emailTemplate.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
    await prisma.emailTemplate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error)
  }
}
