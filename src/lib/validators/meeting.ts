import { z } from "zod"

export const meetingSchema = z.object({
  type: z.enum(["ob", "casual", "info_session", "coffee_chat"]),
  title: z.string().min(1, "タイトルを入力してください").max(200),
  conductedAt: z.string().min(1, "実施日を入力してください"),
  duration: z.number().optional(),
  location: z.string().optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  topics: z.string().optional(),
  insights: z.string().optional(),
  followUp: z.string().optional(),
  thankYouSent: z.boolean(),
})

export type MeetingSchema = z.infer<typeof meetingSchema>
