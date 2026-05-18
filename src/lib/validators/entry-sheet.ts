import { z } from "zod"

export const entrySheetSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(200),
  status: z.enum(["draft", "submitted", "passed", "failed"]),
  deadline: z.string().optional(),
  submittedAt: z.string().optional(),
  companyId: z.string().min(1, "企業を選択してください"),
})

export const esQuestionSchema = z.object({
  question: z.string().min(1, "設問を入力してください"),
  answer: z.string().optional(),
  charLimit: z.number().optional(),
  order: z.number().int().min(0),
})

export type EntrySheetSchema = z.infer<typeof entrySheetSchema>
export type EsQuestionSchema = z.infer<typeof esQuestionSchema>
