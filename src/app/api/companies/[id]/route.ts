import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { companySchema } from "@/lib/validators/company"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

async function getCompany(id: string, userId: string) {
  return prisma.company.findFirst({
    where: { id, userId },
    include: {
      stages: { orderBy: { order: "asc" } },
      events: { orderBy: { startAt: "asc" } },
      caseLogs: { orderBy: { createdAt: "desc" } },
      contacts: { orderBy: { createdAt: "asc" } },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserId()
    const company = await getCompany(id, userId)

    if (!company) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error) {
    return apiError(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getCurrentUserId()
    const existing = await getCompany(id, userId)

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = companySchema.partial().safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        ...parsed.data,
        appliedAt: parsed.data.appliedAt ? new Date(parsed.data.appliedAt) : undefined,
      },
      include: { stages: true },
    })

    return NextResponse.json(company)
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
    const existing = await getCompany(id, userId)

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.company.update({
      where: { id },
      data: { archivedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return apiError(error)
  }
}
