import type { Company, Stage, Event, CaseLog, Contact, Attachment } from "@prisma/client"

export type NextEvent = { id: string; title: string; type: string; startAt: Date | string }

export type CompanyWithData = Company & {
  stages: Stage[]
  _count?: { events: number; caseLogs: number; interviewLogs?: number }
  nextEvents?: NextEvent[]
}

export type CompanyWithRelations = Company & {
  stages: Stage[]
  events: Event[]
  caseLogs: CaseLog[]
  contacts: Contact[]
  attachments: Attachment[]
}

export type { Company, Stage, Event, CaseLog, Contact, Attachment }
