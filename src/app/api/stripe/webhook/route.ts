import { NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe未設定" }, { status: 503 })
  }

  const stripe = new Stripe(stripeKey)
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "署名がありません" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: "Webhook署名が無効" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        // 買い切りモード: payment_intent から price_id を取得
        if (!userId || !session.customer) break

        const priceId = session.line_items?.data[0]?.price?.id
          ?? process.env.STRIPE_PRO_PRICE_ID
          ?? "pro"

        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: null,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: null, // 買い切りのため期限なし
          },
        })
        console.log(`[Stripe] Pro昇格（買い切り）: userId=${userId}`)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Stripe Webhook Error]", error)
    return NextResponse.json({ error: "処理中にエラーが発生しました" }, { status: 500 })
  }
}
