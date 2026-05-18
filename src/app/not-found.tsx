import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { GraduationCap } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <GraduationCap className="h-12 w-12 text-muted-foreground" />
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground mt-2 text-lg">ページが見つかりませんでした</p>
        <p className="text-sm text-muted-foreground mt-1">URLが間違っているか、削除された可能性があります</p>
      </div>
      <div className="flex gap-3">
        <Link href="/" className={buttonVariants()}>ダッシュボードへ</Link>
        <Link href="/companies" className={buttonVariants({ variant: "outline" })}>企業一覧へ</Link>
      </div>
    </div>
  )
}
