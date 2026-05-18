import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { z } from "zod"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

const templateSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
  tags: z.string().optional(),
})

export async function GET() {
  try {
    const userId = await getCurrentUserId()
    const templates = await prisma.emailTemplate.findMany({
      where: { userId },
      orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
    })
    return NextResponse.json(templates)
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const body = await request.json()
    const parsed = templateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const template = await prisma.emailTemplate.create({
      data: { ...parsed.data, userId },
    })
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
