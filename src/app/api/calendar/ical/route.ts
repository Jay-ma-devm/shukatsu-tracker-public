import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

const EVENT_TYPE_LABELS: Record<string, string> = {
  interview: "面接",
  case_interview: "ケース面接",
  deadline: "締め切り",
  task: "タスク",
  meeting: "OB訪問",
  info_session: "説明会",
  coffee_chat: "コーヒーチャット",
}

function icalDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

function icalEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
}

function foldLine(line: string): string {
  if (line.length <= 75) return line
  const chunks: string[] = []
  chunks.push(line.slice(0, 75))
  let i = 75
  while (i < line.length) {
    chunks.push(" " + line.slice(i, i + 74))
    i += 74
  }
  return chunks.join("\r\n")
}

export async function GET() {
  try {
    const userId = await getCurrentUserId()

    const events = await prisma.event.findMany({
      where: { company: { userId } },
      include: { company: { select: { name: true } } },
      orderBy: { startAt: "asc" },
      take: 500,
    })

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//就活トラッカー//JP",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:就活トラッカー`,
      "X-WR-TIMEZONE:Asia/Tokyo",
    ]

    for (const ev of events) {
      const typeLabel = EVENT_TYPE_LABELS[ev.type] ?? ev.type
      const companyName = ev.company?.name ?? ""
      const summary = companyName ? `[${companyName}] ${typeLabel}: ${icalEscape(ev.title)}` : `${typeLabel}: ${icalEscape(ev.title)}`
      const description = ev.notes ? icalEscape(ev.notes) : ""
      const start = new Date(ev.startAt)
      const end = ev.endAt ? new Date(ev.endAt) : new Date(start.getTime() + 60 * 60 * 1000)
      const uid = `${ev.id}@shukatsu-tracker`

      lines.push("BEGIN:VEVENT")
      lines.push(foldLine(`UID:${uid}`))
      lines.push(foldLine(`DTSTAMP:${icalDate(new Date())}`))
      lines.push(foldLine(`DTSTART:${icalDate(start)}`))
      lines.push(foldLine(`DTEND:${icalDate(end)}`))
      lines.push(foldLine(`SUMMARY:${summary}`))
      if (description) lines.push(foldLine(`DESCRIPTION:${description}`))
      if (ev.location) lines.push(foldLine(`LOCATION:${icalEscape(ev.location)}`))
      if (ev.completed) lines.push("STATUS:COMPLETED")
      lines.push("END:VEVENT")
    }

    lines.push("END:VCALENDAR")

    const ical = lines.join("\r\n")

    return new NextResponse(ical, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="shukatsu-${new Date().toISOString().split("T")[0]}.ics"`,
      },
    })
  } catch (error) {
    return apiError(error)
  }
}
