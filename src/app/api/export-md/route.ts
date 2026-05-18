import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const userId = await getCurrentUserId()

    const [companies, cases, meetings, interviewLogs, tasks] = await Promise.all([
      prisma.company.findMany({
        where: { userId },
        include: {
          stages: { orderBy: { order: "asc" } },
          interviewLogs: { orderBy: { conductedAt: "desc" }, take: 3 },
          entrySheets: { select: { id: true, title: true, status: true, deadline: true } },
          companyNotes: { select: { title: true, content: true }, take: 2 },
        },
        orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      }),
      prisma.caseLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { title: true, category: true, rating: true, difficulty: true, createdAt: true },
      }),
      prisma.meeting.findMany({
        where: { userId },
        orderBy: { conductedAt: "desc" },
        select: { title: true, type: true, conductedAt: true, thankYouSent: true, insights: true },
      }),
      prisma.interviewLog.findMany({
        where: { company: { userId } },
        include: { company: { select: { name: true } } },
        orderBy: { conductedAt: "desc" },
        take: 20,
      }),
      prisma.task.findMany({
        where: { userId, status: { in: ["todo", "doing"] } },
        orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
        take: 10,
      }),
    ])

    const now = new Date()
    const sections: string[] = []

    sections.push(`# 就活選考レポート`)
    sections.push(`> 生成日時: ${now.toLocaleString("ja-JP")}`)
    sections.push("")

    // サマリー
    const activeCompanies = companies.filter(c => !["rejected", "withdrawn", "accepted"].includes(c.status))
    const offerCompanies = companies.filter(c => ["offer", "accepted"].includes(c.status))
    const interviewCompanies = companies.filter(c => ["interview", "internship", "case", "final"].includes(c.status))
    const passedInterviews = interviewLogs.filter(l => l.outcome === "passed").length
    const totalWithOutcome = interviewLogs.filter(l => l.outcome && l.outcome !== "pending").length

    sections.push(`## 📊 現在の状況`)
    sections.push(`- **応募企業総数**: ${companies.length}社（アクティブ: ${activeCompanies.length}社）`)
    sections.push(`- **面接中/最終選考**: ${interviewCompanies.length}社`)
    sections.push(`- **内定**: ${offerCompanies.length}社${offerCompanies.length > 0 ? ` (${offerCompanies.map(c => c.name).join(", ")})` : ""}`)
    if (totalWithOutcome > 0) {
      sections.push(`- **面接通過率**: ${Math.round(passedInterviews / totalWithOutcome * 100)}% (${passedInterviews}/${totalWithOutcome})`)
    }
    sections.push(`- **ケース練習**: ${cases.length}回`)
    sections.push(`- **OB訪問**: ${meetings.length}件`)
    sections.push("")

    // 企業別詳細
    sections.push(`## 🏢 選考企業一覧`)
    sections.push("")
    const statusOrder = ["offer", "accepted", "final", "case", "interview", "screening", "applied", "rejected", "withdrawn"]
    const sortedCompanies = [...companies].sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status))

    for (const c of sortedCompanies.slice(0, 15)) {
      const statusEmoji: Record<string, string> = {
        offer: "🎉", accepted: "✅", final: "🔥", case: "📊", interview: "💬",
        screening: "📝", applied: "📮", rejected: "❌", withdrawn: "↩️",
      }
      sections.push(`### ${statusEmoji[c.status] ?? "•"} ${c.name}`)
      sections.push(`**ステータス**: ${c.status} | **優先度**: ${"★".repeat(c.priority)} | **職種**: ${c.position ?? "未設定"}`)
      if (c.stages.length > 0) {
        const passed = c.stages.filter(s => s.status === "passed").length
        sections.push(`**ステージ**: ${passed}/${c.stages.length}通過`)
      }
      if (c.interviewLogs.length > 0) {
        sections.push(`**面接記録**: ${c.interviewLogs.length}件`)
      }
      if (c.companyNotes.length > 0) {
        sections.push(`**メモ**: ${c.companyNotes[0].title}`)
      }
      sections.push("")
    }

    // ケース練習統計
    if (cases.length > 0) {
      sections.push(`## 📚 ケース練習統計`)
      const rated = cases.filter(c => c.rating)
      const avgRating = rated.length > 0 ? (rated.reduce((s, c) => s + (c.rating ?? 0), 0) / rated.length).toFixed(1) : "-"
      const categoryCount = cases.reduce((acc, c) => {
        const k = c.category ?? "未分類"
        acc[k] = (acc[k] ?? 0) + 1
        return acc
      }, {} as Record<string, number>)
      sections.push(`- **総練習数**: ${cases.length}回`)
      sections.push(`- **平均評価**: ★${avgRating}`)
      sections.push(`- **カテゴリ内訳**: ${Object.entries(categoryCount).map(([k, v]) => `${k}(${v})`).join(", ")}`)
      sections.push("")
    }

    // 未完了タスク
    if (tasks.length > 0) {
      sections.push(`## ✅ 優先タスク`)
      for (const t of tasks) {
        const due = t.dueAt ? ` (期限: ${new Date(t.dueAt).toLocaleDateString("ja-JP")})` : ""
        sections.push(`- [ ] ${"★".repeat(t.priority)} ${t.title}${due}`)
      }
      sections.push("")
    }

    const markdown = sections.join("\n")

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="shukatsu-report-${now.toISOString().split("T")[0]}.md"`,
      },
    })
  } catch (error) {
    return apiError(error)
  }
}
