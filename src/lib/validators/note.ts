import { z } from "zod"

export const noteSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(200),
  content: z.string(),
  category: z.string().optional(),
  tags: z.string().optional(),
  pinned: z.boolean(),
  companyId: z.string().optional(),
})

export type NoteSchema = z.infer<typeof noteSchema>
