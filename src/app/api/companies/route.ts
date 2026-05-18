import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { companySchema } from "@/lib/validators/company"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const industry = searchParams.get("industry")
    const search = searchParams.get("search")
    const starred = searchParams.get("starred")
    const archived = searchParams.get("archived") === "true"

    const where = {
      userId,
      archivedAt: archived ? { not: null } : null,
      ...(status && status !== "all" ? { status } : {}),
      ...(priority && priority !== "all" ? { priority: parseInt(priority) } : {}),
      ...(industry && industry !== "all" ? { industry } : {}),
      ...(starred === "true" ? { starred: true } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { position: { contains: search } },
              { industry: { contains: search } },
              { location: { contains: search } },
              { notes: { contains: search } },
            ],
          }
        : {}),
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        stages: { orderBy: { order: "asc" } },
        _count: { select: { events: true, caseLogs: true } },
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    })

    return NextResponse.json(companies)
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()

    // プラン制限チェック（localモードはスキップ）
    if (process.env.NEXT_PUBLIC_AUTH_MODE !== "local") {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripePriceId: true },
      }).catch(() => null)

      const isPro = !!dbUser?.stripePriceId

      if (!isPro) {
        const count = await prisma.company.count({ where: { userId, archivedAt: null } })
        if (count >= 10) {
          return NextResponse.json(
            { error: "無料プランは企業10社まで。Proにアップグレードしてください。", code: "PLAN_LIMIT" },
            { status: 403 }
          )
        }
      }
    }

    const body = await request.json()
    const parsed = companySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const company = await prisma.company.create({
      data: {
        ...parsed.data,
        userId,
        appliedAt: parsed.data.appliedAt ? new Date(parsed.data.appliedAt) : new Date(),
      },
      include: { stages: true },
    })

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
