import { getCurrentUserId, getCurrentUser } from "@/lib/get-user"
import { SettingsPageClient } from "@/components/settings/settings-page"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"
export const metadata = { title: "設定" }

export default async function SettingsRoute() {
  const userId = await getCurrentUserId()
  const user = await getCurrentUser()

  const [companies, tasks, notes, cases, interviews, meetings, templates, es] = await prisma.$transaction([
    prisma.company.count({ where: { userId } }),
    prisma.task.count({ where: { userId } }),
    prisma.note.count({ where: { userId } }),
    prisma.caseLog.count({ where: { userId } }),
    prisma.interviewLog.count({ where: { company: { userId } } }),
    prisma.meeting.count({ where: { userId } }),
    prisma.emailTemplate.count({ where: { userId } }),
    prisma.entrySheet.count({ where: { company: { userId } } }),
  ])

  const dataStats = { companies, tasks, notes, cases, interviews, meetings, templates, es }

  return <SettingsPageClient user={user} dataStats={dataStats} />
}
