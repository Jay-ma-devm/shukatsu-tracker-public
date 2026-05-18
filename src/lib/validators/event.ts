import { z } from "zod"

export const eventSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(200),
  type: z.enum([
    "interview",
    "case_interview",
    "deadline",
    "task",
    "meeting",
    "info_session",
    "coffee_chat",
  ]),
  startAt: z.string().min(1, "日時を入力してください"),
  endAt: z.string().optional(),
  location: z.string().optional(),
  url: z.string().url("正しいURLを入力してください").optional().or(z.literal("")),
  notes: z.string().optional(),
  reminderAt: z.string().optional(),
  companyId: z.string().optional(),
})

export type EventSchema = z.infer<typeof eventSchema>
