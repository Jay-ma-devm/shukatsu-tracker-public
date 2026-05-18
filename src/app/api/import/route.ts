import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    const body = await request.json()

    const { data, mode = "merge" } = body as {
      data: {
        companies?: unknown[]
        events?: unknown[]
        cases?: unknown[]
        templates?: unknown[]
      }
      mode: "merge" | "replace"
    }

    if (!data) {
      return NextResponse.json({ error: "data is required" }, { status: 400 })
    }

    const stats = { companies: 0, events: 0, cases: 0, templates: 0 }

    if (mode === "replace") {
      await prisma.company.deleteMany({ where: { userId } })
      await prisma.emailTemplate.deleteMany({ where: { userId } })
      await prisma.caseLog.deleteMany({ where: { userId } })
    }

    // 企業インポート
    if (Array.isArray(data.companies)) {
      for (const c of data.companies as Record<string, unknown>[]) {
        try {
          await prisma.company.create({
            data: {
              userId,
              name: String(c.name ?? ""),
              industry: c.industry ? String(c.industry) : undefined,
              position: c.position ? String(c.position) : undefined,
              location: c.location ? String(c.location) : undefined,
              size: c.size ? String(c.size) : undefined,
              url: c.url ? String(c.url) : undefined,
              priority: Number(c.priority ?? 3),
              status: String(c.status ?? "applied"),
              starred: Boolean(c.starred),
              notes: c.notes ? String(c.notes) : undefined,
              appliedAt: c.appliedAt ? new Date(String(c.appliedAt)) : undefined,
            },
          })
          stats.companies++
        } catch {
          // 個別失敗はスキップ
        }
      }
    }

    // ケースログインポート
    if (Array.isArray(data.cases)) {
      for (const c of data.cases as Record<string, unknown>[]) {
        try {
          await prisma.caseLog.create({
            data: {
              userId,
              title: String(c.title ?? ""),
              category: c.category ? String(c.category) : undefined,
              prompt: String(c.prompt ?? ""),
              premise: c.premise ? String(c.premise) : undefined,
              structure: c.structure ? String(c.structure) : undefined,
              analysis: c.analysis ? String(c.analysis) : undefined,
              conclusion: c.conclusion ? String(c.conclusion) : undefined,
              feedback: c.feedback ? String(c.feedback) : undefined,
              rating: c.rating ? Number(c.rating) : undefined,
              difficulty: Number(c.difficulty ?? 3),
              duration: c.duration ? Number(c.duration) : undefined,
              tags: c.tags ? String(c.tags) : undefined,
            },
          })
          stats.cases++
        } catch {
          // skip
        }
      }
    }

    // テンプレートインポート
    if (Array.isArray(data.templates)) {
      for (const t of data.templates as Record<string, unknown>[]) {
        try {
          await prisma.emailTemplate.create({
            data: {
              userId,
              name: String(t.name ?? ""),
              category: t.category ? String(t.category) : undefined,
              subject: String(t.subject ?? ""),
              body: String(t.body ?? ""),
              tags: t.tags ? String(t.tags) : undefined,
            },
          })
          stats.templates++
        } catch {
          // skip
        }
      }
    }

    return NextResponse.json({ success: true, stats })
  } catch (error) {
    return apiError(error)
  }
}
