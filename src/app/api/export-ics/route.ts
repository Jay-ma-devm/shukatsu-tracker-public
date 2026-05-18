import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

function escapeIcs(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
}

export async function GET() {
  try {
    const userId = await getCurrentUserId()

    const events = await prisma.event.findMany({
      where: {
        OR: [{ company: { userId } }, { companyId: null }],
        startAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // 過去30日〜
      },
      include: { company: { select: { name: true } } },
      orderBy: { startAt: "asc" },
    })

    // タスク（期限日があるもの）
    const tasks = await prisma.task.findMany({
      where: { userId, dueAt: { not: null }, status: { not: "done" } },
      include: { company: { select: { name: true } } },
    })

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//就活トラッカー//JA",
      "CALSCALE:GREGORIAN",
      "X-WR-CALNAME:就活トラッカー",
      "X-WR-TIMEZONE:Asia/Tokyo",
    ]

    const now = formatIcsDate(new Date())

    // イベント
    for (const event of events) {
      const start = formatIcsDate(new Date(event.startAt))
      const end = event.endAt
        ? formatIcsDate(new Date(event.endAt))
        : formatIcsDate(new Date(new Date(event.startAt).getTime() + 60 * 60 * 1000))

      const summary = event.company
        ? `${event.company.name} - ${event.title}`
        : event.title

      lines.push("BEGIN:VEVENT")
      lines.push(`UID:shukatsu-event-${event.id}@tracker`)
      lines.push(`DTSTAMP:${now}`)
      lines.push(`DTSTART:${start}`)
      lines.push(`DTEND:${end}`)
      lines.push(`SUMMARY:${escapeIcs(summary)}`)
      if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`)
      if (event.url) lines.push(`URL:${event.url}`)
      if (event.notes) lines.push(`DESCRIPTION:${escapeIcs(event.notes)}`)
      lines.push("END:VEVENT")
    }

    // タスク（VTODO）
    for (const task of tasks) {
      const due = task.dueAt ? formatIcsDate(new Date(task.dueAt)) : null
      const summary = task.company
        ? `[タスク] ${task.company.name} - ${task.title}`
        : `[タスク] ${task.title}`

      lines.push("BEGIN:VTODO")
      lines.push(`UID:shukatsu-task-${task.id}@tracker`)
      lines.push(`DTSTAMP:${now}`)
      lines.push(`SUMMARY:${escapeIcs(summary)}`)
      if (due) lines.push(`DUE:${due}`)
      if (task.description) lines.push(`DESCRIPTION:${escapeIcs(task.description)}`)
      lines.push("END:VTODO")
    }

    lines.push("END:VCALENDAR")

    const ics = lines.join("\r\n")

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="shukatsu-${new Date().toISOString().split("T")[0]}.ics"`,
      },
    })
  } catch (error) {
    return apiError(error)
  }
}
