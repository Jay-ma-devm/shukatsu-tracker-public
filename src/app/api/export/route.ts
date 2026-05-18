import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const userId = await getCurrentUserId()

    const [companies, events, cases, templates, tasks, notes, meetings, interviewLogs, careerEntries, entrySheets] = await Promise.all([
      prisma.company.findMany({
        where: { userId },
        include: { stages: true, contacts: true, attachments: true, entrySheets: { include: { questions: true } } },
      }),
      prisma.event.findMany({
        where: { OR: [{ company: { userId } }, { companyId: null }] },
      }),
      prisma.caseLog.findMany({ where: { userId } }),
      prisma.emailTemplate.findMany({ where: { userId } }),
      prisma.task.findMany({ where: { userId } }),
      prisma.note.findMany({ where: { userId } }),
      prisma.meeting.findMany({ where: { userId } }),
      prisma.interviewLog.findMany({ where: { company: { userId } } }),
      prisma.careerEntry.findMany({ where: { userId } }),
      prisma.entrySheet.findMany({ where: { company: { userId } }, include: { questions: true } }),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "2.0",
      appVersion: "1.2.0",
      userEmail: (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email ?? undefined,
      data: {
        companies,
        events,
        cases,
        templates,
        tasks,
        notes,
        meetings,
        interviewLogs,
        careerEntries,
        entrySheets,
      },
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="shukatsu-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })
  } catch (error) {
    return apiError(error)
  }
}
