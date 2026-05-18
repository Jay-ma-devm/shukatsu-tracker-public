import { z } from "zod"

export const interviewLogSchema = z.object({
  companyId: z.string().min(1, "企業を選択してください"),
  stageId: z.string().optional(),
  type: z.enum(["casual", "1st", "2nd", "final", "case", "group"]),
  conductedAt: z.string().min(1, "実施日を入力してください"),
  duration: z.number().optional(),
  interviewerName: z.string().optional(),
  interviewerRole: z.string().optional(),
  questions: z.string().optional(),
  myAnswers: z.string().optional(),
  feedback: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  outcome: z.enum(["passed", "failed", "pending"]).optional(),
  nextStepNotes: z.string().optional(),
})

export type InterviewLogSchema = z.infer<typeof interviewLogSchema>
