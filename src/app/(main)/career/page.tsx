import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { CareerPageClient } from "@/components/career/career-page"

export const dynamic = "force-dynamic"
export const metadata = { title: "キャリア軌跡" }

export default async function CareerRoute() {
  const userId = await getCurrentUserId()

  const entries = await prisma.careerEntry.findMany({
    where: { userId },
    orderBy: { startAt: "desc" },
  })

  return <CareerPageClient initialEntries={entries} />
}
