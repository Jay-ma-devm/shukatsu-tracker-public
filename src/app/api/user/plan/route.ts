import { NextResponse } from "next/server"
import { getCurrentUserId } from "@/lib/get-user"
import { prisma } from "@/lib/db"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // localモードでは常にPro扱い（開発環境）
    if (process.env.NEXT_PUBLIC_AUTH_MODE === "local") {
      return NextResponse.json({
        isPro: true,
        name: "ローカルユーザー",
        email: null,
      })
    }

    const userId = await getCurrentUserId()
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripePriceId: true, name: true, email: true },
    }).catch(() => null)

    return NextResponse.json({
      isPro: !!user?.stripePriceId,
      name: user?.name,
      email: user?.email,
    })
  } catch (error) {
    return apiError(error)
  }
}
