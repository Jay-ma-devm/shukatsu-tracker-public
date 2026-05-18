import { z } from "zod"

export const taskSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(200),
  description: z.string().optional(),
  status: z.enum(["todo", "doing", "done"]),
  priority: z.number().min(1).max(5),
  dueAt: z.string().optional(),
  tags: z.string().optional(),
  companyId: z.string().optional(),
})

export type TaskSchema = z.infer<typeof taskSchema>
