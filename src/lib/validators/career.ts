import { z } from "zod"

export const careerEntrySchema = z.object({
  type: z.enum(["internship", "event", "milestone", "achievement"]),
  title: z.string().min(1, "タイトルを入力してください").max(200),
  organization: z.string().optional(),
  role: z.string().optional(),
  startAt: z.string().min(1, "開始日を入力してください"),
  endAt: z.string().optional(),
  description: z.string().optional(),
  takeaways: z.string().optional(),
  skills: z.string().optional(),
  url: z.string().url("正しいURLを入力してください").optional().or(z.literal("")),
})

export type CareerEntrySchema = z.infer<typeof careerEntrySchema>
