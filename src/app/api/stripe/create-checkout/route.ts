import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getCurrentUser } from "@/lib/get-user"
import { prisma } from "@/lib/db"
import { apiError } from "@/lib/api-error"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json({ error: "Stripe未設定" }, { status: 503 })
    }

    const stripe = new Stripe(stripeKey)
    const user = await getCurrentUser()
    const priceId = process.env.STRIPE_PRO_PRICE_ID

    if (!priceId) {
      return NextResponse.json({ error: "料金プランが未設定" }, { status: 503 })
    }

    const { returnUrl } = await request.json().catch(() => ({ returnUrl: "/" }))
    const origin = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "https://shukatsu-tracker-lac.vercel.app"

    // 既存のStripe顧客IDを取得
    let customerId: string | undefined
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { stripeCustomerId: true, email: true },
      })
      if (dbUser?.stripeCustomerId) {
        customerId = dbUser.stripeCustomerId
      }
    } catch {}

    // チェックアウトセッション作成（買い切り）
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : (user.email ?? undefined),
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/settings?upgraded=1`,
      cancel_url: `${origin}/pricing`,
      metadata: { userId: user.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    return apiError(error)
  }
}
