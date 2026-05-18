"use client"

import { useState } from "react"
import { OnboardingWizard } from "./onboarding-wizard"

interface OnboardingGateProps {
  companyCount: number
  children: React.ReactNode
}

/**
 * 企業数が0のときオンボーディングウィザードを表示するゲートコンポーネント。
 * ウィザード完了後はchildren（ダッシュボード）を表示する。
 */
export function OnboardingGate({ companyCount, children }: OnboardingGateProps) {
  const [onboardingDone, setOnboardingDone] = useState(false)

  // 企業が1社以上あるか、オンボーディング完了後はダッシュボードを表示
  if (companyCount > 0 || onboardingDone) {
    return <>{children}</>
  }

  return <OnboardingWizard onComplete={() => setOnboardingDone(true)} />
}
