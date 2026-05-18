import { prisma } from "@/lib/db"
import { getCurrentUserId } from "@/lib/get-user"
import { TemplatesPageClient } from "@/components/templates/templates-page"

export const dynamic = "force-dynamic"
export const metadata = { title: "メールテンプレート" }

export default async function TemplatesRoute() {
  const userId = await getCurrentUserId()
  const templates = await prisma.emailTemplate.findMany({
    where: { userId },
    orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
  })
  return <TemplatesPageClient initialTemplates={templates} />
}
