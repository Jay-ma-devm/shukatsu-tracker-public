import { z } from "zod"

export const caseLogSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(200),
  category: z.string().optional(),
  prompt: z.string().min(1, "問いを入力してください"),
  premise: z.string().optional(),
  structure: z.string().optional(),
  analysis: z.string().optional(),
  conclusion: z.string().optional(),
  feedback: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  difficulty: z.number().min(1).max(5),
  duration: z.number().min(1).optional(),
  practiceWith: z.string().optional(),
  tags: z.string().optional(),
  companyId: z.string().optional(),
})

export type CaseLogSchema = z.infer<typeof caseLogSchema>
