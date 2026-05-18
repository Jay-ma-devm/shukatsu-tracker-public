/**
 * プラン定義とユーティリティ関数
 * Stripeとの連携は stripeCurrentPeriodEnd / stripePriceId で判断
 */

export const PLANS = {
  free: {
    name: "Free",
    maxCompanies: 10,
    aiEnabled: false,
    price: 0,
  },
  pro: {
    name: "Pro",
    maxCompanies: Infinity,
    aiEnabled: true,
    price: 980,
  },
} as const

export type PlanType = keyof typeof PLANS

/**
 * ユーザーの現在のプランを返す
 * 買い切りモード: stripePriceId が設定されていれば永久 Pro
 */
export function getUserPlan(user: {
  stripePriceId?: string | null
  stripeCurrentPeriodEnd?: Date | null
}): PlanType {
  return user.stripePriceId ? "pro" : "free"
}

/**
 * 企業を追加できるかチェック
 */
export function canAddCompany(currentCount: number, plan: PlanType): boolean {
  return currentCount < PLANS[plan].maxCompanies
}

/**
 * AI機能が使えるかチェック
 */
export function canUseAI(plan: PlanType): boolean {
  return PLANS[plan].aiEnabled
}

/**
 * プランの表示名を返す
 */
export function getPlanDisplayName(plan: PlanType): string {
  return PLANS[plan].name
}

/**
 * プランの月額を返す（円）
 */
export function getPlanPrice(plan: PlanType): number {
  return PLANS[plan].price
}
