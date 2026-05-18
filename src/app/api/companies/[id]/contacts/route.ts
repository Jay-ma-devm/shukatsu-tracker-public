import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { z } from "zod"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

const contactSchema = z.object({
  name: z.string().min(1, "名前を入力してください"),
  role: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
  linkedIn: z.string().optional(),
  important: z.boolean(),
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
    const parsed = contactSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const contact = await prisma.contact.create({
      data: {
        ...parsed.data,
        companyId,
        email: parsed.data.email || undefined,
      },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
