import { z } from "zod"

export const companySchema = z.object({
  name: z.string().min(1, "企業名を入力してください").max(100),
  industry: z.string().optional(),
  position: z.string().optional(),
  location: z.string().optional(),
  size: z.string().optional(),
  url: z.string().url("正しいURLを入力してください").optional().or(z.literal("")),
  priority: z.number().min(1).max(5),
  status: z.enum([
    "applied",
    "screening",
    "interview",
    "internship",
    "case",
    "final",
    "offer",
    "accepted",
    "rejected",
    "withdrawn",
  ]),
  starred: z.boolean(),
  notes: z.string().optional(),
  appliedAt: z.string().optional(),
})

export type CompanySchema = z.infer<typeof companySchema>
